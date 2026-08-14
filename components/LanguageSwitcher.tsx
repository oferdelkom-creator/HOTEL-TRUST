"use client";

import { useLocale } from "./LocaleProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center text-sm border border-neutral-200 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setLocale("ru")}
        className={`px-2 py-1 ${locale === "ru" ? "bg-neutral-900 text-white" : "text-neutral-500"}`}
      >
        RU
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-2 py-1 ${locale === "en" ? "bg-neutral-900 text-white" : "text-neutral-500"}`}
      >
        EN
      </button>
    </div>
  );
}
