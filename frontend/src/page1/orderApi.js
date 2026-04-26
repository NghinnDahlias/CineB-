/**
 * PAGE 1 only — HTTP client cho bảng ORDER (backend /api/orders).
 * Page 2 / Page 3: tạo file api riêng trong thư mục của page, không import từ đây.
 *
 * Dev: mặc định "/api" (Vite proxy → :3000). Nếu lỗi proxy: frontend/.env
 *   VITE_API_BASE=http://127.0.0.1:3000/api
 */
const RAW_BASE = import.meta.env.VITE_API_BASE || "/api";
const BASE = String(RAW_BASE).replace(/\/$/, "");

async function readErrorMessage(res, bodyText) {
  try {
    const j = JSON.parse(bodyText);
    return j.error || j.message || bodyText;
  } catch {
    if (bodyText.includes("Cannot GET") || bodyText.includes("<!DOCTYPE")) {
      return (
        "API không đúng (nhận HTML thay vì JSON). Hãy: (1) chạy backend trong CineB-/backend: npm start, " +
        "(2) tắt hết process Node cũ trên cổng 3000 rồi start lại, hoặc (3) đặt VITE_API_BASE=http://127.0.0.1:3000/api trong frontend/.env"
      );
    }
    return bodyText || res.statusText;
  }
}

async function parseJsonArray(res) {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, text));
  }
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.orders)) return data.orders;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  } catch {
    throw new Error(await readErrorMessage(res, text));
  }
}

export async function fetchOrders() {
  const res = await fetch(`${BASE}/orders`);
  return parseJsonArray(res);
}

export async function createOrder({ customerId, total, discount }) {
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId, total, discount })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(await readErrorMessage(res, text));
  try {
    return text ? JSON.parse(text) : { ok: true };
  } catch {
    return { ok: true };
  }
}

export async function updateOrder(orderId, body) {
  const res = await fetch(`${BASE}/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(await readErrorMessage(res, text));
  try {
    return text ? JSON.parse(text) : { ok: true };
  } catch {
    return { ok: true };
  }
}

export async function removeOrder(orderId) {
  const res = await fetch(`${BASE}/orders/${encodeURIComponent(orderId)}`, {
    method: "DELETE"
  });
  const text = await res.text();
  if (!res.ok) throw new Error(await readErrorMessage(res, text));
  try {
    return text ? JSON.parse(text) : { ok: true };
  } catch {
    return { ok: true };
  }
}
