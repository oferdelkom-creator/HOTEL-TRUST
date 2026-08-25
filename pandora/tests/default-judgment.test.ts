import { describe, it, expect } from 'vitest';
import { evaluate, type DefaultJudgmentFacts } from '../src/rules/tracks/default-judgment';

const base: DefaultJudgmentFacts = {
  today: '2026-01-20',
  judgmentDate: '2026-01-05',
  serviceDate: '2026-01-06',
  learnedDate: '2026-01-06',
  serviceStatus: 'properly_served',
};

describe('ביטול פסק דין שניתן במעמד צד אחד', () => {
  it('פתוח כשנותרו ימים ומונה מיום ההמצאה', () => {
    const r = evaluate(base);
    expect(r.status).toBe('open');
    expect(r.deadline?.countedFrom).toBe('2026-01-06');
    expect(r.deadline?.daysRemaining).toBeGreaterThan(7);
  });

  it('עובר לסטטוס דחוף כשנותרו שבעה ימים או פחות', () => {
    const r = evaluate({ ...base, today: '2026-02-01' });
    expect(r.status).toBe('closing_soon');
    expect(r.deadline!.daysRemaining).toBeLessThanOrEqual(7);
    expect(r.deadline!.daysRemaining).toBeGreaterThanOrEqual(0);
  });

  it('סוגר את המסלול כשהמועד חלף — ותמיד עם הסתעפות', () => {
    const r = evaluate({ ...base, today: '2026-06-01' });
    expect(r.status).toBe('closed');
    expect(r.deadline!.daysRemaining).toBeLessThan(0);
    // סעיף 3.2 לתוכנית: "אין מסלול" לעולם אינו סוף הדרך.
    expect(r.branches.length).toBeGreaterThan(0);
    expect(r.branches.some((b) => b.track === 'appeal_extension')).toBe(true);
  });

  it('פגם בהמצאה לעולם אינו מוביל ל"סגור", גם שנים אחרי', () => {
    // זהו התרחיש המרכזי של אוכלוסיית היעד: פסק דין שנודע עליו
    // לראשונה כשהמשכורת עוקלה. מערכת שתסגור אותו מפני שחלפו 30 יום
    // מהמצאה שלא הייתה — נכשלה בדיוק במה שהמיזם בא לתקן.
    for (const serviceStatus of ['defect_suspected', 'never_served'] as const) {
      const r = evaluate({
        ...base,
        serviceStatus,
        serviceDate: null,
        learnedDate: '2026-01-06',
        today: '2029-01-01',
      });
      expect(r.status, serviceStatus).toBe('requires_human_review');
      expect(r.status, serviceStatus).not.toBe('closed');
      expect(r.branches.some((b) => b.he.includes('פגם בהמצאה')), serviceStatus).toBe(true);
    }
  });

  it('כשההמצאה לא ידועה — מונה מיום הידיעה ומסמן את העובדה החסרה', () => {
    const r = evaluate({
      ...base,
      serviceStatus: 'unknown',
      serviceDate: null,
      learnedDate: '2026-01-12',
    });
    expect(r.deadline?.countedFrom).toBe('2026-01-12');
    expect(r.missingFacts.join(' ')).toContain('הומצא');
  });

  it('אינו מנחש כשחסרים תאריכים', () => {
    const r = evaluate({ ...base, learnedDate: '' });
    expect(r.status).toBe('insufficient_facts');
    expect(r.deadline).toBeUndefined();
    expect(r.missingFacts.length).toBeGreaterThan(0);
  });

  it('מסמן סתירה כשיום הידיעה מוקדם ממתן פסק הדין', () => {
    const r = evaluate({ ...base, learnedDate: '2025-12-01', serviceDate: null, serviceStatus: 'unknown' });
    expect(r.missingFacts.join(' ')).toContain('שגוי');
  });

  it('מחריג ימי פגרה ומסביר זאת למשתמש', () => {
    const r = evaluate({
      ...base,
      judgmentDate: '2026-03-20',
      serviceDate: '2026-03-22',
      learnedDate: '2026-03-22',
      today: '2026-04-20',
    });
    expect(r.deadline!.excludedVacationDays).toBeGreaterThan(0);
    expect(r.reasoning.some((s) => s.he.includes('פגרה'))).toBe(true);
  });

  it('כל תוצאה נושאת מקורות, סטטוס אימות והסתייגות', () => {
    for (const today of ['2026-01-20', '2026-02-01', '2026-06-01']) {
      const r = evaluate({ ...base, today });
      expect(r.sources.length).toBeGreaterThan(0);
      expect(r.verification).toBe('unverified');
      expect(r.disclaimers.length).toBeGreaterThan(0);
    }
  });
});
