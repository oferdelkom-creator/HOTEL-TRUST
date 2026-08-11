import type { SeasonTier, Stars } from "@/lib/credits";

export type Role = "hotel_owner" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type OfferStatus = "open" | "booked" | "withdrawn";
export type GuestType = "owner" | "family" | "employee";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type HoldStatus = "none" | "pending" | "released" | "captured";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Hotel {
  id: string;
  owner_id: string;
  name: string;
  country: string;
  city: string;
  stars: Stars;
  verification_status: VerificationStatus;
  verification_proof_url: string | null;
  verification_note: string | null;
  // Free text: what this specific host offers guests beyond the room itself
  // (upgrade subject to availability, welcome wine, breakfast, etc). Each
  // hotel declares its own - there's no universal guarantee across the
  // network since not every property can offer the same extras.
  perks: string | null;
  created_at: string;
}

export interface NightOffer {
  id: string;
  hotel_id: string;
  start_date: string;
  end_date: string;
  nights: number;
  season_tier: SeasonTier;
  status: OfferStatus;
  created_at: string;
}

export interface Booking {
  id: string;
  night_offer_id: string;
  host_hotel_id: string;
  requesting_hotel_id: string;
  guest_type: GuestType;
  guest_name: string;
  stars_at_booking: Stars;
  season_tier_at_booking: SeasonTier;
  nights: number;
  credits_cost: number;
  status: BookingStatus;
  hold_status: HoldStatus;
  created_at: string;
}

export interface CreditLedgerEntry {
  id: string;
  hotel_id: string;
  booking_id: string | null;
  amount: number;
  reason: "booking_spent" | "stay_redeemed" | "admin_adjustment";
  created_at: string;
}

export type SwapRequestStatus = "open" | "closed";

export interface SwapRequest {
  id: string;
  hotel_id: string;
  wanted_location: string;
  notes: string | null;
  status: SwapRequestStatus;
  created_at: string;
}

export interface SwapInterest {
  id: string;
  request_id: string;
  interested_hotel_id: string;
  created_at: string;
}

export interface SwapMessage {
  id: string;
  request_id: string;
  sender_hotel_id: string;
  recipient_hotel_id: string;
  body: string;
  created_at: string;
}
