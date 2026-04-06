import { useAuth } from "../contexts/AuthContext.jsx";
import { useAppState } from "../contexts/AppStateContext.jsx";
import { apiClient } from "../lib/apiClient.js";
import { formatPercent, formatScore, toSubjectLabel, toWeaknessLabel } from "../lib/formatters.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { ListCard } from "../components/common/ListCard.jsx";
import { LoadingPanel } from "../components/common/LoadingPanel.jsx";
import { StatCard } from "../components/common/StatCard.jsx";
import { StatusBox } from "../components/common/StatusBox.jsx";

export function StudentDetailPage({ studentId }) {
  const { session } = useAuth();
  const { openPage } = useAppState();
  const { data, error, loading } = useAsyncData(
    () => apiClient.getStudentDetail(session.accessToken, studentId),
    [session.accessToken, studentId],
  );

  return (
    <div className="page-grid">
      <section className="hero-card">
        <button className="ghost-button" type="button" onClick={() => openPage("students")} style={{ marginBottom: 12 }}>
          학생 목록으로 돌아가기
        </button>
        <h1>{data?.student?.name ?? "학생"} 상세</h1>
        <p className="muted">
          {data ? `${data.targetGap.university_name ?? "목표 대학"} 기준 격차는 ${formatScore(data.targetGap.gap)}야.` : "학생 상세 정보를 불러오고 있어."}
        </p>
        {loading ? <LoadingPanel title="불러오는 중" description="학생 상세 정보를 정리하고 있어." /> : null}
        {error ? <StatusBox tone="error" title="불러오기 실패" description={error} /> : null}
      </section>

      <section className="stats-grid">
        <StatCard label="주요 진단" value={data?.diagnosis?.primaryWeaknessType ? toWeaknessLabel(data.diagnosis.primaryWeaknessType) : "-"} description="현재 가장 우선으로 보는 진단 유형" />
        <StatCard label="목표 대학 격차" value={formatScore(data?.targetGap?.gap)} description="목표 대학 환산 점수 기준 차이" />
        <StatCard label="최근 총점" value={formatScore(data?.student?.recentExams?.[data.student.recentExams.length - 1]?.totalScore)} description="최근 시험 기준" />
      </section>

      <section className="two-grid">
        <ListCard title="진단 근거" items={(data?.diagnosis?.evidence ?? []).map((item) => String(item.reason ?? "근거 확인 필요"))} />
        <ListCard title="학습 전략 요약" items={data?.strategy?.summary ? [data.strategy.summary] : []} />
      </section>

      <section className="two-grid">
        <ListCard title="과목별 현재 위치" items={(data?.subjects ?? []).map((subject) => `${subject.subjectName} · 현재 ${formatScore(subject.currentScore)} · 목표 ${formatScore(subject.targetScore)}`)} />
        <ListCard title="취약 단원" items={(data?.weakUnits ?? []).map((unit) => `${toSubjectLabel(unit.subjectCode)} · ${unit.unitName} · 이해도 ${formatPercent(unit.mastery)}`)} />
      </section>

      <section className="two-grid">
        <ListCard title="상담 포인트" items={data?.strategy?.coachingPoints ?? []} />
        <ListCard title="피해야 할 공부 방식" items={data?.strategy?.antiPatterns ?? []} />
      </section>
    </div>
  );
}
