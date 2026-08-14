"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AMENITY_VALUES, PROPERTY_TYPE_VALUES, ROOM_TYPE_VALUES } from "@/lib/listingOptions";
import { useLocale } from "@/components/LocaleProvider";

type ListingFormValues = {
  title: string;
  description: string;
  city: string;
  address: string;
  property_type: string;
  room_type: string;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  price_per_night: number;
  cleaning_fee: number;
  amenities: string[];
  status: string;
};

const EMPTY: ListingFormValues = {
  title: "",
  description: "",
  city: "",
  address: "",
  property_type: "apartment",
  room_type: "entire_place",
  max_guests: 1,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  price_per_night: 2000,
  cleaning_fee: 0,
  amenities: [],
  status: "published",
};

export default function ListingForm({
  mode,
  listingId,
  initialValues,
}: {
  mode: "create" | "edit";
  listingId?: string;
  initialValues?: Partial<ListingFormValues>;
}) {
  const router = useRouter();
  const { dict } = useLocale();
  const [values, setValues] = useState<ListingFormValues>({ ...EMPTY, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleAmenity(value: string) {
    setValues((v) => ({
      ...v,
      amenities: v.amenities.includes(value)
        ? v.amenities.filter((a) => a !== value)
        : [...v.amenities, value],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (mode === "create") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const { data, error: insertError } = await supabase
        .from("listings")
        .insert({ ...values, host_id: user.id, host_name: profile?.full_name ?? "" })
        .select("id")
        .single();

      if (insertError || !data) {
        setError(insertError?.message ?? dict.listingForm.createError);
        setLoading(false);
        return;
      }
      router.push(`/host/listings/${data.id}/edit`);
    } else {
      const { error: updateError } = await supabase.from("listings").update(values).eq("id", listingId);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">{dict.listingForm.title}</label>
        <input
          required
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{dict.listingForm.description}</label>
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">{dict.listingForm.city}</label>
          <input
            required
            value={values.city}
            onChange={(e) => update("city", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{dict.listingForm.address}</label>
          <input
            value={values.address}
            onChange={(e) => update("address", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">{dict.listingForm.propertyType}</label>
          <select
            value={values.property_type}
            onChange={(e) => update("property_type", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            {PROPERTY_TYPE_VALUES.map((v) => (
              <option key={v} value={v}>
                {dict.propertyTypeLabels[v]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{dict.listingForm.roomType}</label>
          <select
            value={values.room_type}
            onChange={(e) => update("room_type", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            {ROOM_TYPE_VALUES.map((v) => (
              <option key={v} value={v}>
                {dict.roomTypeLabels[v]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">{dict.listingForm.guests}</label>
          <input
            required
            type="number"
            min={1}
            value={values.max_guests}
            onChange={(e) => update("max_guests", Number(e.target.value))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{dict.listingForm.bedrooms}</label>
          <input
            required
            type="number"
            min={0}
            value={values.bedrooms}
            onChange={(e) => update("bedrooms", Number(e.target.value))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{dict.listingForm.beds}</label>
          <input
            required
            type="number"
            min={0}
            value={values.beds}
            onChange={(e) => update("beds", Number(e.target.value))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{dict.listingForm.bathrooms}</label>
          <input
            required
            type="number"
            min={0}
            value={values.bathrooms}
            onChange={(e) => update("bathrooms", Number(e.target.value))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">{dict.listingForm.pricePerNight}</label>
          <input
            required
            type="number"
            min={1}
            value={values.price_per_night}
            onChange={(e) => update("price_per_night", Number(e.target.value))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{dict.listingForm.cleaningFee}</label>
          <input
            type="number"
            min={0}
            value={values.cleaning_fee}
            onChange={(e) => update("cleaning_fee", Number(e.target.value))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{dict.listingForm.amenities}</label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {AMENITY_VALUES.map((v) => (
            <label key={v} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={values.amenities.includes(v)}
                onChange={() => toggleAmenity(v)}
              />
              {dict.amenityLabels[v]}
            </label>
          ))}
        </div>
      </div>

      {mode === "edit" && (
        <div>
          <label className="block text-sm font-medium mb-1">{dict.listingForm.status}</label>
          <select
            value={values.status}
            onChange={(e) => update("status", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="draft">{dict.listingForm.statusDraft}</option>
            <option value="published">{dict.listingForm.statusPublished}</option>
            <option value="archived">{dict.listingForm.statusArchived}</option>
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand text-white px-5 py-2.5 font-medium disabled:opacity-50"
      >
        {loading
          ? dict.listingForm.saving
          : mode === "create"
            ? dict.listingForm.createSubmit
            : dict.listingForm.saveSubmit}
      </button>
    </form>
  );
}
