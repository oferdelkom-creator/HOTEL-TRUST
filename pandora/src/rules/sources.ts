/**
 * מקורות משפטיים משותפים.
 *
 * אזהרה: מספרי התקנות והסעיפים כאן נכתבו על סמך ידע כללי וטרם אומתו
 * מול נוסח החוק המעודכן. אף מסלול לא יעלה לייצור לפני שעורך הדין
 * השותף אימת כל מקור כאן — ראה docs/legal-verification-backlog.md.
 */
import type { LegalSource } from '../types';

const UNVERIFIED = 'מספר התקנה/הסעיף טעון אימות מול הנוסח המעודכן.';

export const TAKSADA_2018_SETTING_ASIDE: LegalSource = {
  law: 'תקנות סדר הדין האזרחי, תשע"ט-2018',
  section: 'תקנה 131 — ביטול החלטה שניתנה במעמד צד אחד',
  caveat: UNVERIFIED,
};

export const TAKSADA_2018_VACATIONS: LegalSource = {
  law: 'תקנות סדר הדין האזרחי, תשע"ט-2018',
  section: 'הוראת מניין הימים בתקופת פגרה',
  caveat: `${UNVERIFIED} כן טעון אימות היקף ההחרגה: על אילו מועדים היא חלה.`,
};

export const COURT_VACATION_REGS: LegalSource = {
  law: 'תקנות בתי המשפט (פגרות), תשמ"ג-1983',
  section: 'מועדי הפגרות',
};

export const INTERPRETATION_LAW_10: LegalSource = {
  law: 'חוק הפרשנות, תשמ"א-1981',
  section: 'סעיף 10 — מניין תקופות',
  caveat: 'סעיף 10(ג) מיושם כאן לשבת בלבד; דחייה בשל מועדי ישראל טרם מיושמת.',
};

export const EXECUTION_LAW_81A1: LegalSource = {
  law: 'חוק ההוצאה לפועל, תשכ"ז-1967',
  section: 'סעיף 81א1 — ביצוע תביעה על סכום קצוב',
  caveat: UNVERIFIED,
};

export const EXECUTION_LAW_19: LegalSource = {
  law: 'חוק ההוצאה לפועל, תשכ"ז-1967',
  section: 'סעיף 19 — טענת "פרעתי"',
  caveat: UNVERIFIED,
};

export const SETTING_ASIDE_AS_OF_RIGHT: LegalSource = {
  law: 'הלכה פסוקה — ביטול מחובת הצדק',
  caveat:
    'עוגן פסיקתי חסר. אין להציג את הקביעה הזו למשתמש לפני שצורף אליה ' +
    'פסק דין אמיתי עם קישור (תוכנית המיזם, סעיף 3.8).',
};
