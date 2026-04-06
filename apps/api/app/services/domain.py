from __future__ import annotations

from sqlalchemy.orm import Session, selectinload

from ..models import Exam, Question, QuestionUnitMapping, StudentProfile, StudentResult
from ..schemas import ExamCreate, ExamUpdate, QuestionCreate, QuestionUpdate, StudentResultUpsert
from .analytics import recalculate_student_analysis
from .audit import log_audit, log_change


def create_exam(db: Session, payload: ExamCreate, actor_user_id: int | None) -> Exam:
    exam = Exam(
        academy_id=payload.academy_id,
        subject_id=payload.subject_id,
        name=payload.name,
        exam_date=payload.exam_date,
        total_score=payload.total_score,
    )
    db.add(exam)
    db.flush()

    log_audit(
        db,
        actor_user_id=actor_user_id,
        entity_type="exam",
        entity_id=exam.id,
        action="create",
        payload={
            "name": exam.name,
            "exam_date": exam.exam_date.isoformat(),
            "subject_id": exam.subject_id,
            "total_score": exam.total_score,
        },
    )
    log_change(
        db,
        entity_type="exam",
        entity_id=exam.id,
        field_name="created",
        old_value=None,
        new_value=exam.name,
        changed_by_user_id=actor_user_id,
    )
    db.commit()
    db.refresh(exam)
    return exam


def update_exam(db: Session, exam: Exam, payload: ExamUpdate, actor_user_id: int | None) -> Exam:
    changes: list[tuple[str, str | None, str | None]] = []
    update_data = payload.model_dump(exclude_unset=True)
    for field_name, new_value in update_data.items():
        old_value = getattr(exam, field_name)
        if old_value == new_value:
            continue
        setattr(exam, field_name, new_value)
        changes.append((field_name, _stringify(old_value), _stringify(new_value)))

    if changes:
        log_audit(
            db,
            actor_user_id=actor_user_id,
            entity_type="exam",
            entity_id=exam.id,
            action="update",
            payload={field_name: new_value for field_name, _, new_value in changes},
        )
        for field_name, old_value, new_value in changes:
            log_change(
                db,
                entity_type="exam",
                entity_id=exam.id,
                field_name=field_name,
                old_value=old_value,
                new_value=new_value,
                changed_by_user_id=actor_user_id,
            )

    db.commit()
    db.refresh(exam)
    return exam


def list_exams(db: Session) -> list[Exam]:
    return db.query(Exam).order_by(Exam.exam_date.desc(), Exam.id.desc()).all()


def list_student_profiles(db: Session) -> list[StudentProfile]:
    return (
        db.query(StudentProfile)
        .options(selectinload(StudentProfile.user))
        .order_by(StudentProfile.id.asc())
        .all()
    )


def get_student_profile_detail(db: Session, student_profile_id: int) -> StudentProfile | None:
    return (
        db.query(StudentProfile)
        .options(selectinload(StudentProfile.user), selectinload(StudentProfile.class_group))
        .filter(StudentProfile.id == student_profile_id)
        .first()
    )


def list_exam_questions(db: Session, exam_id: int) -> list[Question]:
    return (
        db.query(Question)
        .options(selectinload(Question.unit_mappings))
        .filter(Question.exam_id == exam_id)
        .order_by(Question.number.asc(), Question.id.asc())
        .all()
    )


def create_question(db: Session, payload: QuestionCreate, actor_user_id: int | None) -> Question:
    question = Question(
        exam_id=payload.exam_id,
        number=payload.number,
        difficulty=payload.difficulty,
        points=payload.points,
        question_type=payload.question_type,
        estimated_seconds=payload.estimated_seconds,
    )
    db.add(question)
    db.flush()
    _replace_question_unit_mappings(db, question, payload.unit_mappings)

    log_audit(
        db,
        actor_user_id=actor_user_id,
        entity_type="question",
        entity_id=question.id,
        action="create",
        payload={
            "exam_id": question.exam_id,
            "number": question.number,
            "difficulty": question.difficulty,
            "points": question.points,
            "question_type": question.question_type,
            "unit_mapping_count": len(payload.unit_mappings),
        },
    )
    log_change(
        db,
        entity_type="question",
        entity_id=question.id,
        field_name="created",
        old_value=None,
        new_value=str(question.number),
        changed_by_user_id=actor_user_id,
    )
    db.commit()
    db.refresh(question)
    return question


