/**
 * PAGE 1 — UI bảng ORDER (tab “Page 1” trong App.jsx).
 * Phụ thuộc: ./orderApi.js (chỉ page này dùng), ./page1.css, styles/global.css (chung).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import * as orderApi from "./orderApi.js";
import "./page1.css";

const STATUS_UPDATE_OPTIONS = [
  { value: "", label: "— Giữ nguyên —" },
  { value: "ĐANG CHỜ", label: "ĐANG CHỜ" },
  { value: "ĐÃ THANH TOÁN", label: "ĐÃ THANH TOÁN" },
  { value: "ĐÃ HỦY", label: "ĐÃ HỦY" }
];

function formatMoney(n) {
  if (n === "" || n === null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("vi-VN");
}

function formatDate(isoOrDate) {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return String(isoOrDate ?? "—");
  return d.toLocaleString("vi-VN");
}

/** Số nguyên (có thể âm) — để demo RAISERROR từ SQL, không chặn âm ở client */
function parseIntegerInput(raw) {
  const s = String(raw).trim();
  if (s === "") return { ok: true, empty: true, value: 0 };
  if (!/^-?\d+$/.test(s)) {
    return { ok: false, empty: false, value: 0 };
  }
  const n = Number(s);
  if (!Number.isFinite(n)) {
    return { ok: false, empty: false, value: 0 };
  }
  return { ok: true, empty: false, value: n };
}

