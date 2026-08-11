"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Hotel } from "@/lib/types";

export default function HotelForm({ hotel }: { hotel?: Hotel }) {
  const router = useRouter();
  const [name, setName] = useState(hotel?.name ?? "");
  const [country, setCountry] = useState(hotel?.country ?? "");
  const [city, setCity] = useState(hotel?.city ?? "");
  const [stars, setStars] = useState(hotel?.stars ?? 4);
  const [proofUrl, setProofUrl] = useState(hotel?.verification_proof_url ?? "");
  const [businessName, setBusinessName] = useState(hotel?.business_name ?? "");
  const [perks, setPerks] = useState(hotel?.perks ?? "");
  const [accessibility, setAccessibility] = useState(hotel?.accessibility ?? "");
  const [contactInfo, setContactInfo] = useState(hotel?.contact_info ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      if (hotel) {
        const { error: updateError } = await supabase
          .from("hotels")
          .update({
            name,
            country,
            city,
            stars,
            verification_proof_url: proofUrl,
            business_name: businessName,
            perks,
            accessibility,
            contact_info: contactInfo,
          })
          .eq("id", hotel.id);
        if (updateError) throw updateError;
      } else {
        const { data: newHotel, error: insertError } = await supabase
          .from("hotels")
          .insert({
            owner_id: user.id,
            name,
            country,
            city,
            stars,
            verification_proof_url: proofUrl,
            business_name: businessName,
            perks,
            accessibility,
            contact_info: contactInfo,
          })
          .select()
          .single();
        if (insertError) throw insertError;

        await fetch("/api/notify/new-hotel-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hotelId: newHotel.id }),
        }).catch(() => {});
      }

      router.push("/owner");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Hotel name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Country</label>
          <input
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Star rating</label>
        <select
          value={stars}
          onChange={(e) => setStars(Number(e.target.value) as 3 | 4 | 5)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        >
          <option value={3}>3 stars</option>
          <option value={4}>4 stars</option>
          <option value={5}>5 stars</option>
        </select>
        <p className="text-xs text-neutral-500 mt-1">Below 3 stars isn&apos;t accepted onto the platform.</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Business / legal entity name</label>
        <input
          placeholder="e.g. the company the hotel is registered under, if different from your own name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Ownership proof link</label>
        <input
          required
          type="url"
          placeholder="Link to your Booking.com / Google Business listing, or a hosted license document"
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
        <p className="text-xs text-neutral-500 mt-1">
          An admin reviews this manually before your hotel is verified.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">What guests get beyond the room</label>
        <textarea
          rows={3}
          placeholder="e.g. Free upgrade subject to availability, welcome bottle of wine, breakfast included"
          value={perks}
          onChange={(e) => setPerks(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
        <p className="text-xs text-neutral-500 mt-1">
          Optional - only offer what you can actually deliver. Shown to other members browsing
          your listing.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Accessibility</label>
        <textarea
          rows={2}
          placeholder="e.g. Wheelchair accessible rooms, elevator, accessible bathroom"
          value={accessibility}
          onChange={(e) => setAccessibility(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Contact (phone / WhatsApp)</label>
        <input
          placeholder="+972..."
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
        <p className="text-xs text-neutral-500 mt-1">
          Shown to other members so they can reach you directly.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand-green text-brand-gold px-5 py-2.5 disabled:opacity-50"
      >
        {loading ? "Saving..." : hotel ? "Save changes" : "Add hotel"}
      </button>
    </form>
  );
}
