// Split out from locale.ts because that file imports next/headers
// (server-only) - this constant also needs to be importable from client
// components (LocaleProvider sets the cookie on the browser).
export const LOCALE_COOKIE = "locale";
