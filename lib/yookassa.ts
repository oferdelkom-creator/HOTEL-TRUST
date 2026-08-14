const YOOKASSA_API = "https://api.yookassa.ru/v3";

function authHeader() {
  const shopId = process.env.YOOKASSA_SHOP_ID!;
  const secretKey = process.env.YOOKASSA_SECRET_KEY!;
  return "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64");
}

export type YookassaPayment = {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
};

export async function createPayment(params: {
  amount: number;
  bookingId: string;
  description: string;
  returnUrl: string;
}): Promise<YookassaPayment> {
  const res = await fetch(`${YOOKASSA_API}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      "Idempotence-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      amount: { value: params.amount.toFixed(2), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: params.returnUrl },
      description: params.description,
      metadata: { booking_id: params.bookingId },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YooKassa createPayment failed: ${res.status} ${body}`);
  }

  return res.json();
}

// The webhook never trusts the notification body's status directly
// (YooKassa doesn't sign webhook payloads) - it re-fetches the payment by
// id and acts on that instead.
export async function getPayment(paymentId: string): Promise<YookassaPayment> {
  const res = await fetch(`${YOOKASSA_API}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YooKassa getPayment failed: ${res.status} ${body}`);
  }

  return res.json();
}
