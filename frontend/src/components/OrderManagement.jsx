import { useEffect, useMemo, useState } from "react";
import { Plus, PencilLine, Trash2, AlertTriangle, Download, Eye, Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { orderService } from "../../services/orderService";
import CustomerAutocomplete from "./CustomerAutocomplete";

const statusOptions = ["Tất cả", "ĐANG CHỜ", "ĐÃ THANH TOÁN", "ĐÃ HỦY"];
const statusList = ["ĐANG CHỜ", "ĐÃ THANH TOÁN", "ĐÃ HỦY"];

const defaultForm = {
  customerId: "",
  status: "ĐANG CHỜ",
  promoCode: "",
};

function currency(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatDate(dateStr) {
  if (!dateStr) return "---";
  try {
    // Chuyển về string và xử lý
    const s = String(dateStr);
    
    // Tìm các con số trong chuỗi (Year, Month, Day, Hour, Minute)
    // Phù hợp cho cả: 2026-05-02T19:31:07.260Z và 2026-05-02 19:31:07
    const matches = s.match(/\d+/g); 
    if (!matches || matches.length < 5) return s;

    const [y, m, d, hr, min] = matches;
    
    // Trả về định dạng chuẩn VN
    return `${d}/${m}/${y} ${hr}:${min}`;
  } catch (e) {
    return String(dateStr);
  }
}

function statusTone(status) {
  if (status === "ĐÃ THANH TOÁN") return "badge--teal";
  if (status === "ĐÃ HỦY") return "badge--red";
  return "badge--amber";
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

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState([]);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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
      const matchesSearch = !search || [order.id, order.customerId, order.customerName, order.promoCode].some((value) =>
        String(value || "").toLowerCase().includes(search)
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
      { label: "Đã hủy", value: cancelled.length, note: "Đơn hàng đã hủy" },
      { label: "Đang chờ", value: pending.length, note: "Đang chờ xử lý" },
      { label: "Doanh thu", value: `${currency(revenue)} đ`, note: "Doanh thu đã thanh toán" },
    ];
  }, [orders]);

  const openCreate = () => {
    setEditingId("");
    setForm(defaultForm);
    setErrors({});
    setError(""); // Xóa lỗi cũ
    setModalOpen(true);
  };

  const openEdit = (order) => {
    setEditingId(order.id);
    setForm({
      customerId: order.customerId,
      status: order.status,
      promoCode: order.promoCode || "",
    });
    setErrors({});
    setError(""); // Xóa lỗi cũ
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setErrors({});
    setError(""); // Xóa lỗi khi đóng
  };

  const handleViewDetails = async (order) => {
    setViewingOrder(order);
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    try {
      const data = await orderService.getDetails(order.id);
      setOrderDetails(data);
    } catch (err) {
      console.error("Lỗi tải chi tiết đơn hàng:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setViewingOrder(null);
    setOrderDetails([]);
  };

  const validateForm = () => {
    // Đã xóa bỏ validation ở frontend để nhấn mạnh vai trò của Database 
    // Mọi lỗi dữ liệu sẽ do Stored Procedure/Trigger trong Database trả về.
    return {};
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

  const handleEditClick = (order) => {
    if (order.status === "ĐÃ THANH TOÁN" || order.status === "ĐÃ HỦY") {
      setConfirmDialog({
        id: order.id,
        type: "error",
        title: "Không thể cập nhật",
        message: `Đơn hàng ở trạng thái ${order.status} không được phép chỉnh sửa trực tiếp.`,
      });
      return;
    }
    openEdit(order);
  };

  const handleDeleteClick = (id, status) => {
    if (status === "ĐÃ THANH TOÁN" || status === "ĐÃ HỦY") {
      setConfirmDialog({
        id,
        type: "error",
        title: "Không thể xóa",
        message: `Không được xóa đơn hàng ở trạng thái ${status}.`,
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
    setError("");
    try {
      await orderService.remove(id);
      setConfirmDialog(null);
      await loadOrders();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Không thể xóa đơn hàng.");
    }
  };

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
              <option value="finalAmount">Số tiền cuối</option>
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

      {/* Lỗi sẽ được hiển thị ngay trong Modal/Dialog thao tác */}

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
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      Ngày tạo 
                      {sortBy === "createdAt" ? (
                        sortOrder === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                  </th>
                  <th>Trạng thái</th>
                  <th>Mã khuyến mãi</th>
                  <th style={{ textAlign: "right" }}>Số tiền giảm</th>
                  <th style={{ textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("finalAmount")} title="Nhấn để sắp xếp">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                      Số tiền cuối
                      {sortBy === "finalAmount" ? (
                        sortOrder === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
                      )}
                    </div>
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

                    <td style={{ color: "#6b7280", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td>
                      <span className={`badge ${statusTone(order.status)}`}>{order.status}</span>
                    </td>
                    <td>{order.promoCode ? <code style={{ backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>{order.promoCode}</code> : <span style={{ color: "#d1d5db" }}>—</span>}</td>
                    <td style={{ textAlign: "right", color: "#ef4444", fontVariantNumeric: "tabular-nums" }}>
                      {order.discountAmount > 0 ? `- ${currency(order.discountAmount)} đ` : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                      {currency(order.finalAmount)} đ
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handleEditClick(order)}
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
                {error && (
                  <div className="alert alert--danger" style={{ marginBottom: 16, padding: '10px 12px', fontSize: '13px', backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertTriangle size={16} />
                      <strong>Lỗi Database:</strong> <span>{error}</span>
                    </div>
                  </div>
                )}
                {editingId ? (
                  /* EDIT MODE - Chỉ sửa Status + Promo Code */
                  <div className="form-grid form-grid--2">
                    {/* Trạng thái */}
                    <div className="field">
                      <label htmlFor="form-status">
                        Trạng thái <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <select
                        id="form-status"
                        value={form.status}
                        onChange={(event) => setForm((s) => ({ ...s, status: event.target.value }))}
                      >
                        {statusList.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mã khuyến mãi */}
                    <div className="field">
                      <label htmlFor="form-promo">Mã khuyến mãi (VD: P001, P010)</label>
                      <input
                        id="form-promo"
                        type="text"
                        value={form.promoCode}
                        onChange={(event) => setForm((s) => ({ ...s, promoCode: event.target.value.toUpperCase() }))}
                        placeholder="VD: P001, P010"
                      />
                    </div>
                  </div>
                ) : (
                  /* CREATE MODE - Chỉ nhập Mã khách hàng */
                  <div className="form-grid form-grid--1">
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
                  </div>
                )}

                {/* Ghi chú khi edit */}
                {editingId && (
                  <div style={{ padding: "12px", backgroundColor: "#fef3c7", borderRadius: 8, marginTop: 16, fontSize: "0.9rem", color: "#92400e" }}>
                    ℹ️ Chỉ có thể thay đổi trạng thái và mã khuyến mãi. Để sửa thông tin khác, vui lòng xóa và tạo đơn mới.
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
            
            {error && (
              <div className="modal__body" style={{ paddingBottom: 0 }}>
                <div className="alert alert--danger" style={{ padding: '8px 10px', fontSize: '13px', backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: 8 }}>
                   <strong>Lỗi Database:</strong> {error}
                </div>
              </div>
            )}

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
      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {detailsModalOpen && viewingOrder ? (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 800 }}>
            <div className="modal__header">
              <h2>Chi tiết đơn hàng: {viewingOrder.id}</h2>
              <button type="button" className="close-btn" onClick={closeDetailsModal} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>
                &times;
              </button>
            </div>
            <div className="modal__body">
              {detailsLoading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                  Đang tải chi tiết đơn hàng...
                </div>
              ) : orderDetails.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                  Đơn hàng này không có sản phẩm nào.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table" style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th>Mã SP</th>
                        <th>Tên sản phẩm (Tạm thời)</th>
                        <th style={{ textAlign: "right" }}>Số lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ color: "#6b7280" }}>{item.productId}</td>
                          <td style={{ fontWeight: 500 }}>{item.productName}</td>
                          <td style={{ textAlign: "right" }}>{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: "#f9fafb" }}>
                        <td colSpan="2" style={{ textAlign: "right", fontWeight: 600 }}>Tổng tiền:</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{currency(viewingOrder.totalAmount)} đ</td>
                      </tr>
                      <tr style={{ backgroundColor: "#f9fafb" }}>
                        <td colSpan="2" style={{ textAlign: "right", fontWeight: 600 }}>Số tiền giảm:</td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: "#ef4444" }}>- {currency(viewingOrder.discountAmount)} đ</td>
                      </tr>
                      <tr style={{ backgroundColor: "#f9fafb" }}>
                        <td colSpan="2" style={{ textAlign: "right", fontWeight: 700, fontSize: "1.1rem" }}>Số tiền cuối:</td>
                        <td style={{ textAlign: "right", fontWeight: 700, fontSize: "1.1rem", color: "#14b8a6" }}>{currency(viewingOrder.finalAmount)} đ</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button type="button" className="btn btn--secondary" onClick={closeDetailsModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}