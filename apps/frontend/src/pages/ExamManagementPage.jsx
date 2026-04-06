import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiClient } from "../lib/apiClient.js";
import { formatDate, formatScore } from "../lib/formatters.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { LoadingPanel } from "../components/common/LoadingPanel.jsx";
import { StatusBox } from "../components/common/StatusBox.jsx";

export function ExamManagementPage() {
  const { session } = useAuth();
  const [form, setForm] = useState({
    academy_id: 1,
    subject_id: 1,
    name: "",
    exam_date: "",
    total_score: 100,
  });
  const [submitMessage, setSubmitMessage] = useState("");

  const examsState = useAsyncData(() => apiClient.getExams(session.accessToken), [session.accessToken]);
  const metadataState = useAsyncData(() => apiClient.getMetadata(session.accessToken), [session.accessToken]);

  const canSubmit = useMemo(() => form.name.trim() && form.exam_date && Number(form.total_score) > 0, [form]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitMessage("");
    try {
      const created = await apiClient.createExam(session.accessToken, {
        academy_id: Number(form.academy_id),
        subject_id: Number(form.subject_id),
        name: form.name.trim(),
        exam_date: form.exam_date,
        total_score: Number(form.total_score),
      });
      examsState.setData((previous) => ({ exams: [created, ...(previous?.exams ?? [])] }));
      setSubmitMessage("시험을 등록했어.");
      setForm((previous) => ({ ...previous, name: "", exam_date: "", total_score: 100 }));
    } catch (submitError) {
      setSubmitMessage(submitError instanceof Error ? submitError.message : "시험 등록에 실패했어.");
    }
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <h1>시험 관리</h1>
        <p className="muted">시험을 등록하고 최근 시험 흐름을 확인할 수 있어.</p>
        {examsState.loading || metadataState.loading ? <LoadingPanel title="불러오는 중" description="시험과 기본 정보를 정리하고 있어." /> : null}
        {examsState.error ? <StatusBox tone="error" title="시험 목록 오류" description={examsState.error} /> : null}
        {metadataState.error ? <StatusBox tone="error" title="기본 정보 오류" description={metadataState.error} /> : null}
      </section>

      <section className="panel">
        <h2>새 시험 등록</h2>
        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>학원</span>
              <select value={form.academy_id} onChange={(event) => setForm((prev) => ({ ...prev, academy_id: Number(event.target.value) }))}>
                {(metadataState.data?.academies ?? []).map((academy) => (
                  <option key={academy.id} value={academy.id}>{academy.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>과목</span>
              <select value={form.subject_id} onChange={(event) => setForm((prev) => ({ ...prev, subject_id: Number(event.target.value) }))}>
                {(metadataState.data?.subjects ?? []).map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>시험 이름</span>
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label className="field">
              <span>시험일</span>
              <input type="date" value={form.exam_date} onChange={(event) => setForm((prev) => ({ ...prev, exam_date: event.target.value }))} />
            </label>
            <label className="field">
              <span>총점</span>
              <input type="number" value={form.total_score} onChange={(event) => setForm((prev) => ({ ...prev, total_score: Number(event.target.value) }))} />
            </label>
          </div>
          <button className="primary-button" type="submit" disabled={!canSubmit}>시험 등록</button>
          {submitMessage ? <StatusBox tone={submitMessage.includes("실패") ? "error" : "info"} title="등록 결과" description={submitMessage} /> : null}
        </form>
      </section>

      <section className="table-card">
        <h2>시험 목록</h2>
        <table>
          <thead>
            <tr>
              <th>시험 이름</th>
              <th>시험일</th>
              <th>과목</th>
              <th>문항 수</th>
              <th>응시 인원</th>
              <th>평균 점수</th>
            </tr>
          </thead>
          <tbody>
            {(examsState.data?.exams ?? []).map((exam) => (
              <tr key={exam.id}>
                <td>{exam.name}</td>
                <td>{formatDate(exam.date)}</td>
                <td>{exam.subject}</td>
                <td>{exam.questionCount}</td>
                <td>{exam.participantCount}</td>
                <td>{formatScore(exam.avgScore)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
