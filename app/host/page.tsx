import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRub } from "@/lib/format";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/translations";

export default async function HostDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/host");

  const locale = await getLocale();
  const dict = getDictionary(locale);

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, city, price_per_night, status")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{dict.host.myListings}</h1>
        <Link href="/host/listings/new" className="rounded-md bg-brand text-white px-4 py-2 font-medium">
          {dict.host.newListing}
        </Link>
      </div>

      {!listings || listings.length === 0 ? (
        <p className="text-neutral-500">{dict.host.noListings}</p>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div
              key={l.id}
              className="flex justify-between items-center border border-neutral-200 rounded-lg p-4"
            >
              <div>
                <p className="font-medium">{l.title}</p>
                <p className="text-sm text-neutral-500">
                  {l.city} · {formatRub(l.price_per_night)} {dict.host.perNight} ·{" "}
                  {dict.listingStatusLabels[l.status as keyof typeof dict.listingStatusLabels] ??
                    l.status}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <Link href={`/host/listings/${l.id}/edit`} className="text-brand hover:underline">
                  {dict.host.edit}
                </Link>
                <Link href={`/host/listings/${l.id}/bookings`} className="text-brand hover:underline">
                  {dict.host.bookings}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
