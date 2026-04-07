// apps/frontend/src/pages/ExamManagementPage.jsx
// 시험 관리 — 탭 분리: 시험 목록 / 시험 등록·수정 / 문항 관리

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiClient } from "../lib/apiClient.js";
import { formatDate, formatScore } from "../lib/formatters.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { LoadingPanel } from "../components/common/LoadingPanel.jsx";
import { StatusBox } from "../components/common/StatusBox.jsx";
import { StatCard } from "../components/common/StatCard.jsx";
import { Tabs } from "../components/common/Tabs.jsx";

function createEmptyQuestionForm(examId = "") {
  return { exam_id: examId, number: "", difficulty: 3, points: 4, question_type: "객관식", estimated_seconds: 90, unit_id: "", weight: 1 };
}

export function ExamManagementPage() {
  const { session } = useAuth();
  const [examForm, setExamForm] = useState({ academy_id: 1, subject_id: 1, name: "", exam_date: "", total_score: 100 });
  const [selectedExamId, setSelectedExamId] = useState("");
  const [examMessage, setExamMessage] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const [editingExam, setEditingExam] = useState(false);
  const [questionForm, setQuestionForm] = useState(createEmptyQuestionForm());

  const examsState = useAsyncData(() => apiClient.getExams(session.accessToken), [session.accessToken]);
  const examCatalogState = useAsyncData(() => apiClient.getExamCatalog(session.accessToken), [session.accessToken]);
  const metadataState = useAsyncData(() => apiClient.getMetadata(session.accessToken), [session.accessToken]);
  const unitsState = useAsyncData(
    () => (examForm.subject_id ? apiClient.getSubjectUnits(session.accessToken, Number(examForm.subject_id)) : Promise.resolve([])),
    [session.accessToken, examForm.subject_id],
  );
  const questionsState = useAsyncData(
    () => (selectedExamId ? apiClient.getExamQuestions(session.accessToken, Number(selectedExamId)) : Promise.resolve([])),
    [session.accessToken, selectedExamId],
  );

  const exams = examsState.data?.exams ?? [];
  const examCatalog = examCatalogState.data ?? [];
  const selectedExamRecord = useMemo(() => examCatalog.find((e) => String(e.id) === String(selectedExamId)), [examCatalog, selectedExamId]);

  useEffect(() => {
    if (!selectedExamId && exams.length > 0) {
      const firstId = String(exams[0].id).replace(/^e/, "");
      setSelectedExamId(firstId);
      setQuestionForm(createEmptyQuestionForm(firstId));
    }
  }, [exams, selectedExamId]);

  function syncExamForm() {
    if (!selectedExamRecord) return;
    setExamForm({ academy_id: selectedExamRecord.academy_id, subject_id: selectedExamRecord.subject_id, name: selectedExamRecord.name, exam_date: selectedExamRecord.exam_date, total_score: selectedExamRecord.total_score });
  }

  async function handleCreateExam(event) {
    event.preventDefault(); setExamMessage("");
    try {
      await apiClient.createExam(session.accessToken, { academy_id: Number(examForm.academy_id), subject_id: Number(examForm.subject_id), name: examForm.name.trim(), exam_date: examForm.exam_date, total_score: Number(examForm.total_score) });
      setExamMessage("시험을 등록했어요.");
      setExamForm((p) => ({ ...p, name: "", exam_date: "", total_score: 100 }));
      examsState.reload(); examCatalogState.reload();
    } catch (e) { setExamMessage(e instanceof Error ? e.message : "시험 등록에 실패했어요."); }
  }

  async function handleUpdateExam() {
    if (!selectedExamId) return; setExamMessage("");
    try {
      await apiClient.updateExam(session.accessToken, Number(selectedExamId), { name: examForm.name.trim(), exam_date: examForm.exam_date, total_score: Number(examForm.total_score) });
      setExamMessage("시험 정보를 수정했어요."); setEditingExam(false);
      examsState.reload(); examCatalogState.reload();
    } catch (e) { setExamMessage(e instanceof Error ? e.message : "시험 수정에 실패했어요."); }
  }

  async function handleCreateQuestion(event) {
    event.preventDefault(); setQuestionMessage("");
    try {
      await apiClient.createQuestion(session.accessToken, {
        exam_id: Number(questionForm.exam_id), number: Number(questionForm.number), difficulty: Number(questionForm.difficulty),
        points: Number(questionForm.points), question_type: questionForm.question_type, estimated_seconds: Number(questionForm.estimated_seconds),
        unit_mappings: questionForm.unit_id ? [{ unit_id: Number(questionForm.unit_id), weight: Number(questionForm.weight) }] : [],
      });
      setQuestionMessage("문항을 등록했어요.");
      setQuestionForm(createEmptyQuestionForm(selectedExamId));
      questionsState.reload(); examsState.reload(); examCatalogState.reload();
    } catch (e) { setQuestionMessage(e instanceof Error ? e.message : "문항 등록에 실패했어요."); }
  }

  const availableUnits = unitsState.data ?? [];
  const canSubmitExam = examForm.name.trim() && examForm.exam_date && Number(examForm.total_score) > 0;
  const canSubmitQuestion = selectedExamId && questionForm.number && questionForm.points && questionForm.question_type;
  const questionCount = questionsState.data?.length ?? 0;

  // ── 탭 1: 시험 목록 ──
  const examListTab = (
    <div className="page-grid" style={{ marginTop: 16 }}>
      <section className="stats-grid">
        <StatCard label="등록된 시험" value={`${exams.length}건`} description="전체 시험 수" />
        <StatCard label="최근 시험" value={exams.length > 0 ? exams[exams.length - 1]?.name : "-"} description={exams.length > 0 ? formatDate(exams[exams.length - 1]?.date) : "아직 없어요"} />
        <StatCard label="선택한 시험 문항" value={`${questionCount}개`} description={selectedExamRecord?.name ?? "시험을 선택하세요"} />
      </section>
      <section className="table-card">
        <h2>📋 시험 목록</h2>
        {exams.length === 0 && !examsState.loading ? (
          <StatusBox tone="empty" title="등록된 시험이 없어요" description="'시험 등록' 탭에서 새 시험을 등록해 주세요." />
        ) : (
          <table>
            <thead><tr><th>시험 이름</th><th>시험일</th><th>과목</th><th>문항 수</th><th>응시 인원</th><th>평균 점수</th></tr></thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} onClick={() => { setSelectedExamId(String(exam.id).replace(/^e/, "")); setQuestionForm(createEmptyQuestionForm(String(exam.id).replace(/^e/, ""))); }} style={{ cursor: "pointer", background: String(exam.id).replace(/^e/, "") === selectedExamId ? "rgba(124,58,237,0.06)" : undefined }}>
                  <td><strong>{exam.name}</strong></td>
                  <td>{formatDate(exam.date)}</td>
                  <td>{exam.subject}</td>
                  <td>{exam.questionCount}</td>
                  <td>{exam.participantCount}</td>
                  <td>{formatScore(exam.avgScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );

  // ── 탭 2: 시험 등록·수정 ──
  const examFormTab = (
    <div className="page-grid" style={{ marginTop: 16 }}>
      <section className="two-grid">
        <section className="panel">
          <h2>➕ 새 시험 등록</h2>
          <form className="form-stack" onSubmit={handleCreateExam}>
            <div className="form-grid">
              <label className="field">
                <span>학원</span>
                <select value={examForm.academy_id} onChange={(e) => setExamForm((p) => ({ ...p, academy_id: Number(e.target.value) }))}>
                  {(metadataState.data?.academies ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>과목</span>
                <select value={examForm.subject_id} onChange={(e) => { setExamForm((p) => ({ ...p, subject_id: Number(e.target.value) })); setQuestionForm((p) => ({ ...p, unit_id: "" })); }}>
                  {(metadataState.data?.subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="field"><span>시험 이름</span><input value={examForm.name} onChange={(e) => setExamForm((p) => ({ ...p, name: e.target.value }))} placeholder="예: 6월 모의고사" /></label>
              <label className="field"><span>시험일</span><input type="date" value={examForm.exam_date} onChange={(e) => setExamForm((p) => ({ ...p, exam_date: e.target.value }))} /></label>
              <label className="field"><span>총점</span><input type="number" value={examForm.total_score} onChange={(e) => setExamForm((p) => ({ ...p, total_score: Number(e.target.value) }))} /></label>
            </div>
            <button className="primary-button" type="submit" disabled={!canSubmitExam}>시험 등록</button>
          </form>
          {examMessage ? <StatusBox tone={examMessage.includes("실패") ? "error" : "info"} title="시험 작업 결과" description={examMessage} /> : null}
        </section>

        <section className="panel">
          <div className="section-header">
            <h2>✏️ 선택한 시험 수정</h2>
            <div className="toolbar">
              <select value={selectedExamId} onChange={(e) => { setSelectedExamId(e.target.value); setQuestionForm(createEmptyQuestionForm(e.target.value)); }}>
                {exams.map((exam) => <option key={exam.id} value={String(exam.id).replace(/^e/, "")}>{exam.name}</option>)}
              </select>
              <button className="ghost-button" type="button" onClick={() => { syncExamForm(); setEditingExam(true); }} style={{ fontSize: 13 }}>불러오기</button>
            </div>
          </div>
          {selectedExamRecord ? (
            <>
              <div className="status-box info" style={{ marginBottom: 14 }}>
                <strong>{selectedExamRecord.name}</strong>
                <div>{formatDate(selectedExamRecord.exam_date)} · 총점 {formatScore(selectedExamRecord.total_score)}</div>
              </div>
              {editingExam ? (
                <div className="form-stack">
                  <div className="form-grid">
                    <label className="field"><span>시험 이름</span><input value={examForm.name} onChange={(e) => setExamForm((p) => ({ ...p, name: e.target.value }))} /></label>
                    <label className="field"><span>시험일</span><input type="date" value={examForm.exam_date} onChange={(e) => setExamForm((p) => ({ ...p, exam_date: e.target.value }))} /></label>
                    <label className="field"><span>총점</span><input type="number" value={examForm.total_score} onChange={(e) => setExamForm((p) => ({ ...p, total_score: Number(e.target.value) }))} /></label>
                  </div>
                  <div className="toolbar">
                    <button className="primary-button" type="button" onClick={handleUpdateExam}>수정 저장</button>
                    <button className="ghost-button" type="button" onClick={() => setEditingExam(false)}>취소</button>
                  </div>
                </div>
              ) : (
                <p className="muted">'불러오기'를 누르면 시험 이름, 시험일, 총점을 수정할 수 있어요.</p>
              )}
            </>
          ) : (
            <StatusBox tone="empty" title="선택한 시험이 없어요" description="먼저 시험을 등록하거나 왼쪽에서 시험을 선택해 주세요." />
          )}
        </section>
      </section>
    </div>
  );

  // ── 탭 3: 문항 관리 ──
  const questionTab = (
    <div className="page-grid" style={{ marginTop: 16 }}>
      {!selectedExamId ? (
        <StatusBox tone="empty" title="시험을 먼저 선택해 주세요" description="'시험 목록' 탭에서 시험을 클릭하면 해당 시험의 문항을 관리할 수 있어요." />
      ) : (
        <section className="two-grid">
          <section className="panel">
            <h2>➕ 문항 등록</h2>
            <p className="muted" style={{ marginBottom: 12 }}>
              <strong>{selectedExamRecord?.name ?? "선택한 시험"}</strong>에 문항을 추가해요.
            </p>
            <form className="form-stack" onSubmit={handleCreateQuestion}>
              <div className="form-grid">
                <label className="field"><span>문항 번호</span><input type="number" value={questionForm.number} onChange={(e) => setQuestionForm((p) => ({ ...p, number: e.target.value }))} placeholder="1" /></label>
                <label className="field">
                  <span>난도</span>
                  <select value={questionForm.difficulty} onChange={(e) => setQuestionForm((p) => ({ ...p, difficulty: Number(e.target.value) }))}>
                    {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
                <label className="field"><span>배점</span><input type="number" value={questionForm.points} onChange={(e) => setQuestionForm((p) => ({ ...p, points: Number(e.target.value) }))} /></label>
                <label className="field"><span>유형</span><input value={questionForm.question_type} onChange={(e) => setQuestionForm((p) => ({ ...p, question_type: e.target.value }))} /></label>
                <label className="field"><span>예상 풀이 시간(초)</span><input type="number" value={questionForm.estimated_seconds} onChange={(e) => setQuestionForm((p) => ({ ...p, estimated_seconds: Number(e.target.value) }))} /></label>
                <label className="field">
                  <span>연결 단원</span>
                  <select value={questionForm.unit_id} onChange={(e) => setQuestionForm((p) => ({ ...p, unit_id: e.target.value }))}>
                    <option value="">선택 안 함</option>
                    {availableUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </label>
              </div>
              <button className="primary-button" type="submit" disabled={!canSubmitQuestion}>문항 등록</button>
            </form>
            {questionMessage ? <StatusBox tone={questionMessage.includes("실패") ? "error" : "info"} title="문항 작업 결과" description={questionMessage} /> : null}
            {unitsState.error ? <StatusBox tone="error" title="단원 목록 오류" description={unitsState.error} /> : null}
          </section>

          <section className="table-card">
            <h2>📋 등록된 문항 ({questionCount}개)</h2>
            {questionsState.loading ? <LoadingPanel title="문항을 불러오는 중" /> : null}
            {questionsState.error ? <StatusBox tone="error" title="문항 목록 오류" description={questionsState.error} /> : null}
            {questionCount === 0 && !questionsState.loading ? (
              <StatusBox tone="empty" title="등록된 문항이 없어요" description="왼쪽에서 문항을 등록하면 여기에 표시돼요." />
            ) : (
              <table>
                <thead><tr><th>번호</th><th>유형</th><th>난도</th><th>배점</th><th>연결 단원</th></tr></thead>
                <tbody>
                  {(questionsState.data ?? []).map((q) => (
                    <tr key={q.id}>
                      <td><strong>{q.number}번</strong></td>
                      <td>{q.question_type}</td>
                      <td>{q.difficulty}</td>
                      <td>{formatScore(q.points)}</td>
                      <td>{q.unit_mappings?.map((m) => m.unit_id).join(", ") || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </section>
      )}
    </div>
  );

  return (
    <div className="page-grid">
      <section className="hero-card">
        <h1>시험 관리</h1>
        <p className="muted" style={{ fontSize: 15 }}>시험 등록, 수정, 문항 관리를 탭별로 나눠서 정리했어요.</p>
        {(examsState.loading || metadataState.loading || examCatalogState.loading) ? (
          <LoadingPanel title="시험 정보를 불러오는 중" description="시험 목록과 설정을 정리하고 있어요." />
        ) : null}
        {examsState.error ? <StatusBox tone="error" title="시험 목록 오류" description={examsState.error} /> : null}
        {metadataState.error ? <StatusBox tone="error" title="기본 설정 오류" description={metadataState.error} /> : null}
      </section>

      {!examsState.loading && !metadataState.loading && (
        <Tabs
          defaultTab="list"
          tabs={[
            { key: "list", label: "시험 목록", badge: exams.length || undefined, content: examListTab },
            { key: "create", label: "시험 등록·수정", content: examFormTab },
            { key: "questions", label: "문항 관리", badge: questionCount || undefined, content: questionTab },
          ]}
        />
      )}
    </div>
  );
}
