export function StatusBox({ tone = "info", title, description }) {
  return (
    <div className={`status-box ${tone}`}>
      <strong style={{ display: "block", marginBottom: 4 }}>{title}</strong>
      <span>{description}</span>
    </div>
  );
}
