// apps/frontend/src/pages/UniversityPolicyPage.jsx
// 대학 정책 — 탭 분리: 정책 요약 / 등록·수정

import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiClient } from "../lib/apiClient.js";
import { toSubjectLabel } from "../lib/formatters.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { LoadingPanel } from "../components/common/LoadingPanel.jsx";
import { StatusBox } from "../components/common/StatusBox.jsx";
import { StatCard } from "../components/common/StatCard.jsx";
import { Tabs } from "../components/common/Tabs.jsx";

const SUBJECT_CODES = ["KOR", "MATH", "ENG", "SCI", "SOC"];

function createEmptyForm() {
  return {
    university_name: "", admission_type: "", target_score: 84, notes: "",
    subject_weights: { KOR: 0.3, MATH: 0.4, ENG: 0.3, SCI: 0, SOC: 0 },
    required_subjects: ["KOR", "MATH", "ENG"],
  };
}

export function UniversityPolicyPage() {
  const { session } = useAuth();
  const { data, error, loading, reload } = useAsyncData(() => apiClient.getUniversities(session.accessToken), [session.accessToken]);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [form, setForm] = useState(createEmptyForm());
  const [message, setMessage] = useState("");

  const policies = data ?? [];
  const selectedPolicy = useMemo(() => policies.find((p) => String(p.id) === String(selectedPolicyId)), [policies, selectedPolicyId]);

  function loadPolicy(policy) {
    setForm({
      university_name: policy.university_name ?? policy.universityName,
      admission_type: policy.admission_type ?? policy.admissionType,
      target_score: policy.target_score ?? policy.targetScore,
      notes: policy.notes ?? "",
      subject_weights: SUBJECT_CODES.reduce((acc, code) => ({ ...acc, [code]: Number((policy.subject_weights ?? policy.subjectWeights ?? {})[code] ?? 0) }), {}),
      required_subjects: [...(policy.required_subjects ?? policy.requiredSubjects ?? [])],
    });
  }

  async function handleCreate(event) {
    event.preventDefault(); setMessage("");
    try {
      await apiClient.createUniversityPolicy(session.accessToken, { ...form, target_score: Number(form.target_score), subject_weights: normalizeWeights(form.subject_weights), bonus_rules: [], grade_conversion_rules: {} });
      setMessage("대학 정책을 등록했어요."); setForm(createEmptyForm()); reload();
    } catch (e) { setMessage(e instanceof Error ? e.message : "대학 정책 등록에 실패했어요."); }
  }

  async function handleUpdate() {
    if (!selectedPolicyId) return; setMessage("");
    try {
      await apiClient.updateUniversityPolicy(session.accessToken, Number(selectedPolicyId), { ...form, target_score: Number(form.target_score), subject_weights: normalizeWeights(form.subject_weights), bonus_rules: [], grade_conversion_rules: {} });
      setMessage("대학 정책을 수정했어요."); reload();
    } catch (e) { setMessage(e instanceof Error ? e.message : "대학 정책 수정에 실패했어요."); }
  }

  // ── 탭 1: 정책 요약 카드 ──
  const policyListTab = (
    <div className="page-grid" style={{ marginTop: 16 }}>
      <section className="stats-grid">
        <StatCard label="등록된 대학 정책" value={`${policies.length}건`} description="목표 대학 반영 기준" />
      </section>

      {policies.length === 0 && !loading ? (
        <StatusBox tone="empty" title="등록된 정책이 없어요" description="'정책 등록' 탭에서 대학 정책을 추가해 주세요." />
      ) : (
        <section className="three-grid">
          {policies.map((policy) => {
            const name = policy.university_name ?? policy.universityName;
            const type = policy.admission_type ?? policy.admissionType;
            const target = policy.target_score ?? policy.targetScore;
            const weights = policy.subject_weights ?? policy.subjectWeights ?? {};
            const required = policy.required_subjects ?? policy.requiredSubjects ?? [];
            return (
              <section
                key={policy.id}
                className="panel"
                onClick={() => { setSelectedPolicyId(String(policy.id)); loadPolicy(policy); }}
                style={{ cursor: "pointer", border: String(policy.id) === selectedPolicyId ? "1px solid rgba(124,58,237,0.3)" : undefined }}
              >
                <h2 style={{ fontSize: 18, marginBottom: 4 }}>🎓 {name}</h2>
                <p className="muted" style={{ marginBottom: 14 }}>{type} · 목표 {target}점</p>

                {/* 반영 비율 시각화 */}
                <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
                  {SUBJECT_CODES.filter((code) => Number(weights[code] ?? 0) > 0).map((code) => {
                    const pct = Math.round(Number(weights[code] ?? 0) * 100);
                    const colors = { KOR: "#3B82F6", MATH: "#7C3AED", ENG: "#10B981", SCI: "#F59E0B", SOC: "#EC4899" };
                    return <div key={code} style={{ width: `${pct}%`, background: colors[code] ?? "#94A3B8", opacity: 0.7 }} />;
                  })}
                </div>

                <div className="pill-row" style={{ margin: 0 }}>
                  {SUBJECT_CODES.filter((code) => Number(weights[code] ?? 0) > 0).map((code) => (
                    <span key={code} className="pill" style={{ fontSize: 11, padding: "3px 8px" }}>
                      {toSubjectLabel(code)} {Math.round(Number(weights[code] ?? 0) * 100)}%
                    </span>
                  ))}
                </div>

                <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                  필수: {required.map(toSubjectLabel).join(", ") || "-"}
                </div>

                {policy.notes && (
                  <div className="muted" style={{ marginTop: 4, fontSize: 12, fontStyle: "italic" }}>
                    {policy.notes}
                  </div>
                )}
              </section>
            );
          })}
        </section>
      )}
    </div>
  );

  // ── 탭 2: 등록·수정 ──
  const formTab = (
    <div className="page-grid" style={{ marginTop: 16 }}>
      <section className="two-grid">
        <section className="panel">
          <div className="section-header">
            <h2>📝 정책 등록·수정</h2>
            <div className="toolbar">
              <select value={selectedPolicyId} onChange={(e) => setSelectedPolicyId(e.target.value)}>
                <option value="">기존 정책 선택</option>
                {policies.map((p) => <option key={p.id} value={p.id}>{p.university_name ?? p.universityName}</option>)}
              </select>
              <button className="ghost-button" type="button" onClick={() => { if (selectedPolicy) loadPolicy(selectedPolicy); }} disabled={!selectedPolicy} style={{ fontSize: 13 }}>
                불러오기
              </button>
            </div>
          </div>

          <form className="form-stack" onSubmit={handleCreate}>
            <div className="form-grid">
              <label className="field"><span>대학 이름</span><input value={form.university_name} onChange={(e) => setForm((p) => ({ ...p, university_name: e.target.value }))} placeholder="예: 서울대학교" /></label>
              <label className="field"><span>전형</span><input value={form.admission_type} onChange={(e) => setForm((p) => ({ ...p, admission_type: e.target.value }))} placeholder="예: 정시" /></label>
              <label className="field"><span>목표 점수</span><input type="number" value={form.target_score} onChange={(e) => setForm((p) => ({ ...p, target_score: Number(e.target.value) }))} /></label>
              <label className="field" style={{ gridColumn: "1 / -1" }}><span>비고</span><input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="참고 사항" /></label>
            </div>

            <div className="panel" style={{ background: "rgba(255,255,255,0.2)", boxShadow: "none", padding: 18 }}>
              <h3 style={{ marginTop: 0, fontSize: 15 }}>📊 과목 반영 비율</h3>
              <div className="form-grid">
                {SUBJECT_CODES.map((code) => (
                  <label key={code} className="field">
                    <span>{toSubjectLabel(code)}</span>
                    <input type="number" step="0.05" min="0" max="1" value={form.subject_weights[code] ?? 0}
                      onChange={(e) => setForm((p) => ({ ...p, subject_weights: { ...p.subject_weights, [code]: Number(e.target.value) } }))} />
                  </label>
                ))}
              </div>
            </div>

            <div className="panel" style={{ background: "rgba(255,255,255,0.2)", boxShadow: "none", padding: 18 }}>
              <h3 style={{ marginTop: 0, fontSize: 15 }}>✅ 필수 반영 과목</h3>
              <div className="toolbar">
                {SUBJECT_CODES.map((code) => (
                  <label key={code} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14 }}>
                    <input type="checkbox" checked={form.required_subjects.includes(code)}
                      onChange={(e) => setForm((p) => ({
                        ...p, required_subjects: e.target.checked ? [...p.required_subjects, code] : p.required_subjects.filter((c) => c !== code),
                      }))} />
                    {toSubjectLabel(code)}
                  </label>
                ))}
              </div>
            </div>

            <div className="toolbar">
              <button className="primary-button" type="submit">새 정책 등록</button>
              <button className="ghost-button" type="button" disabled={!selectedPolicyId} onClick={handleUpdate}>선택 정책 수정</button>
              <button className="ghost-button" type="button" onClick={() => setForm(createEmptyForm())}>초기화</button>
            </div>
          </form>
          {message ? <StatusBox tone={message.includes("실패") ? "error" : "info"} title="정책 작업 결과" description={message} /> : null}
        </section>

        {/* 선택한 정책 요약 */}
        <section className="panel">
          <h2>📌 선택한 정책 요약</h2>
          {selectedPolicy ? (
            <>
              <div className="status-box info" style={{ marginBottom: 14 }}>
                <strong style={{ fontSize: 16 }}>{selectedPolicy.university_name ?? selectedPolicy.universityName}</strong>
                <div>{selectedPolicy.admission_type ?? selectedPolicy.admissionType} · 목표 {selectedPolicy.target_score ?? selectedPolicy.targetScore}점</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>반영 비율</h3>
                <div className="pill-row" style={{ margin: 0 }}>
                  {Object.entries(selectedPolicy.subject_weights ?? selectedPolicy.subjectWeights ?? {})
                    .filter(([, w]) => Number(w) > 0)
                    .map(([code, w]) => (
                      <span key={code} className="pill">{toSubjectLabel(code)} {Math.round(Number(w) * 100)}%</span>
                    ))}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>필수 과목</h3>
                <div className="pill-row" style={{ margin: 0 }}>
                  {(selectedPolicy.required_subjects ?? selectedPolicy.requiredSubjects ?? []).map((code) => (
                    <span key={code} className="pill">{toSubjectLabel(code)}</span>
                  ))}
                </div>
              </div>
              {(selectedPolicy.notes) && (
                <div className="muted" style={{ marginTop: 14, fontSize: 13, fontStyle: "italic" }}>
                  📝 {selectedPolicy.notes}
                </div>
              )}
            </>
          ) : (
            <StatusBox tone="empty" title="정책을 선택하세요" description="왼쪽에서 기존 정책을 고르거나 새 정책을 등록해 주세요." />
          )}
        </section>
      </section>
    </div>
  );

  return (
    <div className="page-grid">
      <section className="hero-card">
        <h1>목표 대학 정책</h1>
        <p className="muted" style={{ fontSize: 15 }}>대학별 반영 비율, 필수 과목, 목표 점수를 관리해요. 이 정보가 AI 학습 전략의 핵심 기반이에요.</p>
        {loading ? <LoadingPanel title="대학 정책을 불러오는 중" description="정책 정보를 정리하고 있어요." /> : null}
        {error ? <StatusBox tone="error" title="정책을 불러오지 못했어요" description={error} /> : null}
      </section>

      {!loading && (
        <Tabs
          defaultTab="list"
          tabs={[
            { key: "list", label: "정책 요약", badge: policies.length || undefined, content: policyListTab },
            { key: "form", label: "등록·수정", content: formTab },
          ]}
        />
      )}
    </div>
  );
}

function normalizeWeights(w) {
  return Object.fromEntries(Object.entries(w).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)]));
}
