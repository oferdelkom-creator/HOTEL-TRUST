import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hotel } from "@/lib/types";
import NewRequestForm from "./NewRequestForm";

export default async function NewExchangeRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/exchange/new");

  const { data: myHotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Hotel>();

  if (!myHotel) redirect("/owner/hotel/new");
  if (myHotel.verification_status !== "verified") redirect("/owner");

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Post an exchange request</h1>
      <NewRequestForm hotelId={myHotel.id} />
    </div>
  );
}
