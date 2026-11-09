import dayjs from "dayjs";
import { SCHEDULE_TYPES } from "../config.js";

function ScheduleDetailModal({ schedule, prepared, onTogglePrepared, onClose }) {
  const type = SCHEDULE_TYPES.find((item) => item.value === schedule.type);
  const daysUntil = dayjs(schedule.start_date).startOf("day").diff(dayjs().startOf("day"), "day");
  const countdown =
    daysUntil === 0 ? "D-DAY" : daysUntil > 0 ? `D-${daysUntil}` : `D+${Math.abs(daysUntil)}`;
  const dateLabel = schedule.end_date
    ? `${dayjs(schedule.start_date).format("M월 D일")} ~ ${dayjs(schedule.end_date).format("M월 D일")}`
    : dayjs(schedule.start_date).format("M월 D일");

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="schedule-detail-title"
        aria-modal="true"
        className="mobile-dialog w-full rounded-t-3xl bg-white p-5 shadow-xl dark:bg-slate-900 sm:max-w-lg sm:rounded-3xl sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`type-badge type-${type?.color}`}>{type?.label}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{schedule.subject}</span>
          </div>
          <button
            aria-label="상세 창 닫기"
            className="touch-target -mr-2 -mt-2 rounded-full text-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{dateLabel}</p>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{countdown}</span>
        </div>
        <h2
          className="mt-2 text-2xl font-bold leading-snug text-slate-900 dark:text-white"
          id="schedule-detail-title"
        >
          {schedule.title}
        </h2>
        <dl className="mt-6 space-y-4 text-sm">
          {schedule.content && (
            <div>
              <dt className="font-semibold text-slate-800 dark:text-slate-100">범위·내용</dt>
              <dd className="mt-1 whitespace-pre-wrap leading-6 text-slate-600 dark:text-slate-300">
                {schedule.content}
              </dd>
            </div>
          )}
          {schedule.materials && (
            <div>
              <dt className="font-semibold text-slate-800 dark:text-slate-100">준비물</dt>
              <dd className="mt-1 text-slate-600 dark:text-slate-300">{schedule.materials}</dd>
            </div>
          )}
          {schedule.weight && (
            <div>
              <dt className="font-semibold text-slate-800 dark:text-slate-100">반영 비율</dt>
              <dd className="mt-1 text-slate-600 dark:text-slate-300">{schedule.weight}</dd>
            </div>
          )}
        </dl>
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>
            {schedule.class_no
              ? "우리 반 일정"
              : schedule.grade === 2
                ? schedule.subject === "학교"
                  ? "학년 공통"
                  : "2학년 과목 일정"
                : "학년 공통"}
          </span>
          <span>
            {schedule.updated_by_label} · {dayjs(schedule.updated_at).format("M월 D일")} 수정
          </span>
        </div>
        <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <input
            checked={prepared}
            className="h-5 w-5 accent-indigo-600"
            onChange={onTogglePrepared}
            type="checkbox"
          />
          준비 완료
        </label>
      </section>
    </div>
  );
}

export default ScheduleDetailModal;
