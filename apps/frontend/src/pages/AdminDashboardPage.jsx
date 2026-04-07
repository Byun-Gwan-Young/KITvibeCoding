// apps/frontend/src/pages/AdminDashboardPage.jsx
// 관리자 전용 대시보드 — 학원 운영 관점으로 정리

import { useAuth } from "../contexts/AuthContext.jsx";
import { useRouter } from "../router/hashRouter.js";
import { apiClient } from "../lib/apiClient.js";
import { formatScore, formatPercent, toWeaknessLabel } from "../lib/formatters.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { StatCard } from "../components/common/StatCard.jsx";
import { ListCard } from "../components/common/ListCard.jsx";
import { LoadingPanel } from "../components/common/LoadingPanel.jsx";
import { StatusBox } from "../components/common/StatusBox.jsx";

export function AdminDashboardPage() {
  const { session } = useAuth();
  const { navigate } = useRouter();

  const dashState = useAsyncData(
    () => apiClient.getInstructorDashboard(session.accessToken),
    [session.accessToken],
  );
  const examsState = useAsyncData(
    () => apiClient.getExams(session.accessToken),
    [session.accessToken],
  );
  const univState = useAsyncData(
    () => apiClient.getUniversities(session.accessToken),
    [session.accessToken],
  );

  const data = dashState.data;
  const exams = examsState.data?.exams ?? [];
  const univs = univState.data ?? [];
  const totalStudents = data?.consultPriorityStudents?.length ?? 0;
  const highPriority = (data?.consultPriorityStudents ?? []).filter((s) => s.consultPriority === "high").length;
  const latestExam = data?.examTrend?.length ? data.examTrend[data.examTrend.length - 1] : null;

  const isLoading = dashState.loading || examsState.loading || univState.loading;
  const hasError = dashState.error || examsState.error || univState.error;

  return (
    <div className="page-grid">
      {/* ── 히어로 ── */}
      <section className="hero-card">
        <div className="pill-row">
          <span className="pill">운영 현황</span>
          <span className="pill">학생 {totalStudents}명</span>
          <span className="pill">시험 {exams.length}건</span>
          <span className="pill">대학 정책 {univs.length}건</span>
        </div>
        <h1>학원 운영 현황</h1>
        <p className="muted" style={{ fontSize: 15, lineHeight: 1.7 }}>
          학생 현황, 시험 관리, 대학 정책을 한눈에 확인하고 바로 관리할 수 있어요.
        </p>
        {isLoading ? <LoadingPanel title="운영 정보를 불러오는 중" description="데이터를 정리하고 있어요." /> : null}
        {hasError ? <StatusBox tone="error" title="일부 정보를 불러오지 못했어요" description={dashState.error || examsState.error || univState.error} /> : null}
      </section>

      {/* ── 핵심 수치 ── */}
      <section className="stats-grid">
        <StatCard
          label="전체 학생 수"
          value={`${totalStudents}명`}
          description={highPriority > 0 ? `우선 상담 ${highPriority}명 포함` : "현재 등록된 학생 기준"}
        />
        <StatCard
          label="등록된 시험"
          value={`${exams.length}건`}
          description={exams.length > 0 ? `최근: ${exams[exams.length - 1]?.name ?? "-"}` : "아직 등록된 시험이 없어요"}
        />
        <StatCard
          label="대학 정책"
          value={`${univs.length}건`}
          description="목표 대학 반영 정책 수"
        />
        <StatCard
          label="최근 시험 평균"
          value={latestExam ? formatScore(latestExam.averageScore) : "-"}
          description={latestExam ? `${latestExam.name} 기준` : "시험 데이터 없음"}
        />
      </section>

      {/* ── 빠른 이동 ── */}
      <section className="three-grid">
        <button
          className="panel"
          type="button"
          onClick={() => navigate("/admin/students")}
          style={{ cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
        >
          <h2 style={{ fontSize: 16 }}>👥 학생 관리</h2>
          <p className="muted" style={{ fontSize: 13 }}>
            학생 목록 조회, 상세 진단, 결과 입력, 전략 재계산
          </p>
          {highPriority > 0 && (
            <div className="status-box info" style={{ marginTop: 10, padding: "8px 12px", fontSize: 13 }}>
              우선 상담이 필요한 학생이 <strong>{highPriority}명</strong> 있어요
            </div>
          )}
        </button>

        <button
          className="panel"
          type="button"
          onClick={() => navigate("/admin/exams")}
          style={{ cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
        >
          <h2 style={{ fontSize: 16 }}>📝 시험 관리</h2>
          <p className="muted" style={{ fontSize: 13 }}>
            시험 등록·수정, 문항 관리, 결과 확인
          </p>
          <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
            등록된 시험 <strong>{exams.length}</strong>건
          </div>
        </button>

        <button
          className="panel"
          type="button"
          onClick={() => navigate("/admin/universities")}
          style={{ cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
        >
          <h2 style={{ fontSize: 16 }}>🎓 대학 정책</h2>
          <p className="muted" style={{ fontSize: 13 }}>
            대학별 반영 비율, 필수 과목, 목표 점수 관리
          </p>
          <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
            등록된 정책 <strong>{univs.length}</strong>건
          </div>
        </button>
      </section>

      {/* ── 상담 우선 학생 + 취약 유형 ── */}
      <section className="two-grid">
        <section className="table-card">
          <h2>⚡ 상담 우선 학생</h2>
          {(data?.consultPriorityStudents ?? []).length === 0 && !dashState.loading ? (
            <StatusBox tone="empty" title="표시할 학생이 없어요" description="학생 데이터가 쌓이면 여기에 표시돼요." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>학생</th>
                  <th>격차</th>
                  <th>취약 유형</th>
                  <th>우선도</th>
                </tr>
              </thead>
              <tbody>
                {(data?.consultPriorityStudents ?? []).map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => navigate(`/admin/students/${student.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td><strong>{student.name}</strong></td>
                    <td>{formatScore(student.gapScore)}</td>
                    <td>
                      <div className="pill-row" style={{ margin: 0 }}>
                        {student.weaknessTypes.length > 0
                          ? student.weaknessTypes.slice(0, 2).map((wt) => (
                              <span key={wt} className="pill" style={{ fontSize: 11, padding: "2px 8px" }}>
                                {toWeaknessLabel(wt)}
                              </span>
                            ))
                          : <span className="muted" style={{ fontSize: 12 }}>-</span>}
                      </div>
                    </td>
                    <td>
                      <span className="pill" style={{
                        fontSize: 11, padding: "2px 8px",
                        background: student.consultPriority === "high" ? "rgba(220,38,38,0.08)" : "rgba(245,158,11,0.08)",
                        color: student.consultPriority === "high" ? "var(--danger)" : "var(--warning)",
                        border: `1px solid ${student.consultPriority === "high" ? "rgba(220,38,38,0.18)" : "rgba(245,158,11,0.18)"}`,
                      }}>
                        {student.consultPriority === "high" ? "먼저 보기" : "곧 보기"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <ListCard
          title="📊 취약 유형 분포"
          items={
            (data?.weaknessDistribution ?? []).length > 0
              ? data.weaknessDistribution.map(
                  (item) => `${item.label} — ${item.count}명 (${formatPercent(item.ratio)})`,
                )
              : []
          }
        />
      </section>
    </div>
  );
}
