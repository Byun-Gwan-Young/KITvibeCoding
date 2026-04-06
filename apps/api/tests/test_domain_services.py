from datetime import date
from types import SimpleNamespace

from app.schemas import ExamCreate, QuestionCreate, QuestionUpdate, StudentResultUpsert
from app.services.domain import create_exam, create_question, update_question, upsert_student_result


class FakeExam:
    def __init__(self, **kwargs):
        self.id = None
        for key, value in kwargs.items():
            setattr(self, key, value)


class FakeQuestion:
    def __init__(self, **kwargs):
        self.id = None
        self.unit_mappings = []
        for key, value in kwargs.items():
            setattr(self, key, value)


class FakeQuestionUnitMapping:
    def __init__(self, **kwargs):
        self.id = None
        for key, value in kwargs.items():
            setattr(self, key, value)


class FakeStudentResult:
    student_profile_id = "student_profile_id"
    exam_id = "exam_id"

    def __init__(self, **kwargs):
        self.id = None
        for key, value in kwargs.items():
            setattr(self, key, value)


class FakeQuery:
    def __init__(self, session, model):
        self.session = session
        self.model = model

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        if self.model is self.session.student_result_model:
            return self.session.student_result_lookup
        return None


class FakeSession:
    def __init__(self) -> None:
        self.added = []
        self.deleted = []
        self.flush_count = 0
        self.commit_count = 0
        self.refresh_count = 0
        self.objects_by_key = {}
        self.student_result_lookup = None
        self.student_result_model = None

    def add(self, obj):
        if getattr(obj, "id", None) is None:
            obj.id = len([item for item in self.added if hasattr(item, "id")]) + 1
        self.added.append(obj)

    def delete(self, obj):
        self.deleted.append(obj)

    def flush(self):
        self.flush_count += 1

    def commit(self):
        self.commit_count += 1

    def refresh(self, obj):
        self.refresh_count += 1

    def get(self, model, entity_id):
        return self.objects_by_key.get((model, entity_id))

    def query(self, model):
        return FakeQuery(self, model)


def test_create_exam_records_operational_history(monkeypatch) -> None:
    from app.services import domain

    audit_calls = []
    change_calls = []

    monkeypatch.setattr(domain, "Exam", FakeExam)
    monkeypatch.setattr(domain, "log_audit", lambda *args, **kwargs: audit_calls.append(kwargs))
    monkeypatch.setattr(domain, "log_change", lambda *args, **kwargs: change_calls.append(kwargs))

    db = FakeSession()
    exam = create_exam(
        db,
        ExamCreate(
            academy_id=1,
            subject_id=2,
            name="5월 모의고사",
            exam_date=date(2026, 5, 1),
            total_score=100,
        ),
        actor_user_id=7,
    )

    assert exam.name == "5월 모의고사"
    assert db.commit_count == 1
    assert db.refresh_count == 1
    assert len(db.added) == 1
    assert audit_calls
    assert change_calls


def test_create_question_stores_unit_mappings(monkeypatch) -> None:
    from app.services import domain

    audit_calls = []
    change_calls = []

    monkeypatch.setattr(domain, "Question", FakeQuestion)
    monkeypatch.setattr(domain, "QuestionUnitMapping", FakeQuestionUnitMapping)
    monkeypatch.setattr(domain, "log_audit", lambda *args, **kwargs: audit_calls.append(kwargs))
    monkeypatch.setattr(domain, "log_change", lambda *args, **kwargs: change_calls.append(kwargs))

    db = FakeSession()
    question = create_question(
        db,
        QuestionCreate(
            exam_id=1,
            number=3,
            difficulty=2,
            points=4,
            question_type="객관식",
            estimated_seconds=90,
            unit_mappings=[
                {"unit_id": 2, "weight": 0.7},
                {"unit_id": 3, "weight": 0.3},
            ],
        ),
        actor_user_id=9,
    )

    assert question.number == 3
    assert len(question.unit_mappings) == 2
    assert db.commit_count == 1
    assert audit_calls
    assert change_calls


def test_update_question_records_mapping_changes(monkeypatch) -> None:
    from app.services import domain

    audit_calls = []
    change_calls = []
    monkeypatch.setattr(domain, "QuestionUnitMapping", FakeQuestionUnitMapping)
    monkeypatch.setattr(domain, "log_audit", lambda *args, **kwargs: audit_calls.append(kwargs))
    monkeypatch.setattr(domain, "log_change", lambda *args, **kwargs: change_calls.append(kwargs))

    existing_mapping = FakeQuestionUnitMapping(question_id=1, unit_id=1, weight=1.0)
    question = FakeQuestion(
        exam_id=1,
        number=2,
        difficulty=3,
        points=5,
        question_type="서술형",
        estimated_seconds=120,
    )
    question.id = 1
    question.unit_mappings = [existing_mapping]

    db = FakeSession()
    updated = update_question(
        db,
        question,
        QuestionUpdate(difficulty=4, unit_mappings=[{"unit_id": 2, "weight": 1.0}]),
        actor_user_id=11,
    )

    assert updated.difficulty == 4
    assert len(updated.unit_mappings) == 1
    assert updated.unit_mappings[0].unit_id == 2
    assert db.deleted == [existing_mapping]
    assert audit_calls
    assert any(call["field_name"] == "unit_mappings" for call in change_calls)


def test_upsert_student_result_recalculates_analysis(monkeypatch) -> None:
    from app.services import domain

    audit_calls = []
    change_calls = []
    recalc_calls = []

    monkeypatch.setattr(domain, "StudentResult", FakeStudentResult)
    monkeypatch.setattr(domain, "log_audit", lambda *args, **kwargs: audit_calls.append(kwargs))
    monkeypatch.setattr(domain, "log_change", lambda *args, **kwargs: change_calls.append(kwargs))
    monkeypatch.setattr(domain, "recalculate_student_analysis", lambda *args, **kwargs: recalc_calls.append(kwargs))

    db = FakeSession()
    db.student_result_model = domain.StudentResult
    db.objects_by_key[(domain.Exam, 5)] = SimpleNamespace(id=5, subject_id=2)
    db.objects_by_key[(domain.StudentProfile, 8)] = SimpleNamespace(id=8)

    result = upsert_student_result(
        db,
        StudentResultUpsert(
            student_profile_id=8,
            exam_id=5,
            raw_score=84,
            percentile=88,
            grade=2,
            completed_in_seconds=3100,
            question_breakdown={"1": {"correct": True}},
            result_metadata={"source": "manual"},
        ),
        actor_user_id=4,
        recalculate=True,
    )

    assert result.subject_id == 2
    assert db.commit_count == 1
    assert audit_calls
    assert change_calls
    assert recalc_calls
