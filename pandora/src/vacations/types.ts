import type { IsoDate } from '../types';

/** תקופת פגרה אחת של בתי המשפט. הגבולות כוללניים משני הצדדים. */
export interface CourtVacation {
  name: string;
  start: IsoDate;
  end: IsoDate;
}
