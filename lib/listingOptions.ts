export const PROPERTY_TYPES = [
  { value: "apartment", label: "Квартира" },
  { value: "house", label: "Дом" },
  { value: "room", label: "Комната" },
  { value: "studio", label: "Студия" },
] as const;

export const ROOM_TYPES = [
  { value: "entire_place", label: "Всё жильё" },
  { value: "private_room", label: "Отдельная комната" },
  { value: "shared_room", label: "Общая комната" },
] as const;

export const AMENITIES = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "kitchen", label: "Кухня" },
  { value: "washer", label: "Стиральная машина" },
  { value: "air_conditioning", label: "Кондиционер" },
  { value: "heating", label: "Отопление" },
  { value: "tv", label: "Телевизор" },
  { value: "parking", label: "Парковка" },
  { value: "elevator", label: "Лифт" },
  { value: "workspace", label: "Место для работы" },
  { value: "pets_allowed", label: "Можно с животными" },
] as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Ожидает оплаты",
  confirmed: "Подтверждено",
  cancelled: "Отменено",
  completed: "Завершено",
};

export const LISTING_STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  published: "Опубликовано",
  archived: "В архиве",
};
