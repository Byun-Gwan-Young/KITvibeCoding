// apps/frontend/src/pages/StudentDashboardPage.jsx
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiClient } from "../lib/apiClient.js";
import { formatPercent, formatScore, toSubjectLabel, toWeaknessLabel } from "../lib/formatters.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { ListCard } from "../components/common/ListCard.jsx";
import { LoadingPanel } from "../components/common/LoadingPanel.jsx";
import { StatCard } from "../components/common/StatCard.jsx";
import { StatusBox } from "../components/common/StatusBox.jsx";
import { FirstVisitHint } from "../components/feedback/FirstVisitHint.jsx";

export function StudentDashboardPage() {
  const { session } = useAuth();
  const { data, error, loading } = useAsyncData(
    () => apiClient.getStudentDashboard(session.accessToken),
    [session.accessToken],
  );

  const timeAllocation = (data?.strategy?.timeAllocation ?? []).map(
    (item) =>
      `${toSubjectLabel(String(item.subject_code ?? item.subjectCode ?? "-"))} ${formatPercent(
        item.ratio_percent ?? item.ratioPercent,
      )}`,
  );

  const gapInfo = data?.targetGap;
  const hasGap = gapInfo && (gapInfo.gap !== null && gapInfo.gap !== undefined);

  return (
    <div className="page-grid">
      {/* ── 히어로: 핵심 결론 먼저 ── */}
      <section className="hero-card">
        <FirstVisitHint id="student-welcome" title="나의 학습 전략 화면이에요" description="AI가 분석한 진단 결과와 맞춤 전략을 확인할 수 있어요. 목표 대학 기준으로 지금 집중해야 할 과목과 단원을 안내해 드려요." />
        <div className="pill-row">
          <span className="pill">AI 진단</span>
          <span className="pill">맞춤 전략</span>
          {gapInfo?.university_name && <span className="pill">{gapInfo.university_name}</span>}
        </div>
        <h1>{data?.student?.name ?? session.user.name}님, 지금 해야 할 공부</h1>
        <p className="muted" style={{ fontSize: 15, lineHeight: 1.7 }}>
          {hasGap
            ? `${gapInfo.university_name ?? "목표 대학"} 기준 현재 환산 점수는 ${formatScore(gapInfo.weighted_score)}이고, 목표까지 ${formatScore(gapInfo.gap)} 차이가 있어요.`
            : "현재 위치를 분석하고 있어요."}
        </p>
        {loading ? <LoadingPanel title="학습 전략을 불러오는 중" description="진단 결과와 맞춤 전략을 정리하고 있어요." /> : null}
        {error ? <StatusBox tone="error" title="화면을 불러오지 못했어요" description={error} /> : null}
      </section>

      {/* ── 핵심 수치 3개 ── */}
      <section className="stats-grid">
        <StatCard
          label="현재 진단 결과"
          value={data?.diagnosis?.primaryWeaknessType ? toWeaknessLabel(data.diagnosis.primaryWeaknessType) : "진단 대기"}
          description="최근 시험과 단원 이해도를 바탕으로 분석했어요"
        />
        <StatCard
          label="지금 집중할 과목"
          value={
            (data?.strategy?.prioritySubjects ?? [])
              .slice(0, 2)
              .map((item) => toSubjectLabel(String(item.subject_code ?? item.subjectCode ?? "-")))
              .join(" · ") || "-"
          }
          description="목표 대학 반영 비율과 최근 흐름을 함께 고려했어요"
        />
        <StatCard
          label="이번 주 시간 배분"
          value={timeAllocation[0] ?? "-"}
          description="공부 시간을 어디에 먼저 쓰면 좋을지 안내해요"
        />
      </section>

      {/* ── 전략 요약 + 신뢰도 ── */}
      <section className="two-grid">
        <ListCard
          title="📋 나의 학습 전략"
          items={data?.strategy?.studentSummary ? [data.strategy.studentSummary] : []}
        />
        <ListCard
          title="📊 전략 신뢰도"
          items={
            data?.strategy?.confidenceLevel
              ? [`신뢰도: ${data.strategy.confidenceLevel}`, data.strategy.confidenceMessage]
              : []
          }
        />
      </section>

      {/* ── 근거 + 보완 단원 ── */}
      <section className="two-grid">
        <ListCard
          title="💡 왜 이런 전략을 제안할까요?"
          items={(data?.diagnosis?.evidence ?? []).map((item) => String(item.reason ?? "근거를 확인하고 있어요"))}
        />
        <ListCard
          title="📚 먼저 보완할 단원"
          items={(data?.strategy?.priorityUnits ?? []).map(
            (item) => String(item.unit_name ?? item.unitName ?? "-"),
          )}
        />
      </section>

      {/* ── 시간 배분 + 피해야 할 패턴 ── */}
      <section className="two-grid">
        <ListCard title="⏰ 추천 시간 배분" items={timeAllocation} />
        <ListCard
          title="⚠️ 피하면 좋은 공부 방식"
          items={data?.strategy?.antiPatterns ?? []}
        />
      </section>
    </div>
  );
}
