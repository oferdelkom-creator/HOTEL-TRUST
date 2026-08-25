/**
 * מסלול 4 — בקשה להארכת מועד להגשת ערעור.
 *
 * המסלול היחיד במנוע שלעולם אינו מחזיר "פתוח" או "סגור". התנאי הוא
 * "טעם מיוחד", שהוא שיקול דעת שיפוטי ולא חישוב. מנוע דטרמיניסטי אינו
 * יכול להכריע בו, ומודל שפה בוודאי לא — ולכן התשובה כאן היא תמיד
 * העברה לבדיקה אנושית, עם הצגת השיקולים שבית המשפט ישקול בפועל.
 *
 * מה שהמנוע כן עושה: מודד את גודל האיחור. הפער בין איחור של שלושה
 * ימים לאיחור של שלוש שנים הוא ההבדל המעשי בין בקשה שיש בה טעם לבין
 * בקשה שאין.
 */
import type { GateResult, ReasoningStep } from '../../types';
import type { BaseFacts, Track } from '../types';
import { daysBetween, isIsoDate } from '../../dates';
import { NON_LITIGATION_ROUTES } from '../branches';

export interface AppealExtensionFacts extends BaseFacts {
  /** המועד האחרון שהוחמץ. */
  missedDeadline: string;
  /** הסיבה לאיחור, כפי שהמשתמש מתאר אותה. */
  reasonForDelay?: string;
  /** האם המשתמש היה מיוצג בזמן שהמועד חלף. */
  wasRepresented?: boolean;
}

const NAME_HE = 'בקשה להארכת מועד להגשת ערעור';

/** מעבר לסף הזה, האיחור עצמו הופך למכשול המרכזי. */
const SUBSTANTIAL_DELAY_DAYS = 90;

export function evaluate(facts: AppealExtensionFacts): GateResult {
  if (!isIsoDate(facts.today) || !isIsoDate(facts.missedDeadline)) {
    return {
      track: 'appeal_extension',
      trackNameHe: NAME_HE,
      status: 'insufficient_facts',
      reasoning: [{ he: 'חסר המועד שהוחמץ, ובלעדיו אי אפשר להעריך את גודל האיחור.' }],
      branches: [...NON_LITIGATION_ROUTES],
      sources: [],
      verification: 'unverified',
      missingFacts: ['המועד האחרון שהוחמץ.'],
      disclaimers: ['זהו מידע כללי ואינו ייעוץ משפטי.'],
    };
  }

  const delayDays = daysBetween(facts.missedDeadline, facts.today);

  const reasoning: ReasoningStep[] = [
    {
      he: 'הארכת מועד אינה זכות. בית המשפט נותן אותה ב"טעם מיוחד" בלבד, וזהו שיקול דעת שאיש אינו יכול להבטיח לך את תוצאתו מראש.',
    },
    {
      he:
        delayDays <= 0
          ? 'לפי התאריכים שמסרת המועד טרם חלף. אם כך, אינך זקוק להארכה — בדוק שוב את המסלול הרגיל.'
          : `האיחור עומד על ${delayDays} ימים.`,
    },
  ];

  if (delayDays > SUBSTANTIAL_DELAY_DAYS) {
    reasoning.push({
      he: 'זהו איחור ניכר. ככל שהאיחור ארוך יותר, כך גדל המשקל שבית המשפט ייתן לאינטרס של הצד השני בסופיות ההליך — ולא רק לסיבת האיחור שלך.',
    });
  }

  if (facts.wasRepresented) {
    reasoning.push({
      he:
        'מסרת שהיית מיוצג כשהמועד חלף. ככלל, מחדל של עורך הדין נזקף ללקוח, ויש לכך חריגים. ' +
        'זו סוגיה פתוחה שהמיזם סימן כשאלת המחקר הראשונה שלו — עורך דין חייב לבחון אותה בתיק שלך, ' +
        'ולצדה גם את השאלה הנפרדת של אחריות מקצועית.',
    });
  }

  reasoning.push({
    he: 'מה שבית המשפט יבחן בפועל: מה גרם לאיחור, האם פעלת מיד כשנודע לך, מה גודל האיחור, ומה סיכויי הערעור לגופו. סיבה טובה בלי סיכוי בערעור לרוב לא תספיק.',
  });

  return {
    track: 'appeal_extension',
    trackNameHe: NAME_HE,
    // תמיד. אין כאן הכרעה אוטומטית, ומערכת שתיתן אחת תמכור תקווה.
    status: 'requires_human_review',
    reasoning,
    branches: [...NON_LITIGATION_ROUTES],
    sources: [],
    verification: 'unverified',
    missingFacts: facts.reasonForDelay
      ? []
      : ['לא מסרת מה גרם לאיחור. זהו הנתון המרכזי בבקשה מסוג זה.'],
    disclaimers: [
      'זהו מידע כללי ואינו ייעוץ משפטי.',
      'המערכת אינה מעריכה את סיכויי הבקשה ולא תעריך. הערכה כזו היא ייעוץ משפטי, ורק עורך דין רשאי לתת אותה.',
    ],
  };
}

export const appealExtensionTrack: Track<AppealExtensionFacts> = {
  id: 'appeal_extension',
  nameHe: NAME_HE,
  verification: 'unverified',
  evaluate,
};
