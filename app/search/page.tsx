import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRub } from "@/lib/format";

type SearchParams = {
  city?: string;
  check_in?: string;
  check_out?: string;
  guests?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("id, title, city, price_per_night, max_guests, listing_photos(url, sort_order)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (params.city) {
    query = query.ilike("city", `%${params.city}%`);
  }
  const guests = params.guests ? Number(params.guests) : undefined;
  if (guests && guests > 0) {
    query = query.gte("max_guests", guests);
  }

  const { data: listings, error } = await query;

  let availableListings = listings ?? [];

  if (params.check_in && params.check_out && availableListings.length > 0) {
    const { data: overlapping } = await supabase
      .from("bookings")
      .select("listing_id")
      .in("status", ["pending_payment", "confirmed"])
      .lt("check_in", params.check_out)
      .gt("check_out", params.check_in);

    const bookedIds = new Set((overlapping ?? []).map((b) => b.listing_id));
    availableListings = availableListings.filter((l) => !bookedIds.has(l.id));
  }

  const detailParams = new URLSearchParams();
  if (params.check_in) detailParams.set("check_in", params.check_in);
  if (params.check_out) detailParams.set("check_out", params.check_out);
  if (params.guests) detailParams.set("guests", params.guests);
  const detailQuery = detailParams.toString();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">
        {params.city ? `Жильё в городе ${params.city}` : "Всё доступное жильё"}
      </h1>

      {error && <p className="text-red-600">Не удалось загрузить объявления.</p>}

      {availableListings.length === 0 ? (
        <p className="text-neutral-500">Ничего не найдено. Попробуйте изменить параметры поиска.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableListings.map((listing) => {
            const photos = [...(listing.listing_photos ?? [])].sort(
              (a, b) => a.sort_order - b.sort_order
            );
            const cover = photos[0]?.url;
            return (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}${detailQuery ? `?${detailQuery}` : ""}`}
                className="rounded-xl overflow-hidden border border-neutral-200 bg-white hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-neutral-100">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                      Нет фото
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm text-neutral-500">{listing.city}</p>
                  <h2 className="font-medium mb-1">{listing.title}</h2>
                  <p className="font-semibold">{formatRub(listing.price_per_night)} / ночь</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
