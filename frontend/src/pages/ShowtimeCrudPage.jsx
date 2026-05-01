import { useMemo, useState } from "react";

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
  if (Number.isNaN(d.getTime())) return String(isoOrDate);
  return d.toLocaleString("vi-VN");
}

function parseMoneyInput(raw) {
  const s = String(raw).trim();
  if (s === "") return { ok: true, empty: true, value: 0 };
  if (!/^\d+(\.\d+)?$/.test(s)) {
    return { ok: false, empty: false, value: 0 };
  }
  const n = Number(s);
  if (n < 0) return { ok: false, empty: false, value: 0 };
  return { ok: true, empty: false, value: n };
}

const initialOrders = [
  {
    orderId: "DH001",
    customerId: "KH001",
    totalAmount: 520000,
    discountAmount: 20000,
    finalAmount: 500000,
    createdAt: new Date("2026-04-18T10:30:00").toISOString(),
    status: "ĐANG CHỜ",
    promoCode: "KM04"
  },
  {
    orderId: "DH002",
    customerId: "KH002",
    totalAmount: 180000,
    discountAmount: 0,
    finalAmount: 180000,
    createdAt: new Date("2026-04-19T14:00:00").toISOString(),
    status: "ĐÃ THANH TOÁN",
    promoCode: "—"
  }
];

let idCounter = 3;

function nextOrderId() {
  const n = idCounter;
  idCounter += 1;
  return `DH${String(n).padStart(3, "0")}`;
}

