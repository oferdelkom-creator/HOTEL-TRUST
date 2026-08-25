/**
 * תיבת פנדורה — שער המועדים.
 *
 * חבילה עצמאית, בלי תלות ב-UI ובלי גישה לרשת. זהו הרכיב שהתוכנית
 * (סעיף 6) מגדירה כ"מנוע כללים דטרמיניסטי — לא LLM": הוא מקבל עובדות
 * מאומתות על ידי המשתמש ומחזיר הכרעה שאפשר לשחזר, לבדוק ולהגן עליה.
 *
 * מה שהמנוע הזה לא עושה: הוא אינו מנתח עילות, אינו מעריך סיכויים
 * ואינו כותב מסמכים. אלה שלבים נפרדים, ושניים מהם דורשים חתימת עורך דין.
 */
export * from './types';
export { computeDeadline } from './engine/deadline';
export type { DeadlineInput, DeadlineOutput } from './engine/deadline';
export { COURT_VACATIONS, vacationOn, tableCovers } from './vacations';
export type { CourtVacation } from './vacations';
export type { ServiceStatus, BaseFacts, Track } from './rules/types';

export { defaultJudgmentTrack } from './rules/tracks/default-judgment';
export type { DefaultJudgmentFacts } from './rules/tracks/default-judgment';
export { executionObjectionTrack } from './rules/tracks/execution-objection';
export type { ExecutionObjectionFacts } from './rules/tracks/execution-objection';
export { pareatiTrack } from './rules/tracks/pareati';
export type { PareatiFacts } from './rules/tracks/pareati';
export { appealExtensionTrack } from './rules/tracks/appeal-extension';
export type { AppealExtensionFacts } from './rules/tracks/appeal-extension';
