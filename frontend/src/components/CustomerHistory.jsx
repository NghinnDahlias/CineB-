import { useEffect, useMemo, useState } from "react";
import { Users, Search } from "lucide-react";
import { reportService } from "../../services/reportService";

const tierTone = {
  MEMBER: "badge--teal",
  VIP: "badge--blue",
  VVIP: "badge--amber",
  "Chưa phân hạng": "badge--red",
};

function formatDate(value) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN");
}

export default function CustomerHistory() {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCustomers() {
      setLoading(true);
      setError("");
      try {
        const data = await reportService.getCustomers();
        if (mounted) {
          setCustomers(data);
        }
      } catch (err) {
        if (mounted) {
          setError(reportService.getErrorMessage(err, "Không tải được dữ liệu khách hàng."));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCustomers();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return customers.filter((customer) =>
      !search || [customer.name, customer.favorite, customer.tier].some((value) => String(value).toLowerCase().includes(search))
    );
  }, [customers, query]);

  const loyalCustomers = useMemo(() => filtered.filter((item) => item.visits >= 5).length, [filtered]);
  const avgVisits = useMemo(() => {
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, item) => sum + Number(item.visits || 0), 0) / filtered.length;
  }, [filtered]);

  return (
    <section className="page page--customers" aria-label="Lịch sử khách hàng">
      <div className="page__header">
        <div>
          <h1>Lịch sử khách hàng</h1>
          <p>Xem hạng thành viên, lượt ghé gần nhất và phim yêu thích.</p>
        </div>
        <div className="page__actions">
          <button type="button" className="btn btn--secondary">Đồng bộ dữ liệu</button>
          <button type="button" className="btn btn--primary">Nhập CSV</button>
        </div>
      </div>

      {error ? <div className="page-card" style={{ color: "#b91c1c" }}>{error}</div> : null}

      <div className="page-card toolbar">
        <div className="toolbar__filters">
          <div className="field toolbar__search">
            <label htmlFor="customer-search">Tìm kiếm</label>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: 11, color: "#6b7280" }} />
              <input
                id="customer-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm khách hàng, hạng, phim..."
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>
        </div>
        <div className="badge badge--teal"><Users size={14} style={{ marginRight: 6 }} /> {filtered.length} khách hàng</div>
      </div>

      <div className="grid-3">
        <article className="stat-card">
          <div className="stat-card__label">Khách hàng trung thành</div>
          <div className="stat-card__value">{loyalCustomers.toLocaleString("vi-VN")}</div>
          <div className="stat-card__note">Quay lại hơn 5 lần</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Lượt ghé trung bình</div>
          <div className="stat-card__value">{avgVisits.toFixed(1)}</div>
          <div className="stat-card__note">Trên mỗi khách hàng đang hoạt động</div>
        </article>
        <article className="stat-card">
          <div className="stat-card__label">Tỷ lệ giữ chân</div>
          <div className="stat-card__value">{filtered.length ? ((loyalCustomers * 100) / filtered.length).toFixed(1) : "0.0"}%</div>
          <div className="stat-card__note">Tỷ lệ khách quay lại thường xuyên</div>
        </article>
      </div>

      <article className="page-card table-card">
        <div className="table-card__head">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <div>
              <h2>Lịch sử khách hàng gần đây</h2>
              <p>Bảng rõ ràng với badge trạng thái dễ đọc.</p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="loading-state">Đang tải dữ liệu khách hàng...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">Không có khách hàng nào phù hợp với tìm kiếm.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Lượt ghé</th>
                  <th>Phim yêu thích</th>
                  <th>Lần ghé cuối</th>
                  <th>Hạng</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.customerId || customer.name}>
                    <td style={{ fontWeight: 600 }}>{customer.name}</td>
                    <td>{customer.visits}</td>
                    <td>{customer.favorite}</td>
                    <td>{formatDate(customer.lastVisit)}</td>
                    <td><span className={`badge ${tierTone[customer.tier] || "badge--blue"}`}>{customer.tier}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
