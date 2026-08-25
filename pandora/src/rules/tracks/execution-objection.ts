/**
 * מסלול 2 — התנגדות לביצוע תביעה על סכום קצוב.
 *
 * הערה על פגרות: החרגת ימי הפגרה מקורה בתקנות סדר הדין האזרחי.
 * תחולתה על מועד שמקורו בחוק ההוצאה לפועל אינה מובנת מאליה, ולכן
 * המסלול הזה מחשב *בלי* החרגה — ההנחה המחמירה, שמציגה למשתמש מועד
 * מוקדם יותר. אם עורך הדין השותף יאשר שההחרגה חלה, יש להפוך את הדגל
 * ולעדכן את הבדיקות.
 */
import type { GateResult, ReasoningStep } from '../../types';
import type { BaseFacts, ServiceStatus, Track } from '../types';
import { computeDeadline } from '../../engine/deadline';
import { daysBetween, isIsoDate } from '../../dates';
import { EXECUTION_LAW_81A1, INTERPRETATION_LAW_10 } from '../sources';
import { extensionOfTime, serviceDefect, pareati, NON_LITIGATION_ROUTES } from '../branches';

export interface ExecutionObjectionFacts extends BaseFacts {
  /** מועד המצאת האזהרה מלשכת ההוצאה לפועל. */
  warningServiceDate?: string | null;
  /** מתי נודע למשתמש על תיק ההוצאה לפועל. */
  learnedDate: string;
  serviceStatus: ServiceStatus;
  /** האם המשתמש טוען שהחוב שולם — פותח את מסלול "פרעתי" במקביל. */
  claimsDebtPaid?: boolean;
}

const STATUTORY_DAYS = 30;
const URGENT_THRESHOLD_DAYS = 7;
const NAME_HE = 'התנגדות לביצוע תביעה על סכום קצוב';

const DISCLAIMERS = [
  'זהו מידע כללי ואינו ייעוץ משפטי. המועדים והעילות טעונים אימות על ידי עורך דין מורשה.',
  'המועד נמנה מהמצאת האזהרה, לא מפתיחת התיק. אלה שני תאריכים שונים.',
];

export function evaluate(facts: ExecutionObjectionFacts): GateResult {
  const base = {
    track: 'execution_objection' as const,
    trackNameHe: NAME_HE,
    sources: [EXECUTION_LAW_81A1, INTERPRETATION_LAW_10],
    verification: 'unverified' as const,
    disclaimers: DISCLAIMERS,
  };

  if (!isIsoDate(facts.today) || !isIsoDate(facts.learnedDate)) {
    return {
      ...base,
      status: 'insufficient_facts',
      reasoning: [{ he: 'חסר התאריך שבו נודע לך על תיק ההוצאה לפועל.' }],
      branches: [...NON_LITIGATION_ROUTES],
      missingFacts: ['מועד הידיעה על תיק ההוצאה לפועל.'],
    };
  }

  const servedProperly = facts.serviceStatus === 'properly_served' && !!facts.warningServiceDate;
  const from = servedProperly ? facts.warningServiceDate! : facts.learnedDate;
  const reason = servedProperly
    ? 'האזהרה הומצאה לך כדין, ולכן מניין הימים מתחיל מיום ההמצאה.'
    : 'האזהרה לא הומצאה כדין או שמועדה אינו ידוע, ולכן החישוב נעשה מיום הידיעה.';

  const deadline = computeDeadline({
    countFrom: from,
    statutoryDays: STATUTORY_DAYS,
    excludeVacations: false,
  });
  const daysRemaining = daysBetween(facts.today, deadline.lastDate);

  const reasoning: ReasoningStep[] = [
    {
      he: `לחייב עומדים ${STATUTORY_DAYS} ימים מהמצאת האזהרה כדי להגיש התנגדות לביצוע.`,
      sources: [EXECUTION_LAW_81A1],
    },
    { he: reason },
    {
      he: 'ימי פגרה לא הוחרגו מן המניין במסלול זה. זו ההנחה המחמירה: ייתכן שיש לך יותר זמן מכפי שמוצג כאן, אך אין להסתמך על כך.',
    },
  ];

  const branches = [];
  let status: GateResult['status'];

  if (facts.serviceStatus === 'defect_suspected' || facts.serviceStatus === 'never_served') {
    status = 'requires_human_review';
    reasoning.push({
      he: 'מסרת שהאזהרה לא הגיעה אליך כדין. אזהרה שלא הומצאה היא טענה נפרדת, והמועד אינו נמנה מהמצאה שלא הייתה.',
    });
    branches.push(serviceDefect('יש לבדוק בלשכת ההוצאה לפועל לאיזו כתובת נשלחה האזהרה ומי אישר את קבלתה.'));
  } else if (daysRemaining < 0) {
    status = 'closed';
    reasoning.push({
      he: `המועד חלף ביום ${deadline.lastDate}, לפני ${Math.abs(daysRemaining)} ימים.`,
    });
    branches.push(
      extensionOfTime('אפשר לבקש הארכת מועד להגשת ההתנגדות. זהו שיקול דעת ולא זכות.'),
    );
  } else if (daysRemaining <= URGENT_THRESHOLD_DAYS) {
    status = 'closing_soon';
    reasoning.push({ he: `נותרו ${daysRemaining} ימים בלבד, עד ${deadline.lastDate}.` });
  } else {
    status = 'open';
    reasoning.push({ he: `נותרו ${daysRemaining} ימים, עד ${deadline.lastDate}.` });
  }

  if (facts.claimsDebtPaid) {
    branches.push(
      pareati(
        'מסרת שהחוב שולם. טענת "פרעתי" היא מסלול נפרד שאינו כפוף לאותו מועד, והוא עשוי להיות פתוח גם אם ההתנגדות סגורה.',
      ),
    );
  }

  return {
    ...base,
    status,
    deadline: {
      countedFrom: from,
      countedFromReason: reason,
      statutoryDays: STATUTORY_DAYS,
      excludedVacationDays: 0,
      lastDate: deadline.lastDate,
      daysRemaining,
    },
    reasoning,
    branches: [...branches, ...NON_LITIGATION_ROUTES],
    missingFacts: servedProperly ? [] : ['מועד ההמצאה המדויק של האזהרה.'],
  };
}

export const executionObjectionTrack: Track<ExecutionObjectionFacts> = {
  id: 'execution_objection',
  nameHe: NAME_HE,
  verification: 'unverified',
  evaluate,
};
