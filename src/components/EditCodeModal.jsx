import { useState } from "react";
import { readJsonResponse } from "../lib/api-response.js";

function EditCodeModal({ onClose, onVerified }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (isChecking) return;

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
        setMessage(body.error || "비밀번호를 확인하지 못했어요.");
        return;
      }
      if (body.role !== "admin" || typeof body.token !== "string") {
        throw new Error("인증 서버 응답을 확인하지 못했어요.");
      }
      onVerified({ role: body.role, token: body.token });
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
            <h2
              className="mt-1 text-2xl font-bold text-slate-900 dark:text-white"
              id="edit-code-title"
            >
              관리자 비밀번호 입력
            </h2>
          </div>
          <button
            aria-label="비밀번호 입력 창 닫기"
            className="touch-target -mr-2 -mt-2 rounded-full px-3 text-2xl text-slate-500"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          비밀번호를 아는 사람은 누구나 관리 모드를 사용할 수 있어요.
        </p>
        <form className="mt-5" onSubmit={submit}>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            관리자 비밀번호
            <input
              autoComplete="current-password"
              className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-950"
              disabled={isChecking}
              inputMode="numeric"
              onChange={(event) => setCode(event.target.value)}
              required
              type="password"
              value={code}
            />
          </label>
          {message && (
            <p aria-live="polite" className="mt-3 text-sm font-medium text-rose-700 dark:text-rose-300">
              {message}
            </p>
          )}
          <button
            className="touch-target mt-5 w-full rounded-xl bg-indigo-600 font-bold text-white disabled:opacity-60"
            disabled={isChecking || !code.trim()}
            type="submit"
          >
            {isChecking ? "비밀번호 확인 중…" : "관리 모드 시작"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default EditCodeModal;
