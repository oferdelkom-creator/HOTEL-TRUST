import { describe, it, expect } from 'vitest';
import { addDays, daysBetween, isIsoDate, isSaturday } from '../src/dates';

describe('אריתמטיקה של תאריכים', () => {
  it('מוסיף ימים מעבר לגבול חודש ושנה', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('מטפל בשנה מעוברת', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(daysBetween('2028-02-01', '2028-03-01')).toBe(29);
  });

  it('אינו מושפע משעון קיץ', () => {
    // מעבר לשעון קיץ בישראל נופל בסוף מרס. תאריכים ברמת יום ב-UTC
    // חייבים לחצות אותו בלי לזוז.
    expect(daysBetween('2026-03-26', '2026-03-28')).toBe(2);
    expect(addDays('2026-03-26', 2)).toBe('2026-03-28');
  });

  it('דוחה תאריכים שאינם קיימים', () => {
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('26-01-01')).toBe(false);
    expect(isIsoDate('2026-1-1')).toBe(false);
    expect(isIsoDate(null)).toBe(false);
    expect(isIsoDate('2026-02-28')).toBe(true);
  });

  it('מזהה שבת', () => {
    expect(isSaturday('2026-02-07')).toBe(true);
    expect(isSaturday('2026-02-08')).toBe(false);
  });
});
