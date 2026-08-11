import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hotel, SwapMessage, SwapRequest } from "@/lib/types";
import ChatThread from "./ChatThread";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ requestId: string; otherHotelId: string }>;
}) {
  const { requestId, otherHotelId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/exchange/${requestId}/chat/${otherHotelId}`);

  const { data: myHotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Hotel>();
  if (!myHotel) redirect("/owner/hotel/new");

  const { data: request } = await supabase
    .from("swap_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<SwapRequest>();
  if (!request) notFound();

  const { data: otherHotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", otherHotelId)
    .maybeSingle<Hotel>();
  if (!otherHotel) notFound();

  const { data: messages } = await supabase
    .from("swap_messages")
    .select("*")
    .eq("request_id", requestId)
    .or(
      `and(sender_hotel_id.eq.${myHotel.id},recipient_hotel_id.eq.${otherHotelId}),and(sender_hotel_id.eq.${otherHotelId},recipient_hotel_id.eq.${myHotel.id})`
    )
    .order("created_at", { ascending: true })
    .returns<SwapMessage[]>();

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-xl font-semibold mb-1">
        {otherHotel.name} - {otherHotel.city}, {otherHotel.country}
      </h1>
      <p className="text-neutral-500 mb-6">Re: {request.wanted_location}</p>

      <ChatThread
        requestId={requestId}
        myHotelId={myHotel.id}
        otherHotelId={otherHotelId}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
