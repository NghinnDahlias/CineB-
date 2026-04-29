import { useEffect, useMemo, useState } from "react";
import { Plus, PencilLine, Trash2, AlertTriangle, Download, Eye, Search } from "lucide-react";
import { orderService } from "../../services/orderService";
import CustomerAutocomplete from "./CustomerAutocomplete";

const statusOptions = ["Tất cả", "ĐANG CHỜ", "ĐÃ THANH TOÁN", "ĐÃ HỦY"];
const statusList = ["ĐANG CHỜ", "ĐÃ THANH TOÁN", "ĐÃ HỦY"];

const defaultForm = {
  customerId: "",
  promoCode: "",
  totalAmount: "",
  discountAmount: "",
  status: "ĐANG CHỜ",
  createdAt: new Date().toISOString().split("T")[0],
};

function currency(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function statusTone(status) {
  if (status === "ĐÃ THANH TOÁN") return "badge--teal";
  if (status === "ĐÃ HỦY") return "badge--red";
  return "badge--amber";
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function parseNumber(str) {
  const num = Number.parseInt(String(str || "").replace(/\D/g, ""), 10);
  return Number.isNaN(num) ? 0 : num;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await orderService.list();
      setOrders(rows);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Không tải được danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    let result = orders.filter((order) => {
      const matchesSearch = !search || [order.id, order.customerId, order.promoCode].some((value) =>
        String(value).toLowerCase().includes(search)
      );
      const matchesStatus = statusFilter === "Tất cả" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    result = result.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else {
        aVal = a.finalAmount || 0;
        bVal = b.finalAmount || 0;
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [orders, query, statusFilter, sortBy, sortOrder]);

  const metrics = useMemo(() => {
    const paid = orders.filter((order) => order.status === "ĐÃ THANH TOÁN");
    const pending = orders.filter((order) => order.status === "ĐANG CHỜ");
    const cancelled = orders.filter((order) => order.status === "ĐÃ HỦY");
    const revenue = paid.reduce((sum, order) => sum + order.finalAmount, 0);
    return [
      { label: "Tổng đơn", value: orders.length, note: "Tất cả đơn hàng" },
      { label: "Đã thanh toán", value: paid.length, note: "Thanh toán thành công" },
      { label: "Đang chờ", value: pending.length, note: "Đang chờ xử lý" },
      { label: "Doanh thu", value: `${currency(revenue)} đ`, note: "Doanh thu đã thanh toán" },
    ];
  }, [orders]);

  const openCreate = () => {
    setEditingId("");
    setForm(defaultForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (order) => {
    setEditingId(order.id);
    setForm({
      customerId: order.customerId,
      promoCode: order.promoCode || "",
      totalAmount: String(order.totalAmount || 0),
      discountAmount: String(order.discountAmount || 0),
      status: order.status,
      createdAt: new Date(order.createdAt).toISOString().split("T")[0],
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setErrors({});
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.customerId.trim()) {
      nextErrors.customerId = "Mã khách hàng là bắt buộc.";
    }

    if (!editingId) {
      const total = parseNumber(form.totalAmount);
      if (form.totalAmount.trim() === "") {
        nextErrors.totalAmount = "Tổng tiền là bắt buộc.";
      } else if (total <= 0) {
        nextErrors.totalAmount = "Tổng tiền phải lớn hơn 0.";
      }
    }

    if (!editingId) {
      const discount = parseNumber(form.discountAmount);
      const total = parseNumber(form.totalAmount);
      if (form.discountAmount.trim() === "") {
        nextErrors.discountAmount = "Số tiền giảm là bắt buộc.";
      } else if (discount < 0) {
        nextErrors.discountAmount = "Số tiền giảm không được âm.";
      } else if (discount > total && total > 0) {
        nextErrors.discountAmount = "Số tiền giảm không được vượt quá tổng tiền.";
      }
    }

    if (form.createdAt === "") {
      nextErrors.createdAt = "Ngày tạo là bắt buộc.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await orderService.update(editingId, {
          status: form.status,
          promoCode: form.promoCode || null,
        });
      } else {
        await orderService.create(form.customerId.trim());
      }
      await loadOrders();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Không thể lưu đơn hàng.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id, status) => {
    if (status === "ĐÃ THANH TOÁN") {
      setConfirmDialog({
        id,
        type: "error",
        title: "Không thể xóa",
        message: "Không được xóa đơn hàng đã thanh toán. Vui lòng liên hệ quản trị viên nếu cần hủy.",
      });
      return;
    }
    setConfirmDialog({
      id,
      type: "confirm",
      title: "Xác nhận xóa",
      message: `Bạn chắc chắn muốn xóa đơn hàng ${id}? Hành động này không thể hoàn tác.`,
    });
  };

  const confirmDelete = async () => {
    const { id } = confirmDialog;
    setConfirmDialog(null);
    setError("");
    try {
      await orderService.remove(id);
      await loadOrders();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Không thể xóa đơn hàng.");
    }
  };

  const finalAmount = useMemo(() => {
    const total = parseNumber(form.totalAmount);
    const discount = parseNumber(form.discountAmount);
    return Math.max(0, total - discount);
  }, [form.totalAmount, form.discountAmount]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };



  return (
    <section className="page page--orders" aria-label="Quản lý đơn hàng">
      <div className="page__header">
        <div>
          <h1>Quản lý đơn hàng</h1>
          <p>Theo dõi đơn hàng, trạng thái thanh toán và thao tác nhanh.</p>
        </div>
        <div className="page__actions">
          <button type="button" className="btn btn--secondary">Xuất dữ liệu</button>
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            <Plus size={16} /> Đơn hàng mới
          </button>
        </div>
      </div>

      <div className="stat-grid">
        {metrics.map((item) => (
          <article className="stat-card" key={item.label}>
            <div className="stat-card__label">{item.label}</div>
            <div className="stat-card__value">{item.value}</div>
            <div className="stat-card__note">{item.note}</div>
          </article>
        ))}
      </div>

      {/* Thanh lọc */}
      <div className="page-card toolbar">
        <div className="toolbar__filters">
          <div className="field toolbar__search">
            <label htmlFor="order-search">Tìm kiếm</label>
            <div style={{ position: "relative" }}>
              <input
                id="order-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm mã đơn, khách hàng hoặc khuyến mãi..."
                style={{ paddingLeft: 12 }}
              />
            </div>
          </div>

          <div className="field toolbar__select">
            <label htmlFor="order-status">Trạng thái</label>
            <select id="order-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div className="field" style={{ minWidth: 180 }}>
            <label htmlFor="sort-by">Sắp xếp theo</label>
            <select id="sort-by" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="createdAt">Ngày tạo</option>
              <option value="finalAmount">Tổng tiền cuối</option>
            </select>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            title={sortOrder === "asc" ? "Tăng dần" : "Giảm dần"}
          >
            {sortOrder === "asc" ? "⬆ Tăng dần" : "⬇ Giảm dần"}
          </button>
        </div>
      </div>

      {/* Thông báo lỗi */}
      {error ? (
        <div className="page-card" style={{ backgroundColor: "#fee2e2", borderColor: "#fecaca", color: "#b91c1c", padding: 16, borderRadius: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>{error}</div>
          </div>
        </div>
      ) : null}

      {/* Bảng đơn hàng */}
      <article className="page-card table-card">
        <div className="table-card__head">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <div>
              <h2>Danh sách đơn hàng</h2>
              <p>{filteredOrders.length} đơn hàng hiện có • {statusFilter !== "Tất cả" && `Lọc: ${statusFilter}`}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">⏳ Đang tải danh sách đơn hàng...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">📭 Không có đơn hàng nào khớp với tiêu chí tìm kiếm.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã đơn hàng</th>
                  <th>Mã khách hàng</th>
                  <th>Khách hàng</th>
                  <th style={{ cursor: "pointer" }} onClick={() => toggleSort("createdAt")} title="Nhấn để sắp xếp">
                    Ngày tạo {sortBy === "createdAt" && (sortOrder === "asc" ? "⬆" : "⬇")}
                  </th>
                  <th>Trạng thái</th>
                  <th>Mã khuyến mãi</th>
                  <th style={{ textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("finalAmount")} title="Nhấn để sắp xếp">
                    Tổng tiền cuối {sortBy === "finalAmount" && (sortOrder === "asc" ? "⬆" : "⬇")}
                  </th>
                  <th style={{ textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr key={order.id} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#fafbfc" }}>
                    <td style={{ fontWeight: 600, color: "#14b8a6" }}>{order.id}</td>
                    <td style={{ color: "#374151", fontSize: "0.9rem" }}>{order.customerId}</td>
                    <td style={{ fontWeight: 600, color: "#374151" }}>
                      {order.customerName || "Khách vãng lai"}
                    </td>

                    <td style={{ color: "#6b7280", fontSize: "0.9rem" }}>{formatDate(order.createdAt)}</td>
                    <td>
                      <span className={`badge ${statusTone(order.status)}`}>{order.status}</span>
                    </td>
                    <td>{order.promoCode ? <code style={{ backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>{order.promoCode}</code> : <span style={{ color: "#d1d5db" }}>—</span>}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                      {currency(order.finalAmount)} đ
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}> 
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => alert(`Xem chi tiết đơn ${order.id}`)}
                          title="Xem chi tiết"
                          style={{ color: "#6366f1" }}
                        >
                          <Eye size={16} /> 
                        </button>                     
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => openEdit(order)}
                          aria-label={`Sửa ${order.id}`}
                          title="Sửa đơn hàng"
                        >
                          <PencilLine size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handleDeleteClick(order.id, order.status)}
                          aria-label={`Xóa ${order.id}`}
                          title="Xóa đơn hàng"
                          style={{ color: "#ef4444" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {/* Modal thêm/sửa */}
      {modalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={closeModal}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="order-modal-title" onClick={(event) => event.stopPropagation()}>
            <form onSubmit={handleSubmit} noValidate>
              <div className="modal__header">
                <div>
                  <h2 id="order-modal-title">{editingId ? "📝 Chỉnh sửa đơn hàng" : "➕ Tạo đơn hàng mới"}</h2>
                  <p>{editingId ? "Cập nhật thông tin đơn hàng" : "Nhập thông tin khách hàng và chi tiết đơn"}</p>
                </div>
                <button type="button" className="icon-btn" onClick={closeModal} aria-label="Đóng" style={{ color: "#6b7280" }}>
                  ✕
                </button>
              </div>

              <div className="modal__body">
                <div className="form-grid form-grid--2">
                  {/* Mã khách hàng */}
                  <div className="field">
                    <label style={{ display: "block", marginBottom: 6 }}>
                      Mã khách hàng <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <CustomerAutocomplete
                      value={form.customerId}
                      onChange={(customerId) => {
                        setForm((s) => ({ ...s, customerId: customerId || "" }));
                      }}
                      placeholder="Nhập mã khách (C000001) - 8 ký tự"
                      error={errors.customerId}
                    />
                  </div>

                  {/* Trạng thái */}
                  <div className="field">
                    <label htmlFor="form-status">
                      Trạng thái <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      id="form-status"
                      value={form.status}
                      onChange={(event) => setForm((s) => ({ ...s, status: event.target.value }))}
                      disabled={!editingId}
                    >
                      {statusList.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tổng tiền */}
                  {!editingId && (
                    <div className="field">
                      <label htmlFor="form-total">
                        Tổng tiền gốc <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        id="form-total"
                        type="text"
                        inputMode="numeric"
                        value={form.totalAmount}
                        onChange={(event) => setForm((s) => ({ ...s, totalAmount: event.target.value }))}
                        placeholder="VD: 500000"
                        className={errors.totalAmount ? "is-error" : ""}
                      />
                      {errors.totalAmount && <span className="field__error">❌ {errors.totalAmount}</span>}
                      {form.totalAmount && !errors.totalAmount && (
                        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                          {currency(parseNumber(form.totalAmount))} đ
                        </span>
                      )}
                    </div>
                  )}

                  {/* Số tiền giảm */}
                  {!editingId && (
                    <div className="field">
                      <label htmlFor="form-discount">
                        Số tiền giảm <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        id="form-discount"
                        type="text"
                        inputMode="numeric"
                        value={form.discountAmount}
                        onChange={(event) => setForm((s) => ({ ...s, discountAmount: event.target.value }))}
                        placeholder="VD: 20000"
                        className={errors.discountAmount ? "is-error" : ""}
                      />
                      {errors.discountAmount && <span className="field__error">❌ {errors.discountAmount}</span>}
                      {form.discountAmount && !errors.discountAmount && (
                        <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                          {currency(parseNumber(form.discountAmount))} đ
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tổng tiền cuối (readonly) */}
                  {!editingId && (
                    <div className="field">
                      <label htmlFor="form-final" style={{ color: "#14b8a6", fontWeight: 600 }}>
                        Tổng tiền cuối (tự động)
                      </label>
                      <input
                        id="form-final"
                        type="text"
                        readOnly
                        value={currency(finalAmount)}
                        style={{ backgroundColor: "#f0fdf4", cursor: "not-allowed", fontWeight: 600, color: "#14b8a6" }}
                      />
                    </div>
                  )}

                  {/* Mã khuyến mãi */}
                  <div className="field">
                    <label htmlFor="form-promo">Mã khuyến mãi (tùy chọn)</label>
                    <input
                      id="form-promo"
                      type="text"
                      value={form.promoCode}
                      onChange={(event) => setForm((s) => ({ ...s, promoCode: event.target.value.toUpperCase() }))}
                      placeholder="VD: KM01, SUMMER2026"
                      disabled={!editingId}
                    />
                  </div>

                  {/* Ngày tạo */}
                  {!editingId && (
                    <div className="field">
                      <label htmlFor="form-date">
                        Ngày tạo <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        id="form-date"
                        type="date"
                        value={form.createdAt}
                        onChange={(event) => setForm((s) => ({ ...s, createdAt: event.target.value }))}
                        className={errors.createdAt ? "is-error" : ""}
                      />
                      {errors.createdAt && <span className="field__error">❌ {errors.createdAt}</span>}
                    </div>
                  )}
                </div>

                {/* Ghi chú */}
                {editingId && (
                  <div style={{ padding: "12px", backgroundColor: "#fef3c7", borderRadius: 8, marginTop: 16, fontSize: "0.9rem", color: "#92400e" }}>
                    Chỉ có thể thay đổi trạng thái và mã khuyến mãi. Để sửa thông tin khác, vui lòng xóa và tạo đơn mới.
                  </div>
                )}
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "➕ Tạo đơn hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Dialog xác nhận xóa */}
      {confirmDialog ? (
        <div className="modal-overlay" role="presentation" onClick={() => setConfirmDialog(null)}>
          <div className="modal" style={{ maxWidth: 420 }} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal__header">
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                {confirmDialog.type === "error" ? (
                  <AlertTriangle size={24} style={{ color: "#ef4444", flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={24} style={{ color: "#f59e0b", flexShrink: 0 }} />
                )}
                <div>
                  <h2 style={{ margin: "0 0 4px 0" }}>{confirmDialog.title}</h2>
                  <p style={{ margin: 0, color: "#6b7280" }}>{confirmDialog.message}</p>
                </div>
              </div>
            </div>

            <div className="modal__footer">
              <button type="button" className="btn btn--secondary" onClick={() => setConfirmDialog(null)}>
                {confirmDialog.type === "error" ? "Đóng" : "Hủy"}
              </button>
              {confirmDialog.type === "confirm" && (
                <button type="button" className="btn btn--danger" onClick={confirmDelete}>
                  ✓ Xác nhận xóa
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}