export default function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [modal, setModal] = useState(null);

  const [insert, setInsert] = useState({ customerId: "", total: "", discount: "" });
  const [insertErrors, setInsertErrors] = useState({});
  const [insertBusy, setInsertBusy] = useState(false);

  const [update, setUpdate] = useState({ orderId: "", total: "", discount: "", status: "" });
  const [updateErrors, setUpdateErrors] = useState({});
  const [updateBusy, setUpdateBusy] = useState(false);

  const [del, setDel] = useState({ orderId: "" });
  const [delErrors, setDelErrors] = useState({});
  const [delBusy, setDelBusy] = useState(false);

  const loadOrders = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const data = await orderApi.fetchOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(e.message || "Không tải được danh sách.");
      setOrders([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const closeModal = () => {
    setModal(null);
    setInsertErrors({});
    setUpdateErrors({});
    setDelErrors({});
  };

  const openInsert = () => {
    setInsert({ customerId: ""});//, total: "", discount: "" });
    setInsertErrors({});
    setModal("insert");
  };

  const openUpdate = () => {
    setUpdate({ orderId: "", status: "", promoCode: "" });
    setUpdateErrors({});
    setModal("update");
  };

  const openDelete = () => {
    setDel({ orderId: "" });
    setDelErrors({});
    setModal("delete");
  };

  const submitInsert = async () => {
    const err = {};
    const customerId = String(insert.customerId ?? "").trim();
    if (!customerId) err.customerId = "Bắt buộc";
    setInsertErrors(err);
    if (Object.keys(err).length > 0) return;

    setInsertBusy(true);
    try {
      await orderApi.createOrder({
        customerId,
      });
      await loadOrders();
      closeModal();
    } catch (e) {
      setInsertErrors({ api: e.message || "Lỗi server." });
    } finally {
      setInsertBusy(false);
    }
  };

  const submitUpdate = async () => {
    const err = {};
    const orderId = String(update.orderId ?? "").trim();
    if (!orderId) err.orderId = "Bắt buộc";
    setUpdateErrors(err);
    if (Object.keys(err).length > 0) return;

    const body = {};
    if (String(update.status).trim() !== "") body.status = update.status.trim();
    if (String(update.promoCode).trim() !== "") body.promoCode = update.promoCode.trim();
    setUpdateBusy(true);
    try {
      await orderApi.updateOrder(orderId, body);
      await loadOrders();
      closeModal();
    } catch (e) {
      setUpdateErrors({ api: e.message || "Lỗi server." });
    } finally {
      setUpdateBusy(false);
    }
  };

  const submitDelete = async () => {
    const err = {};
    const orderId = String(del.orderId ?? "").trim();
    if (!orderId) err.orderId = "Bắt buộc";
    setDelErrors(err);
    if (Object.keys(err).length > 0) return;

    setDelBusy(true);
    try {
      await orderApi.removeOrder(orderId);
      await loadOrders();
      closeModal();
    } catch (e) {
      setDelErrors({ api: e.message || "Lỗi server." });
    } finally {
      setDelBusy(false);
    }
  };

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => String(a.orderId).localeCompare(String(b.orderId), "vi")),
    [orders]
  );

  return (
    <div className="order-page card-surface" aria-label="Page 1">
      <div className="order-page-toolbar">
        <h2 className="order-page-title">Bảng đơn hàng (Order)</h2>
        <div className="order-page-actions">
          <button type="button" className="ghost-btn" onClick={loadOrders} disabled={listLoading}>
            {listLoading ? "Đang tải…" : "Tải lại"}
          </button>
          <button type="button" className="primary-btn" onClick={openInsert}>
            INSERT
          </button>
          <button type="button" className="warning-btn" onClick={openUpdate}>
            UPDATE
          </button>
          <button type="button" className="danger-btn" onClick={openDelete}>
            DELETE
          </button>
        </div>
      </div>

      {listError ? <div className="feedback error">{listError}</div> : null}

      <div className="table-wrap">
        <table className="order-table">
          <thead>
            <tr>
              <th>MÃ ĐƠN HÀNG</th>
              <th>MÃ SỐ KHÁCH HÀNG</th>
              <th>TỔNG TIỀN</th>
              <th>SỐ TIỀN GIẢM</th>
              <th>SỐ TIỀN CUỐI</th>
              <th>NGÀY TẠO</th>
              <th>TRẠNG THÁI</th>
              <th>MÃ KHUYẾN MÃI</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.length === 0 && !listLoading && !listError ? (
              <tr>
                <td colSpan={8} className="muted" style={{ textAlign: "center" }}>
                  Chưa có dòng nào trong bảng ORDER (DB đang trống) hoặc API chưa trả JSON. Thử INSERT từ nút trên, hoặc kiểm tra
                  backend <code style={{ color: "var(--accent)" }}>GET /api/orders</code> trên cổng 3000.
                </td>
              </tr>
            ) : null}
            {sortedOrders.map((row) => (
              <tr key={row.orderId}>
                <td>{row.orderId}</td>
                <td>{row.customerId}</td>
                <td>{formatMoney(row.totalAmount)}</td>
                <td>{formatMoney(row.discountAmount)}</td>
                <td>{formatMoney(row.finalAmount)}</td>
                <td>{formatDate(row.createdAt)}</td>
                <td>{row.status}</td>
                <td>{row.promoCode ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === "insert" ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="modal-panel card-surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-insert-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="modal-insert-title" className="modal-title">
              Thêm đơn hàng
            </h3>
            {insertErrors.api ? <div className="feedback error">{insertErrors.api}</div> : null}
            <div className="modal-fields">
              <label className="field-wrap">
                <span>MÃ SỐ KHÁCH HÀNG *</span>
                <input
                  value={insert.customerId}
                  onChange={(e) => setInsert((s) => ({ ...s, customerId: e.target.value }))}
                  placeholder="VD: C0000001"
                />
                {insertErrors.customerId ? <small className="error-text">{insertErrors.customerId}</small> : null}
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={closeModal} disabled={insertBusy}>
                Hủy
              </button>
              <button type="button" className="primary-btn" onClick={submitInsert} disabled={insertBusy}>
                {insertBusy ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modal === "update" ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="modal-panel card-surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-update-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="modal-update-title" className="modal-title">
              Cập nhật đơn hàng
            </h3>
            {updateErrors.api ? <div className="feedback error">{updateErrors.api}</div> : null}
            <div className="modal-fields">
              <label className="field-wrap">
                <span>MÃ ĐƠN HÀNG *</span>
                <input
                  value={update.orderId}
                  onChange={(e) => setUpdate((s) => ({ ...s, orderId: e.target.value }))}
                  placeholder="VD: O00001"
                />
                {updateErrors.orderId ? <small className="error-text">{updateErrors.orderId}</small> : null}
              </label>
              <label className="field-wrap">
                <span>TRẠNG THÁI</span>
                <select
                  value={update.status}
                  onChange={(e) => setUpdate((s) => ({ ...s, status: e.target.value }))}
                >
                  {STATUS_UPDATE_OPTIONS.map((o) => (
                    <option key={o.value || "keep"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-wrap">
                <span>MÃ KHUYẾN MÃI</span>
                <input
                  value={update.promoCode}
                  onChange={(e) => setUpdate((s) => ({ ...s, promoCode: e.target.value }))}
                  placeholder="VD: P001"
                />
                {updateErrors.promoCode ? <small className="error-text">{updateErrors.promoCode}</small> : null}
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={closeModal} disabled={updateBusy}>
                Hủy
              </button>
              <button type="button" className="warning-btn" onClick={submitUpdate} disabled={updateBusy}>
                {updateBusy ? "Đang cập nhật…" : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modal === "delete" ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="modal-panel card-surface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="modal-delete-title" className="modal-title">
              Xóa đơn hàng
            </h3>
            {delErrors.api ? <div className="feedback error">{delErrors.api}</div> : null}
            <div className="modal-fields">
              <label className="field-wrap">
                <span>MÃ ĐƠN HÀNG *</span>
                <input
                  value={del.orderId}
                  onChange={(e) => setDel((s) => ({ ...s, orderId: e.target.value }))}
                  placeholder="VD: O00001"
                />
                {delErrors.orderId ? <small className="error-text">{delErrors.orderId}</small> : null}
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={closeModal} disabled={delBusy}>
                Hủy
              </button>
              <button type="button" className="danger-btn" onClick={submitDelete} disabled={delBusy}>
                {delBusy ? "Đang xóa…" : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
