/**
 * EXAMPLE_USAGE.jsx
 * Ví dụ sử dụng CustomerAutocomplete component trong modal/form
 */

import { useState } from "react";
import CustomerAutocomplete from "./CustomerAutocomplete";

export function ExampleUsage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [errors, setErrors] = useState({});

  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
    if (customerId) {
      setErrors((prev) => ({ ...prev, customer: "" })); // Clear error
    }
  };

  const handleCustomerSelect = (customer) => {
    console.log("Khách hàng được chọn:", customer);
    // Ở đây bạn có thể xử lý thêm thông tin khách hàng nếu cần
    // Ví dụ: lấy thêm info khách hàng từ API
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate
    const newErrors = {};
    if (!selectedCustomerId.trim()) {
      newErrors.customer = "Vui lòng chọn khách hàng";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit form
    console.log("Tạo đơn hàng cho khách:", selectedCustomerId);
    // API call ở đây...
  };

  return (
    <div style={{ maxWidth: 600, margin: "20px auto", padding: 20 }}>
      <h2>Ví dụ: Tạo đơn hàng mới</h2>

      <form onSubmit={handleSubmit}>
        {/* Sử dụng CustomerAutocomplete */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            Chọn khách hàng <span style={{ color: "red" }}>*</span>
          </label>
          <CustomerAutocomplete
            value={selectedCustomerId}
            onChange={handleCustomerChange}
            onSelect={handleCustomerSelect}
            error={errors.customer}
            placeholder="Tìm kiếm khách hàng..."
          />
        </div>

        {/* Các field khác */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            Số tiền đơn hàng
          </label>
          <input
            type="number"
            placeholder="Nhập số tiền..."
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          />
        </div>

        {/* Button submit */}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px 16px",
            backgroundColor: "#14b8a6",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Tạo đơn hàng
        </button>
      </form>

      {/* Display selected customer */}
      {selectedCustomerId && (
        <div
          style={{
            marginTop: 20,
            padding: 12,
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: 4,
          }}
        >
          ✅ Khách hàng được chọn: <strong>{selectedCustomerId}</strong>
        </div>
      )}
    </div>
  );
}
