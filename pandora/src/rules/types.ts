import type { IsoDate, GateResult, VerificationStatus, TrackId } from '../types';

/**
 * מצב ההמצאה של המסמך שפתח את המועד.
 *
 * זהו השדה החשוב ביותר במסלול ביטול פסק הדין, ולא התאריך. פגם בהמצאה
 * הוא הסתעפות משפטית נפרדת לחלוטין ולא רק "עוד יום-יומיים".
 */
export type ServiceStatus =
  /** המסמך הומצא כדין וידוע מתי. */
  | 'properly_served'
  /** המשתמש מדווח על פגם: הומצא לכתובת ישנה, לאדם אחר, לא נמסר לידיו. */
  | 'defect_suspected'
  /** המסמך מעולם לא הומצא; נודע למשתמש בדרך אחרת (עיקול, בירור). */
  | 'never_served'
  /** המשתמש אינו יודע. */
  | 'unknown';

/** עובדות שכל מסלול מקבל. מסלול יכול להרחיב. */
export interface BaseFacts {
  /** תאריך ההרצה. נמסר במפורש כדי שהמנוע יהיה דטרמיניסטי ובר-בדיקה. */
  today: IsoDate;
}

/** מסלול משפטי אחד. */
export interface Track<F extends BaseFacts> {
  id: TrackId;
  nameHe: string;
  verification: VerificationStatus;
  evaluate(facts: F): GateResult;
}
