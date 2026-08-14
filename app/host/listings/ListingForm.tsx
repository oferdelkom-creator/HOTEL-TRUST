"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AMENITIES, PROPERTY_TYPES, ROOM_TYPES } from "@/lib/listingOptions";

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
        setError(insertError?.message ?? "Не удалось создать объявление");
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
        <label className="block text-sm font-medium mb-1">Название</label>
        <input
          required
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Описание</label>
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Город</label>
          <input
            required
            value={values.city}
            onChange={(e) => update("city", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Адрес</label>
          <input
            value={values.address}
            onChange={(e) => update("address", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Тип жилья</label>
          <select
            value={values.property_type}
            onChange={(e) => update("property_type", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            {PROPERTY_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Что сдаётся</label>
          <select
            value={values.room_type}
            onChange={(e) => update("room_type", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            {ROOM_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Гостей</label>
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
          <label className="block text-sm font-medium mb-1">Спален</label>
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
          <label className="block text-sm font-medium mb-1">Мест</label>
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
          <label className="block text-sm font-medium mb-1">Санузлов</label>
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
          <label className="block text-sm font-medium mb-1">Цена за ночь, ₽</label>
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
          <label className="block text-sm font-medium mb-1">Плата за уборку, ₽</label>
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
        <label className="block text-sm font-medium mb-2">Удобства</label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {AMENITIES.map((a) => (
            <label key={a.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={values.amenities.includes(a.value)}
                onChange={() => toggleAmenity(a.value)}
              />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      {mode === "edit" && (
        <div>
          <label className="block text-sm font-medium mb-1">Статус</label>
          <select
            value={values.status}
            onChange={(e) => update("status", e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="draft">Черновик (не видно гостям)</option>
            <option value="published">Опубликовано</option>
            <option value="archived">В архиве</option>
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-brand text-white px-5 py-2.5 font-medium disabled:opacity-50"
      >
        {loading ? "Сохраняем..." : mode === "create" ? "Создать и добавить фото" : "Сохранить"}
      </button>
    </form>
  );
}
