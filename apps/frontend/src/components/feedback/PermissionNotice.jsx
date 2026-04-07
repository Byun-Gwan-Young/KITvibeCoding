// apps/frontend/src/components/feedback/PermissionNotice.jsx
// 접근 권한이 없을 때 보여주는 안내

export function PermissionNotice({
  title = "접근 권한이 없습니다",
  description = "이 페이지는 현재 계정으로 이용할 수 없어요.",
}) {
  return (
    <div className="screen-message">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>{title}</h2>
        <p className="muted">{description}</p>
      </div>
    </div>
  );
}
