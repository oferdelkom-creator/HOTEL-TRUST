import type { Stars } from "@/lib/credits";

const MAX_STARS = 5;

export default function StarRating({ stars }: { stars: Stars }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="text-brand-gold tracking-tight">
        {"★".repeat(stars)}
        <span className="text-neutral-300">{"☆".repeat(MAX_STARS - stars)}</span>
      </span>
      <span className="sr-only">{stars}-star hotel</span>
      <span aria-hidden="true" className="text-neutral-500">
        {stars}-star
      </span>
    </span>
  );
}
