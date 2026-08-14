import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/translations";
import ListingForm from "../../ListingForm";
import PhotoManager from "./PhotoManager";
import BlockedDatesManager from "./BlockedDatesManager";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/host/listings/${id}/edit`);

  const locale = await getLocale();
  const dict = getDictionary(locale);

  const { data: listing } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing || listing.host_id !== user.id) notFound();

  const { data: photos } = await supabase
    .from("listing_photos")
    .select("id, url, sort_order")
    .eq("listing_id", id)
    .order("sort_order");
  const { data: blockedDates } = await supabase
    .from("blocked_dates")
    .select("id, date")
    .eq("listing_id", id)
    .order("date");

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold mb-6">{dict.host.editListingTitle}</h1>
        <ListingForm mode="edit" listingId={listing.id} initialValues={listing} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">{dict.host.photos}</h2>
        <PhotoManager listingId={listing.id} photos={photos ?? []} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">{dict.host.blockedDates}</h2>
        <BlockedDatesManager listingId={listing.id} blockedDates={blockedDates ?? []} />
      </div>
    </div>
  );
}
