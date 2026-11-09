import { useState } from "react";
import {
  CLASSES_PER_GRADE,
  GRADES,
  GRADES_WITHOUT_CLASSES,
  SCHEDULE_TYPES,
  SCHOOL_SUBJECT,
  getSubjectsForGrade,
} from "../config.js";

function ScheduleEditorModal({
  identity,
  schedule,
  defaultGrade,
  defaultClassNo,
  saving,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => ({
    grade: schedule?.grade ?? defaultGrade,
    class_no: schedule ? schedule.class_no : defaultClassNo,
    subject: schedule?.subject ?? getSubjectsForGrade(schedule?.grade ?? defaultGrade)[0],
    type: schedule?.type ?? "performance",
    title: schedule?.title ?? "",
    start_date: schedule?.start_date ?? "",
    end_date: schedule?.end_date ?? "",
    content: schedule?.content ?? "",
    materials: schedule?.materials ?? "",
    weight: schedule?.weight ?? "",
  }));
  const [formError, setFormError] = useState("");
  const isAdmin = identity.role === "admin";
  const availableTypes = SCHEDULE_TYPES.filter(
    (item) => isAdmin || !["event", "holiday"].includes(item.value),
  );
  const gradeSubjects = getSubjectsForGrade(form.grade);
  const availableSubjects =
    schedule?.grade === form.grade && !gradeSubjects.includes(schedule.subject)
      ? [...gradeSubjects, schedule.subject]
      : gradeSubjects;

  const changeGrade = (grade) => {
    setForm((current) => {
      const subjects = getSubjectsForGrade(grade);
      return {
        ...current,
        grade,
        class_no: GRADES_WITHOUT_CLASSES.includes(grade) ? null : current.class_no,
        subject:
          current.subject === SCHOOL_SUBJECT || subjects.includes(current.subject)
            ? current.subject
            : subjects[0],
      };
    });
  };

  const changeType = (type) => {
    setForm((current) => ({
      ...current,
      type,
      subject:
        type === "event" || type === "holiday"
          ? SCHOOL_SUBJECT
          : current.subject === SCHOOL_SUBJECT
            ? getSubjectsForGrade(current.grade)[0]
            : current.subject,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    try {
      await onSave({
        ...form,
        grade: Number(form.grade),
        class_no:
          form.class_no === null || form.class_no === ""
            ? null
            : Number(form.class_no),
        end_date: form.end_date || null,
        content: form.content.trim(),
        materials: form.materials.trim(),
        weight: form.weight.trim() || null,
      });
    } catch (error) {
      setFormError(error.message);
    }
  };

  const inputClass =
    "mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-950";
  const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-200";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-5">
      <section
        aria-labelledby="schedule-editor-title"
        aria-modal="true"
        className="mobile-dialog w-full rounded-t-3xl bg-white p-5 shadow-xl dark:bg-slate-900 sm:max-w-xl sm:rounded-3xl sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {schedule ? "일정 내용 수정" : "새 일정을 등록해요"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white" id="schedule-editor-title">
              일정 {schedule ? "수정" : "추가"}
            </h2>
          </div>
          <button
            aria-label="일정 입력 창 닫기"
            className="touch-target -mr-2 -mt-2 rounded-full px-3 text-2xl text-slate-500"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <label className={labelClass}>
              학년
              <select
                className={inputClass}
                disabled={!isAdmin}
                onChange={(event) => changeGrade(Number(event.target.value))}
                value={form.grade}
              >
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}학년
                  </option>
                ))}
              </select>
            </label>
            {isAdmin && !GRADES_WITHOUT_CLASSES.includes(form.grade) && (
              <label className={labelClass}>
                일정 범위
                <select
                  className={inputClass}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      class_no: event.target.value === "" ? null : Number(event.target.value),
                    }))
                  }
                  value={form.class_no ?? ""}
                >
                  <option value="">학년 공통 일정</option>
                  {Array.from({ length: CLASSES_PER_GRADE }, (_, index) => index + 1).map(
                    (classNo) => (
                      <option key={classNo} value={classNo}>
                        {classNo}반 일정
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <label className={labelClass}>
              일정 종류
              <select
                className={inputClass}
                onChange={(event) => changeType(event.target.value)}
                value={form.type}
              >
                {availableTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              과목
              <select
                className={inputClass}
                disabled={form.type === "event" || form.type === "holiday"}
                onChange={(event) =>
                  setForm((current) => ({ ...current, subject: event.target.value }))
                }
                value={form.subject}
              >
                {form.subject === SCHOOL_SUBJECT && <option value={SCHOOL_SUBJECT}>학교</option>}
                {availableSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            제목
            <input
              className={inputClass}
              maxLength={40}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
              value={form.title}
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <label className={labelClass}>
              시작 날짜
              <input
                className={inputClass}
                onChange={(event) =>
                  setForm((current) => ({ ...current, start_date: event.target.value }))
                }
                required
                type="date"
                value={form.start_date}
              />
            </label>
            <label className={labelClass}>
              종료 날짜
              <input
                className={inputClass}
                min={form.start_date || undefined}
                onChange={(event) =>
                  setForm((current) => ({ ...current, end_date: event.target.value }))
                }
                type="date"
                value={form.end_date}
              />
            </label>
          </div>
          <label className={labelClass}>
            범위·내용
            <textarea
              className={`${inputClass} min-h-24 py-3`}
              maxLength={500}
              onChange={(event) =>
                setForm((current) => ({ ...current, content: event.target.value }))
              }
              rows={3}
              value={form.content}
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <label className={labelClass}>
              준비물
              <input
                className={inputClass}
                maxLength={200}
                onChange={(event) =>
                  setForm((current) => ({ ...current, materials: event.target.value }))
                }
                value={form.materials}
              />
            </label>
            <label className={labelClass}>
              반영 비율
              <input
                className={inputClass}
                maxLength={20}
                onChange={(event) =>
                  setForm((current) => ({ ...current, weight: event.target.value }))
                }
                placeholder="예: 20%"
                value={form.weight}
              />
            </label>
          </div>
          {formError && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
              {formError}
            </p>
          )}
          <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 flex gap-2 border-t border-slate-100 bg-white/95 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6">
            <button
              className="touch-target flex-1 rounded-xl border border-slate-200 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              onClick={onClose}
              type="button"
            >
              취소
            </button>
            <button
              className="touch-target flex-1 rounded-xl bg-indigo-600 font-bold text-white disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ScheduleEditorModal;
