# FRONTEND_ARCHITECTURE.md

UnitFlow AI 프론트엔드 재설계 산출물 문서.

---

## 1. 역할별 화면 구조 설명

### 학생 (student)

학생은 **"지금 내가 무엇을 공부해야 하는가"** 하나에 집중하는 구조.
강사/관리자용 메뉴, 학생 목록, 시험 관리, 대학 정책 관리는 **렌더링 자체가 되지 않음**.

```
/#/student
└── StudentDashboardPage
    ├── 히어로: 목표 대학 대비 현재 위치 요약
    ├── 핵심 수치: 진단 결과 / 집중 과목 / 시간 배분
    ├── 학습 전략 요약 + 전략 신뢰도
    ├── 전략 근거 + 보완 단원
    └── 추천 시간 배분 + 피해야 할 패턴
```

**정보 순서**: 결론(지금 할 것) → 근거(왜) → 세부(과목·단원) → 행동 지침

### 강사 (instructor)

강사는 **"오늘 어떤 학생을 먼저 볼 것인가"** 에서 시작해, 학생 상세 → 결과 입력 → 전략 재계산 흐름이 이어지는 구조.

```
/#/teacher                    → InstructorDashboardPage (오늘의 요약)
/#/teacher/students           → StudentListPage (학생 목록)
/#/teacher/students/:id       → StudentDetailPage (학생 상세, 탭 분리)
/#/teacher/exams              → ExamManagementPage (시험 관리, 탭 분리)
/#/teacher/universities       → UniversityPolicyPage (대학 정책, 탭 분리)
```

**대시보드 정보 순서**: 우선 상담 학생 → 취약 유형 → 최근 시험 → 취약 단원 → 학생 바로 보기

### 관리자 (admin)

관리자는 **학원 운영 전체를 한눈에** 보는 구조. 강사 대시보드와 다른 전용 화면 사용.

```
/#/admin                      → AdminDashboardPage (운영 현황)
/#/admin/students             → StudentListPage
/#/admin/students/:id         → StudentDetailPage
/#/admin/exams                → ExamManagementPage
/#/admin/universities         → UniversityPolicyPage
```

**대시보드 정보 순서**: 전체 수치(학생·시험·정책) → 빠른 이동 카드 → 상담 우선 학생 → 취약 유형

---

## 2. 권한 매트릭스

### 경로 접근 권한

| 경로 | 학생 | 강사 | 관리자 |
|------|:----:|:----:|:------:|
| `/#/student` | ✅ | ❌ → 리다이렉트 | ❌ → 리다이렉트 |
| `/#/teacher` | ❌ → 리다이렉트 | ✅ | ❌ → 리다이렉트 |
| `/#/teacher/students` | ❌ | ✅ | ❌ |
| `/#/teacher/students/:id` | ❌ | ✅ | ❌ |
| `/#/teacher/exams` | ❌ | ✅ | ❌ |
| `/#/teacher/universities` | ❌ | ✅ | ❌ |
| `/#/admin` | ❌ → 리다이렉트 | ❌ → 리다이렉트 | ✅ |
| `/#/admin/students` | ❌ | ❌ | ✅ |
| `/#/admin/students/:id` | ❌ | ❌ | ✅ |
| `/#/admin/exams` | ❌ | ❌ | ✅ |
| `/#/admin/universities` | ❌ | ❌ | ✅ |

### 메뉴 노출

| 메뉴 | 학생 | 강사 | 관리자 |
|------|:----:|:----:|:------:|
| 나의 학습 전략 | ✅ | - | - |
| 오늘의 요약 | - | ✅ | - |
| 운영 현황 | - | - | ✅ |
| 학생 관리 | - | ✅ | ✅ |
| 시험 관리 | - | ✅ | ✅ |
| 대학 정책 | - | ✅ | ✅ |

### API 호출 권한

