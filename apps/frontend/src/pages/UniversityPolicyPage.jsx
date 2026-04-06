import { useAuth } from "../contexts/AuthContext.jsx";
import { apiClient } from "../lib/apiClient.js";
import { toSubjectLabel } from "../lib/formatters.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { ListCard } from "../components/common/ListCard.jsx";
import { LoadingPanel } from "../components/common/LoadingPanel.jsx";
import { StatusBox } from "../components/common/StatusBox.jsx";

export function UniversityPolicyPage() {
  const { session } = useAuth();
  const { data, error, loading } = useAsyncData(() => apiClient.getUniversities(session.accessToken), [session.accessToken]);

  return (
    <div className="page-grid">
      <section className="hero-card">
        <h1>목표 대학 정책</h1>
        <p className="muted">대학별 반영 과목과 목표 점수를 확인할 수 있어.</p>
        {loading ? <LoadingPanel title="대학 정책을 불러오는 중" description="대학별 반영 기준을 정리하고 있어." /> : null}
        {error ? <StatusBox tone="error" title="정책을 불러오지 못했어" description={error} /> : null}
      </section>

      <section className="three-grid">
        {(data?.universities ?? []).map((university) => (
          <section key={university.id} className="panel">
            <h2>{university.universityName}</h2>
            <p className="muted">{university.admissionType}</p>
            <ListCard
              title="반영 과목 비율"
              items={Object.entries(university.subjectWeights ?? {}).map(
                ([subject, weight]) => `${toSubjectLabel(subject)} ${Math.round(Number(weight) * 100)}%`,
              )}
            />
            <ListCard title="필수 반영 과목" items={(university.requiredSubjects ?? []).map((subject) => toSubjectLabel(subject))} />
          </section>
        ))}
      </section>
    </div>
  );
}
