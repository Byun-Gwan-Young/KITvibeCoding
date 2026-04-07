// apps/frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { StatusBox } from "../components/common/StatusBox.jsx";

const DEMO_ACCOUNTS = [
  { role: "강사", email: "instructor@unitflow.ai", password: "password123", desc: "학생 진단과 상담 포인트 확인" },
  { role: "학생", email: "student@unitflow.ai", password: "password123", desc: "나의 학습 전략과 현재 위치 확인" },
  { role: "관리자", email: "admin@unitflow.ai", password: "password123", desc: "학원 운영과 정책 관리" },
];

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "로그인에 실패했어요. 계정 정보를 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }

  return (
    <div className="login-shell">
      <div className="login-grid">
        {/* 왼쪽: 소개 */}
        <section className="hero-card">
          <div className="pill-row">
            <span className="pill">AI 진단</span>
            <span className="pill">맞춤 전략</span>
            <span className="pill">목표 대학 반영</span>
          </div>
          <h1>학생에게는 지금 해야 할 공부를,<br />강사에게는 오늘 먼저 볼 학생을</h1>
          <p className="muted" style={{ marginTop: 12, fontSize: 15, lineHeight: 1.7 }}>
            UnitFlow AI는 학생별 취약 유형을 진단하고,
            목표 대학의 반영 방식까지 고려한 맞춤 학습 전략을 제안합니다.
          </p>
        </section>

        {/* 오른쪽: 로그인 폼 */}
        <section className="panel">
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>로그인</h2>
          <p className="muted" style={{ marginBottom: 20 }}>계정에 맞는 화면으로 바로 이동합니다.</p>

          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>이메일</span>
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                type="email"
                placeholder="이메일을 입력하세요"
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <span>비밀번호</span>
              <input
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                type="password"
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                required
              />
            </label>
            {error ? <StatusBox tone="error" title="로그인 실패" description={error} /> : null}
            <button className="primary-button" type="submit" disabled={submitting} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
              {submitting ? "확인 중..." : "로그인"}
            </button>
          </form>

          {/* 데모 계정 안내 */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.3)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
              🎯 데모 계정으로 체험하기
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  className="nav-button"
                  type="button"
                  onClick={() => fillDemo(account)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div>
                    <strong style={{ fontSize: 14 }}>{account.role}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>{account.desc}</div>
                  </div>
                  <span className="pill" style={{ fontSize: 11, padding: "3px 10px" }}>{account.role}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
