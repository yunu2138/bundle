import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import ScheduleEditorModal from "../components/ScheduleEditorModal.jsx";
import { readJsonResponse } from "../lib/api-response.js";
import {
  CLASSES_PER_GRADE,
  GRADES,
  GRADES_WITHOUT_CLASSES,
  SCHEDULE_TYPES,
} from "../config.js";

async function request(path, options = {}, token) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  const body = await readJsonResponse(response);
  if (!response.ok) {
    const error = new Error(body?.error || "요청을 처리하지 못했어요.");
    error.status = response.status;
    throw error;
  }
  return body;
}

function ManagementPage({ identity, onEnd, onTokenChange }) {
  const [grade, setGrade] = useState(1);
  const [classFilter, setClassFilter] = useState("all");
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [editorSchedule, setEditorSchedule] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordCommand, setPasswordCommand] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const isAdmin = identity.role === "admin";
  const endExpiredSession = useCallback(() => {
    onEnd("관리 요청 권한을 확인할 수 없어 화면을 닫았어요.");
  }, [onEnd]);

  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    const query = new URLSearchParams({
      grade: String(grade),
      class: "all",
    });

    try {
      const data = await request(`/api/schedules?${query}`, {}, identity.token);
      setSchedules(data);
    } catch (error) {
      if (error.status === 401) {
        endExpiredSession();
        return;
      }
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [endExpiredSession, grade, identity.token]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredSchedules = useMemo(
    () =>
      schedules.filter(
        (item) =>
          classFilter === "all" ||
          (classFilter === "common"
            ? item.class_no === null
            : item.class_no === Number(classFilter)),
      ),
    [classFilter, schedules],
  );
  const visibleSchedules = useMemo(
    () =>
      filteredSchedules.filter(
        (item) =>
          showPast || !dayjs(item.end_date || item.start_date).isBefore(dayjs(), "day"),
      ),
    [filteredSchedules, showPast],
  );

  const saveSchedule = async (values) => {
    setSaving(true);
    try {
      const isEditing = Boolean(editorSchedule);
      const path = isEditing
        ? `/api/schedules/${encodeURIComponent(editorSchedule.id)}`
        : "/api/schedules";
      await request(path, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(values),
      }, identity.token);
      setEditorOpen(false);
      setEditorSchedule(null);
      setToast(isEditing ? "일정을 수정했어요." : "일정을 추가했어요.");
      await loadSchedules();
    } catch (error) {
      if (error.status === 401) endExpiredSession();
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteSchedule = async (schedule) => {
    if (!window.confirm(`"${schedule.title}" 일정을 정말 삭제할까요?`)) return;
    try {
      await request(`/api/schedules/${encodeURIComponent(schedule.id)}`, {
        method: "DELETE",
      }, identity.token);
      setToast("일정을 삭제했어요.");
      await loadSchedules();
    } catch (error) {
      if (error.status === 401) {
        endExpiredSession();
        return;
      }
      setToast(error.message);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setChangingPassword(true);
    setPasswordError("");
    try {
      const result = await request("/api/admin-password", {
        method: "POST",
        body: JSON.stringify({ command: passwordCommand }),
      }, identity.token);
      if (typeof result.token !== "string") {
        throw new Error("새 인증 정보를 확인하지 못했어요. 다시 로그인해 주세요.");
      }
      onTokenChange(result.token);
      setPasswordDialogOpen(false);
      setPasswordCommand("");
      setToast("관리자 비밀번호를 변경했어요.");
    } catch (error) {
      if (error.status === 401) {
        endExpiredSession();
        return;
      }
      setPasswordError(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const startCreate = () => {
    setEditorSchedule(null);
    setEditorOpen(true);
  };

  const startEdit = (schedule) => {
    setEditorSchedule(schedule);
    setEditorOpen(true);
  };

  const title = "일정 관리";
  const editorDefaultClass =
    classFilter === "all" ||
    classFilter === "common" ||
    GRADES_WITHOUT_CLASSES.includes(grade)
      ? null
      : Number(classFilter);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-indigo-600 dark:text-indigo-400">
            우리반 일정
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button
              className="touch-target rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              onClick={() => {
                setPasswordError("");
                setPasswordDialogOpen(true);
              }}
              type="button"
            >
              비밀번호 변경
            </button>
          )}
          <button
            className="touch-target rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            onClick={() => onEnd()}
            type="button"
          >
            관리 모드 끝내기
          </button>
        </div>
      </header>

      <>
          {isAdmin ? (
            <div aria-label="학년 선택" className="mt-6 grid grid-cols-3 gap-2">
              {GRADES.map((item) => (
                <button
                  aria-pressed={grade === item}
                  className={`touch-target rounded-xl border font-bold ${
                    grade === item
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                  key={item}
                  onClick={() => {
                    setGrade(item);
                    setClassFilter("all");
                    setShowPast(false);
                  }}
                  type="button"
                >
                  {item}학년
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
              관리자 비밀번호를 입력하면 누구나 일정을 추가·수정·삭제할 수 있어요.
            </p>
          )}

          <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">일정 목록</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {`${grade}학년 일정`}
                </p>
              </div>
              <button
                className="touch-target rounded-xl bg-indigo-600 px-4 font-bold text-white"
                onClick={startCreate}
                type="button"
              >
                일정 추가
              </button>
            </div>
            {isAdmin && !GRADES_WITHOUT_CLASSES.includes(grade) && (
              <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                반별 일정 보기
                <select
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
                  onChange={(event) => setClassFilter(event.target.value)}
                  value={classFilter}
                >
                  <option value="all">학년 전체</option>
                  <option value="common">학년 공통 일정만</option>
                  {Array.from({ length: CLASSES_PER_GRADE }, (_, index) => index + 1).map(
                    (item) => (
                      <option key={item} value={item}>
                        {item}반 일정
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}
            <div className="mt-4">
              {isLoading ? (
                <div aria-label="일정 불러오는 중" className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" key={item} />
                  ))}
                </div>
              ) : loadError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center dark:border-rose-900 dark:bg-rose-950/30">
                  <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">{loadError}</p>
                  <button
                    className="touch-target mt-2 rounded-lg bg-white px-4 text-sm font-semibold dark:bg-slate-900"
                    onClick={loadSchedules}
                    type="button"
                  >
                    다시 시도
                  </button>
                </div>
              ) : visibleSchedules.length ? (
                <div className="space-y-3">
                  {visibleSchedules.map((schedule) => (
                    <ManagedScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      onDelete={deleteSchedule}
                      onEdit={startEdit}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">아직 등록된 일정이 없어요.</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">일정 추가 버튼으로 새 일정을 등록해 보세요.</p>
                </div>
              )}
            </div>
            {filteredSchedules.some((item) =>
              dayjs(item.end_date || item.start_date).isBefore(dayjs(), "day"),
            ) && (
              <button
                aria-expanded={showPast}
                className="touch-target mt-4 w-full rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                onClick={() => setShowPast((value) => !value)}
                type="button"
              >
                {showPast ? "지난 일정 접기" : "지난 일정 보기"}
              </button>
            )}
          </section>
      </>

      {toast && (
        <div
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl dark:bg-slate-100 dark:text-slate-900"
          role="status"
        >
          {toast}
        </div>
      )}

      {passwordDialogOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-5">
          <section
            aria-labelledby="admin-password-title"
            aria-modal="true"
            className="mobile-dialog w-full rounded-t-3xl bg-white p-6 shadow-xl dark:bg-slate-900 sm:max-w-md sm:rounded-3xl"
            role="dialog"
          >
            <h2
              className="text-xl font-bold text-slate-900 dark:text-white"
              id="admin-password-title"
            >
              관리자 비밀번호 변경
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              새 비밀번호를 설정하려면 <code>password.</code> 뒤에 숫자를 입력하세요.
            </p>
            <form className="mt-5" onSubmit={changePassword}>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                변경 명령
                <input
                  autoComplete="new-password"
                  className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-950"
                  disabled={changingPassword}
                  onChange={(event) => setPasswordCommand(event.target.value)}
                  placeholder="password.1234"
                  required
                  type="password"
                  value={passwordCommand}
                />
              </label>
              {passwordError && (
                <p aria-live="polite" className="mt-3 text-sm font-medium text-rose-700 dark:text-rose-300">
                  {passwordError}
                </p>
              )}
              <div className="mt-5 flex gap-2">
                <button
                  className="touch-target flex-1 rounded-xl border border-slate-200 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  disabled={changingPassword}
                  onClick={() => setPasswordDialogOpen(false)}
                  type="button"
                >
                  취소
                </button>
                <button
                  className="touch-target flex-1 rounded-xl bg-indigo-600 font-bold text-white disabled:opacity-60"
                  disabled={changingPassword || !passwordCommand.trim()}
                  type="submit"
                >
                  {changingPassword ? "변경 중…" : "비밀번호 변경"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {editorOpen && (
        <ScheduleEditorModal
          defaultClassNo={editorDefaultClass}
          defaultGrade={grade}
          identity={identity}
          onClose={() => {
            if (!saving) {
              setEditorOpen(false);
              setEditorSchedule(null);
            }
          }}
          onSave={saveSchedule}
          saving={saving}
          schedule={editorSchedule}
        />
      )}
    </main>
  );
}

function ManagedScheduleCard({ schedule, onEdit, onDelete }) {
  const type = SCHEDULE_TYPES.find((item) => item.value === schedule.type);
  const dateLabel = schedule.end_date
    ? `${dayjs(schedule.start_date).format("M월 D일")} ~ ${dayjs(schedule.end_date).format("M월 D일")}`
    : dayjs(schedule.start_date).format("M월 D일");

  return (
    <article
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`type-badge type-${type?.color}`}>{type?.label}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {schedule.class_no
                ? `${schedule.class_no}반`
                : "학년 공통"}
            </span>
          </div>
          <h3 className="mt-2 break-words font-bold text-slate-900 dark:text-white">{schedule.title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {schedule.subject} · {dateLabel}
          </p>
          {schedule.content && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
              {schedule.content}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-400">
            {schedule.updated_by_label} · {dayjs(schedule.updated_at).format("M월 D일")} 수정
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:shrink-0">
            <button
              className="touch-target rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              onClick={() => onEdit(schedule)}
              type="button"
            >
              수정
            </button>
            <button
              className="touch-target rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:text-rose-300"
              onClick={() => onDelete(schedule)}
              type="button"
            >
              삭제
            </button>
        </div>
      </div>
    </article>
  );
}

export default ManagementPage;
