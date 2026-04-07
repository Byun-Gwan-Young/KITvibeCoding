// apps/frontend/src/components/feedback/ErrorState.jsx
// 에러 발생 시 보여주는 안내

export function ErrorState({
  icon = "⚠️",
  title = "문제가 발생했어요",
  description = "잠시 후 다시 시도해 주세요.",
  onRetry,
}) {
  return (
    <div className="status-box error" style={{ textAlign: "center", padding: "28px 20px" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <strong style={{ display: "block", marginBottom: 6, fontSize: 16 }}>{title}</strong>
      <span style={{ display: "block", marginBottom: onRetry ? 14 : 0 }}>{description}</span>
      {onRetry && (
        <button className="ghost-button" type="button" onClick={onRetry} style={{ marginTop: 4 }}>
          다시 시도
        </button>
      )}
    </div>
  );
}
