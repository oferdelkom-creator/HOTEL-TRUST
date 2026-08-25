/**
 * תיבת פנדורה — טיפוסי הליבה של שער המועדים.
 *
 * עיקרון מנחה (תוכנית המיזם, סעיף 6): חישוב המועדים והכשירות נעשה בקוד
 * דטרמיניסטי ולא במודל שפה. זהו החלק שאסור שיטעה.
 *
 * עיקרון מנחה שני (סעיף 3.2): "אין מסלול" היא תשובה לגיטימית ומכובדת,
 * והיא תהיה התשובה הנפוצה ביותר — ותמיד עם הסתעפות למה שכן פתוח.
 */

/** תאריך בפורמט YYYY-MM-DD. אין שעות: כל המועדים כאן הם ברמת יום. */
export type IsoDate = string;

/** מזהי המסלולים שהמנוע מכיר. ראה תוכנית המיזם, סעיף 4. */
export type TrackId =
  | 'default_judgment'      // ביטול פסק דין שניתן במעמד צד אחד
  | 'execution_objection'   // התנגדות לביצוע תביעה על סכום קצוב
  | 'pareati'               // טענת "פרעתי"
  | 'appeal_extension';     // בקשה להארכת מועד להגשת ערעור

/**
 * סטטוס אימות של כלל משפטי.
 *
 * כל כלל במאגר נולד כ-`unverified`. אין להעלות לייצור מסלול שאינו
 * `verified_by_counsel` — ראה docs/legal-verification-backlog.md.
 */
export type VerificationStatus =
  | 'verified_by_counsel'
  | 'unverified'
  | 'needs_reverification';

/** מקור משפטי. אין קביעה במערכת בלי מקור — תוכנית המיזם, סעיף 3.8. */
export interface LegalSource {
  /** שם החוק או התקנות, כלשונם הרשמי. */
  law: string;
  /** הסעיף או התקנה. ריק אם ההפניה היא לחוק כולו. */
  section?: string;
  /** קישור למקור רשמי. חובה לפני עלייה לייצור. */
  url?: string;
  /** הערה על אי-ודאות שידועה לנו בזמן הכתיבה. */
  caveat?: string;
}

/** תוצאת שער המועדים. */
export type GateStatus =
  /** קיים מסלול פתוח והמועד טרם חלף. */
  | 'open'
  /** פתוח, אך נותרו מעט ימים — נדרשת פעולה מיידית. */
  | 'closing_soon'
  /** המועד חלף. תמיד מלווה בהסתעפויות (`branches`). */
  | 'closed'
  /** למסלול אין מועד קבוע בחוק (למשל טענת "פרעתי"). */
  | 'no_statutory_deadline'
  /** חסרות עובדות שבלעדיהן אי אפשר להכריע. */
  | 'insufficient_facts'
  /** ההכרעה תלויה בשיקול דעת שיפוטי או בעובדה שנויה במחלוקת. */
  | 'requires_human_review';

/** צעד בשרשרת ההנמקה. מוצג למשתמש כפי שהוא — סעיף 3.1: להסביר, לא רק להשיב. */
export interface ReasoningStep {
  /** ניסוח בשפה פשוטה, לעיני המשתמש. */
  he: string;
  /** מקורות שעליהם נשען הצעד. */
  sources?: LegalSource[];
}

/** הסתעפות: מה כן פתוח כשהמסלול הראשי סגור. סעיף 3.2. */
export interface Branch {
  /** כותרת קצרה, למשל "בקשה להארכת מועד". */
  he: string;
  /** מדוע ההסתעפות הזו רלוונטית למקרה הזה דווקא. */
  why: string;
  /** מסלול אחר במנוע, אם ההסתעפות מובילה לכזה. */
  track?: TrackId;
  sources?: LegalSource[];
}

/** חישוב המועד עצמו — שקוף וניתן לביקורת. */
export interface DeadlineComputation {
  /** התאריך שממנו התחיל מרוץ הימים. */
  countedFrom: IsoDate;
  /** מדוע דווקא מהתאריך הזה. */
  countedFromReason: string;
  /** מספר הימים שהחוק נותן. */
  statutoryDays: number;
  /** ימי פגרה שלא נמנו. ריק אם המסלול אינו נהנה מהחרגת פגרות. */
  excludedVacationDays: number;
  /** התאריך האחרון להגשה, אחרי כל ההתאמות. */
  lastDate: IsoDate;
  /** ימים שנותרו נכון ל-`today`. שלילי אם המועד חלף. */
  daysRemaining: number;
}

/** תוצאת השער. זהו המבנה שעליו נבנה הדוח למשתמש. */
export interface GateResult {
  track: TrackId;
  /** שם המסלול בעברית, לתצוגה. */
  trackNameHe: string;
  status: GateStatus;
  /** קיים רק כשניתן היה לחשב מועד. */
  deadline?: DeadlineComputation;
  reasoning: ReasoningStep[];
  branches: Branch[];
  sources: LegalSource[];
  verification: VerificationStatus;
  /** עובדות שחסרות ובלעדיהן ההכרעה חלקית. */
  missingFacts: string[];
  /** אזהרות שחייבות להופיע בדוח. */
  disclaimers: string[];
}
