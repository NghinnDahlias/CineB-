import { useEffect, useMemo, useState, useRef } from "react";
import { Download, Search, UserCheck } from "lucide-react";

function formatDate(value) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

export default function CustomerHistory() {
  // State cho việc tìm kiếm Real-time
  const [keyword, setKeyword] = useState("");
  const [customers, setCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // State lưu thông tin khách hàng đã chọn & bộ lọc lịch sử
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  
  // State cho bảng Lịch sử
  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const dropdownRef = useRef(null);

  // 1. LUỒNG REAL-TIME SEARCH (Gõ tới đâu gọi API tới đó)
  useEffect(() => {
    // Ẩn dropdown nếu xóa trắng ô tìm kiếm
    if (!keyword.trim()) {
      setCustomers([]);
      setShowDropdown(false);
      return;
    }

    // Nếu vừa chọn người xong thì không gọi API tìm kiếm nữa
    if (selectedCustomer && keyword === `${selectedCustomer["Tên Khách Hàng"]} - ${selectedCustomer["Số Điện Thoại"]}`) {
      return;
    }

    // Kỹ thuật Debounce: Chờ 300ms sau khi ngừng gõ mới gọi API
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setError("");
      try {
        const res = await fetch(`http://localhost:3000/api/customers/search?keyword=${encodeURIComponent(keyword)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        setCustomers(data);
        setShowDropdown(true);
      } catch (err) {
        console.error("Lỗi tìm kiếm:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [keyword, selectedCustomer]);

  // Click ra ngoài thì đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 2. KHI CLICK CHỌN 1 KHÁCH HÀNG TỪ DROPDOWN
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setKeyword(`${customer["Tên Khách Hàng"]} - ${customer["Số Điện Thoại"]}`);
    setShowDropdown(false);
    setTransactions([]); // Reset bảng cũ
    setSearched(false);
  };

  // 3. KHI BẤM NÚT "TÌM KIẾM" (Lấy lịch sử của khách đã chọn)
  const handleFetchHistory = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setError("Vui lòng chọn một khách hàng từ danh sách gợi ý!");
      return;
    }

    setLoadingHistory(true);
    setError("");
    setSearched(true);
    
    try {
      let url = `http://localhost:3000/api/customers/${selectedCustomer["Mã KH"]}/history?`;
      if (fromDate) url += `from=${fromDate}&`;
      if (toDate) url += `to=${toDate}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Không tải được lịch sử giao dịch");
      setTransactions([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Lọc Frontend theo trạng thái
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => 
      statusFilter === "Tất cả" || t.status === statusFilter
    );
  }, [transactions, statusFilter]);

  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      alert("Không có dữ liệu để xuất");
      return;
    }

    const csv = [
      ["Mã Đơn", "Ngày Giao Dịch", "Chi Tiết Phim & Ghế", "Chi Tiết Combo", "Tổng Tiền", "Khuyến Mãi", "Thành Tiền", "Trạng Thái"],
      ...filteredTransactions.map((t) => [
        t.orderId, formatDate(t.date), t.movieSeatDetail, t.comboDetail, t.total, t.discount, t.finalAmount, t.status
      ]),
    ].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `LichSu-${selectedCustomer?.["Mã KH"] || "Khach"}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <section style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "30px", fontWeight: 700, marginBottom: "8px" }}>Tra cứu lịch sử giao dịch</h1>
          <p style={{ fontSize: "14px", color: "#666" }}>Tìm kiếm khách hàng bằng Tên / SĐT để xem chi tiết lịch sử.</p>
        </div>
        <button
          onClick={handleExport}
          style={{ padding: "8px 16px", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 500 }}
        >
          <Download size={16} /> Xuất Excel
        </button>
      </header>

      {/* FORM LỌC & TÌM KIẾM */}
      <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb", marginBottom: "24px" }}>
        <form onSubmit={handleFetchHistory} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "16px", alignItems: "end" }}>
          
          {/* Ô Input Real-time */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "8px" }}>
              TÌM KHÁCH HÀNG (TÊN / SĐT)
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setSelectedCustomer(null); // Reset lại khách nếu user sửa text
              }}
              placeholder="VD: Nguyễn Văn A, 0987..."
              style={{ width: "100%", padding: "10px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", boxSizing: "border-box" }}
            />
            {/* Vòng tròn xoay xoay khi đang tìm */}
            {isSearching && <span style={{ position: "absolute", right: "12px", top: "36px", fontSize: "12px", color: "#888" }}>Đang tìm...</span>}

            {/* Dropdown Gợi ý */}
            {showDropdown && customers.length > 0 && (
              <ul style={{ 
                position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", 
                border: "1px solid #e5e7eb", borderRadius: "8px", marginTop: "4px", padding: 0, 
                listStyle: "none", maxHeight: "250px", overflowY: "auto", zIndex: 50,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}>
                {customers.map((c, idx) => (
                  <li 
                    key={idx} 
                    onClick={() => handleSelectCustomer(c)}
                    style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f3f4f6" }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <div style={{ fontWeight: 600, color: "#111827" }}>{c["Tên Khách Hàng"]}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                      SĐT: {c["Số Điện Thoại"] || "N/A"} | ID: {c["Mã KH"]}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {/* Hiển thị báo Không tìm thấy */}
            {showDropdown && customers.length === 0 && keyword.trim() && !isSearching && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", marginTop: "4px", padding: "12px 16px", fontSize: "14px", color: "#ef4444", zIndex: 50 }}>
                Không tìm thấy khách hàng nào!
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "8px" }}>TỪ NGÀY</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ width: "100%", padding: "10px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "8px" }}>ĐẾN NGÀY</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ width: "100%", padding: "10px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", boxSizing: "border-box" }} />
          </div>
          <button type="submit" disabled={loadingHistory} style={{ width: "100%", padding: "10px", backgroundColor: "#00694c", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: loadingHistory ? "not-allowed" : "pointer", display: "flex", gap: "8px", justifyContent: "center", boxSizing: "border-box" }}>
            <Search size={18} /> {loadingHistory ? "Đang tải..." : "Tìm lịch sử"}
          </button>
        </form>
      </div>

      {error && <div style={{ padding: "16px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "24px" }}>{error}</div>}

      {/* BẢNG LỊCH SỬ GIAO DỊCH */}
      {searched && selectedCustomer && (
        <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "4px" }}>Lịch sử của: {selectedCustomer["Tên Khách Hàng"]}</h2>
              <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>SĐT: {selectedCustomer["Số Điện Thoại"]} | Đã tìm thấy {filteredTransactions.length} giao dịch.</p>
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none" }}>
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="ĐÃ THANH TOÁN">ĐÃ THANH TOÁN</option>
              <option value="ĐÃ HỦY">ĐÃ HỦY</option>
            </select>
          </div>

          {loadingHistory ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#6b7280" }}>Đang tải dữ liệu...</div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>Khách hàng này chưa có giao dịch nào trong khoảng thời gian trên.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#374151" }}>Mã Đơn</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#374151" }}>Ngày</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#374151" }}>Phim & Ghế</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#374151" }}>Combo</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "#374151" }}>Tổng Tiền</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "#374151" }}>Khuyến Mãi</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "#374151" }}>Thành Tiền</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", color: "#374151" }}>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{t.orderId}</td>
                      <td style={{ padding: "12px 16px" }}>{formatDate(t.date)}</td>
                      <td style={{ padding: "12px 16px", maxWidth: "200px" }}>{t.movieSeatDetail}</td>
                      <td style={{ padding: "12px 16px", maxWidth: "150px" }}>{t.comboDetail}</td>
                      
                      {/* Cột Tổng tiền ban đầu */}
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#6b7280" }}>
                        {formatCurrency(t.total)}
                      </td>
                      
                      {/* Cột Khuyến mãi (Màu đỏ nếu có giảm) */}
                      <td style={{ padding: "12px 16px", textAlign: "right", color: t.discount > 0 ? "#ef4444" : "#6b7280" }}>
                        {t.discount > 0 ? `-${formatCurrency(t.discount)}` : "0 ₫"}
                      </td>
                      
                      {/* Cột Thành tiền thực tế (Màu xanh lá, in đậm) */}
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#059669" }}>
                        {formatCurrency(t.finalAmount)}
                      </td>

                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{ 
                          padding: "4px 12px", 
                          backgroundColor: t.status === "ĐÃ THANH TOÁN" ? "#dcfce7" : (t.status === "ĐANG CHỜ" ? "#fef08a" : "#fee2e2"), 
                          color: t.status === "ĐÃ THANH TOÁN" ? "#166534" : (t.status === "ĐANG CHỜ" ? "#854d0e" : "#991b1b"), 
                          borderRadius: "6px", 
                          fontSize: "12px", 
                          fontWeight: 600 
                        }}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}