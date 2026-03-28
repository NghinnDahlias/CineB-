// Một khối giao diện dạng thẻ (card) dùng để gom nhóm thông tin, 
// có thể dùng để bọc ngoài thông tin chi tiết của một bộ phim hoặc một cụm rạp chiếu.

export default function SectionCard({ title, subtitle, actions, children }) {
  return (
    <section className="card-surface section-card">
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="section-actions">{actions}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
