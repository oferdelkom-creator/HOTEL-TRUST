export const PROPERTY_TYPE_VALUES = ["apartment", "house", "room", "studio"] as const;

export const ROOM_TYPE_VALUES = ["entire_place", "private_room", "shared_room"] as const;

export const AMENITY_VALUES = [
  "wifi",
  "kitchen",
  "washer",
  "air_conditioning",
  "heating",
  "tv",
  "parking",
  "elevator",
  "workspace",
  "pets_allowed",
] as const;

export const BOOKING_STATUS_VALUES = ["pending_payment", "confirmed", "cancelled", "completed"] as const;

export const LISTING_STATUS_VALUES = ["draft", "published", "archived"] as const;
