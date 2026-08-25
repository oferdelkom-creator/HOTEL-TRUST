import { describe, it, expect } from 'vitest';
import { evaluate as objection } from '../src/rules/tracks/execution-objection';
import { evaluate as pareati } from '../src/rules/tracks/pareati';
import { evaluate as extension } from '../src/rules/tracks/appeal-extension';

describe('התנגדות לביצוע תביעה על סכום קצוב', () => {
  const base = {
    today: '2026-02-01',
    warningServiceDate: '2026-01-10',
    learnedDate: '2026-01-10',
    serviceStatus: 'properly_served' as const,
  };

  it('אינו מחריג ימי פגרה — ההנחה המחמירה', () => {
    const r = objection({ ...base, warningServiceDate: '2026-03-25', learnedDate: '2026-03-25', today: '2026-04-01' });
    expect(r.deadline!.excludedVacationDays).toBe(0);
    expect(r.reasoning.some((s) => s.he.includes('מחמירה'))).toBe(true);
  });

  it('פותח את מסלול "פרעתי" כשהמשתמש טוען שהחוב שולם', () => {
    const r = objection({ ...base, today: '2026-06-01', claimsDebtPaid: true });
    expect(r.status).toBe('closed');
    expect(r.branches.some((b) => b.track === 'pareati')).toBe(true);
  });

  it('אזהרה שלא הומצאה אינה נסגרת בחלוף הזמן', () => {
    const r = objection({ ...base, serviceStatus: 'never_served', warningServiceDate: null, today: '2029-01-01' });
    expect(r.status).toBe('requires_human_review');
  });
});

describe('טענת "פרעתי"', () => {
  it('אינו נסגר בחלוף זמן', () => {
    const r = pareati({ today: '2035-01-01', hasPaymentEvidence: true });
    expect(r.status).toBe('no_statutory_deadline');
    expect(r.deadline).toBeUndefined();
  });

  it('אומר מראש שבלי אסמכתאות הטענה חלשה', () => {
    const r = pareati({ today: '2026-01-01', hasPaymentEvidence: false });
    expect(r.missingFacts.join(' ')).toContain('אסמכתאות');
  });
});

describe('הארכת מועד', () => {
  it('לעולם אינו מכריע לבד', () => {
    for (const today of ['2026-01-02', '2026-03-01', '2030-01-01']) {
      const r = extension({ today, missedDeadline: '2026-01-01' });
      expect(r.status).toBe('requires_human_review');
    }
  });

  it('מסמן איחור ניכר', () => {
    const r = extension({ today: '2026-09-01', missedDeadline: '2026-01-01' });
    expect(r.reasoning.some((s) => s.he.includes('איחור ניכר'))).toBe(true);
  });

  it('מעלה את סוגיית המחדל של עורך הדין כשהמשתמש היה מיוצג', () => {
    const r = extension({ today: '2026-03-01', missedDeadline: '2026-01-01', wasRepresented: true });
    expect(r.reasoning.some((s) => s.he.includes('אחריות מקצועית'))).toBe(true);
  });

  it('אינו מעריך סיכויים', () => {
    const r = extension({ today: '2026-03-01', missedDeadline: '2026-01-01' });
    expect(r.disclaimers.some((d) => d.includes('אינה מעריכה את סיכויי'))).toBe(true);
  });
});
