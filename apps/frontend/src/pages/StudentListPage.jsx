import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useAppState } from "../contexts/AppStateContext.jsx";
import { apiClient } from "../lib/apiClient.js";
import { formatScore, toPriorityLabel, toWeaknessLabel } from "../lib/formatters.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { LoadingPanel } from "../components/common/LoadingPanel.jsx";
import { StatusBox } from "../components/common/StatusBox.jsx";

export function StudentListPage() {
  const { session } = useAuth();
  const { openStudentDetail } = useAppState();
  const [keyword, setKeyword] = useState("");
  const { data, error, loading } = useAsyncData(() => apiClient.getStudents(session.accessToken), [session.accessToken]);

  const filteredStudents = useMemo(() => {
    const students = data?.students ?? [];
    if (!keyword.trim()) return students;
    const lowered = keyword.trim().toLowerCase();
    return students.filter((student) => student.name.toLowerCase().includes(lowered) || (student.targetUniv ?? "").toLowerCase().includes(lowered));
  }, [data, keyword]);

  return (
    <div className="page-grid">
      <section className="hero-card">
        <h1>학생 목록</h1>
        <p className="muted">상담이 필요한 학생을 빠르게 찾고 바로 상세 화면으로 이동할 수 있어.</p>
        {loading ? <LoadingPanel title="불러오는 중" description="학생 목록을 정리하고 있어." /> : null}
        {error ? <StatusBox tone="error" title="불러오기 실패" description={error} /> : null}
      </section>

      <section className="panel">
        <div className="toolbar">
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="학생 이름 또는 목표 대학 검색" />
        </div>
      </section>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>학생</th>
              <th>반</th>
              <th>목표 대학</th>
              <th>상담 우선도</th>
              <th>취약 유형</th>
              <th>목표 대학 격차</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} onClick={() => openStudentDetail(student.id)} style={{ cursor: "pointer" }}>
                <td>{student.name}</td>
                <td>{student.classGroup ?? "-"}</td>
                <td>{student.targetUniv ?? "-"}</td>
                <td>{toPriorityLabel(student.consultPriority)}</td>
                <td>{student.weaknessTypes.map(toWeaknessLabel).join(", ") || "-"}</td>
                <td>{formatScore(student.gapScore)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