| API | 학생 | 강사 | 관리자 |
|-----|:----:|:----:|:------:|
| `getStudentDashboard` | ✅ | - | - |
| `getInstructorDashboard` | - | ✅ | ✅ |
| `getStudents` | - | ✅ | ✅ |
| `getStudentDetail` | - | ✅ | ✅ |
| `getStudentResults` | - | ✅ | ✅ |
| `saveStudentResult` | - | ✅ | ✅ |
| `recalculateStudent` | - | ✅ | ✅ |
| `getExams` / `getExamCatalog` | - | ✅ | ✅ |
| `createExam` / `updateExam` | - | ✅ | ✅ |
| `getExamQuestions` / `createQuestion` | - | ✅ | ✅ |
| `getMetadata` | - | ✅ | ✅ |
| `getSubjectUnits` | - | ✅ | ✅ |
| `getUniversities` | - | ✅ | ✅ |
| `createUniversityPolicy` / `updateUniversityPolicy` | - | ✅ | ✅ |

---

## 3. 백엔드 기능 → UI 매핑

| # | 백엔드 기능 | API 엔드포인트 | 프론트 화면 | 컴포넌트 |
|---|-------------|----------------|-------------|----------|
| 1 | 로그인 | `POST /auth/login` | LoginPage | 로그인 폼 + 데모 계정 |
| 2 | 내 정보 확인 | `GET /auth/me` | AuthContext | 세션 유효성 검증 (자동) |
| 3 | 강사용 대시보드 | `GET /frontend/dashboard/instructor` | InstructorDashboardPage | StatCard × 3 + 학생 테이블 + ListCard × 4 |
| 4 | 학생용 대시보드 | `GET /frontend/dashboard/student` | StudentDashboardPage | StatCard × 3 + ListCard × 6 |
| 5 | 학생 목록 | `GET /frontend/students` | StudentListPage | 검색 + 테이블 + 우선도 배지 |
| 6 | 학생 상세 | `GET /frontend/students/:id` | StudentDetailPage [진단 탭] | StatCard × 3 + ListCard × 4 |
| 7 | 학생 결과 입력 | `POST /student-results` | StudentDetailPage [결과 탭] | 시험 선택 + 문항 정오답 + 점수 자동계산 |
| 8 | 전략 재계산 | `POST /students/:id/recalculate` | StudentDetailPage [결과 탭] | 재계산 버튼 + 상태 메시지 |
| 9 | 학생 시험 결과 | `GET /students/:id/results` | StudentDetailPage [결과 탭] | 저장된 결과 테이블 |
| 10 | 시험 목록 | `GET /frontend/exams` + `GET /exams` | ExamManagementPage [목록 탭] | StatCard × 3 + 시험 테이블 |
| 11 | 시험 등록 | `POST /frontend/exams` | ExamManagementPage [등록 탭] | 등록 폼 |
| 12 | 시험 수정 | `PUT /exams/:id` | ExamManagementPage [등록 탭] | 불러오기 + 수정 폼 |
| 13 | 문항 목록 | `GET /exams/:id/questions` | ExamManagementPage [문항 탭] | 문항 테이블 |
| 14 | 문항 등록 | `POST /questions` | ExamManagementPage [문항 탭] | 문항 등록 폼 |
| 15 | 메타데이터 | `GET /frontend/metadata` | ExamManagementPage | 학원·과목 셀렉트 |
| 16 | 과목별 단원 | `GET /subjects/:id/units` | ExamManagementPage [문항 탭] | 단원 셀렉트 |
| 17 | 대학 정책 목록 | `GET /universities/policies` | UniversityPolicyPage [요약 탭] | 정책 카드 (반영비율 바 + 필수과목) |
| 18 | 대학 정책 등록 | `POST /universities/policies` | UniversityPolicyPage [등록 탭] | 등록 폼 |
| 19 | 대학 정책 수정 | `PUT /universities/policies/:id` | UniversityPolicyPage [등록 탭] | 불러오기 + 수정 폼 |

### 상태 화면 매핑

| 상태 | 구현 방식 | 사용 위치 |
|------|----------|-----------|
| loading | `LoadingPanel` 컴포넌트 | 모든 데이터 로딩 구간 |
| empty | `StatusBox tone="empty"` 또는 `EmptyState` | 데이터 0건일 때 |
| error | `StatusBox tone="error"` 또는 `ErrorState` | API 실패 시 |
| no permission | `RoleGuard` → 자동 리다이렉트 + 안내 화면 | 잘못된 경로 접근 시 |
| save success | `StatusBox tone="info"` | 저장/수정 완료 시 |
| save failure | `StatusBox tone="error"` | 저장/수정 실패 시 |
| first visit | `FirstVisitHint` | 강사 대시보드, 학생 대시보드 |
| session check | App.jsx 로딩 화면 | 새로고침 시 세션 확인 |

