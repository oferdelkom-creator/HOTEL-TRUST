import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Booking, CreditLedgerEntry, Hotel } from "@/lib/types";
import ConfirmBookingButton from "./ConfirmBookingButton";

const HOLD_CLASS: Record<Booking["hold_status"], string> = {
  none: "bg-neutral-100 text-neutral-600",
  pending: "bg-amber-100 text-amber-800",
  released: "bg-emerald-100 text-emerald-800",
  captured: "bg-red-100 text-red-800",
};

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/owner/bookings");

  const { data: hotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Hotel>();

  if (!hotel) redirect("/owner/hotel/new");

  const [{ data: myBookings }, { data: hostBookings }, { data: ledger }, { data: balanceRow }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*, host_hotel:hotels!bookings_host_hotel_id_fkey(name, city, country)")
        .eq("requesting_hotel_id", hotel.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("bookings")
        .select("*, requesting_hotel:hotels!bookings_requesting_hotel_id_fkey(name, city, country)")
        .eq("host_hotel_id", hotel.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("credit_ledger")
        .select("*")
        .eq("hotel_id", hotel.id)
        .order("created_at", { ascending: false })
        .returns<CreditLedgerEntry[]>(),
      supabase.from("credit_balances").select("balance").eq("hotel_id", hotel.id).maybeSingle<{
        balance: number;
      }>(),
    ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Bookings & ledger</h1>
        <p className="text-neutral-500">
          Credit balance: <span className="font-semibold text-neutral-900">{(balanceRow?.balance ?? 0).toFixed(2)}</span>
        </p>
      </div>

      <section>
        <h2 className="font-medium mb-4">Nights you booked elsewhere</h2>
        <div className="space-y-3">
          {myBookings?.length ? (
            myBookings.map((b) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <BookingRow key={b.id} booking={b as any} otherHotel={(b as any).host_hotel} />
            ))
          ) : (
            <p className="text-neutral-500 text-sm">No bookings yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-4">Guests booked at your hotel</h2>
        <div className="space-y-3">
          {hostBookings?.length ? (
            hostBookings.map((b) => (
              <div key={b.id} className="rounded-lg border border-neutral-200 bg-white px-5 py-4">
                <BookingRow
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  booking={b as any}
                  otherHotel={(b as any).requesting_hotel}
                  bare
                />
                {b.status === "pending" && <ConfirmBookingButton bookingId={b.id} />}
              </div>
            ))
          ) : (
            <p className="text-neutral-500 text-sm">No one has booked your nights yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-4">Credit history</h2>
        <div className="space-y-2">
          {ledger?.length ? (
            ledger.map((entry) => (
              <div key={entry.id} className="flex justify-between text-sm border-b border-neutral-100 py-2">
                <span className="text-neutral-500">{entry.reason.replace("_", " ")}</span>
                <span className={entry.amount < 0 ? "text-red-600" : "text-emerald-700"}>
                  {entry.amount > 0 ? "+" : ""}
                  {entry.amount.toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-neutral-500 text-sm">No credit activity yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function BookingRow({
  booking,
  otherHotel,
  bare,
}: {
  booking: Booking;
  otherHotel?: { name: string; city: string; country: string } | null;
  bare?: boolean;
}) {
  const content = (
    <>
      <div>
        <p className="font-medium">
          {otherHotel ? `${otherHotel.name} - ${otherHotel.city}, ${otherHotel.country}` : "Hotel"}
        </p>
        <p className="text-sm text-neutral-500">
          {booking.nights} nights - {booking.guest_type} ({booking.guest_name}) - {booking.credits_cost} credits
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-neutral-500">{booking.status}</span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${HOLD_CLASS[booking.hold_status]}`}>
          hold: {booking.hold_status}
        </span>
      </div>
    </>
  );

  if (bare) return <div className="flex items-center justify-between">{content}</div>;

  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4">
      {content}
    </div>
  );
}
