import { useAuth } from "../contexts/AuthContext.jsx";
import { useAppState } from "../contexts/AppStateContext.jsx";
import { ExamManagementPage } from "../pages/ExamManagementPage.jsx";
import { InstructorDashboardPage } from "../pages/InstructorDashboardPage.jsx";
import { StudentDashboardPage } from "../pages/StudentDashboardPage.jsx";
import { StudentDetailPage } from "../pages/StudentDetailPage.jsx";
import { StudentListPage } from "../pages/StudentListPage.jsx";
import { UniversityPolicyPage } from "../pages/UniversityPolicyPage.jsx";

export function MainRouter() {
  const { session } = useAuth();
  const { currentPage, selectedStudentId } = useAppState();

  if (session.user.role === "student") {
    return <StudentDashboardPage />;
  }

  switch (currentPage) {
    case "students":
      return <StudentListPage />;
    case "student-detail":
      return <StudentDetailPage studentId={selectedStudentId} />;
    case "exams":
      return <ExamManagementPage />;
    case "universities":
      return <UniversityPolicyPage />;
    case "instructor-dashboard":
    default:
      return <InstructorDashboardPage />;
  }
}