export default function OrderPage() {
  const [orders, setOrders] = useState(initialOrders);
  const [modal, setModal] = useState(null);

  const [insert, setInsert] = useState({ customerId: "", total: "", discount: "" });
  const [insertErrors, setInsertErrors] = useState({});

  const [update, setUpdate] = useState({ orderId: "", total: "", discount: "", status: "" });
  const [updateErrors, setUpdateErrors] = useState({});

  const [del, setDel] = useState({ orderId: "" });
  const [delErrors, setDelErrors] = useState({});

  const closeModal = () => {
    setModal(null);
    setInsertErrors({});
    setUpdateErrors({});
    setDelErrors({});
  };

  const openInsert = () => {
    setInsert({ customerId: "", total: "", discount: "" });
    setInsertErrors({});
    setModal("insert");
  };

  const openUpdate = () => {
    setUpdate({ orderId: "", total: "", discount: "", status: "" });
    setUpdateErrors({});
    setModal("update");
  };

  const openDelete = () => {
    setDel({ orderId: "" });
    setDelErrors({});
    setModal("delete");
  };

  const submitInsert = () => {
    const err = {};
    const c = insert.customerId.trim();
    if (!c) err.customerId = "Bắt buộc";

    const t = parseMoneyInput(insert.total);
    if (!t.ok) err.total = "Chỉ nhập số ≥ 0";
    else if (t.empty) err.total = "Bắt buộc";

    const d = parseMoneyInput(insert.discount);
    if (!d.ok) err.discount = "Chỉ nhập số ≥ 0";
    else if (d.empty) err.discount = "Bắt buộc";

    if (t.ok && !t.empty && d.ok && !d.empty && d.value > t.value) {
      err.discount = "Không được lớn hơn tổng tiền";
    }

    setInsertErrors(err);
    if (Object.keys(err).length > 0) return;

    const totalAmount = t.value;
    const discountAmount = d.value;
    const finalAmount = totalAmount - discountAmount;

    setOrders((prev) => [
      {
        orderId: nextOrderId(),
        customerId: c,
        totalAmount,
        discountAmount,
        finalAmount,
        createdAt: new Date().toISOString(),
        status: "ĐANG CHỜ",
        promoCode: "—"
      },
      ...prev
    ]);
    closeModal();
  };

  const submitUpdate = () => {
    const err = {};
    const oid = update.orderId.trim();
    if (!oid) err.orderId = "Bắt buộc";

    let totalParsed = null;
    if (String(update.total).trim() !== "") {
      const t = parseMoneyInput(update.total);
      if (!t.ok || t.empty) err.total = "Chỉ nhập số ≥ 0";
      else totalParsed = t.value;
    }

    let discountParsed = null;
    if (String(update.discount).trim() !== "") {
      const d = parseMoneyInput(update.discount);
      if (!d.ok || d.empty) err.discount = "Chỉ nhập số ≥ 0";
      else discountParsed = d.value;
    }

    setUpdateErrors(err);
    if (Object.keys(err).length > 0) return;

    const idx = orders.findIndex((o) => o.orderId === oid);
    if (idx === -1) {
      setUpdateErrors({ orderId: "Không tìm thấy mã đơn hàng" });
      return;
    }

    const row = orders[idx];
    const nextTotal = totalParsed !== null ? totalParsed : row.totalAmount;
    const nextDiscount = discountParsed !== null ? discountParsed : row.discountAmount;

    if (nextDiscount > nextTotal) {
      setUpdateErrors({ discount: "Không được lớn hơn tổng tiền" });
      return;
    }

    const nextStatus = update.status ? update.status : row.status;

    setOrders((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...row,
        totalAmount: nextTotal,
        discountAmount: nextDiscount,
        finalAmount: nextTotal - nextDiscount,
        status: nextStatus
      };
      return copy;
    });
    closeModal();
  };

  const submitDelete = () => {
    const err = {};
    const oid = del.orderId.trim();
    if (!oid) err.orderId = "Bắt buộc";
    setDelErrors(err);
    if (Object.keys(err).length > 0) return;

    const idx = orders.findIndex((o) => o.orderId === oid);
    if (idx === -1) {
      setDelErrors({ orderId: "Không tìm thấy mã đơn hàng" });
      return;
    }

    setOrders((prev) => prev.filter((o) => o.orderId !== oid));
    closeModal();
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
            {sortedOrders.map((row) => (
              <tr key={row.orderId}>
                <td>{row.orderId}</td>
                <td>{row.customerId}</td>
                <td>{formatMoney(row.totalAmount)}</td>
                <td>{formatMoney(row.discountAmount)}</td>
                <td>{formatMoney(row.finalAmount)}</td>
                <td>{formatDate(row.createdAt)}</td>
                <td>{row.status}</td>
                <td>{row.promoCode}</td>
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
            <div className="modal-fields">
              <label className="field-wrap">
                <span>MÃ SỐ KHÁCH HÀNG *</span>
                <input
                  value={insert.customerId}
                  onChange={(e) => setInsert((s) => ({ ...s, customerId: e.target.value }))}
                  placeholder="VD: KH001"
                />
                {insertErrors.customerId ? <small className="error-text">{insertErrors.customerId}</small> : null}
              </label>
              <label className="field-wrap">
                <span>TỔNG TIỀN * (số)</span>
                <input
                  inputMode="decimal"
                  value={insert.total}
                  onChange={(e) => setInsert((s) => ({ ...s, total: e.target.value }))}
                  placeholder="VD: 500000"
                />
                {insertErrors.total ? <small className="error-text">{insertErrors.total}</small> : null}
              </label>
              <label className="field-wrap">
                <span>SỐ TIỀN GIẢM * (số)</span>
                <input
                  inputMode="decimal"
                  value={insert.discount}
                  onChange={(e) => setInsert((s) => ({ ...s, discount: e.target.value }))}
                  placeholder="VD: 20000"
                />
                {insertErrors.discount ? <small className="error-text">{insertErrors.discount}</small> : null}
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={closeModal}>
                Hủy
              </button>
              <button type="button" className="primary-btn" onClick={submitInsert}>
                Lưu
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
            <div className="modal-fields">
              <label className="field-wrap">
                <span>MÃ ĐƠN HÀNG *</span>
                <input
                  value={update.orderId}
                  onChange={(e) => setUpdate((s) => ({ ...s, orderId: e.target.value }))}
                  placeholder="VD: DH001"
                />
                {updateErrors.orderId ? <small className="error-text">{updateErrors.orderId}</small> : null}
              </label>
              <label className="field-wrap">
                <span>TỔNG TIỀN (số, tùy chọn)</span>
                <input
                  inputMode="decimal"
                  value={update.total}
                  onChange={(e) => setUpdate((s) => ({ ...s, total: e.target.value }))}
                  placeholder="Để trống nếu giữ nguyên"
                />
                {updateErrors.total ? <small className="error-text">{updateErrors.total}</small> : null}
              </label>
              <label className="field-wrap">
                <span>SỐ TIỀN GIẢM (số, tùy chọn)</span>
                <input
                  inputMode="decimal"
                  value={update.discount}
                  onChange={(e) => setUpdate((s) => ({ ...s, discount: e.target.value }))}
                  placeholder="Để trống nếu giữ nguyên"
                />
                {updateErrors.discount ? <small className="error-text">{updateErrors.discount}</small> : null}
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
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={closeModal}>
                Hủy
              </button>
              <button type="button" className="warning-btn" onClick={submitUpdate}>
                Cập nhật
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
            <div className="modal-fields">
              <label className="field-wrap">
                <span>MÃ ĐƠN HÀNG *</span>
                <input
                  value={del.orderId}
                  onChange={(e) => setDel((s) => ({ ...s, orderId: e.target.value }))}
                  placeholder="VD: DH001"
                />
                {delErrors.orderId ? <small className="error-text">{delErrors.orderId}</small> : null}
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={closeModal}>
                Hủy
              </button>
              <button type="button" className="danger-btn" onClick={submitDelete}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
