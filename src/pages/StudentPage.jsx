import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import EditCodeModal from "../components/EditCodeModal.jsx";
import ScheduleDetailModal from "../components/ScheduleDetailModal.jsx";
import ManagementPage from "./ManagementPage.jsx";
import {
  CLASSES_PER_GRADE,
  GRADES,
  GRADES_WITHOUT_CLASSES,
  SCHEDULE_TYPES,
  getSubjectsForGrade,
} from "../config.js";

dayjs.locale("ko");

const readStoredValue = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const writeStoredValue = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const dateKey = (date) => dayjs(date).format("YYYY-MM-DD");
const TYPE_BAR_CLASS = {
  orange: "bg-orange-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  gray: "bg-gray-500",
  purple: "bg-purple-500",
};

function decodeTokenClaims(token) {
  const encodedClaims = token?.split(".")[1];
  if (!encodedClaims) return null;

  const unpadded = encodedClaims.replace(/-/g, "+").replace(/_/g, "/");
  const base64 = unpadded.padEnd(Math.ceil(unpadded.length / 4) * 4, "=");
  return JSON.parse(window.atob(base64));
}

function readManagementSession() {
  try {
    const token = sessionStorage.getItem("schedule-management-token");
    if (!token) return null;
    const claims = decodeTokenClaims(token);
    if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) {
      sessionStorage.removeItem("schedule-management-token");
      return null;
    }

    if (claims.role === "admin") {
      return { token, identity: claims, expiresAt: claims.exp * 1000 };
    }
    sessionStorage.removeItem("schedule-management-token");
  } catch {
    sessionStorage.removeItem("schedule-management-token");
  }
  return null;
}

