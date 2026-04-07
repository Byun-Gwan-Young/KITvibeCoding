// apps/frontend/src/pages/InstructorDashboardPage.jsx
import { useAuth } from "../contexts/AuthContext.jsx";
import { useRouter } from "../router/hashRouter.js";
import { apiClient } from "../lib/apiClient.js";
import { formatPercent, formatScore, toWeaknessLabel } from "../lib/formatters.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { ListCard } from "../components/common/ListCard.jsx";
import { LoadingPanel } from "../components/common/LoadingPanel.jsx";
import { StatCard } from "../components/common/StatCard.jsx";
import { StatusBox } from "../components/common/StatusBox.jsx";
import { FirstVisitHint } from "../components/feedback/FirstVisitHint.jsx";

export function InstructorDashboardPage() {
  const { session } = useAuth();
  const { pathname, navigate } = useRouter();
  const studentBasePath = pathname.startsWith("/admin") ? "/admin/students" : "/teacher/students";

  const { data, error, loading } = useAsyncData(
    () => apiClient.getInstructorDashboard(session.accessToken),
    [session.accessToken],
  );

  const priorityStudent = data?.consultPriorityStudents?.[0];
  const latestExamPoint = data?.examTrend?.length ? data.examTrend[data.examTrend.length - 1] : null;

  return (
    <div className="page-grid">
      {/* ── 히어로 ── */}
      <section className="hero-card">
        <FirstVisitHint id="instructor-welcome" title="강사 대시보드에 오신 것을 환영합니다" description="우선 상담 학생, 취약 유형 분포, 최근 시험 흐름을 한눈에 확인할 수 있어요. 학생 이름을 클릭하면 상세 화면으로 이동해요." />
        <h1>오늘 먼저 볼 학생과 상담 포인트</h1>
        <p className="muted" style={{ fontSize: 15, lineHeight: 1.7 }}>
          우선 상담이 필요한 학생, 자주 보이는 취약 유형, 최근 시험 흐름을 한눈에 확인할 수 있어요.
        </p>
        {loading ? <LoadingPanel title="요약 정보를 불러오는 중" description="학생 진단과 전략을 정리하고 있어요." /> : null}
        {error ? <StatusBox tone="error" title="요약 정보를 불러오지 못했어요" description={error} /> : null}
      </section>

      {/* ── 핵심 수치 ── */}
      <section className="stats-grid">
        <StatCard
          label="우선 상담 학생"
          value={priorityStudent?.name ?? "-"}
          description={
            priorityStudent
              ? `목표 대학 격차 ${formatScore(priorityStudent.gapScore)}`
              : "지금 바로 볼 학생이 아직 없어요."
          }
        />
        <StatCard
          label="가장 많이 보이는 취약 유형"
          value={data?.weaknessDistribution?.[0]?.label ?? "-"}
          description="최근 진단 기준으로 집계했어요"
        />
        <StatCard
          label="최근 시험 평균"
          value={latestExamPoint ? formatScore(latestExamPoint.averageScore) : "-"}
          description={latestExamPoint ? `${latestExamPoint.name} 기준` : "최근 시험 데이터가 없어요"}
        />
      </section>

      {/* ── 우선 학생 + 전략 요약 ── */}
      <section className="two-grid">
        <ListCard
          title="📌 지금 먼저 볼 학생"
          items={
            priorityStudent
              ? [
                  `${priorityStudent.name} 학생을 먼저 확인해 주세요`,
                  `취약 유형: ${priorityStudent.weaknessTypes.map(toWeaknessLabel).join(", ") || "데이터 수집 중"}`,
                  `상담 우선도: ${priorityStudent.consultPriority}`,
                ]
              : []
          }
        />
        <ListCard
          title="📋 최근 전략 요약"
          items={data?.recentStrategies?.length ? data.recentStrategies.map((item) => item.summary) : []}
        />
      </section>

      {/* ── 취약 단원 + 학생 바로 보기 ── */}
      <section className="two-grid">
        <ListCard
          title="📚 보완이 필요한 단원"
          items={(data?.weakUnits ?? []).slice(0, 5).map(
            (unit) => `${unit.unitName} · 이해도 ${formatPercent(unit.mastery)}`,
          )}
        />
        <section className="table-card">
          <h2>학생 바로 보기</h2>
          {(data?.consultPriorityStudents ?? []).length === 0 && !loading ? (
            <StatusBox tone="empty" title="표시할 학생이 없어요" description="학생 데이터가 쌓이면 여기에 표시돼요." />
          ) : (
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
                  <tr
                    key={student.id}
                    onClick={() => navigate(`${studentBasePath}/${student.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td><strong>{student.name}</strong></td>
                    <td>{formatScore(student.gapScore)}</td>
                    <td>
                      <div className="pill-row" style={{ margin: 0 }}>
                        {student.weaknessTypes.length > 0
                          ? student.weaknessTypes.map((wt) => (
                              <span key={wt} className="pill" style={{ fontSize: 11, padding: "2px 8px" }}>
                                {toWeaknessLabel(wt)}
                              </span>
                            ))
                          : <span className="muted" style={{ fontSize: 12 }}>-</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </section>
    </div>
  );
}
