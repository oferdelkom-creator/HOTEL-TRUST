import type { IsoDate } from '../types';
import type { CourtVacation } from './types';
import { COURT_VACATIONS, VACATION_TABLE_COVERS } from './table';

export type { CourtVacation };
export { COURT_VACATIONS, VACATION_TABLE_COVERS };

/** האם התאריך נופל בתוך תקופת פגרה. */
export function vacationOn(date: IsoDate): CourtVacation | undefined {
  return COURT_VACATIONS.find((v) => date >= v.start && date <= v.end);
}

/**
 * האם הטבלה מכסה את התאריך.
 *
 * זו לא בדיקה טכנית אלא בדיקת בטיחות: אם התיק חורג מהטווח שנוצר,
 * המנוע חייב לומר "אינני יודע" ולא לחשב מועד על סמך טבלה חסרה.
 */
export function tableCovers(date: IsoDate): boolean {
  const year = Number(date.slice(0, 4));
  return year >= VACATION_TABLE_COVERS.from && year <= VACATION_TABLE_COVERS.to;
}
