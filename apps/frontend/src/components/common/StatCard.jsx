export function StatCard({ label, value, description }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="muted">{description}</div>
    </div>
  );
}
