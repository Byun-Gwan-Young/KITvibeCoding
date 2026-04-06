export function LoadingPanel({ title = "불러오는 중", description = "데이터를 정리하고 있어." }) {
  return (
    <div className="status-box info">
      <strong style={{ display: "block", marginBottom: 4 }}>{title}</strong>
      <span>{description}</span>
    </div>
  );
}
