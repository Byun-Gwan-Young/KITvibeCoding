// apps/frontend/src/components/feedback/EmptyState.jsx
// 데이터가 없을 때 보여주는 빈 상태 안내

export function EmptyState({
  icon = "📭",
  title = "아직 표시할 내용이 없어요",
  description = "데이터가 쌓이면 여기에 표시돼요.",
  action,
}) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{title}</h3>
      <p className="muted" style={{ marginBottom: action ? 16 : 0 }}>{description}</p>
      {action ?? null}
    </div>
  );
}
