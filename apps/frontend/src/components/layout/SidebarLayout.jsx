// apps/frontend/src/components/layout/SidebarLayout.jsx
// 역할별 사이드바 + 상단바 레이아웃. 역할에 맞는 메뉴만 표시.

import { useAuth } from "../../contexts/AuthContext.jsx";
import { useRouter } from "../../router/hashRouter.js";
import { MENUS } from "../../router/permissions.js";

const ROLE_LABELS = { admin: "관리자", instructor: "강사", student: "학생" };
const ROLE_TITLES = {
  student: { title: "나의 학습 전략", subtitle: "지금 해야 할 공부를 바로 확인할 수 있어요." },
  instructor: { title: "강사 운영 화면", subtitle: "오늘 먼저 볼 학생과 상담 포인트를 정리했어요." },
  admin: { title: "운영 관리", subtitle: "학원 전체 운영 현황을 한눈에 확인할 수 있어요." },
};

export function SidebarLayout({ children }) {
  const { session, logout } = useAuth();
  const { pathname, navigate } = useRouter();

  const role = session?.user?.role || "student";
  const menuItems = MENUS[role] || [];
  const titles = ROLE_TITLES[role] || ROLE_TITLES.student;

  return (
    <div className="app-shell">
      {/* ── 사이드바 ── */}
      <aside className="side-nav">
        <h1 className="brand-title">UnitFlow AI</h1>
        <p className="brand-copy">
          AI 기반 맞춤 학습 전략 플랫폼
        </p>
        <nav className="nav-list">
          {menuItems.map((item) => {
            const isActive =
              item.path === pathname ||
              (item.path !== `/${role === "admin" ? "admin" : role === "instructor" ? "teacher" : "student"}` &&
                pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                className={`nav-button ${isActive ? "active" : ""}`}
                type="button"
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.25)" }}>
          <div className="user-chip" style={{ width: "100%", justifyContent: "space-between" }}>
            <div>
              <strong style={{ display: "block", fontSize: 14 }}>{session?.user?.name}</strong>
              <span className="muted" style={{ fontSize: 12 }}>{ROLE_LABELS[role]}</span>
            </div>
            <button className="ghost-button" type="button" onClick={logout} style={{ padding: "6px 12px", fontSize: 13 }}>
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* ── 메인 영역 ── */}
      <main className="main-area">
        <header className="topbar">
          <div>
            <h2 className="topbar-title">{titles.title}</h2>
            <p className="topbar-copy">{titles.subtitle}</p>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