def update_question(db: Session, question: Question, payload: QuestionUpdate, actor_user_id: int | None) -> Question:
    changes: list[tuple[str, str | None, str | None]] = []
    update_data = payload.model_dump(exclude_unset=True, exclude={"unit_mappings"})
    for field_name, new_value in update_data.items():
        old_value = getattr(question, field_name)
        if old_value == new_value:
            continue
        setattr(question, field_name, new_value)
        changes.append((field_name, _stringify(old_value), _stringify(new_value)))

    if payload.unit_mappings is not None:
        old_summary = _summarize_unit_mappings(question.unit_mappings)
        _replace_question_unit_mappings(db, question, payload.unit_mappings)
        new_summary = _summarize_unit_mappings(question.unit_mappings)
        if old_summary != new_summary:
            changes.append(("unit_mappings", old_summary, new_summary))

    if changes:
        log_audit(
            db,
            actor_user_id=actor_user_id,
            entity_type="question",
            entity_id=question.id,
            action="update",
            payload={field_name: new_value for field_name, _, new_value in changes},
        )
        for field_name, old_value, new_value in changes:
            log_change(
                db,
                entity_type="question",
                entity_id=question.id,
                field_name=field_name,
                old_value=old_value,
                new_value=new_value,
                changed_by_user_id=actor_user_id,
            )

    db.commit()
    db.refresh(question)
    return question


def upsert_student_result(
    db: Session,
    payload: StudentResultUpsert,
    actor_user_id: int | None,
    *,
    recalculate: bool = True,
) -> StudentResult:
    exam = db.get(Exam, payload.exam_id)
    if exam is None:
        raise ValueError("exam_not_found")

    result = (
        db.query(StudentResult)
        .filter(
            StudentResult.student_profile_id == payload.student_profile_id,
            StudentResult.exam_id == payload.exam_id,
        )
        .first()
    )

    if result is None:
        result = StudentResult(
            student_profile_id=payload.student_profile_id,
            exam_id=payload.exam_id,
            subject_id=exam.subject_id,
            raw_score=payload.raw_score,
            percentile=payload.percentile,
            grade=payload.grade,
            completed_in_seconds=payload.completed_in_seconds,
            question_breakdown=payload.question_breakdown,
            result_metadata=payload.result_metadata,
        )
        db.add(result)
        db.flush()
        action = "create"
        changes = [("created", None, str(payload.raw_score))]
    else:
        action = "update"
        changes = []
        for field_name, new_value in payload.model_dump(exclude={"student_profile_id", "exam_id"}).items():
            old_value = getattr(result, field_name)
            if old_value == new_value:
                continue
            setattr(result, field_name, new_value)
            changes.append((field_name, _stringify(old_value), _stringify(new_value)))

    log_audit(
        db,
        actor_user_id=actor_user_id,
        entity_type="student_result",
        entity_id=result.id,
        action=action,
        payload={
            "student_profile_id": payload.student_profile_id,
            "exam_id": payload.exam_id,
            "subject_id": exam.subject_id,
            "raw_score": result.raw_score,
        },
    )
    for field_name, old_value, new_value in changes:
        log_change(
            db,
            entity_type="student_result",
            entity_id=result.id,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            changed_by_user_id=actor_user_id,
        )

    db.commit()
    db.refresh(result)

    if recalculate:
        student_profile = db.get(StudentProfile, payload.student_profile_id)
        if student_profile is not None:
            recalculate_student_analysis(db, student_profile, actor_user_id=actor_user_id)
            db.refresh(result)

    return result


def list_student_results(db: Session, student_profile_id: int) -> list[StudentResult]:
    return (
        db.query(StudentResult)
        .filter(StudentResult.student_profile_id == student_profile_id)
        .order_by(StudentResult.created_at.desc(), StudentResult.id.desc())
        .all()
    )


def _replace_question_unit_mappings(db: Session, question: Question, unit_mappings: list) -> None:
    existing_mappings = list(question.unit_mappings)
    for mapping in existing_mappings:
        db.delete(mapping)
    db.flush()

    new_mappings = []
    for mapping_payload in unit_mappings:
        mapping = QuestionUnitMapping(
            question_id=question.id,
            unit_id=mapping_payload.unit_id,
            weight=mapping_payload.weight,
        )
        db.add(mapping)
        new_mappings.append(mapping)
    db.flush()
    question.unit_mappings = new_mappings


def _summarize_unit_mappings(unit_mappings: list[QuestionUnitMapping]) -> str:
    return ",".join(f"{mapping.unit_id}:{mapping.weight}" for mapping in sorted(unit_mappings, key=lambda item: item.unit_id))


def _stringify(value: object) -> str | None:
    if value is None:
        return None
    return str(value)
