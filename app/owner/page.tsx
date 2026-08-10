import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hotel } from "@/lib/types";

const STATUS_LABEL: Record<Hotel["verification_status"], string> = {
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<Hotel["verification_status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default async function OwnerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/owner");

  const { data: hotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Hotel>();

  if (!hotel) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Add your hotel</h1>
        <p className="text-neutral-500 mb-6">
          You need a hotel profile before you can offer nights or exchange with other members.
        </p>
        <Link
          href="/owner/hotel/new"
          className="inline-block rounded-md bg-neutral-900 text-white px-5 py-2.5"
        >
          Add hotel
        </Link>
      </div>
    );
  }

  const { data: balanceRow } = await supabase
    .from("credit_balances")
    .select("balance")
    .eq("hotel_id", hotel.id)
    .maybeSingle<{ balance: number }>();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">{hotel.name}</h1>
          <p className="text-neutral-500">
            {hotel.city}, {hotel.country} - {hotel.stars}★
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CLASS[hotel.verification_status]}`}
        >
          {STATUS_LABEL[hotel.verification_status]}
        </span>
      </div>

      {hotel.verification_status !== "verified" && (
        <div className="mb-8 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Your hotel isn&apos;t verified yet, so you can&apos;t browse the marketplace or offer
          nights. An admin reviews new hotels manually.
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white p-6 mb-8">
        <p className="text-sm text-neutral-500">Credit balance</p>
        <p className="text-3xl font-semibold">{(balanceRow?.balance ?? 0).toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/owner/nights" className="rounded-lg border border-neutral-200 bg-white p-6 hover:border-neutral-400">
          <h2 className="font-medium mb-1">Your available nights</h2>
          <p className="text-sm text-neutral-500">Offer vacant nights to earn credits</p>
        </Link>
        <Link href="/owner/bookings" className="rounded-lg border border-neutral-200 bg-white p-6 hover:border-neutral-400">
          <h2 className="font-medium mb-1">Bookings & ledger</h2>
          <p className="text-sm text-neutral-500">Track exchanges and credit history</p>
        </Link>
        <Link href="/marketplace" className="rounded-lg border border-neutral-200 bg-white p-6 hover:border-neutral-400">
          <h2 className="font-medium mb-1">Marketplace</h2>
          <p className="text-sm text-neutral-500">Browse nights at other verified hotels</p>
        </Link>
        <Link href="/owner/hotel/edit" className="rounded-lg border border-neutral-200 bg-white p-6 hover:border-neutral-400">
          <h2 className="font-medium mb-1">Hotel profile</h2>
          <p className="text-sm text-neutral-500">Edit your hotel details</p>
        </Link>
      </div>
    </div>
  );
}
