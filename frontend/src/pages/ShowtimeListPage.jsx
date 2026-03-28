// Màn hình hiển thị danh sách lịch chiếu, 
// thường là giao diện hướng tới khách hàng (người dùng cuối) 
// để họ xem hôm nay có phim gì chiếu vào những khung giờ nào.

import { useEffect, useMemo, useState } from "react";
import InputField from "../components/InputField";
import SectionCard from "../components/SectionCard";
import { showtimeService } from "../services/showtimeService";
import { showtimeRows as fallbackRows } from "../mock/mockData";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "OPEN", value: "OPEN" },
  { label: "CLOSED", value: "CLOSED" },
  { label: "CANCELLED", value: "CANCELLED" }
];

const SORT_OPTIONS = [
  { label: "Newest Start", value: "start-desc" },
  { label: "Oldest Start", value: "start-asc" },
  { label: "Price High -> Low", value: "price-desc" },
  { label: "Price Low -> High", value: "price-asc" }
];

export default function ShowtimeListPage({ onEditShowtime }) {
  const [filters, setFilters] = useState({
    branchId: "",
    movieKeyword: "",
    fromDate: "",
    toDate: "",
    status: ""
  });

  const [sortBy, setSortBy] = useState("start-desc");
  const [rows, setRows] = useState(fallbackRows);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const loadRows = async () => {
    setLoading(true);
    setErrorText("");

    try {
      const data = await showtimeService.list({
        branchId: filters.branchId ? Number(filters.branchId) : undefined,
        movieKeyword: filters.movieKeyword || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        status: filters.status || undefined
      });

      setRows(Array.isArray(data) && data.length > 0 ? data : fallbackRows);
    } catch (error) {
      setRows(fallbackRows);
      setErrorText(error.message || "Cannot load from API. Showing fallback rows.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedRows = useMemo(() => {
    const clone = [...rows];

    clone.sort((a, b) => {
      if (sortBy === "start-asc") {
        return new Date(a.startTime) - new Date(b.startTime);
      }
      if (sortBy === "price-desc") {
        return Number(b.baseTicketPrice) - Number(a.baseTicketPrice);
      }
      if (sortBy === "price-asc") {
        return Number(a.baseTicketPrice) - Number(b.baseTicketPrice);
      }
      return new Date(b.startTime) - new Date(a.startTime);
    });

    return clone;
  }, [rows, sortBy]);

  return (
    <SectionCard
      title="Showtime List, Search, Sort"
      subtitle="Screen for section 3.2 - call query procedure in 2.3"
      actions={
        <button type="button" className="ghost-btn" onClick={loadRows} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      }
    >
      <div className="filter-grid">
        <InputField
          id="branch-id"
          label="Branch ID"
          value={filters.branchId}
          onChange={(v) => setFilter("branchId", v)}
          placeholder="Example: 1"
        />

        <InputField
          id="movie-keyword"
          label="Movie Keyword"
          value={filters.movieKeyword}
          onChange={(v) => setFilter("movieKeyword", v)}
          placeholder="Galaxy"
        />

        <InputField
          id="from-date"
          label="From"
          type="datetime-local"
          value={filters.fromDate}
          onChange={(v) => setFilter("fromDate", v)}
        />

        <InputField
          id="to-date"
          label="To"
          type="datetime-local"
          value={filters.toDate}
          onChange={(v) => setFilter("toDate", v)}
        />

        <InputField
          id="status-filter"
          label="Status"
          value={filters.status}
          onChange={(v) => setFilter("status", v)}
          options={STATUS_OPTIONS}
        />

        <InputField
          id="sort-by"
          label="Sort"
          value={sortBy}
          onChange={setSortBy}
          options={SORT_OPTIONS}
        />
      </div>

      {errorText ? <div className="feedback warning">{errorText}</div> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Branch</th>
              <th>Room</th>
              <th>Movie</th>
              <th>Start</th>
              <th>End</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.showtimeId}>
                <td>{row.showtimeId}</td>
                <td>{row.branchName || "-"}</td>
                <td>{row.roomCode || row.roomId}</td>
                <td>{row.movieTitle || "-"}</td>
                <td>{row.startTime}</td>
                <td>{row.endTime}</td>
                <td>{Number(row.baseTicketPrice).toLocaleString()}</td>
                <td>{row.status}</td>
                <td>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => onEditShowtime?.(row)}
                    >
                      Edit
                    </button>
                    <button type="button" className="mini-btn danger">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