---

## 4. 남은 프론트 이슈 목록

### 높음 (기능 영향)

| # | 이슈 | 현황 | 대응 방안 |
|---|------|------|-----------|
| 1 | 문항 수정 기능 | `updateQuestion` API 존재하나 프론트 UI 미구현 | 문항 카드에 수정 버튼 + 인라인 편집 추가 |
| 2 | 시험 결과 삭제 | 백엔드 API 미확인 | FRONTEND_GAPS.md에 기록됨 |
| 3 | 관리자 전용 감사 로그 | 백엔드 API 존재(`/analytics`) 하나 프론트 미연결 | 관리자 대시보드에 로그 탭 추가 |

### 중간 (UX 개선)

| # | 이슈 | 현황 | 대응 방안 |
|---|------|------|-----------|
| 4 | 차트/시각화 | Recharts 설치되어 있으나 미사용 | 시험 추이 라인차트, 과목별 바차트 추가 |
| 5 | 모바일 세밀 조정 | 기본 반응형만 적용 | 모바일 사이드바 토글, 테이블 가로 스크롤 보강 |
| 6 | 학생 상세 과목별 추세 차트 | 데이터 구조 있으나 시각화 없음 | Recharts LineChart 추가 |
| 7 | 대학 정책 비교 뷰 | 여러 대학 비교 불가 | 정책 카드 다중 선택 + 비교 테이블 |

### 낮음 (부가 기능)

| # | 이슈 | 현황 | 대응 방안 |
|---|------|------|-----------|
| 8 | 알림/상태 영역 | 미구현 | 사이드바 또는 상단바에 알림 배지 |
| 9 | 다크 모드 | 미구현 | CSS 변수 기반이라 추가 용이 |
| 10 | 키보드 접근성 | 기본 HTML 접근성만 | focus-visible, aria-label 보강 |
| 11 | 세션 만료 자동 처리 | 현재 수동 로그아웃만 | API 401 응답 시 자동 로그아웃 + 안내 |

---

## 5. 실행 방법

### 백엔드 실행

```bash
cd apps/api
python -m venv .venv
# Windows: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp ../../.env.example .env
pip uninstall -y bcrypt && pip install bcrypt==4.0.1
python -m app.seed
python -m uvicorn app.main:app --reload
```

백엔드: `http://127.0.0.1:8000`
API 문서: `http://127.0.0.1:8000/docs`

### 프론트엔드 실행

```bash
cd apps/frontend
npm install
npm run dev
```

프론트엔드: `http://127.0.0.1:5173`

### 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 강사 | `instructor@unitflow.ai` | `password123` |
| 학생 | `student@unitflow.ai` | `password123` |
| 관리자 | `admin@unitflow.ai` | `password123` |

### 빌드 검증

```bash
cd apps/frontend
npm run build
```

---

## 6. 데모 동선 및 캡처 포인트

### 동선 A: 강사 흐름 (핵심 데모)

```
1. 로그인 화면
   → 데모 계정 "강사" 클릭 → 로그인
   📸 캡처: 로그인 화면 (데모 계정 카드)

2. 강사 대시보드
   → 우선 상담 학생, 취약 유형, 시험 평균 확인
   📸 캡처: 대시보드 전체 (StatCard + 학생 테이블)

3. 학생 바로 보기 → 학생 클릭
   → 학생 상세 [진단 요약] 탭
   📸 캡처: 진단 요약 (전략 + 상담 포인트 + 과목 + 단원)

4. [결과 입력] 탭 전환
   → 시험 선택 → 문항 정오답 체크 → 결과 저장
   📸 캡처: 문항 정오답 카드 + 자동 계산 점수

5. 전략 다시 계산 버튼 클릭
   📸 캡처: 재계산 성공 메시지

6. 시험 관리 이동
   → [시험 목록] 탭 → [시험 등록] 탭 → [문항 관리] 탭
   📸 캡처: 시험 목록 테이블 + 문항 등록 화면

7. 대학 정책 이동
   → [정책 요약] 탭 → 정책 카드 (반영비율 바)
   📸 캡처: 정책 카드 3개 비교
```

