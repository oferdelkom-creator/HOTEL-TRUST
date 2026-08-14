import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingForm from "../ListingForm";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/host/listings/new");

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Новое объявление</h1>
      <ListingForm mode="create" />
    </div>
  );
}
