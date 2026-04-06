import { useAuth } from "../contexts/AuthContext.jsx";
import { useAppState } from "../contexts/AppStateContext.jsx";
import { apiClient } from "../lib/apiClient.js";
import { formatPercent, formatScore, toWeaknessLabel } from "../lib/formatters.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { ListCard } from "../components/common/ListCard.jsx";
import { LoadingPanel } from "../components/common/LoadingPanel.jsx";
import { StatCard } from "../components/common/StatCard.jsx";
import { StatusBox } from "../components/common/StatusBox.jsx";

export function InstructorDashboardPage() {
  const { session } = useAuth();
  const { openStudentDetail } = useAppState();
  const { data, error, loading } = useAsyncData(
    () => apiClient.getInstructorDashboard(session.accessToken),
    [session.accessToken],
  );

  const priorityStudent = data?.consultPriorityStudents?.[0];

  return (
    <div className="page-grid">
      <section className="hero-card">
        <h1>오늘 먼저 봐야 할 학생과 상담 포인트</h1>
        <p className="muted">강사 화면은 결론부터 보여주고, 바로 학생 상세로 들어갈 수 있게 구성했어.</p>
        {loading ? <LoadingPanel title="불러오는 중" description="학생 진단과 전략 요약을 정리하고 있어." /> : null}
        {error ? <StatusBox tone="error" title="불러오기 실패" description={error} /> : null}
      </section>

      <section className="stats-grid">
        <StatCard label="우선 상담 학생" value={priorityStudent?.name ?? "-"} description={priorityStudent ? `목표 대학 격차 ${formatScore(priorityStudent.gapScore)}` : "표시할 학생이 아직 없어"} />
        <StatCard label="많이 보이는 취약 유형" value={data?.weaknessDistribution?.[0]?.label ?? "-"} description="최근 진단 기준 집계" />
        <StatCard label="최근 시험 평균" value={formatScore(data?.examTrend?.[data.examTrend.length - 1]?.averageScore)} description="최근 시험 흐름 기준" />
      </section>

      <section className="two-grid">
        <ListCard
          title="지금 먼저 볼 학생"
          items={
            priorityStudent
              ? [
                  `${priorityStudent.name} 학생을 먼저 확인`,
                  `취약 유형 ${priorityStudent.weaknessTypes.map(toWeaknessLabel).join(", ") || "데이터 없음"}`,
                  `상담 우선도 ${priorityStudent.consultPriority}`,
                ]
              : []
          }
        />
        <ListCard
          title="최근 전략 요약"
          items={data?.recentStrategies?.length ? data.recentStrategies.map((item) => item.summary) : []}
        />
      </section>

      <section className="two-grid">
        <ListCard
          title="취약 단원 상위"
          items={(data?.weakUnits ?? []).slice(0, 5).map((unit) => `${unit.unitName} · 이해도 ${formatPercent(unit.mastery)}`)}
        />
        <section className="table-card">
          <h2>학생 빠른 이동</h2>
          <table>
            <thead>
              <tr>
                <th>학생</th>
                <th>목표 대학 격차</th>
                <th>취약 유형</th>
              </tr>
            </thead>
            <tbody>
              {(data?.consultPriorityStudents ?? []).map((student) => (
                <tr key={student.id} onClick={() => openStudentDetail(student.id)} style={{ cursor: "pointer" }}>
                  <td>{student.name}</td>
                  <td>{formatScore(student.gapScore)}</td>
                  <td>{student.weaknessTypes.map(toWeaknessLabel).join(", ") || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>
    </div>
  );
}
