import { useEffect, useMemo, useState, useRef } from "react";
import { Download, Search, User } from "lucide-react";

function formatDate(value) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " đ";
}

export default function CustomerHistory() {
  const [keyword, setKeyword]               = useState("");
  const [customers, setCustomers]           = useState([]);
  const [showDropdown, setShowDropdown]     = useState(false);
  const [isSearching, setIsSearching]       = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [fromDate, setFromDate]             = useState("");
  const [toDate, setToDate]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState("Tất cả");

  const [transactions, setTransactions]     = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError]                   = useState("");
  const [searched, setSearched]             = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!keyword.trim()) { setCustomers([]); setShowDropdown(false); return; }
    if (selectedCustomer && keyword === `${selectedCustomer["Tên Khách Hàng"]} - ${selectedCustomer["Số Điện Thoại"]}`) return;
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res  = await fetch(`http://localhost:3000/api/customers/search?keyword=${encodeURIComponent(keyword)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setCustomers(data);
        setShowDropdown(true);
      } catch (err) {
        console.error("Lỗi tìm kiếm:", err);
      } finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [keyword, selectedCustomer]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectCustomer = (c) => {
    setSelectedCustomer(c);
    setKeyword(`${c["Tên Khách Hàng"]} - ${c["Số Điện Thoại"]}`);
    setShowDropdown(false);
    setTransactions([]);
    setSearched(false);
  };

  const handleFetchHistory = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) { setError("Vui lòng chọn một khách hàng từ danh sách gợi ý!"); return; }
    setLoadingHistory(true); setError(""); setSearched(true);
    try {
      let url = `http://localhost:3000/api/customers/${selectedCustomer["Mã KH"]}/history?`;
      if (fromDate) url += `from=${fromDate}&`;
      if (toDate)   url += `to=${toDate}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Không tải được lịch sử giao dịch");
      setTransactions([]);
    } finally { setLoadingHistory(false); }
  };

  const filteredTransactions = useMemo(() =>
    transactions.filter(t => statusFilter === "Tất cả" || t.status === statusFilter),
    [transactions, statusFilter]
  );
  const totalSpent    = useMemo(() => filteredTransactions.reduce((s, t) => s + Number(t.finalAmount || 0), 0), [filteredTransactions]);
  const totalDiscount = useMemo(() => filteredTransactions.reduce((s, t) => s + Number(t.discount    || 0), 0), [filteredTransactions]);
  const paidCount     = useMemo(() => filteredTransactions.filter(t => t.status === "ĐÃ THANH TOÁN").length, [filteredTransactions]);

  const handleExport = () => {
    if (!filteredTransactions.length) { alert("Không có dữ liệu để xuất"); return; }
    const csv = [
      ["Mã Đơn","Ngày","Phim & Ghế","Combo","Tổng Tiền","Khuyến Mãi","Thành Tiền","Trạng Thái"],
      ...filteredTransactions.map(t => [t.orderId, formatDate(t.date), t.movieSeatDetail, t.comboDetail, t.total, t.discount, t.finalAmount, t.status]),
    ].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `LichSu-${selectedCustomer?.["Mã KH"] || "Khach"}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <section className="page page--customers" aria-label="Tra cứu lịch sử giao dịch">

      {/* Header */}
      <div className="page__header">
        <div>
          <h1>Tra cứu lịch sử giao dịch</h1>
          <p>Tìm kiếm khách hàng bằng Tên / SĐT để xem chi tiết lịch sử.</p>
        </div>
        <div className="page__actions">
          <button type="button" className="btn btn--secondary" onClick={handleExport} disabled={!filteredTransactions.length}>
            <Download size={15} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Search toolbar — dùng class "page-card toolbar" + "field" y hệt OrderManagement */}
      <div className="page-card toolbar">
        <form onSubmit={handleFetchHistory} style={{ width: "100%" }}>
          <div className="toolbar__filters" style={{ alignItems: "flex-end" }}>

            {/* Autocomplete field */}
            <div className="field toolbar__search" ref={dropdownRef} style={{ position: "relative" }}>
              <label htmlFor="customer-search">Tìm khách hàng (Tên / SĐT)</label>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                <input
                  id="customer-search"
                  type="text"
                  value={keyword}
                  onChange={e => { setKeyword(e.target.value); setSelectedCustomer(null); }}
                  placeholder="VD: Nguyễn Văn A, 0987..."
                  style={{ paddingLeft: 32 }}
                />
                {isSearching && (
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#9ca3af" }}>
                    Đang tìm...
                  </span>
                )}
              </div>

              {showDropdown && customers.length > 0 && (
                <ul style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
                  padding: 0, margin: 0, listStyle: "none",
                  maxHeight: 240, overflowY: "auto", zIndex: 99,
                  boxShadow: "0 8px 24px rgba(0,0,0,.10)",
                }}>
                  {customers.map((c, i) => (
                    <li key={i} onClick={() => handleSelectCustomer(c)}
                      style={{ padding: "10px 14px", cursor: "pointer", borderBottom: i < customers.length - 1 ? "1px solid #f3f4f6" : "none" }}
                      onMouseOver={e => e.currentTarget.style.background = "#f9fafb"}
                      onMouseOut={e  => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{c["Tên Khách Hàng"]}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                        SĐT: {c["Số Điện Thoại"] || "N/A"} &nbsp;·&nbsp; ID: {c["Mã KH"]}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {showDropdown && !customers.length && keyword.trim() && !isSearching && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
                  padding: "12px 14px", fontSize: 14, color: "#ef4444", zIndex: 99,
                  boxShadow: "0 8px 24px rgba(0,0,0,.10)",
                }}>
                  Không tìm thấy khách hàng nào!
                </div>
              )}
            </div>

            {/* Từ ngày */}
            <div className="field">
              <label htmlFor="from-date">Từ ngày</label>
              <input id="from-date" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>

            {/* Đến ngày */}
            <div className="field">
              <label htmlFor="to-date">Đến ngày</label>
              <input id="to-date" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn--primary" disabled={loadingHistory} style={{ whiteSpace: "nowrap", alignSelf: "flex-end" }}>
              <Search size={15} /> {loadingHistory ? "Đang tải..." : "Tìm lịch sử"}
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="page-card" style={{ color: "#b91c1c", marginBottom: 16 }}>{error}</div>
      )}

      {/* Kết quả */}
      {searched && selectedCustomer && (
        <>
          {/* Stat cards */}
          {!loadingHistory && filteredTransactions.length > 0 && (
            <div className="stat-grid">
              <article className="stat-card">
                <div className="stat-card__label">Tổng giao dịch</div>
                <div className="stat-card__value">{filteredTransactions.length}</div>
                <div className="stat-card__note">{paidCount} đã thanh toán</div>
              </article>
              <article className="stat-card">
                <div className="stat-card__label">Tổng chi tiêu</div>
                <div className="stat-card__value">{formatCurrency(totalSpent)}</div>
                <div className="stat-card__note">Sau khi áp khuyến mãi</div>
              </article>
              <article className="stat-card">
                <div className="stat-card__label">Tiết kiệm được</div>
                <div className="stat-card__value" style={{ color: "#059669" }}>{formatCurrency(totalDiscount)}</div>
                <div className="stat-card__note">Từ mã khuyến mãi</div>
              </article>
            </div>
          )}

          {/* Bảng lịch sử */}
          <article className="page-card table-card">
            <div className="table-card__head">
              <div className="section-head" style={{ marginBottom: 0 }}>
                {/* Tên khách */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0fdfa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={16} color="#14b8a6" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0 }}>{selectedCustomer["Tên Khách Hàng"]}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                      SĐT: {selectedCustomer["Số Điện Thoại"]} &nbsp;·&nbsp; ID: {selectedCustomer["Mã KH"]}
                      &nbsp;·&nbsp; {filteredTransactions.length} giao dịch
                    </p>
                  </div>
                </div>

                {/* Filter trạng thái — dùng class "field toolbar__select" */}
                <div className="field toolbar__select" style={{ marginBottom: 0 }}>
                  <label htmlFor="status-filter">Trạng thái</label>
                  <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="Tất cả">Tất cả</option>
                    <option value="ĐÃ THANH TOÁN">ĐÃ THANH TOÁN</option>
                    <option value="ĐÃ HỦY">ĐÃ HỦY</option>
                    <option value="ĐANG CHỜ">ĐANG CHỜ</option>
                  </select>
                </div>
              </div>
            </div>

            {loadingHistory ? (
              <div className="loading-state">Đang tải dữ liệu...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="empty-state">Không có giao dịch nào trong khoảng thời gian này.</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Ngày</th>
                      <th>Phim &amp; Ghế</th>
                      <th>Combo</th>
                      <th style={{ textAlign: "right" }}>Tổng tiền</th>
                      <th style={{ textAlign: "right" }}>Khuyến mãi</th>
                      <th style={{ textAlign: "right" }}>Thành tiền</th>
                      <th style={{ textAlign: "center" }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t, idx) => {
                      const badgeClass = t.status === "ĐÃ THANH TOÁN" ? "badge--teal" : t.status === "ĐANG CHỜ" ? "badge--amber" : "badge--red";
                      return (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafbfc" }}>
                          <td style={{ fontWeight: 600, color: "#14b8a6" }}>{t.orderId}</td>
                          <td style={{ color: "#6b7280", fontSize: "0.9rem" }}>{formatDate(t.date)}</td>
                          <td style={{ maxWidth: 220, fontSize: "0.9rem" }}>{t.movieSeatDetail}</td>
                          <td style={{ maxWidth: 160, fontSize: "0.9rem", color: "#6b7280" }}>{t.comboDetail}</td>
                          <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#6b7280" }}>{formatCurrency(t.total)}</td>
                          <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: t.discount > 0 ? "#ef4444" : "#d1d5db" }}>
                            {t.discount > 0 ? `-${formatCurrency(t.discount)}` : "—"}
                          </td>
                          <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#059669" }}>{formatCurrency(t.finalAmount)}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className={`badge ${badgeClass}`}>{t.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </>
      )}

      {/* Chưa tìm lần nào */}
      {!searched && (
        <div className="page-card" style={{ textAlign: "center", padding: "48px 24px", color: "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ margin: 0, fontSize: 15 }}>Nhập tên hoặc số điện thoại để tìm khách hàng</p>
        </div>
      )}
    </section>
  );
}