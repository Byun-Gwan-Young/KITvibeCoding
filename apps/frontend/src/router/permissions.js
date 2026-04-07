// apps/frontend/src/router/permissions.js
// 역할별 접근 매트릭스 — 라우트/메뉴/액션 단위

/**
 * 역할별 접근 가능한 경로 prefix 목록.
 * 이 목록에 없는 경로로 접근하면 권한 없음 화면을 보여준다.
 */
export const ROUTE_ACCESS = {
  student: ["/student"],
  instructor: ["/teacher"],
  admin: ["/admin", "/teacher"],  // 관리자는 강사 화면도 접근 가능
};

/**
 * 역할별 로그인 후 이동할 기본 경로
 */
export const DEFAULT_ROUTES = {
  student: "/student",
  instructor: "/teacher",
  admin: "/admin",
};

/**
 * 역할별 사이드바 메뉴 정의
 */
export const MENUS = {
  student: [
    { path: "/student", label: "나의 학습 전략", icon: "BookOpen" },
  ],
  instructor: [
    { path: "/teacher", label: "오늘의 요약", icon: "LayoutDashboard" },
    { path: "/teacher/students", label: "학생 관리", icon: "Users" },
    { path: "/teacher/exams", label: "시험 관리", icon: "FileText" },
    { path: "/teacher/universities", label: "대학 정책", icon: "GraduationCap" },
  ],
  admin: [
    { path: "/admin", label: "운영 현황", icon: "LayoutDashboard" },
    { path: "/admin/students", label: "학생 관리", icon: "Users" },
    { path: "/admin/exams", label: "시험 관리", icon: "FileText" },
    { path: "/admin/universities", label: "대학 정책", icon: "GraduationCap" },
  ],
};

/**
 * 주어진 역할이 해당 경로에 접근할 수 있는지 확인
 */
export function canAccess(role, pathname) {
  const allowed = ROUTE_ACCESS[role];
  if (!allowed) return false;
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}
