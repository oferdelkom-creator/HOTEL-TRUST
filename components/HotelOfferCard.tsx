import type { ReactNode } from "react";
import type { Hotel, NightOffer } from "@/lib/types";
import { SEASON_TIER_LABELS } from "@/lib/credits";
import { formatDateRange, formatNights } from "@/lib/format";
import StarRating from "./StarRating";

/**
 * The single presentation of a night offer, shared by the marketplace list and
 * the booking detail page so an owner sees the same facts, in the same order,
 * wherever the offer appears: which hotel, where, what class of property, which
 * dates, and what it costs in credits.
 */
export default function HotelOfferCard({
  hotel,
  offer,
  cost,
  action,
  showContact = false,
}: {
  hotel: Hotel;
  offer: NightOffer;
  cost: number;
  action?: ReactNode;
  showContact?: boolean;
}) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white px-6 py-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h3 className="font-medium text-brand-green">{hotel.name}</h3>
          <p className="text-sm text-neutral-600">
            {hotel.city}, {hotel.country}
          </p>
          <p className="text-sm mt-1">
            <StarRating stars={hotel.stars} />
          </p>
          {hotel.business_name && (
            <p className="text-xs text-neutral-500 mt-1">Operated by {hotel.business_name}</p>
          )}
        </div>

        <div className="sm:text-right shrink-0">
          <p className="text-lg font-semibold text-brand-green">{cost.toFixed(2)} credits</p>
          <p className="text-xs text-neutral-500">for the full stay</p>
          {action && <div className="mt-2">{action}</div>}
        </div>
      </div>

      <dl className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Dates</dt>
          <dd className="mt-0.5">{formatDateRange(offer.start_date, offer.end_date)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Length of stay</dt>
          <dd className="mt-0.5">{formatNights(offer.nights)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Season</dt>
          <dd className="mt-0.5">{SEASON_TIER_LABELS[offer.season_tier]}</dd>
        </div>
      </dl>

      {(hotel.perks || hotel.accessibility || (showContact && hotel.contact_info)) && (
        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3 text-sm">
          {hotel.perks && (
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                What this hotel offers
              </p>
              <p className="mt-0.5 text-brand-green">{hotel.perks}</p>
              <p className="text-xs text-neutral-500 mt-1">
                Offered by the host hotel; upgrades and other extras remain subject to availability.
              </p>
            </div>
          )}
          {hotel.accessibility && (
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Accessibility</p>
              <p className="mt-0.5 text-neutral-600">{hotel.accessibility}</p>
            </div>
          )}
          {showContact && hotel.contact_info && (
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Hotel contact</p>
              <p className="mt-0.5 text-neutral-600">{hotel.contact_info}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
