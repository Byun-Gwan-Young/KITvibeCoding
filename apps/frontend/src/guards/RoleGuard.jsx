// apps/frontend/src/guards/RoleGuard.jsx
// 권한이 없는 경로 접근 시 차단하고 리다이렉트 또는 안내 화면 표시

import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useRouter } from "../router/hashRouter.js";
import { canAccess, DEFAULT_ROUTES } from "../router/permissions.js";

export function RoleGuard({ children }) {
  const { session } = useAuth();
  const { pathname, replace } = useRouter();

  const role = session?.user?.role;
  const allowed = role ? canAccess(role, pathname) : false;

  useEffect(() => {
    if (!role) return;
    if (!allowed) {
      replace(DEFAULT_ROUTES[role] || "/login");
    }
  }, [role, allowed, replace]);

  if (!role || !allowed) {
    return (
      <div className="screen-message">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>접근 권한이 없습니다</h2>
          <p className="muted">이 페이지는 현재 계정으로 이용할 수 없어요.<br />잠시 후 올바른 화면으로 이동합니다.</p>
        </div>
      </div>
    );
  }

  return children;
}
