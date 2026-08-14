import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./translations";
import { LOCALE_COOKIE } from "./localeCookie";

export { LOCALE_COOKIE };

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
}
