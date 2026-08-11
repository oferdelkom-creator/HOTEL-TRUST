"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VerificationActions({ hotelId }: { hotelId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function decide(status: "verified" | "rejected") {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("hotels").update({ verification_status: status }).eq("id", hotelId);
    // Best-effort notification - a failed email shouldn't block the decision itself.
    await fetch("/api/notify/verification-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotelId }),
    }).catch(() => {});
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-3 flex gap-2">
      <button
        onClick={() => decide("verified")}
        disabled={loading}
        className="text-sm rounded-md bg-emerald-700 text-white px-4 py-1.5 hover:bg-emerald-800 disabled:opacity-50"
      >
        Verify
      </button>
      <button
        onClick={() => decide("rejected")}
        disabled={loading}
        className="text-sm rounded-md bg-red-700 text-white px-4 py-1.5 hover:bg-red-800 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
