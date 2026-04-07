// apps/frontend/src/components/feedback/FirstVisitHint.jsx
// 첫 방문 안내 — 한 번 닫으면 다시 안 보임 (세션 동안)

import { useState } from "react";

const dismissed = new Set();

export function FirstVisitHint({ id, icon = "💡", title, description }) {
  const [visible, setVisible] = useState(!dismissed.has(id));

  if (!visible) return null;

  function dismiss() {
    dismissed.add(id);
    setVisible(false);
  }

  return (
    <div className="status-box info" style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      animation: "fadeIn 0.3s ease",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <strong style={{ display: "block", marginBottom: 2 }}>{title}</strong>
        <span style={{ fontSize: 13 }}>{description}</span>
      </div>
      <button
        type="button"
        onClick={dismiss}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "inherit", opacity: 0.5, fontSize: 16, padding: "0 4px",
          lineHeight: 1, flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
