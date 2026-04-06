const API_BASE_URL =
  (typeof window !== "undefined" && window.__UNITFLOW_API_BASE_URL__) ||
  "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = `요청 처리에 실패했어. (${response.status})`;
    try {
      const payload = await response.json();
      if (payload?.detail) message = payload.detail;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  return response.json();
}

export const apiClient = {
  login: (payload) => request("/frontend/login", { method: "POST", body: payload }),
  me: (token) => request("/frontend/me", { token }),
  getInstructorDashboard: (token) => request("/frontend/dashboard/instructor", { token }),
  getStudentDashboard: (token) => request("/frontend/dashboard/student", { token }),
  getStudents: (token) => request("/frontend/students", { token }),
  getStudentDetail: (token, studentId) => request(`/frontend/students/${studentId}`, { token }),
  getExams: (token) => request("/frontend/exams", { token }),
  createExam: (token, payload) => request("/frontend/exams", { method: "POST", token, body: payload }),
  getMetadata: (token) => request("/frontend/metadata", { token }),
  getUniversities: (token) => request("/frontend/universities", { token }),
};
