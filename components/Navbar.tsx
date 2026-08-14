import Link from "next/link";
import Logo from "./Logo";
import { createClient } from "@/lib/supabase/server";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/search" className="text-neutral-700 hover:text-brand">
            Жильё
          </Link>
          <Link href="/host" className="text-neutral-700 hover:text-brand">
            Сдать жильё
          </Link>
          {user && (
            <Link href="/account/bookings" className="text-neutral-700 hover:text-brand">
              Мои поездки
            </Link>
          )}
          <Link
            href={user ? "/account" : "/login"}
            className="rounded-md bg-brand text-white px-4 py-2 hover:bg-brand-dark"
          >
            {user ? "Профиль" : "Войти"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
