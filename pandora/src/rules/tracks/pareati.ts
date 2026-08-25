/**
 * מסלול 3 — טענת "פרעתי".
 *
 * מסלול חריג במנוע: אין לו מועד קבוע בחוק, ולכן שער המועדים אינו
 * סוגר אותו. זו הסיבה שהוא חשוב — הוא נשאר פתוח לאנשים שכל שאר
 * הדלתות נסגרו בפניהם.
 *
 * מה שכן מגביל אותו הוא נטל הראיה: הטוען "פרעתי" צריך להראות שהחוב
 * שולם, ובלי אסמכתאות הטענה לא תתקבל. המערכת אומרת זאת מראש במקום
 * לשלוח אדם להליך שיתמוטט באולם.
 */
import type { GateResult } from '../../types';
import type { BaseFacts, Track } from '../types';
import { EXECUTION_LAW_19 } from '../sources';
import { NON_LITIGATION_ROUTES } from '../branches';

export interface PareatiFacts extends BaseFacts {
  /** האם בידי המשתמש אסמכתאות על התשלום. */
  hasPaymentEvidence: boolean;
  /** תיאור חופשי של הראיות, אם יש. */
  evidenceDescription?: string;
}

const NAME_HE = 'טענת "פרעתי" בהוצאה לפועל';

export function evaluate(facts: PareatiFacts): GateResult {
  const missingFacts = facts.hasPaymentEvidence
    ? []
    : [
        'אין בידיך אסמכתאות על התשלום. בלי אלה הטענה כמעט אינה עומדת — הנטל מוטל עליך, לא על הזוכה.',
      ];

  return {
    track: 'pareati',
    trackNameHe: NAME_HE,
    status: 'no_statutory_deadline',
    reasoning: [
      {
        he: 'טענת "פרעתי" אינה כפופה למועד קבוע בחוק. אם החוב שולם, כולו או חלקו, אפשר להעלות את הטענה גם שנים אחרי פסק הדין.',
        sources: [EXECUTION_LAW_19],
      },
      {
        he: 'מה שכן קובע כאן הוא הראיות: הנטל להוכיח את התשלום מוטל עליך. אישורי העברה, קבלות, דפי בנק והתכתבות עם הזוכה הם מה שיכריע.',
      },
      facts.hasPaymentEvidence
        ? { he: 'מסרת שיש בידיך אסמכתאות. זו נקודת הפתיחה הטובה ביותר במסלול הזה.' }
        : {
            he: 'מסרת שאין בידיך אסמכתאות. לפני שתגיש, כדאי לפנות לבנק לקבלת דפי חשבון מהתקופה הרלוונטית — הם ניתנים לשחזור שנים אחורה.',
          },
    ],
    branches: [...NON_LITIGATION_ROUTES],
    sources: [EXECUTION_LAW_19],
    verification: 'unverified',
    missingFacts,
    disclaimers: [
      'זהו מידע כללי ואינו ייעוץ משפטי. המועדים והעילות טעונים אימות על ידי עורך דין מורשה.',
      'היעדר מועד קבוע אינו אומר שאין מה למהר: ככל שעובר הזמן, קשה יותר לשחזר אסמכתאות.',
    ],
  };
}

export const pareatiTrack: Track<PareatiFacts> = {
  id: 'pareati',
  nameHe: NAME_HE,
  verification: 'unverified',
  evaluate,
};
