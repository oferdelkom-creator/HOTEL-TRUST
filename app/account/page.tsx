import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-1">{profile?.full_name || "Профиль"}</h1>
      <p className="text-neutral-500 mb-8">{profile?.email}</p>

      <div className="space-y-3">
        <Link
          href="/account/bookings"
          className="block rounded-md border border-neutral-200 px-4 py-3 hover:bg-neutral-50"
        >
          Мои бронирования
        </Link>
        <Link
          href="/host"
          className="block rounded-md border border-neutral-200 px-4 py-3 hover:bg-neutral-50"
        >
          Панель хозяина
        </Link>
      </div>
    </div>
  );
}
