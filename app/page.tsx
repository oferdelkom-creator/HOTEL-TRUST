import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/translations";

export default async function HomePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div>
      <section className="bg-gradient-to-br from-brand to-brand-dark">
        <div className="max-w-3xl mx-auto px-4 py-24 text-center text-white">
          <h1 className="text-4xl font-semibold tracking-tight mb-4">{dict.home.heroTitle}</h1>
          <p className="text-lg text-white/90 mb-10">{dict.home.heroSubtitle}</p>

          <form
            action="/search"
            method="get"
            className="bg-white rounded-xl p-4 shadow-lg grid grid-cols-1 md:grid-cols-4 gap-3 text-left"
          >
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                {dict.home.city}
              </label>
              <input
                name="city"
                placeholder={dict.home.cityPlaceholder}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                {dict.home.checkIn}
              </label>
              <input
                type="date"
                name="check_in"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                {dict.home.checkOut}
              </label>
              <input
                type="date"
                name="check_out"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  {dict.home.guests}
                </label>
                <input
                  type="number"
                  name="guests"
                  min={1}
                  defaultValue={1}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
                />
              </div>
              <button
                type="submit"
                className="self-end rounded-md bg-brand text-white px-5 py-2 font-medium"
              >
                {dict.home.search}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div>
          <h2 className="font-medium mb-2 text-brand">{dict.home.feature1Title}</h2>
          <p className="text-sm text-neutral-600">{dict.home.feature1Body}</p>
        </div>
        <div>
          <h2 className="font-medium mb-2 text-brand">{dict.home.feature2Title}</h2>
          <p className="text-sm text-neutral-600">{dict.home.feature2Body}</p>
        </div>
        <div>
          <h2 className="font-medium mb-2 text-brand">{dict.home.feature3Title}</h2>
          <p className="text-sm text-neutral-600">{dict.home.feature3Body}</p>
        </div>
      </section>

      <section className="bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">{dict.home.hostCtaTitle}</h2>
          <p className="text-white/70 mb-6">{dict.home.hostCtaBody}</p>
          <Link
            href="/host/listings/new"
            className="inline-block rounded-md bg-white text-neutral-900 px-6 py-3 font-medium"
          >
            {dict.home.hostCtaButton}
          </Link>
        </div>
      </section>
    </div>
  );
}
