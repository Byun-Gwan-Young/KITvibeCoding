// apps/frontend/src/App.jsx
import { useEffect } from "react";
import { HashRouterProvider, useRouter } from "./router/hashRouter.js";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { MainRouter } from "./router/MainRouter.jsx";
import { DEFAULT_ROUTES } from "./router/permissions.js";

function AppContent() {
  const { session, isHydrating } = useAuth();
  const { pathname, replace } = useRouter();

  // 로그인 후 역할에 맞는 기본 경로로 이동
  useEffect(() => {
    if (!session) return;
    const role = session.user.role;
    if (pathname === "/" || pathname === "/login") {
      replace(DEFAULT_ROUTES[role] || "/");
    }
  }, [session, pathname, replace]);

  if (isHydrating) {
    return (
      <div className="screen-message">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "fadeIn 0.5s ease" }}>⏳</div>
          <p className="muted">로그인 상태를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return <MainRouter />;
}

export default function App() {
  return (
    <HashRouterProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouterProvider>
  );
}
