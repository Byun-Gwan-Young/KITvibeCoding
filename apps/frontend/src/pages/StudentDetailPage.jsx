// apps/frontend/src/pages/StudentDetailPage.jsx
// 학생 상세 화면 — 탭 분리: 진단 요약 / 결과 입력 / 시험 이력

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useRouter } from "../router/hashRouter.js";
import { apiClient } from "../lib/apiClient.js";
import { formatPercent, formatScore, toSubjectLabel, toWeaknessLabel } from "../lib/formatters.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { ListCard } from "../components/common/ListCard.jsx";
import { LoadingPanel } from "../components/common/LoadingPanel.jsx";
import { StatCard } from "../components/common/StatCard.jsx";
import { StatusBox } from "../components/common/StatusBox.jsx";
import { Tabs } from "../components/common/Tabs.jsx";

function createEmptyResultForm() {
  return { exam_id: "", raw_score: "", percentile: "", grade: "", completed_in_seconds: "" };
}

export function StudentDetailPage({ studentId }) {
  const { session } = useAuth();
  const { pathname, navigate } = useRouter();
  const backPath = pathname.startsWith("/admin") ? "/admin/students" : "/teacher/students";
  const [resultForm, setResultForm] = useState(createEmptyResultForm());
  const [questionResults, setQuestionResults] = useState({});
  const [resultMessage, setResultMessage] = useState("");
  const [recalculateMessage, setRecalculateMessage] = useState("");

  const detailState = useAsyncData(() => apiClient.getStudentDetail(session.accessToken, studentId), [session.accessToken, studentId]);
  const numericStudentId = Number(String(studentId).replace(/^st/, ""));
  const resultsState = useAsyncData(() => apiClient.getStudentResults(session.accessToken, numericStudentId), [session.accessToken, studentId]);
  const examsState = useAsyncData(() => apiClient.getExams(session.accessToken), [session.accessToken]);
  const questionState = useAsyncData(
    () => (resultForm.exam_id ? apiClient.getExamQuestions(session.accessToken, Number(resultForm.exam_id)) : Promise.resolve([])),
    [session.accessToken, resultForm.exam_id],
  );

  const selectedSavedResult = useMemo(
    () => (resultsState.data ?? []).find((r) => String(r.exam_id) === String(resultForm.exam_id)),
    [resultsState.data, resultForm.exam_id],
  );

  useEffect(() => {
    if (!selectedSavedResult) {
      setResultForm((p) => ({ ...p, percentile: "", grade: "", completed_in_seconds: "" }));
      return;
    }
    setResultForm((p) => ({
      ...p,
      raw_score: String(selectedSavedResult.raw_score ?? ""),
      percentile: selectedSavedResult.percentile != null ? String(selectedSavedResult.percentile) : "",
      grade: selectedSavedResult.grade != null ? String(selectedSavedResult.grade) : "",
      completed_in_seconds: selectedSavedResult.completed_in_seconds != null ? String(selectedSavedResult.completed_in_seconds) : "",
    }));
  }, [selectedSavedResult]);

  useEffect(() => {
    const questions = questionState.data ?? [];
    if (!questions.length) { setQuestionResults({}); return; }
    const saved = selectedSavedResult?.question_breakdown ?? {};
    setQuestionResults(
      Object.fromEntries(questions.map((q) => {
        const s = saved[String(q.id)] ?? {};
        return [q.id, { is_correct: Boolean(s.is_correct), points: q.points, estimated_seconds: s.estimated_seconds ?? q.estimated_seconds }];
      })),
    );
  }, [questionState.data, selectedSavedResult]);

  const latestExamLabel = useMemo(() => {
    const recent = detailState.data?.student?.recentExams ?? [];
    return recent.length ? recent[recent.length - 1].name : "-";
  }, [detailState.data]);

  const calculatedRawScore = useMemo(() => {
    const questions = questionState.data ?? [];
    if (!questions.length) return Number(resultForm.raw_score || 0);
    return questions.reduce((t, q) => t + (questionResults[q.id]?.is_correct ? Number(q.points) : 0), 0);
  }, [questionResults, questionState.data, resultForm.raw_score]);

  async function handleSaveResult(event) {
    event.preventDefault();
    setResultMessage("");
    try {
      await apiClient.saveStudentResult(session.accessToken, {
        student_profile_id: numericStudentId,
        exam_id: Number(resultForm.exam_id),
        raw_score: calculatedRawScore,
        percentile: resultForm.percentile ? Number(resultForm.percentile) : null,
        grade: resultForm.grade ? Number(resultForm.grade) : null,
        completed_in_seconds: resultForm.completed_in_seconds ? Number(resultForm.completed_in_seconds) : null,
        question_breakdown: Object.fromEntries(Object.entries(questionResults).map(([k, v]) => [String(k), v])),
        result_metadata: { source: "frontend_manual", question_count: questionState.data?.length ?? 0 },
      });
      setResultMessage("결과를 저장하고 전략을 다시 계산했어요.");
      resultsState.reload();
      detailState.reload();
    } catch (e) {
      setResultMessage(e instanceof Error ? e.message : "결과 저장에 실패했어요.");
    }
  }

  async function handleRecalculate() {
    setRecalculateMessage("");
    try {
      await apiClient.recalculateStudent(session.accessToken, numericStudentId);
      setRecalculateMessage("진단과 학습 전략을 다시 계산했어요.");
      detailState.reload();
    } catch (e) {
      setRecalculateMessage(e instanceof Error ? e.message : "재계산에 실패했어요.");
    }
  }

  const resultSubmitEnabled = resultForm.exam_id && (questionState.data?.length ? true : resultForm.raw_score !== "");

  // ── 탭 정의 ──
  const diagnosisTab = (
    <div className="page-grid" style={{ marginTop: 16 }}>
      <section className="stats-grid">
        <StatCard
          label="주요 진단"
          value={detailState.data?.diagnosis?.primaryWeaknessType ? toWeaknessLabel(detailState.data.diagnosis.primaryWeaknessType) : "-"}
          description="가장 먼저 확인해야 할 취약 유형"
        />
        <StatCard label="목표 대학 격차" value={formatScore(detailState.data?.targetGap?.gap)} description="목표 대학 환산 점수 기준" />
        <StatCard label="최근 시험" value={latestExamLabel} description="가장 최근에 반영된 시험" />
      </section>

      <section className="two-grid">
        <ListCard
          title="📋 학습 전략 요약"
          items={
            detailState.data?.strategy?.studentSummary ? [detailState.data.strategy.studentSummary]
              : detailState.data?.strategy?.summary ? [detailState.data.strategy.summary]
              : []
          }
        />
        <ListCard
          title="💬 강사용 상담 포인트"
          items={
            detailState.data?.strategy?.instructorSummary
              ? [detailState.data.strategy.instructorSummary, ...(detailState.data?.strategy?.coachingPoints ?? [])]
              : detailState.data?.strategy?.coachingPoints ?? []
          }
        />
      </section>

      <section className="two-grid">
        <ListCard
          title="📊 과목별 현재 위치"
          items={(detailState.data?.subjects ?? []).map(
            (s) => `${s.subjectName} · 현재 ${formatScore(s.currentScore)} · 목표 ${formatScore(s.targetScore)}`,
          )}
        />
        <ListCard
          title="📚 보완이 필요한 단원"
          items={(detailState.data?.weakUnits ?? []).map(
            (u) => `${toSubjectLabel(u.subjectCode)} · ${u.unitName} · 이해도 ${formatPercent(u.mastery)}`,
          )}
        />
      </section>
    </div>
  );

  const resultEntryTab = (
    <div className="page-grid" style={{ marginTop: 16 }}>
      <section className="two-grid">
        <section className="panel">
          <div className="section-header">
            <h2>📝 시험 결과 입력</h2>
            <button className="ghost-button" type="button" onClick={handleRecalculate} style={{ fontSize: 13 }}>
              전략 다시 계산
            </button>
          </div>
          <p className="muted" style={{ marginBottom: 16 }}>
            시험을 고르면 기존 저장값을 먼저 불러와요. 문항별 정오답을 체크하면 점수가 자동으로 계산돼요.
          </p>
          <form className="form-stack" onSubmit={handleSaveResult}>
            <div className="form-grid">
              <label className="field">
                <span>시험 선택</span>
                <select value={resultForm.exam_id} onChange={(e) => setResultForm((p) => ({ ...p, exam_id: e.target.value }))}>
                  <option value="">시험을 선택하세요</option>
                  {(examsState.data?.exams ?? []).map((exam) => (
                    <option key={exam.id} value={String(exam.id).replace(/^e/, "")}>{exam.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>자동 계산 점수</span>
                <input type="number" value={calculatedRawScore} readOnly style={{ fontWeight: 700 }} />
              </label>
              <label className="field">
                <span>백분위</span>
                <input type="number" value={resultForm.percentile} onChange={(e) => setResultForm((p) => ({ ...p, percentile: e.target.value }))} placeholder="선택" />
              </label>
              <label className="field">
                <span>등급</span>
                <input type="number" value={resultForm.grade} onChange={(e) => setResultForm((p) => ({ ...p, grade: e.target.value }))} placeholder="선택" />
              </label>
              <label className="field">
                <span>풀이 시간(초)</span>
                <input type="number" value={resultForm.completed_in_seconds} onChange={(e) => setResultForm((p) => ({ ...p, completed_in_seconds: e.target.value }))} placeholder="선택" />
              </label>
            </div>

            {questionState.loading ? <LoadingPanel title="문항 정보를 불러오는 중" /> : null}
            {questionState.error ? <StatusBox tone="error" title="문항 정보 오류" description={questionState.error} /> : null}

            {questionState.data?.length ? (
              <div className="question-grid">
                {questionState.data.map((q) => {
                  const current = questionResults[q.id] ?? { is_correct: false };
                  return (
                    <div className="question-card" key={q.id}>
                      <div className="question-card-header">
                        <strong>{q.number}번</strong>
                        <span className="muted">{q.question_type}</span>
                      </div>
                      <div className="question-card-meta">
                        <span>배점 {formatScore(q.points)}</span>
                        <span>난도 {q.difficulty}</span>
                        <span>{q.estimated_seconds}초</span>
                      </div>
                      <div className="toolbar">
                        <button className={`nav-button ${current.is_correct ? "active" : ""}`} type="button"
                          onClick={() => setQuestionResults((p) => ({ ...p, [q.id]: { is_correct: true, points: q.points, estimated_seconds: q.estimated_seconds } }))}>
                          ✓ 정답
                        </button>
                        <button className={`nav-button ${current.is_correct === false ? "active" : ""}`} type="button"
                          onClick={() => setQuestionResults((p) => ({ ...p, [q.id]: { is_correct: false, points: q.points, estimated_seconds: q.estimated_seconds } }))}>
                          ✗ 오답
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : resultForm.exam_id ? (
              <StatusBox tone="empty" title="등록된 문항이 없어요" description="시험 관리에서 먼저 문항을 등록해 주세요." />
            ) : null}

            <button className="primary-button" type="submit" disabled={!resultSubmitEnabled}>결과 저장</button>
          </form>
          {resultMessage ? <StatusBox tone={resultMessage.includes("실패") ? "error" : "info"} title="저장 결과" description={resultMessage} /> : null}
          {recalculateMessage ? <StatusBox tone={recalculateMessage.includes("실패") ? "error" : "info"} title="재계산 결과" description={recalculateMessage} /> : null}
        </section>

        <section className="table-card">
          <h2>저장된 시험 결과</h2>
          {resultsState.loading ? <LoadingPanel title="시험 결과를 불러오는 중" /> : null}
          {resultsState.error ? <StatusBox tone="error" title="시험 결과 오류" description={resultsState.error} /> : null}
          {(resultsState.data ?? []).length === 0 && !resultsState.loading ? (
            <StatusBox tone="empty" title="아직 저장된 결과가 없어요" description="위에서 시험 결과를 입력하면 여기에 표시돼요." />
          ) : (
            <table>
              <thead><tr><th>시험</th><th>과목</th><th>원점수</th><th>백분위</th><th>등급</th></tr></thead>
              <tbody>
                {(resultsState.data ?? []).map((r) => (
                  <tr key={r.id}>
                    <td>{r.exam_name}</td><td>{r.subject_name}</td>
                    <td><strong>{formatScore(r.raw_score)}</strong></td>
                    <td>{formatPercent(r.percentile)}</td><td>{r.grade ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </section>
    </div>
  );

  const savedResultCount = (resultsState.data ?? []).length;

  return (
    <div className="page-grid">
      {/* ── 히어로 ── */}
      <section className="hero-card">
        <button className="ghost-button" type="button" onClick={() => navigate(backPath)} style={{ marginBottom: 12 }}>
          ← 학생 목록으로
        </button>
        <h1>{detailState.data?.student?.name ?? "학생"} 학생 상세</h1>
        <p className="muted" style={{ fontSize: 15 }}>
          {detailState.data
            ? `${detailState.data.targetGap.university_name ?? "목표 대학"} 기준 격차는 ${formatScore(detailState.data.targetGap.gap)}이에요.`
            : "학생 정보를 분석하고 있어요."}
        </p>
        {detailState.loading ? <LoadingPanel title="학생 정보를 불러오는 중" description="진단과 전략을 정리하고 있어요." /> : null}
        {detailState.error ? <StatusBox tone="error" title="학생 정보를 불러오지 못했어요" description={detailState.error} /> : null}
      </section>

      {/* ── 탭 ── */}
      {!detailState.loading && !detailState.error && (
        <Tabs
          defaultTab="diagnosis"
          tabs={[
            { key: "diagnosis", label: "진단 요약", content: diagnosisTab },
            { key: "result-entry", label: "결과 입력", badge: savedResultCount || undefined, content: resultEntryTab },
          ]}
        />
      )}
    </div>
  );
}
