import { useEffect, useState } from "react";
import { readJsonResponse } from "../lib/api-response.js";

const ATTEMPT_STORAGE_KEY = "schedule-edit-code-attempts";
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 60_000;

function getAttemptState() {
  try {
    const stored = JSON.parse(localStorage.getItem(ATTEMPT_STORAGE_KEY) || "{}");
    if (Number.isInteger(stored.count) && Number.isFinite(stored.blockedUntil)) {
      if (stored.blockedUntil > Date.now()) return stored;
      if (stored.blockedUntil) return { count: 0, blockedUntil: 0 };
      if (stored.count >= 0 && stored.count < MAX_ATTEMPTS) return stored;
    }
  } catch {
    return { count: 0, blockedUntil: 0 };
  }
  return { count: 0, blockedUntil: 0 };
}

function EditCodeModal({ onClose, onVerified, initialMessage = "" }) {
  const [code, setCode] = useState("");
  const [attemptState, setAttemptState] = useState(getAttemptState);
  const [message, setMessage] = useState(initialMessage);
  const [isChecking, setIsChecking] = useState(false);
  const isLocked = attemptState.blockedUntil > Date.now();
  const remainingSeconds = Math.ceil(
    Math.max(0, attemptState.blockedUntil - Date.now()) / 1000,
  );

  useEffect(() => {
    if (!attemptState.blockedUntil) return undefined;
    const timer = window.setInterval(() => {
      if (attemptState.blockedUntil <= Date.now()) {
        const reset = { count: 0, blockedUntil: 0 };
        localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(reset));
        setAttemptState(reset);
      } else {
        setAttemptState((current) => ({ ...current }));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attemptState.blockedUntil]);

  const submit = async (event) => {
    event.preventDefault();
    if (isLocked || isChecking) return;

    setMessage("");
    setIsChecking(true);
    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = await readJsonResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          const nextCount = attemptState.count + 1;
          const nextState =
            nextCount >= MAX_ATTEMPTS
              ? { count: 0, blockedUntil: Date.now() + LOCK_DURATION_MS }
              : { count: nextCount, blockedUntil: 0 };
          localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(nextState));
          setAttemptState(nextState);
          setMessage(
            nextState.blockedUntil
              ? "코드를 여러 번 확인하지 못했어요. 1분 뒤 다시 입력해 주세요."
              : `${body.error || "코드가 올바르지 않아요."} (${nextCount}/${MAX_ATTEMPTS})`,
          );
        } else {
          setMessage(body.error || "코드를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
        return;
      }

      if (
        typeof body.token !== "string" ||
        body.role !== "admin"
      ) {
        throw new Error("서버 응답을 확인하지 못했어요. 다시 시도해 주세요.");
      }

      localStorage.removeItem(ATTEMPT_STORAGE_KEY);
      onVerified(body);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-5">
      <section
        aria-labelledby="edit-code-title"
        aria-modal="true"
        className="mobile-dialog w-full rounded-t-3xl bg-white p-6 shadow-xl dark:bg-slate-900 sm:max-w-md sm:rounded-3xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">관리 모드</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white" id="edit-code-title">
              편집 코드 입력
            </h2>
          </div>
          <button
            aria-label="편집 코드 입력 창 닫기"
            className="touch-target -mr-2 -mt-2 rounded-full px-3 text-2xl text-slate-500"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          반장 또는 관리자에게 받은 편집 코드를 입력하세요. 계정이나 개인정보는 필요 없어요.
        </p>
        <form className="mt-5" onSubmit={submit}>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            편집 코드
            <input
              autoComplete="one-time-code"
              className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-950"
              disabled={isLocked || isChecking}
              inputMode="numeric"
              onChange={(event) => setCode(event.target.value)}
              required
              type="password"
              value={code}
            />
          </label>
          {isLocked && (
            <p className="mt-2 text-sm font-medium text-rose-700 dark:text-rose-300">
              잠시 입력이 제한됐어요. 약 {remainingSeconds}초 뒤 다시 시도해 주세요.
            </p>
          )}
          {message && (
            <p aria-live="polite" className="mt-3 text-sm font-medium text-rose-700 dark:text-rose-300">
              {message}
            </p>
          )}
          <button
            className="touch-target mt-5 w-full rounded-xl bg-indigo-600 font-bold text-white disabled:opacity-60"
            disabled={isLocked || isChecking || !code.trim()}
            type="submit"
          >
            {isChecking ? "코드 확인 중…" : "관리 모드 시작"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default EditCodeModal;
