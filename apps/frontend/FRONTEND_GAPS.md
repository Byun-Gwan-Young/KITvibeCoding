# FRONTEND_GAPS.md

프론트엔드 재설계 과정에서 발견한 백엔드 한계와 대응 방식 정리.

## 1. 역할별 대시보드 API 분리 없음

**현황**: `GET /frontend/dashboard/instructor` 하나로 강사/관리자 모두 처리.
**대응**: 관리자 대시보드(`AdminDashboardPage`)에서 같은 API를 호출하되, 추가로 시험 목록(`getExams`)과 대학 정책(`getUniversities`)을 함께 호출하여 운영 관점 수치를 계산.
**개선 제안**: `GET /frontend/dashboard/admin` API를 별도로 만들어 학원 전체 통계(등록 학생 수, 시험 현황, 정책 수 등)를 한 번에 반환하면 효율적.

## 2. 학생 상세 전략 재계산 후 갱신된 전략 미반환

**현황**: `POST /students/{id}/recalculate` 호출 후 응답에 갱신된 전략이 포함되지 않음.
**대응**: 재계산 후 `getStudentDetail`을 다시 호출하여 화면을 갱신.
**개선 제안**: 재계산 응답에 갱신된 진단/전략을 함께 반환하면 API 호출 1회 절감.

## 3. 시험 목록 응답 형식 이중성

**현황**: `GET /frontend/exams`와 `GET /exams`가 다른 형식을 반환. 프론트에서 ID를 `e` prefix 제거 후 사용.
**대응**: `String(exam.id).replace(/^e/, "")` 로 정규화.
**개선 제안**: 하나의 일관된 시험 목록 API로 통합하거나, ID 형식을 통일.

## 4. 대학 정책 필드명 불일치

**현황**: 일부 응답에서 `university_name` / `universityName`, `subject_weights` / `subjectWeights` 등 snake_case와 camelCase가 혼재.
**대응**: 프론트에서 `policy.university_name ?? policy.universityName` 형태로 양쪽 모두 처리.
**개선 제안**: 백엔드 응답을 snake_case 또는 camelCase 하나로 통일.

## 5. 학생 대시보드 전략 필드명 불일치

**현황**: `timeAllocation` 배열 내 항목에 `subject_code` / `subjectCode`, `ratio_percent` / `ratioPercent` 등 혼재.
**대응**: 프론트에서 `item.subject_code ?? item.subjectCode` 형태로 양쪽 처리.
**개선 제안**: API 응답 스키마를 통일.

## 6. 관리자 전용 기능 부재

**현황**: 강사 감사 로그, 학원 설정, 강사 관리 등 관리자 전용 API가 없음.
**대응**: 관리자 대시보드에서 강사 대시보드 API를 재활용하되, 시험/정책 관리로의 빠른 이동을 강조.
**개선 제안**: 관리자 전용 엔드포인트 추가 (감사 로그, 강사 목록, 학원 설정 등).
