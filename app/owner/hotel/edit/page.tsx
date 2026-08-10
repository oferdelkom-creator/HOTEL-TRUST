import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hotel } from "@/lib/types";
import HotelForm from "../HotelForm";

export default async function EditHotelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/owner/hotel/edit");

  const { data: hotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Hotel>();

  if (!hotel) redirect("/owner/hotel/new");

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Edit your hotel</h1>
      <HotelForm hotel={hotel} />
    </div>
  );
}
