/**
 * PAGE 1 only — HTTP client cho bảng ORDER (backend /api/orders).
 * Page 2 / Page 3: tạo file api riêng trong thư mục của page, không import từ đây.
 *
 * Dev: mặc định "/api" (Vite proxy → :3000). Nếu lỗi proxy: frontend/.env
 *   VITE_API_BASE=http://127.0.0.1:3000/api
 * 
 * ⚠️ FIX: Improve error messages, handle JSON parsing better
 */
const RAW_BASE = import.meta.env.VITE_API_BASE || "/api";
const BASE = String(RAW_BASE).replace(/\/$/, "");

/**
 * Extract error message từ response
 */
async function readErrorMessage(res, bodyText) {
  try {
    const j = JSON.parse(bodyText);
    return j.error || j.message || bodyText;
  } catch {
    if (bodyText.includes("Cannot GET") || bodyText.includes("<!DOCTYPE")) {
      return (
        "API không đúng (nhận HTML thay vì JSON).\n" +
        "Hãy:\n" +
        "(1) Chạy backend: cd backend && npm start\n" +
        "(2) Tắt hết process Node cũ trên cổng 3000: lsof -i :3000 | kill -9\n" +
        "(3) Đặt VITE_API_BASE=http://127.0.0.1:3000/api trong frontend/.env\n" +
        "(4) Restart frontend: npm run dev"
      );
    }
    return bodyText || res.statusText || "Lỗi không xác định";
  }
}

/**
 * Parse JSON array từ response
 */
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

/**
 * Parse JSON object từ response
 */
async function parseJsonObject(res) {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, text));
  }
  try {
    return text ? JSON.parse(text) : { ok: true };
  } catch {
    // Nếu không parse được JSON, vẫn ok vì đã check res.ok
    return { ok: true };
  }
}

/**
 * Fetch danh sách order
 * GET /api/orders
 */
export async function fetchOrders() {
  try {
    const res = await fetch(`${BASE}/orders`);
    return await parseJsonArray(res);
  } catch (err) {
    throw new Error(`Lấy danh sách order thất bại: ${err.message}`);
  }
}

/**
 * Thêm order
 * POST /api/orders
 * @param {{ customerId: string }} data
 */
export async function createOrder({ customerId }) {
  try {
    // Validate client-side
    const maKhachHang = String(customerId ?? "").trim();
    if (!maKhachHang) {
      throw new Error("Mã khách hàng không được để trống");
    }
    if (maKhachHang.length > 8) {
      throw new Error("Mã khách hàng tối đa 8 ký tự (VD: C0000001)");
    }

    const res = await fetch(`${BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: maKhachHang })
    });
    
    return await parseJsonObject(res);
  } catch (err) {
    throw new Error(`Thêm order thất bại: ${err.message}`);
  }
}

/**
 * Cập nhật order
 * PATCH /api/orders/:orderId
 * @param {string} orderId
 * @param {{ status?: string, promoCode?: string }} body
 */
export async function updateOrder(orderId, body) {
  try {
    // Validate client-side
    const maDonHang = String(orderId ?? "").trim();
    if (!maDonHang) {
      throw new Error("Mã đơn hàng không được để trống");
    }
    if (maDonHang.length > 6) {
      throw new Error("Mã đơn hàng tối đa 6 ký tự (VD: O00001)");
    }

    const res = await fetch(`${BASE}/orders/${encodeURIComponent(maDonHang)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
    
    return await parseJsonObject(res);
  } catch (err) {
    throw new Error(`Cập nhật order thất bại: ${err.message}`);
  }
}

/**
 * Xóa order
 * DELETE /api/orders/:orderId
 * @param {string} orderId
 */
export async function removeOrder(orderId) {
  try {
    // Validate client-side
    const maDonHang = String(orderId ?? "").trim();
    if (!maDonHang) {
      throw new Error("Mã đơn hàng không được để trống");
    }
    if (maDonHang.length > 6) {
      throw new Error("Mã đơn hàng tối đa 6 ký tự (VD: O00001)");
    }

    const res = await fetch(`${BASE}/orders/${encodeURIComponent(maDonHang)}`, {
      method: "DELETE"
    });
    
    return await parseJsonObject(res);
  } catch (err) {
    throw new Error(`Xóa order thất bại: ${err.message}`);
  }
}

/**
 * Export component
 */
export { default as Page1OrderView } from "./OrderPage.jsx";