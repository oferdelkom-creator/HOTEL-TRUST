/**
 * מסלול 1 — ביטול פסק דין שניתן במעמד צד אחד.
 *
 * זהו מסלול ה-MVP (תוכנית המיזם, סעיף 12, שלב 1).
 *
 * הלוגיקה כאן אינה "האם עברו 30 יום". היא מבחינה בין שתי שאלות
 * שונות לחלוטין, וההבחנה הזו היא כל העניין:
 *
 *   1. האם פסק הדין הומצא כדין?  אם לא — יש טענה לביטול מחובת הצדק,
 *      והמרוץ אינו מתחיל מן ההמצאה הפגומה. זה בדיוק מצבם של רוב
 *      האנשים שהמיזם פונה אליהם: פסק דין שהם שמעו עליו לראשונה
 *      כשהמשכורת עוקלה.
 *
 *   2. אם כן הומצא כדין — מתי, וכמה זמן נותר.
 *
 * מערכת שמדלגת על השאלה הראשונה תסגור את הדלת בפני בדיוק האוכלוסייה
 * שהמיזם קיים בשבילה.
 */
import type { GateResult, ReasoningStep, Branch } from '../../types';
import type { BaseFacts, ServiceStatus, Track } from '../types';
import { computeDeadline } from '../../engine/deadline';
import { daysBetween, isIsoDate } from '../../dates';
import {
  TAKSADA_2018_SETTING_ASIDE,
  TAKSADA_2018_VACATIONS,
  COURT_VACATION_REGS,
  INTERPRETATION_LAW_10,
  SETTING_ASIDE_AS_OF_RIGHT,
} from '../sources';
import { extensionOfTime, serviceDefect, NON_LITIGATION_ROUTES } from '../branches';

export interface DefaultJudgmentFacts extends BaseFacts {
  /** מועד מתן פסק הדין, כפי שמופיע בו. */
  judgmentDate: IsoDateLike;
  /** מועד המצאת פסק הדין לידי המשתמש. לא ידוע ברוב המקרים. */
  serviceDate?: IsoDateLike | null;
  /**
   * מתי נודע למשתמש על פסק הדין בפועל.
   *
   * זהו השדה שהמשתמש חייב לאשר ידנית (תוכנית המיזם, סעיף 5, שלב ב').
   * הוא קובע את המועד בכל מקרה שבו ההמצאה פגומה או לא ידועה.
   */
  learnedDate: IsoDateLike;
  serviceStatus: ServiceStatus;
}

type IsoDateLike = string;

/** התקופה להגשת בקשת ביטול. טעון אימות — ראה sources.ts. */
const STATUTORY_DAYS = 30;

/** מתחת לסף הזה הדוח עובר לניסוח של דחיפות. */
const URGENT_THRESHOLD_DAYS = 7;

const NAME_HE = 'ביטול פסק דין שניתן במעמד צד אחד';

const BASE_DISCLAIMERS = [
  'זהו מידע כללי ואינו ייעוץ משפטי. המועדים והעילות טעונים אימות על ידי עורך דין מורשה.',
  'החישוב מסתמך על התאריכים שמסרת. תאריך שגוי אחד משנה את התוצאה כולה.',
];

function validate(facts: DefaultJudgmentFacts): string[] {
  const problems: string[] = [];
  if (!isIsoDate(facts.today)) problems.push('תאריך ההרצה אינו תקין.');
  if (!isIsoDate(facts.judgmentDate)) problems.push('מועד מתן פסק הדין חסר או אינו תקין.');
  if (!isIsoDate(facts.learnedDate)) problems.push('לא ידוע מתי נודע לך על פסק הדין.');
  if (facts.serviceDate != null && !isIsoDate(facts.serviceDate)) {
    problems.push('מועד ההמצאה שנמסר אינו תקין.');
  }
  return problems;
}

function insufficient(problems: string[]): GateResult {
  return {
    track: 'default_judgment',
    trackNameHe: NAME_HE,
    status: 'insufficient_facts',
    reasoning: [
      { he: 'אי אפשר להכריע בלי התאריכים החסרים. המערכת לא תנחש אותם — ניחוש כאן עלול לשלוח אותך להליך שהמועד בו כבר חלף.' },
    ],
    branches: [...NON_LITIGATION_ROUTES],
    sources: [TAKSADA_2018_SETTING_ASIDE],
    verification: 'unverified',
    missingFacts: problems,
    disclaimers: BASE_DISCLAIMERS,
  };
}

/**
 * קובע מאיזה תאריך מתחיל המרוץ ומדוע.
 *
 * הכלל: המרוץ מתחיל מן ההמצאה כדין. כשההמצאה פגומה או לא ידועה,
 * נקודת המוצא המעשית היא יום הידיעה — וזו גם ההנחה המחמירה יותר,
 * משום שהיא מקצרת את הזמן שהמערכת מציגה למשתמש. עדיף שאדם ימהר
 * מכפי שנדרש מאשר יאחר משום שהמערכת הרגיעה אותו.
 */
function determineStart(facts: DefaultJudgmentFacts): { from: string; reason: string } {
  if (facts.serviceStatus === 'properly_served' && facts.serviceDate) {
    return {
      from: facts.serviceDate,
      reason: 'פסק הדין הומצא לך כדין, ולכן מניין הימים מתחיל מיום ההמצאה.',
    };
  }
  return {
    from: facts.learnedDate,
    reason:
      facts.serviceStatus === 'properly_served'
        ? 'ההמצאה נעשתה כדין אך מועדה אינו ידוע, ולכן החישוב נעשה מיום הידיעה — ההנחה המחמירה מבין השתיים.'
        : 'ההמצאה פגומה או שלא נעשתה, ולכן החישוב נעשה מיום שנודע לך על פסק הדין.',
  };
}

