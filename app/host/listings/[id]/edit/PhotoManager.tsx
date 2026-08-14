"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Photo = { id: string; url: string; sort_order: number };

export default function PhotoManager({
  listingId,
  photos,
}: {
  listingId: string;
  photos: Photo[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `${user.id}/${listingId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, file);
      if (uploadError) {
        setError(uploadError.message);
        continue;
      }
      const { data: pub } = supabase.storage.from("listing-photos").getPublicUrl(path);
      await supabase.from("listing_photos").insert({
        listing_id: listingId,
        url: pub.publicUrl,
        sort_order: photos.length + i,
      });
    }

    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    router.refresh();
  }

  async function handleDelete(photoId: string) {
    const supabase = createClient();
    await supabase.from("listing_photos").delete().eq("id", photoId);
    router.refresh();
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {photos.map((p) => (
          <div key={p.id} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="w-full h-24 object-cover rounded-md" />
            <button
              type="button"
              onClick={() => handleDelete(p.id)}
              className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1.5 py-0.5"
            >
              Удалить
            </button>
          </div>
        ))}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        disabled={uploading}
        className="text-sm"
      />
      {uploading && <p className="text-sm text-neutral-500 mt-1">Загружаем...</p>}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
