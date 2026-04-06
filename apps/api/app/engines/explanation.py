from __future__ import annotations


def render_strategy_summary(structured_plan: dict, diagnosis: dict, target_gap: dict) -> str:
    student_summary = structured_plan.get("student_summary")
    if student_summary:
        return student_summary

    focus_subjects = ", ".join(item["subject_code"] for item in structured_plan.get("priority_subjects", [])[:2]) or "핵심 과목"
    top_units = ", ".join(item["unit_name"] for item in structured_plan.get("priority_units", [])[:3]) or "취약 단원"
    return (
        f"현재 주요 취약 유형은 {diagnosis.get('primary_weakness_type', 'concept_gap')}이고, "
        f"{target_gap.get('university_name', '목표 대학')} 기준 격차는 {target_gap.get('gap', 0)}점이야. "
        f"이번 4주에는 {focus_subjects} 중심으로 점수를 올리고 {top_units} 순서로 단원을 보완하는 흐름이 좋아."
    )
