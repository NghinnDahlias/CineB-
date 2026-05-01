/**
 * frontend/src/components/CustomerAutocomplete.jsx
 * 
 * Autocomplete dropdown để chọn khách hàng
 * - Tìm kiếm real-time (mã hoặc tên)
 * - Hiển thị: "MÃ | TÊN KHÁCH"
 * - Load từ API
 */

import { useEffect, useRef, useState } from "react";
import "./CustomerAutocomplete.css";

export default function CustomerAutocomplete({ 
  value, 
  onChange, 
  error,
  placeholder = "Tìm kiếm khách hàng (mã hoặc tên)..."
}) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]); // Danh sách gợi ý
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  /**
   * Fetch danh sách khách hàng từ API
   * Gọi khi người dùng gõ
   */
  const fetchCustomers = async (searchTerm) => {
    // Bỏ hoặc sửa dòng check rỗng để API vẫn được gọi
    setLoading(true);
    try {
        const response = await fetch(
        `/api/customers?search=${encodeURIComponent(searchTerm)}&limit=10`
        );

      const result = await response.json();

      if (result.ok) {
        setSuggestions(result.data);
        setIsOpen(true);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Fetch customers error:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle input change - tìm kiếm real-time
   */
  const handleInputChange = (e) => {
    const newInput = e.target.value;
    setInput(newInput);

    // Nếu input trống, clear suggestions
    if (!newInput.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Fetch suggestions
    fetchCustomers(newInput);
  };

  /**
   * Handle chọn 1 khách hàng từ dropdown
   */
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setInput(customer.label); // Hiển thị "MÃ | TÊN"
    setSuggestions([]);
    setIsOpen(false);
    
    // Gọi callback cha
    onChange(customer.id); // Truyền mã khách hàng lên
  };

  /**
   * Handle click ngoài dropdown - đóng
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Reset input nếu value từ cha thay đổi
   */
  useEffect(() => {
    if (!value) {
      setInput("");
      setSelectedCustomer(null);
    }
  }, [value]);

  return (
    <div className="customer-autocomplete">
      <div className="autocomplete-wrapper">
        {/* Input tìm kiếm */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`autocomplete-input ${error ? "error" : ""}`}
          autoComplete="off"
        />

        {/* Loading indicator */}
        {loading && <span className="autocomplete-loading"></span>}

        {/* Dropdown danh sách */}
        {isOpen && suggestions.length > 0 && (
          <div ref={dropdownRef} className="autocomplete-dropdown">
            {suggestions.map((customer) => (
              <div
                key={customer.id}
                className="autocomplete-option"
                onClick={() => handleSelectCustomer(customer)}
              >
                <strong>{customer.code}</strong>
                <span className="autocomplete-separator">|</span>
                <span>{customer.name}</span>
                {customer.phone && (
                  <span className="autocomplete-detail">({customer.phone})</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {isOpen && input.trim() && suggestions.length === 0 && !loading && (
          <div className="autocomplete-empty">
            Không tìm thấy khách hàng nào
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <small className="error-text">{error}</small>}

      {/* Hiển thị khách hàng đã chọn */}
      {selectedCustomer && (
        <div className="selected-customer">
          Đã chọn: <strong>{selectedCustomer.label}</strong>
          <button
            type="button"
            className="clear-btn"
            onClick={() => {
              setSelectedCustomer(null);
              setInput("");
              onChange(null);
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}