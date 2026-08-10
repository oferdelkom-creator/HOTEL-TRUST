"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={loading}
      className="mt-3 text-sm rounded-md bg-neutral-900 text-white px-4 py-1.5 hover:bg-neutral-700 disabled:opacity-50"
    >
      {loading ? "Confirming..." : "Confirm booking"}
    </button>
  );
}
