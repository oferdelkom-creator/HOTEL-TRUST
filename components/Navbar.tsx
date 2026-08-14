import Link from "next/link";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/translations";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/search" className="text-neutral-700 hover:text-brand">
            {dict.nav.listings}
          </Link>
          <Link href="/host" className="text-neutral-700 hover:text-brand">
            {dict.nav.hostCta}
          </Link>
          {user && (
            <Link href="/account/bookings" className="text-neutral-700 hover:text-brand">
              {dict.nav.myTrips}
            </Link>
          )}
          <LanguageSwitcher />
          <Link
            href={user ? "/account" : "/login"}
            className="rounded-md bg-brand text-white px-4 py-2 hover:bg-brand-dark"
          >
            {user ? dict.nav.profile : dict.nav.signIn}
          </Link>
        </nav>
      </div>
    </header>
  );
}
