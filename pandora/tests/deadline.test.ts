import { describe, it, expect } from 'vitest';
import { computeDeadline } from '../src/engine/deadline';
import { vacationOn } from '../src/vacations';

describe('computeDeadline', () => {
  it('אינו מונה את יום האירוע עצמו', () => {
    // חוק הפרשנות סעיף 10(א): "מיום פלוני" — אותו יום אינו נמנה.
    const r = computeDeadline({ countFrom: '2026-01-05', statutoryDays: 1, excludeVacations: false });
    expect(r.lastDate).toBe('2026-01-06');
  });

  it('מחשב 30 ימים רצופים כשאין פגרה בדרך', () => {
    const r = computeDeadline({ countFrom: '2026-01-05', statutoryDays: 30, excludeVacations: false });
    expect(r.lastDate).toBe('2026-02-04');
    expect(r.excludedVacationDays).toBe(0);
    expect(r.shiftedOffRestDay).toBe(0);
  });

  it('דוחה יום אחרון שחל בשבת ליום החול שאחריו', () => {
    // 8.1.2026 הוא יום חמישי; היום ה-30 נופל בשבת 7.2.2026.
    const r = computeDeadline({ countFrom: '2026-01-08', statutoryDays: 30, excludeVacations: false });
    expect(r.lastDate).toBe('2026-02-08');
    expect(r.shiftedOffRestDay).toBe(1);
  });

  it('מחריג ימי פגרה מן המניין, כולל שתי פגרות עוקבות', () => {
    // מ-10.7.2026: עשרה ימים עד פגרת הקיץ, אחר כך פגרת סוכות.
    const r = computeDeadline({ countFrom: '2026-07-10', statutoryDays: 30, excludeVacations: true });
    expect(r.vacationsCrossed).toEqual(['פגרת הקיץ', 'פגרת סוכות']);
    expect(r.excludedVacationDays).toBe(55);
    expect(r.lastDate).toBe('2026-10-04');
  });

  it('היום האחרון לעולם אינו נופל בתוך פגרה כשההחרגה פעילה', () => {
    // סריקה על כל ימי 2026: אף חישוב לא רשאי לנחות בתוך פגרה.
    for (let d = new Date('2026-01-01T00:00:00Z'); d < new Date('2027-01-01T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
      const from = d.toISOString().slice(0, 10);
      const r = computeDeadline({ countFrom: from, statutoryDays: 30, excludeVacations: true });
      expect(vacationOn(r.lastDate), `נחת בפגרה עבור ${from}`).toBeUndefined();
    }
  });

  it('החרגת פגרות מאריכה את המועד ולעולם אינה מקצרת אותו', () => {
    for (let d = new Date('2026-01-01T00:00:00Z'); d < new Date('2027-01-01T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
      const from = d.toISOString().slice(0, 10);
      const withVac = computeDeadline({ countFrom: from, statutoryDays: 30, excludeVacations: true });
      const without = computeDeadline({ countFrom: from, statutoryDays: 30, excludeVacations: false });
      expect(withVac.lastDate >= without.lastDate, `קוצר עבור ${from}`).toBe(true);
    }
  });

  it('זורק שגיאה במקום לנחש כשהטבלה אינה מכסה את התאריך', () => {
    expect(() =>
      computeDeadline({ countFrom: '2099-01-01', statutoryDays: 30, excludeVacations: true }),
    ).toThrow(/טבלת הפגרות/);
  });

  it('דוחה מספר ימים לא תקין', () => {
    expect(() => computeDeadline({ countFrom: '2026-01-01', statutoryDays: 0, excludeVacations: false })).toThrow();
    expect(() => computeDeadline({ countFrom: '2026-01-01', statutoryDays: -5, excludeVacations: false })).toThrow();
    expect(() => computeDeadline({ countFrom: '2026-01-01', statutoryDays: 1.5, excludeVacations: false })).toThrow();
  });
});