### 동선 B: 학생 흐름

```
1. 로그인 → "학생" 데모 계정
   📸 캡처: 로그인 화면

2. 학생 대시보드
   → "지금 해야 할 공부" 확인
   → 진단 결과, 집중 과목, 시간 배분 확인
   📸 캡처: 대시보드 전체

3. 전략 근거 + 보완 단원 확인
   📸 캡처: 전략 카드 + 단원 리스트

4. URL에 /#/teacher 직접 입력
   → 🔒 접근 차단 → /student로 리다이렉트
   📸 캡처: 권한 차단 화면 (선택)
```

### 동선 C: 관리자 흐름

```
1. 로그인 → "관리자" 데모 계정
   📸 캡처: 로그인

2. 관리자 대시보드
   → 학생 수, 시험 수, 정책 수 확인
   → 빠른 이동 카드 (학생/시험/대학)
   📸 캡처: 운영 현황 전체

3. 학생 관리 → 학생 상세 → 결과 입력
   📸 캡처: 학생 상세 탭 전환

4. 대학 정책 → 정책 등록
   📸 캡처: 정책 등록 폼 + 요약 패널
```

### 핵심 캡처 우선순위

1. **강사 대시보드** — "오늘 먼저 볼 학생" 즉시 확인
2. **학생 상세 [진단 탭]** — AI 전략 + 상담 포인트
3. **학생 대시보드** — "지금 해야 할 공부" 코칭 뷰
4. **대학 정책 카드** — 반영비율 시각화
5. **로그인** — 역할별 데모 계정

---

## 7. 기술 스택

| 영역 | 기술 |
|------|------|
| UI 프레임워크 | React 19 |
| 빌드 | Vite 7 |
| 라우팅 | 자체 해시 라우터 (hashRouter.js) |
| 상태 관리 | React Context (AuthContext) + 커스텀 훅 (useAsyncData) |
| 스타일 | 단일 CSS (Glassmorphism 디자인 시스템) |
| 차트 | Recharts (설치됨, 향후 적용) |
| 아이콘 | Lucide React (설치됨, 향후 적용) |
| API 통신 | fetch 기반 apiClient |

---

## 8. 파일 구조

```
apps/frontend/
├── index.html
├── main.jsx
├── vite.config.js
├── package.json
├── FRONTEND_GAPS.md
└── src/
    ├── App.jsx
    ├── styles.css
    ├── components/
    │   ├── common/
    │   │   ├── ListCard.jsx
    │   │   ├── LoadingPanel.jsx
    │   │   ├── StatCard.jsx
    │   │   ├── StatusBox.jsx
    │   │   └── Tabs.jsx
    │   ├── feedback/
    │   │   ├── EmptyState.jsx
    │   │   ├── ErrorState.jsx
    │   │   ├── FirstVisitHint.jsx
    │   │   └── PermissionNotice.jsx
    │   └── layout/
    │       └── SidebarLayout.jsx
    ├── contexts/
    │   └── AuthContext.jsx
    ├── guards/
    │   └── RoleGuard.jsx
    ├── hooks/
    │   └── useAsyncData.js
    ├── lib/
    │   ├── apiClient.js
    │   ├── constants.js
    │   ├── formatters.js
    │   └── storage.js
    ├── pages/
    │   ├── AdminDashboardPage.jsx
    │   ├── ExamManagementPage.jsx
    │   ├── InstructorDashboardPage.jsx
    │   ├── LoginPage.jsx
    │   ├── StudentDashboardPage.jsx
    │   ├── StudentDetailPage.jsx
    │   ├── StudentListPage.jsx
    │   └── UniversityPolicyPage.jsx
    └── router/
        ├── MainRouter.jsx
        ├── hashRouter.js
        └── permissions.js
```
