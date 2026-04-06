import { createContext, useContext, useMemo, useState } from "react";

const AppStateContext = createContext(null);

function defaultPageForRole(role) {
  return role === "student" ? "student-dashboard" : "instructor-dashboard";
}

export function AppStateProvider({ role, children }) {
  const [currentPage, setCurrentPage] = useState(defaultPageForRole(role));
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const value = useMemo(
    () => ({
      currentPage,
      selectedStudentId,
      openPage: setCurrentPage,
      openStudentDetail(studentId) {
        setSelectedStudentId(studentId);
        setCurrentPage("student-detail");
      },
    }),
    [currentPage, selectedStudentId],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("AppStateProvider 안에서만 사용할 수 있어.");
  return context;
}