export function evaluate(facts: DefaultJudgmentFacts): GateResult {
  const problems = validate(facts);
  if (problems.length > 0) return insufficient(problems);

  const { from, reason } = determineStart(facts);
  const deadline = computeDeadline({
    countFrom: from,
    statutoryDays: STATUTORY_DAYS,
    excludeVacations: true,
  });
  const daysRemaining = daysBetween(facts.today, deadline.lastDate);

  const reasoning: ReasoningStep[] = [
    {
      he: `פסק הדין ניתן ב-${facts.judgmentDate} בהיעדר הגנה או בהיעדר התייצבות. החוק נותן ${STATUTORY_DAYS} ימים להגיש בקשה לביטולו.`,
      sources: [TAKSADA_2018_SETTING_ASIDE],
    },
    { he: reason },
  ];

  if (deadline.excludedVacationDays > 0) {
    reasoning.push({
      he:
        `בתוך התקופה נפלו ${deadline.excludedVacationDays} ימי פגרה ` +
        `(${deadline.vacationsCrossed.join(', ')}), שאינם נמנים במניין. ` +
        'המועד האחרון נדחה בהתאם.',
      sources: [TAKSADA_2018_VACATIONS, COURT_VACATION_REGS],
    });
  }
  if (deadline.shiftedOffRestDay > 0) {
    reasoning.push({
      he: 'היום האחרון חל בשבת, ולכן הוא נדחה ליום החול שאחריו.',
      sources: [INTERPRETATION_LAW_10],
    });
  }

  const missingFacts: string[] = [];
  const branches: Branch[] = [];
  let status: GateResult['status'];

  // ההמצאה נבדקת לפני המועד. פגם בהמצאה הוא עילה עצמאית, ולא רק
  // שאלה של כמה ימים נותרו.
  const serviceIsDefective =
    facts.serviceStatus === 'defect_suspected' || facts.serviceStatus === 'never_served';

  if (serviceIsDefective) {
    reasoning.push({
      he:
        'מסרת שפסק הדין לא הומצא לך כדין. זו טענה נפרדת ומשמעותית: כשההמצאה פגומה, ' +
        'הביטול אינו נתון לשיקול דעת בית המשפט באותה מידה, והמועד אינו נמנה מהמצאה שלא הייתה. ' +
        'זו הנקודה שעורך דין חייב לבחון ראשונה בתיק שלך.',
      sources: [SETTING_ASIDE_AS_OF_RIGHT],
    });
    branches.push(
      serviceDefect(
        'המערכת חישבה לך מועד מחמיר מיום הידיעה, אך ייתכן שהמועד כלל לא החל לרוץ. אל תניח שאיחרת.',
      ),
    );
    status = 'requires_human_review';
  } else if (daysRemaining < 0) {
    status = 'closed';
    reasoning.push({
      he: `המועד להגשת הבקשה חלף ביום ${deadline.lastDate}, לפני ${Math.abs(daysRemaining)} ימים. המסלול הרגיל סגור.`,
    });
    branches.push(
      extensionOfTime(
        'המועד חלף, אך בית המשפט רשאי להאריך מועד ב"טעם מיוחד". זהו שיקול דעת ולא זכות, וההצלחה תלויה בנסיבות שגרמו לאיחור.',
      ),
      serviceDefect(
        'אם בדיעבד יתברר שההמצאה הייתה פגומה, החישוב שלמעלה אינו חל. שווה לבדוק לאיזו כתובת נשלח פסק הדין ומי חתם על הקבלה.',
      ),
    );
  } else if (daysRemaining <= URGENT_THRESHOLD_DAYS) {
    status = 'closing_soon';
    reasoning.push({
      he: `נותרו ${daysRemaining} ימים בלבד, עד ${deadline.lastDate}. זהו לוח זמנים דחוף — פנייה לעורך דין או לסיוע המשפטי צריכה להיעשות היום.`,
    });
  } else {
    status = 'open';
    reasoning.push({
      he: `נותרו ${daysRemaining} ימים, עד ${deadline.lastDate}.`,
    });
  }

  if (facts.serviceStatus === 'unknown') {
    missingFacts.push(
      'לא ידוע אם פסק הדין הומצא לך כדין ומתי. זו העובדה שמשנה את התוצאה יותר מכל אחרת — כדאי לברר בתיק בית המשפט לאיזו כתובת נשלח ומי קיבל אותו.',
    );
  }
  if (!facts.serviceDate && facts.serviceStatus === 'properly_served') {
    missingFacts.push('מועד ההמצאה המדויק חסר; החישוב נעשה מיום הידיעה.');
  }
  if (daysBetween(facts.judgmentDate, facts.learnedDate) < 0) {
    missingFacts.push(
      'לפי התאריכים שמסרת נודע לך על פסק הדין לפני שניתן. אחד התאריכים כנראה שגוי.',
    );
  }

  return {
    track: 'default_judgment',
    trackNameHe: NAME_HE,
    status,
    deadline: {
      countedFrom: from,
      countedFromReason: reason,
      statutoryDays: STATUTORY_DAYS,
      excludedVacationDays: deadline.excludedVacationDays,
      lastDate: deadline.lastDate,
      daysRemaining,
    },
    reasoning,
    branches: [...branches, ...NON_LITIGATION_ROUTES],
    sources: [TAKSADA_2018_SETTING_ASIDE, TAKSADA_2018_VACATIONS, INTERPRETATION_LAW_10],
    verification: 'unverified',
    missingFacts,
    disclaimers: BASE_DISCLAIMERS,
  };
}

export const defaultJudgmentTrack: Track<DefaultJudgmentFacts> = {
  id: 'default_judgment',
  nameHe: NAME_HE,
  verification: 'unverified',
  evaluate,
};
