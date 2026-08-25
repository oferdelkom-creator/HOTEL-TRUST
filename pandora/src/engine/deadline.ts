import type { IsoDate } from '../types';
import { addDays, isSaturday } from '../dates';
import { vacationOn, tableCovers } from '../vacations';

export interface DeadlineInput {
  /** האירוע שממנו מתחיל המרוץ (יום ההמצאה, יום הידיעה וכיוצא בזה). */
  countFrom: IsoDate;
  /** מספר הימים שהחוק נותן. */
  statutoryDays: number;
  /**
   * האם ימי פגרה מוחרגים מן המניין.
   *
   * לא כל מסלול נהנה מכך: החרגת הפגרות מקורה בתקנות סדר הדין האזרחי,
   * ותחולתה על מועדים שמקורם בחוק ההוצאה לפועל אינה מובנת מאליה.
   * לכן זו החלטה פר-מסלול ולא ברירת מחדל גורפת.
   */
  excludeVacations: boolean;
}

export interface DeadlineOutput {
  lastDate: IsoDate;
  excludedVacationDays: number;
  /** ימים שנוספו משום שהיום האחרון חל בשבת. */
  shiftedOffRestDay: number;
  /** שמות הפגרות שנחצו, לצורך ההנמקה המוצגת למשתמש. */
  vacationsCrossed: string[];
}

/** תקרת בטיחות: מונעת לולאה אינסופית אם נכנס קלט משובש. */
const MAX_ITERATIONS = 5_000;

/**
 * מחשב את היום האחרון להגשה.
 *
 * שני כללים מחוק הפרשנות, תשמ"א-1981 מיושמים כאן:
 *   סעיף 10(א) — יום האירוע עצמו אינו נמנה. המניין מתחיל למחרת.
 *   סעיף 10(ג) — יום אחרון שחל ביום מנוחה נדחה ליום שאחריו.
 *
 * הערה על היקף היישום של 10(ג): כאן נדחה רק יום שחל בשבת. דחייה בשל
 * מועדי ישראל טרם מיושמת ומסומנת ב-docs/legal-verification-backlog.md.
 */
export function computeDeadline(input: DeadlineInput): DeadlineOutput {
  const { countFrom, statutoryDays, excludeVacations } = input;

  if (!Number.isInteger(statutoryDays) || statutoryDays < 1) {
    throw new RangeError(`statutoryDays חייב להיות מספר שלם חיובי, התקבל: ${statutoryDays}`);
  }
  if (excludeVacations && !tableCovers(countFrom)) {
    throw new RangeError(
      `טבלת הפגרות אינה מכסה את ${countFrom}. יש להריץ מחדש את scripts/generate-vacations.mjs.`,
    );
  }

  let cursor = countFrom;
  let counted = 0;
  let excludedVacationDays = 0;
  const vacationsCrossed = new Set<string>();

  for (let i = 0; counted < statutoryDays; i++) {
    if (i >= MAX_ITERATIONS) {
      throw new RangeError(`חישוב המועד לא התכנס עבור ${countFrom} + ${statutoryDays} ימים.`);
    }
    cursor = addDays(cursor, 1);

    if (excludeVacations) {
      const vacation = vacationOn(cursor);
      if (vacation) {
        excludedVacationDays++;
        vacationsCrossed.add(vacation.name);
        continue;
      }
    }
    counted++;
  }

  let shiftedOffRestDay = 0;
  while (isSaturday(cursor)) {
    cursor = addDays(cursor, 1);
    shiftedOffRestDay++;
  }

  return {
    lastDate: cursor,
    excludedVacationDays,
    shiftedOffRestDay,
    vacationsCrossed: [...vacationsCrossed],
  };
}
