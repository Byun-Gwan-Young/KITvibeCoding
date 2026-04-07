// apps/frontend/src/router/MainRouter.jsx
// 해시 기반 라우팅 + 역할별 경로 분기 + 권한 가드 통합

import { useRouter, matchPath } from "./hashRouter.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { RoleGuard } from "../guards/RoleGuard.jsx";
import { SidebarLayout } from "../components/layout/SidebarLayout.jsx";

// Pages
import { AdminDashboardPage } from "../pages/AdminDashboardPage.jsx";
import { InstructorDashboardPage } from "../pages/InstructorDashboardPage.jsx";
import { StudentDashboardPage } from "../pages/StudentDashboardPage.jsx";
import { StudentListPage } from "../pages/StudentListPage.jsx";
import { StudentDetailPage } from "../pages/StudentDetailPage.jsx";
import { ExamManagementPage } from "../pages/ExamManagementPage.jsx";
import { UniversityPolicyPage } from "../pages/UniversityPolicyPage.jsx";

function NotFoundPage() {
  const { navigate } = useRouter();
  return (
    <div className="screen-message">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>페이지를 찾을 수 없습니다</h2>
        <p className="muted" style={{ marginBottom: 16 }}>요청한 화면이 존재하지 않아요.</p>
        <button className="primary-button" type="button" onClick={() => navigate("/")}>
          첫 화면으로 이동
        </button>
      </div>
    </div>
  );
}

function resolveRoute(pathname, role) {
  // ── 학생 라우트 ──
  if (role === "student") {
    if (pathname === "/student") return <StudentDashboardPage />;
    return null;
  }

  // ── 강사 라우트 ──
  if (pathname === "/teacher") return <InstructorDashboardPage />;
  if (pathname === "/teacher/students") return <StudentListPage />;
  
  const studentDetail = matchPath("/teacher/students/:id", pathname);
  if (studentDetail.matched) return <StudentDetailPage studentId={studentDetail.params.id} />;
  
  if (pathname === "/teacher/exams") return <ExamManagementPage />;
  if (pathname === "/teacher/universities") return <UniversityPolicyPage />;

  // ── 관리자 라우트 (관리자 전용 대시보드 + 공유 화면) ──
  if (pathname === "/admin") return <AdminDashboardPage />;
  if (pathname === "/admin/students") return <StudentListPage />;
  
  const adminStudentDetail = matchPath("/admin/students/:id", pathname);
  if (adminStudentDetail.matched) return <StudentDetailPage studentId={adminStudentDetail.params.id} />;
  
  if (pathname === "/admin/exams") return <ExamManagementPage />;
  if (pathname === "/admin/universities") return <UniversityPolicyPage />;

  return null;
}

export function MainRouter() {
  const { pathname } = useRouter();
  const { session } = useAuth();

  const role = session?.user?.role;
  const page = resolveRoute(pathname, role);

  return (
    <RoleGuard>
      <SidebarLayout>
        {page || <NotFoundPage />}
      </SidebarLayout>
    </RoleGuard>
  );
}
