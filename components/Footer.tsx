import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/translations";

export default async function Footer() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <footer className="border-t border-neutral-200 bg-neutral-900">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-white/70 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>{dict.footer.tagline}</p>
        <p className="text-white/40">{dict.footer.payment}</p>
      </div>
    </footer>
  );
}
