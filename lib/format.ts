// Offer dates are stored as plain `YYYY-MM-DD` strings. Parsing them as UTC and
// formatting with an explicit UTC timeZone keeps the rendered date identical on
// the server and in the browser, whatever the viewer's local timezone is.
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? isoDate : DATE_FORMAT.format(parsed);
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} → ${formatDate(endDate)}`;
}

export function formatNights(nights: number): string {
  return `${nights} ${nights === 1 ? "night" : "nights"}`;
}