function StudentPage() {
  const [selection, setSelection] = useState(() => {
    const stored = readStoredValue("schedule-selection", null);
    return stored?.grade === 2 ? { ...stored, class_no: null } : stored;
  });
  const [choosing, setChoosing] = useState(!selection);
  const [gradeDraft, setGradeDraft] = useState(selection?.grade ?? null);
  const [selectedSubjects, setSelectedSubjects] = useState(() =>
    readStoredValue("schedule-subject-filters", []),
  );
  const [selectedTypes, setSelectedTypes] = useState(() =>
    readStoredValue("schedule-type-filters", []),
  );
  const [preparedIds, setPreparedIds] = useState(() =>
    readStoredValue("schedule-prepared", []),
  );
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(selection));
  const [loadError, setLoadError] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [view, setView] = useState(() =>
    window.matchMedia("(max-width: 640px)").matches ? "list" : "calendar",
  );
  const [month, setMonth] = useState(dayjs().startOf("month"));
  const [showPast, setShowPast] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [managementSession, setManagementSession] = useState(readManagementSession);
  const [showCodePrompt, setShowCodePrompt] = useState(false);
  const [codePromptMessage, setCodePromptMessage] = useState("");

  const endManagement = (message = "") => {
    sessionStorage.removeItem("schedule-management-token");
    setManagementSession(null);
    setShowCodePrompt(Boolean(message));
    setCodePromptMessage(message);
  };

  const startManagement = (result) => {
    const identity = { role: "admin" };
    const claims = decodeTokenClaims(result.token);
    sessionStorage.setItem("schedule-management-token", result.token);
    setManagementSession({
      token: result.token,
      identity,
      expiresAt: claims.exp * 1000,
    });
    setShowCodePrompt(false);
    setCodePromptMessage("");
  };

  useEffect(() => {
    if (!selection) return undefined;

    const controller = new AbortController();
    const query = new URLSearchParams({
      grade: String(selection.grade),
      class: GRADES_WITHOUT_CLASSES.includes(selection.grade)
        ? "all"
        : String(selection.class_no),
    });

    setIsLoading(true);
    setLoadError(false);
    fetch(`/api/schedules?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "일정을 불러오지 못했어요.");
        }
        if (!Array.isArray(data)) {
          throw new Error("일정 응답 형식이 올바르지 않아요.");
        }
        setSchedules(data);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setLoadError(true);
        setSchedules([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [selection, reloadCount]);

  const visibleSchedules = useMemo(() => {
    if (!selection) return [];
    return schedules
      .filter(
        (item) =>
          item.grade === selection.grade &&
          (GRADES_WITHOUT_CLASSES.includes(selection.grade)
            ? item.class_no === null
            : item.class_no === null || item.class_no === selection.class_no),
      )
      .filter((item) => !selectedSubjects.length || selectedSubjects.includes(item.subject))
      .filter((item) => !selectedTypes.length || selectedTypes.includes(item.type))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, [selection, schedules, selectedSubjects, selectedTypes]);

  const upcoming = visibleSchedules
    .filter((item) => item.start_date >= dateKey(dayjs()))
    .filter((item) => !preparedIds.includes(item.id))
    .slice(0, 3);

  const subjectFilterValues = useMemo(() => {
    if (!selection) return [];
    const gradeSubjects = getSubjectsForGrade(selection.grade);
    const existingSubjects = schedules
      .filter(
        (item) =>
          item.grade === selection.grade &&
          (GRADES_WITHOUT_CLASSES.includes(selection.grade)
            ? item.class_no === null
            : item.class_no === null || item.class_no === selection.class_no),
      )
      .map((item) => item.subject)
      .filter((subject) => subject !== "학교" && !gradeSubjects.includes(subject));
    return [...new Set([...gradeSubjects, ...existingSubjects])];
  }, [schedules, selection]);

  useEffect(() => {
    if (!selection || isLoading) return;
    setSelectedSubjects((current) => {
      const next = current.filter((subject) => subjectFilterValues.includes(subject));
      if (next.length !== current.length) {
        writeStoredValue("schedule-subject-filters", next);
      }
      return next;
    });
  }, [isLoading, selection, subjectFilterValues]);

  const chooseClass = (classNo, grade = gradeDraft) => {
    if (selection?.grade !== grade) {
      setSelectedSubjects([]);
      writeStoredValue("schedule-subject-filters", []);
    }
    const nextSelection = {
      grade,
      class_no: GRADES_WITHOUT_CLASSES.includes(grade) ? null : classNo,
    };
    setSelection(nextSelection);
    writeStoredValue("schedule-selection", nextSelection);
    setChoosing(false);
  };

  const changePrepared = (scheduleId, checked) => {
    const updated = checked
      ? [...new Set([...preparedIds, scheduleId])]
      : preparedIds.filter((id) => id !== scheduleId);
    setPreparedIds(updated);
    writeStoredValue("schedule-prepared", updated);
  };

  const toggleFilter = (value, current, setCurrent, storageKey, allValues) => {
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    const normalized = updated.length === allValues.length ? [] : updated;
    setCurrent(normalized);
    writeStoredValue(storageKey, normalized);
  };

  const clearFilters = (setCurrent, storageKey) => {
    setCurrent([]);
    writeStoredValue(storageKey, []);
  };

  if (managementSession) {
    return (
      <ManagementPage
        identity={managementSession.identity}
        onEnd={endManagement}
        expiresAt={managementSession.expiresAt}
        token={managementSession.token}
      />
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-24 pt-5 sm:px-6 sm:pt-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-indigo-600 dark:text-indigo-400">
            우리 학교 일정 모아보기
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">우리반 일정</h1>
        </div>
        {selection && (
          <button
            className="touch-target rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => {
              setGradeDraft(selection.grade);
              setChoosing(true);
            }}
            type="button"
          >
            {selection.grade}학년
            {selection.class_no ? ` ${selection.class_no}반` : " 과목 전체"} ▾
          </button>
        )}
      </header>

      <section aria-labelledby="upcoming-title" className="mt-7">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white" id="upcoming-title">
            다가오는 일정
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">준비 완료 일정은 숨겨져요</span>
        </div>
        {isLoading ? (
          <div aria-label="일정 불러오는 중" className="-mx-4 flex gap-3 overflow-hidden px-4 sm:mx-0 sm:px-0">
            {[1, 2, 3].map((item) => (
              <div
                className="h-32 min-w-[220px] flex-1 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
                key={item}
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 dark:border-rose-900 dark:bg-rose-950/30">
            <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">일정을 불러오지 못했어요.</p>
            <button
              className="touch-target mt-2 rounded-lg bg-white px-3 text-sm font-semibold text-rose-700 dark:bg-slate-900 dark:text-rose-200"
              onClick={() => setReloadCount((count) => count + 1)}
              type="button"
            >
              다시 시도
            </button>
          </div>
        ) : upcoming.length ? (
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {upcoming.map((item) => {
              const days = dayjs(item.start_date).diff(dayjs().startOf("day"), "day");
              const type = SCHEDULE_TYPES.find((entry) => entry.value === item.type);
              return (
                <button
                  className="min-w-[220px] max-w-[280px] flex-1 snap-start rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  key={item.id}
                  onClick={() => setActiveSchedule(item)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xl font-extrabold ${
                        days <= 3 ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {days === 0 ? "D-DAY" : `D-${days}`}
                    </span>
                    <span className={`type-badge type-${type?.color}`}>{type?.label}</span>
                  </div>
                  <p className="mt-3 truncate font-bold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {item.subject} · {dayjs(item.start_date).format("M월 D일")}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            가까운 일정이 없어요.
          </p>
        )}
      </section>

      <section className="mt-7 space-y-5">
        <FilterGroup
          label="과목"
          values={subjectFilterValues}
          selected={selectedSubjects}
          onToggle={(value) =>
            toggleFilter(
              value,
              selectedSubjects,
              setSelectedSubjects,
              "schedule-subject-filters",
              subjectFilterValues,
            )
          }
          onAll={() => clearFilters(setSelectedSubjects, "schedule-subject-filters")}
        />
        <FilterGroup
          label="일정 종류"
          values={SCHEDULE_TYPES.map((item) => item.label)}
          selected={selectedTypes.map(
            (type) => SCHEDULE_TYPES.find((item) => item.value === type)?.label,
          )}
          onToggle={(label) => {
            const type = SCHEDULE_TYPES.find((item) => item.label === label)?.value;
            if (type) {
              toggleFilter(
                type,
                selectedTypes,
                setSelectedTypes,
                "schedule-type-filters",
                SCHEDULE_TYPES.map((item) => item.value),
              );
            }
          }}
          onAll={() => clearFilters(setSelectedTypes, "schedule-type-filters")}
        />
      </section>

      <section className="mt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">일정 보기</h2>
          <div aria-label="일정 보기 방식" className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {[
              { value: "calendar", label: "달력 보기" },
              { value: "list", label: "목록 보기" },
            ].map((item) => (
              <button
                aria-pressed={view === item.value}
                className={`touch-target rounded-lg px-3 text-sm font-semibold ${
                  view === item.value
                    ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300"
                    : "text-slate-600 dark:text-slate-300"
                }`}
                key={item.value}
                onClick={() => setView(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div aria-label="일정 불러오는 중" className="mt-4 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
                key={item}
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-center dark:border-rose-900 dark:bg-rose-950/30">
            <p className="font-semibold text-rose-800 dark:text-rose-200">일정을 불러오지 못했어요.</p>
            <button
              className="touch-target mt-3 rounded-xl bg-white px-4 text-sm font-semibold text-rose-700 dark:bg-slate-900 dark:text-rose-200"
              onClick={() => setReloadCount((count) => count + 1)}
              type="button"
            >
              다시 시도
            </button>
          </div>
        ) : visibleSchedules.length ? (
          view === "calendar" ? (
            <CalendarView
              month={month}
              schedules={visibleSchedules}
              preparedIds={preparedIds}
              onChangeMonth={setMonth}
              onOpen={setActiveSchedule}
            />
          ) : (
            <ListView
              schedules={visibleSchedules}
              preparedIds={preparedIds}
              showPast={showPast}
              onTogglePast={() => setShowPast((value) => !value)}
              onOpen={setActiveSchedule}
            />
          )
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              아직 등록된 일정이 없어요.
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {selection?.grade === 2
                ? "과목 일정 관리에서 직접 등록할 수 있어요."
                : "반장에게 일정 등록을 부탁해 보세요!"}
            </p>
          </div>
        )}
      </section>

      <section aria-label="일정 종류 범례" className="mt-8 border-t border-slate-200 pt-5 dark:border-slate-800">
        <p className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">일정 종류</p>
        <div className="flex flex-wrap gap-2">
          {SCHEDULE_TYPES.map((type) => (
            <span className={`type-badge type-${type.color}`} key={type.value}>
              <span aria-hidden="true" className="type-dot" />
              {type.label}
            </span>
          ))}
        </div>
      </section>

      <button
        className="touch-target fixed bottom-4 right-4 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        onClick={() => {
          if (selection?.grade === 2) {
            setManagementSession({
              token: null,
              identity: { role: "grade2_public", grade: 2, class_no: null },
              expiresAt: null,
            });
            return;
          }
          setCodePromptMessage("");
          setShowCodePrompt(true);
        }}
        type="button"
      >
        {selection?.grade === 2 ? "2학년 과목 일정 편집" : "일정 관리"}
      </button>

      {showCodePrompt && (
        <EditCodeModal
          initialMessage={codePromptMessage}
          onClose={() => {
            setShowCodePrompt(false);
            setCodePromptMessage("");
          }}
          onVerified={startManagement}
        />
      )}
      {choosing && (
        <ClassPicker
          grade={gradeDraft}
          onChooseGrade={setGradeDraft}
          onChooseClass={chooseClass}
          onClose={selection ? () => setChoosing(false) : undefined}
        />
      )}
      {activeSchedule && (
        <ScheduleDetailModal
          schedule={activeSchedule}
          prepared={preparedIds.includes(activeSchedule.id)}
          onTogglePrepared={(event) =>
            changePrepared(activeSchedule.id, event.currentTarget.checked)
          }
          onClose={() => setActiveSchedule(null)}
        />
      )}
    </main>
  );
}

function ClassPicker({ grade, onChooseGrade, onChooseClass, onClose }) {
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-5">
      <section
        aria-labelledby="class-picker-title"
        aria-modal="true"
        className="mobile-dialog w-full rounded-t-3xl bg-white p-6 shadow-xl dark:bg-slate-900 sm:max-w-lg sm:rounded-3xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">처음 한 번만 선택해요</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white" id="class-picker-title">
              학년을 골라주세요
            </h2>
          </div>
          {onClose && (
            <button
              aria-label="선택 창 닫기"
              className="touch-target rounded-full text-2xl text-slate-500"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          )}
        </div>
        <p className="mt-5 text-sm font-semibold text-slate-700 dark:text-slate-200">학년</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {GRADES.map((item) => (
            <button
              aria-pressed={grade === item}
              className={`touch-target rounded-xl border text-base font-bold ${
                grade === item
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
              }`}
              key={item}
              onClick={() => {
                if (GRADES_WITHOUT_CLASSES.includes(item)) {
                  onChooseClass(null, item);
                } else {
                  onChooseGrade(item);
                }
              }}
              type="button"
            >
              {item}학년
            </button>
          ))}
        </div>
        {grade && !GRADES_WITHOUT_CLASSES.includes(grade) && (
          <>
            <p className="mt-5 text-sm font-semibold text-slate-700 dark:text-slate-200">반</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {Array.from({ length: CLASSES_PER_GRADE }, (_, index) => index + 1).map((classNo) => (
                <button
                  className="touch-target rounded-xl border border-slate-200 text-base font-bold text-slate-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-indigo-950"
                  key={classNo}
                  onClick={() => onChooseClass(classNo, grade)}
                  type="button"
                >
                  {classNo}반
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function FilterGroup({ label, values, selected, onToggle, onAll }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">{label}</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          aria-pressed={!selected.length}
          className={`touch-target shrink-0 rounded-full border px-4 text-sm font-semibold ${
            !selected.length
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          }`}
          onClick={onAll}
          type="button"
        >
          전체
        </button>
        {values.map((value) => (
          <button
            aria-pressed={selected.includes(value)}
            className={`touch-target shrink-0 rounded-full border px-4 text-sm font-semibold ${
              selected.includes(value)
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
            key={value}
            onClick={() => onToggle(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function CalendarView({ month, schedules, preparedIds, onChangeMonth, onOpen }) {
  const firstDay = month.startOf("month");
  const start = firstDay.subtract(firstDay.day(), "day");
  const calendarDays = Array.from({ length: 42 }, (_, index) => start.add(index, "day"));

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <button
          aria-label="이전 달"
          className="touch-target rounded-lg px-3 text-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => onChangeMonth(month.subtract(1, "month"))}
          type="button"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{month.format("YYYY년 M월")}</h3>
          <button
            className="touch-target rounded-lg px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950"
            onClick={() => onChangeMonth(dayjs().startOf("month"))}
            type="button"
          >
            오늘
          </button>
        </div>
        <button
          aria-label="다음 달"
          className="touch-target rounded-lg px-3 text-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => onChangeMonth(month.add(1, "month"))}
          type="button"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 pb-2 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
          <span className={index === 0 ? "text-rose-500" : index === 6 ? "text-blue-500" : ""} key={day}>
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((date) => {
          const events = schedules.filter(
            (item) => item.start_date <= dateKey(date) && (item.end_date || item.start_date) >= dateKey(date),
          );
          const isToday = date.isSame(dayjs(), "day");
          const isCurrentMonth = date.month() === month.month();
          return (
            <div
              className={`min-h-[76px] border-b border-r border-slate-100 p-1 dark:border-slate-800 sm:min-h-[100px] sm:p-2 ${
                !isCurrentMonth ? "bg-slate-50/70 text-slate-400 dark:bg-slate-950/40" : ""
              } ${date.day() === 0 ? "bg-rose-50/40 dark:bg-rose-950/10" : ""} ${
                date.day() === 6 ? "bg-blue-50/40 dark:bg-blue-950/10" : ""
              }`}
              key={date.format("YYYY-MM-DD")}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-indigo-600 font-bold text-white" : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {date.date()}
              </span>
              <div className="mt-1 space-y-1">
                {events.slice(0, 2).map((item) => {
                  const type = SCHEDULE_TYPES.find((entry) => entry.value === item.type);
                  return (
                    <button
                      className={`calendar-event type-${type?.color} ${
                        preparedIds.includes(item.id) ? "opacity-40 line-through" : ""
                      }`}
                      key={item.id}
                      onClick={() => onOpen(item)}
                      title={item.title}
                      type="button"
                    >
                      {item.title}
                    </button>
                  );
                })}
                {events.length > 2 && (
                  <p className="truncate px-1 text-[10px] text-slate-500">+{events.length - 2}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ schedules, preparedIds, showPast, onTogglePast, onOpen }) {
  const today = dayjs().startOf("day");
  const upcomingItems = schedules.filter((item) => !dayjs(item.start_date).isBefore(today, "day"));
  const pastItems = schedules.filter((item) => dayjs(item.start_date).isBefore(today, "day"));
  const thisWeekEnd = today.endOf("week");
  const nextWeekEnd = thisWeekEnd.add(1, "week").endOf("week");
  const groups = [
    { title: "이번 주", items: upcomingItems.filter((item) => !dayjs(item.start_date).isAfter(thisWeekEnd, "day")) },
    {
      title: "다음 주",
      items: upcomingItems.filter(
        (item) => dayjs(item.start_date).isAfter(thisWeekEnd, "day") && !dayjs(item.start_date).isAfter(nextWeekEnd, "day"),
      ),
    },
    { title: "이후", items: upcomingItems.filter((item) => dayjs(item.start_date).isAfter(nextWeekEnd, "day")) },
  ];

  return (
    <div className="mt-4 space-y-5">
      {groups.map((group) => (
        <section key={group.title}>
          <h3 className="mb-2 border-b border-slate-200 pb-2 text-sm font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {group.title}
          </h3>
          {group.items.length ? (
            <div className="space-y-2">
              {group.items.map((item) => (
                <ScheduleRow
                  item={item}
                  prepared={preparedIds.includes(item.id)}
                  onOpen={onOpen}
                  key={item.id}
                />
              ))}
            </div>
          ) : (
            <p className="py-2 text-sm text-slate-400">일정이 없어요.</p>
          )}
        </section>
      ))}
      <button
        aria-expanded={showPast}
        className="touch-target w-full rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        onClick={onTogglePast}
        type="button"
      >
        {showPast ? "지난 일정 접기" : `지난 일정 보기 (${pastItems.length})`}
      </button>
      {showPast && (
        <section>
          <h3 className="mb-2 border-b border-slate-200 pb-2 text-sm font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">
            지난 일정
          </h3>
          <div className="space-y-2">
            {pastItems.length ? (
              pastItems.map((item) => (
                <ScheduleRow
                  item={item}
                  prepared={preparedIds.includes(item.id)}
                  onOpen={onOpen}
                  key={item.id}
                />
              ))
            ) : (
              <p className="py-2 text-sm text-slate-400">지난 일정이 없어요.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function ScheduleRow({ item, prepared, onOpen }) {
  const type = SCHEDULE_TYPES.find((entry) => entry.value === item.type);
  return (
    <button
      className={`flex min-h-[76px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
        prepared ? "opacity-50" : ""
      }`}
      onClick={() => onOpen(item)}
      type="button"
    >
      <div className="w-14 shrink-0 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">{dayjs(item.start_date).format("M월")}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{dayjs(item.start_date).format("D")}</p>
      </div>
      <span className={`h-9 w-1 shrink-0 rounded-full ${TYPE_BAR_CLASS[type?.color] ?? "bg-slate-400"}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`type-badge type-${type?.color}`}>{type?.label}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{item.subject}</span>
        </div>
        <p className={`mt-1 truncate font-bold text-slate-900 dark:text-white ${prepared ? "line-through" : ""}`}>
          {item.title}
        </p>
      </div>
      <span className="text-lg text-slate-400" aria-hidden="true">›</span>
    </button>
  );
}

export default StudentPage;
