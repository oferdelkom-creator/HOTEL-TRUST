import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AMENITIES, PROPERTY_TYPES, ROOM_TYPES } from "@/lib/listingOptions";
import BookingForm from "./BookingForm";

type Params = { id: string };
type SearchParams = { check_in?: string; check_out?: string; guests?: string };

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, title, description, city, address, property_type, room_type, max_guests, bedrooms, beds, bathrooms, price_per_night, cleaning_fee, amenities, host_name, listing_photos(url, sort_order)"
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!listing) {
    notFound();
  }

  const { data: rating } = await supabase
    .from("listing_ratings")
    .select("avg_rating, review_count")
    .eq("listing_id", id)
    .maybeSingle();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("author_name, rating, comment, created_at")
    .eq("listing_id", id)
    .eq("author_role", "guest")
    .order("created_at", { ascending: false });

  const photos = [...(listing.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const propertyLabel =
    PROPERTY_TYPES.find((p) => p.value === listing.property_type)?.label ?? listing.property_type;
  const roomLabel = ROOM_TYPES.find((r) => r.value === listing.room_type)?.label ?? listing.room_type;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-1">{listing.title}</h1>
      <p className="text-neutral-500 mb-6">
        {listing.city}
        {listing.address ? `, ${listing.address}` : ""}
        {rating && (
          <>
            {" · "}
            <span className="text-neutral-700">★ {rating.avg_rating}</span> ({rating.review_count})
          </>
        )}
      </p>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 mb-8 rounded-xl overflow-hidden">
          {photos.slice(0, 4).map((photo, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={photo.url}
              alt={listing.title}
              className={`w-full object-cover h-64 ${i === 0 ? "col-span-2" : ""}`}
            />
          ))}
        </div>
      ) : (
        <div className="mb-8 h-64 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400">
          Нет фото
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="font-medium mb-1">
              {propertyLabel} · {roomLabel}
            </h2>
            <p className="text-sm text-neutral-600">
              До {listing.max_guests} гостей · {listing.bedrooms} спален · {listing.beds} спальных
              мест · {listing.bathrooms} санузлов
            </p>
            {listing.host_name && (
              <p className="text-sm text-neutral-500 mt-1">Хозяин: {listing.host_name}</p>
            )}
          </div>

          <div>
            <h2 className="font-medium mb-2">Описание</h2>
            <p className="text-neutral-700 whitespace-pre-line">
              {listing.description || "Хозяин пока не добавил описание."}
            </p>
          </div>

          {listing.amenities?.length > 0 && (
            <div>
              <h2 className="font-medium mb-2">Удобства</h2>
              <ul className="grid grid-cols-2 gap-2 text-sm text-neutral-700">
                {listing.amenities.map((a: string) => (
                  <li key={a}>{AMENITIES.find((am) => am.value === a)?.label ?? a}</li>
                ))}
              </ul>
            </div>
          )}

          {reviews && reviews.length > 0 && (
            <div>
              <h2 className="font-medium mb-3">Отзывы{rating ? ` · ★ ${rating.avg_rating}` : ""}</h2>
              <div className="space-y-4">
                {reviews.map((r, i) => (
                  <div key={i} className="border-t border-neutral-100 pt-3">
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-medium">{r.author_name || "Гость"}</p>
                      <p className="text-brand text-sm">{"★".repeat(r.rating)}</p>
                    </div>
                    {r.comment && <p className="text-sm text-neutral-600 mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <BookingForm
            listingId={listing.id}
            pricePerNight={listing.price_per_night}
            cleaningFee={listing.cleaning_fee}
            maxGuests={listing.max_guests}
            defaultCheckIn={sp.check_in}
            defaultCheckOut={sp.check_out}
            defaultGuests={sp.guests}
          />
        </div>
      </div>
    </div>
  );
}
