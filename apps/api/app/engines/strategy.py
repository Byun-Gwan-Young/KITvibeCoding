from __future__ import annotations


SUBJECT_LABELS = {
    "KOR": "국어",
    "MATH": "수학",
    "ENG": "영어",
    "SCI": "과학탐구",
    "SOC": "사회탐구",
}


def _subject_label(subject_code: str) -> str:
    return SUBJECT_LABELS.get(subject_code, subject_code)


def _build_confidence(feature_snapshot: dict, priority_units: list[dict]) -> tuple[str, str]:
    subject_count = len(feature_snapshot.get("latest_scores", {}))
    unit_count = len(priority_units)
    if subject_count >= 3 and unit_count >= 2:
        return "높음", "최근 시험, 단원 이해도, 목표 대학 반영 비율이 함께 있어 전략 신뢰도가 높은 편이야."
    if subject_count >= 2:
        return "보통", "기본 데이터는 충분하지만 단원 데이터가 더 쌓이면 더 정밀하게 추천할 수 있어."
    return "낮음", "시험 데이터가 아직 적어서 방향 중심으로 제안하고 있어."


def build_strategy(diagnosis: dict) -> dict:
    features = diagnosis["feature_snapshot"]
    subject_weights = features.get("target_gap", {}).get("subject_weights", {})
    weak_subjects = diagnosis.get("weak_subjects", [])

    ranked_subjects = []
    for item in weak_subjects:
        weight = subject_weights.get(item["subject_code"], 0.5)
        efficiency = round(
            (weight * 100)
            + (item.get("growth_rate", 0.0) * 40)
            + ((100 - item.get("latest_score", 0.0)) * 0.2),
            2,
        )
        ranked_subjects.append({**item, "university_weight": weight, "efficiency_score": efficiency})
    ranked_subjects.sort(key=lambda item: item["efficiency_score"], reverse=True)

    total_efficiency = sum(item["efficiency_score"] for item in ranked_subjects[:3]) or 1.0
    time_allocation = [
        {
            "subject_code": item["subject_code"],
            "ratio_percent": round((item["efficiency_score"] / total_efficiency) * 100, 1),
            "reason": f"{_subject_label(item['subject_code'])}의 반영 비율과 최근 흐름을 함께 반영한 비율이야.",
        }
        for item in ranked_subjects[:3]
    ]

    priority_units = [
        {
            "unit_id": unit["unit_id"],
            "unit_name": unit["unit_name"],
            "mastery": unit["mastery"],
            "sequence_reason": "선행 개념부터 다시 잡아야 하는 단원이야." if unit.get("prerequisite_unit_id") else "점수로 바로 이어질 가능성이 큰 단원이야.",
        }
        for unit in diagnosis.get("weak_units", [])[:5]
    ]

    rationale = [
        {
            "kind": "subject_priority",
            "subject_code": item["subject_code"],
            "message": f"{_subject_label(item['subject_code'])}은 목표 대학 반영 비율과 최근 상승 흐름을 함께 봤을 때 투자 효율이 높아.",
        }
        for item in ranked_subjects[:2]
    ]
    rationale.extend(
        {
            "kind": "unit_priority",
            "unit_name": unit["unit_name"],
            "message": f"{unit['unit_name']} 단원 이해도가 {unit['mastery']}%라서 먼저 보완할 필요가 있어.",
        }
        for unit in priority_units[:2]
    )

    confidence_level, confidence_message = _build_confidence(features, priority_units)
    top_subject_label = _subject_label(ranked_subjects[0]["subject_code"]) if ranked_subjects else "핵심 과목"
    top_unit_name = priority_units[0]["unit_name"] if priority_units else "취약 단원"

    student_summary = (
        f"이번 4주에는 {top_subject_label}부터 끌어올리는 게 좋아. "
        f"{top_unit_name}부터 차근차근 보완하면 목표 대학 점수 차이를 줄이기 쉬워."
    )
    instructor_summary = (
        f"주요 취약 유형은 {diagnosis['primary_weakness_type']}이며, "
        f"{', '.join(_subject_label(item['subject_code']) for item in ranked_subjects[:2]) or '핵심 과목'} 중심으로 우선 개입이 필요해. "
        f"{top_unit_name} 보완을 시작점으로 두는 편이 적절해."
    )

    return {
        "priority_subjects": ranked_subjects[:3],
        "priority_units": priority_units,
        "time_allocation": time_allocation,
        "coaching_points": [
            "오답 원인을 개념, 계산, 시간 관리로 나눠서 상담해.",
            "반영 비율이 높고 상승 가능성이 큰 과목부터 먼저 점검해.",
            "단원 보완 순서를 명확히 정해 학습 부담을 줄여.",
        ],
        "anti_patterns": [
            "모든 과목에 똑같이 시간을 나누는 방식",
            "취약 단원을 건너뛰고 문제만 많이 푸는 방식",
            "반영 비율이 낮은 과목에만 시간을 과하게 쓰는 방식",
        ],
        "diagnosis_type": diagnosis["primary_weakness_type"],
        "rationale": rationale,
        "student_summary": student_summary,
        "instructor_summary": instructor_summary,
        "confidence_level": confidence_level,
        "confidence_message": confidence_message,
        "data_sufficiency": {
            "subject_count": len(features.get("latest_scores", {})),
            "unit_count": len(priority_units),
            "has_target_gap": bool(features.get("target_gap")),
        },
    }
