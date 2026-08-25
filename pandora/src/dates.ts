/**
 * אריתמטיקה של תאריכים ברמת יום, בלי אזורי זמן.
 *
 * כל התאריכים כאן הם מחרוזות YYYY-MM-DD ומעובדים ב-UTC. תיק שיושב על
 * גבול של שעון קיץ לא יזוז יום קדימה או אחורה בגלל אזור זמן.
 */
import type { IsoDate } from './types';

const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const parsed = parse(value);
  if (Number.isNaN(parsed.getTime())) return false;
  // דוחה תאריכים שאינם קיימים אך ניתנים לפירוש, כגון 2026-02-30.
  return toIso(parsed) === value;
}

function parse(date: IsoDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function toIso(d: Date): IsoDate {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return toIso(new Date(parse(date).getTime() + days * MS_PER_DAY));
}

/** מספר הימים מ-`from` עד `to`. חיובי אם `to` מאוחר יותר. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / MS_PER_DAY);
}

/** 0 = ראשון, 6 = שבת. */
export function dayOfWeek(date: IsoDate): number {
  return parse(date).getUTCDay();
}

export function isSaturday(date: IsoDate): boolean {
  return dayOfWeek(date) === 6;
}
