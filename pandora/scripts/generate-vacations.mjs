/**
 * מייצר את טבלת ימי הפגרה של בתי המשפט כקובץ נתונים סטטי.
 *
 * למה טבלה סטטית ולא חישוב בזמן ריצה: עורך הדין השותף צריך לאמת את
 * המועדים בעיניים. אפשר לאמת טבלה של תאריכים; אי אפשר לאמת ספריית
 * לוח עברי. הטבלה נוצרת פעם אחת, נבדקת, ונכנסת לגיט.
 *
 * מקור: תקנות בתי המשפט (פגרות), תשמ"ג-1983.
 *   פגרת סוכות — י"ד בתשרי עד כ"א בתשרי
 *   פגרת פסח   — י' בניסן עד כ"ו בניסן
 *   פגרת הקיץ  — 21 ביולי עד 5 בספטמבר
 *
 * הרצה:  node scripts/generate-vacations.mjs > src/vacations/table.ts
 */
import { HDate } from '@hebcal/core';

const FROM_YEAR = 2020;
const TO_YEAR = 2040;

const iso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const hebrew = (day, month, hebrewYear) => iso(new HDate(day, month, hebrewYear).greg());

const rows = [];
for (let g = FROM_YEAR; g <= TO_YEAR; g++) {
  // ניסן של שנה עברית H נופל בשנה הלועזית H-3760.
  rows.push({
    year: g,
    name: 'פגרת פסח',
    start: hebrew(10, 'Nisan', g + 3760),
    end: hebrew(26, 'Nisan', g + 3760),
  });
  rows.push({ year: g, name: 'פגרת הקיץ', start: `${g}-07-21`, end: `${g}-09-05` });
  // תשרי של שנה עברית H נופל בשנה הלועזית H-3761.
  rows.push({
    year: g,
    name: 'פגרת סוכות',
    start: hebrew(14, 'Tishrei', g + 3761),
    end: hebrew(21, 'Tishrei', g + 3761),
  });
}

rows.sort((a, b) => a.start.localeCompare(b.start));

const body = rows
  .map((r) => `  { name: '${r.name}', start: '${r.start}', end: '${r.end}' },`)
  .join('\n');

process.stdout.write(`// נוצר אוטומטית על ידי scripts/generate-vacations.mjs — אין לערוך ידנית.
// מקור: תקנות בתי המשפט (פגרות), תשמ"ג-1983.
// טווח: ${FROM_YEAR}–${TO_YEAR}. יש להריץ מחדש לפני שהטבלה נגמרת.
import type { CourtVacation } from './types';

export const COURT_VACATIONS: readonly CourtVacation[] = [
${body}
];

export const VACATION_TABLE_COVERS = { from: ${FROM_YEAR}, to: ${TO_YEAR} } as const;
`);
