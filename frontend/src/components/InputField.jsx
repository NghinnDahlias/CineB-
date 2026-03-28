// Component chuẩn hóa cho các ô nhập liệu

export default function InputField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  options,
  min,
  step
}) {
  const isSelect = Array.isArray(options);

  return (
    <label className="field-wrap" htmlFor={id}>
      <span>{label}</span>
      {isSelect ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          step={step}
        />
      )}
      {error ? <small className="error-text">{error}</small> : null}
    </label>
  );
}
