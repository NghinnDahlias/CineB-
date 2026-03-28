// Trang này đóng vai trò như bảng điều khiển của Admin/Nhân viên rạp để 
// quản lý lịch chiếu (thêm lịch mới, cập nhật giờ chiếu, xóa lịch bị hủy). 
// Nó sẽ gửi các câu lệnh tương ứng xuống Backend để thao tác với Database.

import { useEffect, useMemo, useState } from "react";
import InputField from "../components/InputField";
import SectionCard from "../components/SectionCard";
import { showtimeService } from "../services/showtimeService";
import { validateShowtimeDelete, validateShowtimePayload } from "../utils/validators";

const STATUS_OPTIONS = [
  { label: "OPEN", value: "OPEN" },
  { label: "CLOSED", value: "CLOSED" },
  { label: "CANCELLED", value: "CANCELLED" }
];

const INITIAL_FORM = {
  showtimeId: "",
  roomId: "",
  movieId: "",
  startTime: "",
  endTime: "",
  baseTicketPrice: "",
  languageVersion: "VIE_SUB",
  status: "OPEN"
};

export default function ShowtimeCrudPage({ selectedShowtime }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: "idle", text: "" });

  useEffect(() => {
    if (!selectedShowtime) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      showtimeId: String(selectedShowtime.showtimeId || ""),
      roomId: String(selectedShowtime.roomId || ""),
      movieId: String(selectedShowtime.movieId || ""),
      startTime: selectedShowtime.startTime || "",
      endTime: selectedShowtime.endTime || "",
      baseTicketPrice: String(selectedShowtime.baseTicketPrice || ""),
      languageVersion: selectedShowtime.languageVersion || "VIE_SUB",
      status: selectedShowtime.status || "OPEN"
    }));
  }, [selectedShowtime]);

  const payload = useMemo(
    () => ({
      roomId: Number(form.roomId),
      movieId: Number(form.movieId),
      startTime: form.startTime,
      endTime: form.endTime,
      baseTicketPrice: Number(form.baseTicketPrice),
      languageVersion: form.languageVersion,
      status: form.status
    }),
    [form]
  );

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setFeedback({ type: "idle", text: "" });
  };

  const submitCreate = async () => {
    const nextErrors = validateShowtimePayload(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFeedback({ type: "error", text: "Please fix highlighted inputs before create." });
      return;
    }

    try {
      await showtimeService.create(payload);
      setFeedback({ type: "success", text: "Create request sent. Check backend response." });
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Create failed." });
    }
  };

  const submitUpdate = async () => {
    const nextErrors = {
      ...validateShowtimePayload(payload),
      ...validateShowtimeDelete(form.showtimeId)
    };
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFeedback({ type: "error", text: "Showtime ID and payload are required for update." });
      return;
    }

    try {
      await showtimeService.update(Number(form.showtimeId), payload);
      setFeedback({ type: "success", text: "Update request sent. Check backend response." });
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Update failed." });
    }
  };

  const submitDelete = async () => {
    const nextErrors = validateShowtimeDelete(form.showtimeId);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFeedback({ type: "error", text: "Showtime ID is required for delete." });
      return;
    }

    try {
      await showtimeService.remove(Number(form.showtimeId));
      setFeedback({ type: "success", text: "Delete request sent. Check backend response." });
    } catch (error) {
      setFeedback({ type: "error", text: error.message || "Delete failed." });
    }
  };

  return (
    <SectionCard
      title="Showtime CRUD"
      subtitle="Screen for section 3.1 - all actions should call procedures in 2.1"
      actions={
        <button type="button" className="ghost-btn" onClick={resetForm}>
          Reset form
        </button>
      }
    >
      <div className="form-grid">
        <InputField
          id="showtime-id"
          label="Showtime ID (for update/delete)"
          value={form.showtimeId}
          onChange={(v) => setField("showtimeId", v)}
          placeholder="Example: 12"
          error={errors.showtimeId}
        />

        <InputField
          id="room-id"
          label="Room ID"
          value={form.roomId}
          onChange={(v) => setField("roomId", v)}
          placeholder="Example: 1"
          error={errors.roomId}
        />

        <InputField
          id="movie-id"
          label="Movie ID"
          value={form.movieId}
          onChange={(v) => setField("movieId", v)}
          placeholder="Example: 3"
          error={errors.movieId}
        />

        <InputField
          id="start-time"
          label="Start Time"
          type="datetime-local"
          value={form.startTime}
          onChange={(v) => setField("startTime", v)}
          error={errors.startTime}
        />

        <InputField
          id="end-time"
          label="End Time"
          type="datetime-local"
          value={form.endTime}
          onChange={(v) => setField("endTime", v)}
          error={errors.endTime}
        />

        <InputField
          id="base-ticket-price"
          label="Base Ticket Price"
          type="number"
          min="0"
          step="1000"
          value={form.baseTicketPrice}
          onChange={(v) => setField("baseTicketPrice", v)}
          placeholder="Example: 90000"
          error={errors.baseTicketPrice}
        />

        <InputField
          id="language-version"
          label="Language Version"
          value={form.languageVersion}
          onChange={(v) => setField("languageVersion", v)}
          placeholder="VIE_SUB"
          error={errors.languageVersion}
        />

        <InputField
          id="status"
          label="Status"
          value={form.status}
          onChange={(v) => setField("status", v)}
          options={STATUS_OPTIONS}
        />
      </div>

      <div className="action-row">
        <button type="button" className="primary-btn" onClick={submitCreate}>
          Create
        </button>
        <button type="button" className="warning-btn" onClick={submitUpdate}>
          Update
        </button>
        <button type="button" className="danger-btn" onClick={submitDelete}>
          Delete
        </button>
      </div>

      {feedback.type !== "idle" ? (
        <div className={`feedback ${feedback.type}`}>{feedback.text}</div>
      ) : null}
    </SectionCard>
  );
}
