import { handleApiError, HttpError, readJsonBody, rejectMethod, sendJson } from "../lib/api.js";
import { isAdminCode, issueToken } from "../lib/auth.js";

const INVALID_CODE_MESSAGE = "코드가 올바르지 않아요.";
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function rejectInvalidCode(res) {
  await wait(1000);
  return sendJson(res, 401, { error: INVALID_CODE_MESSAGE });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return rejectMethod(res, ["POST"]);

  try {
    const { code } = readJsonBody(req);
    if (typeof code !== "string" || !code.trim()) {
      return rejectInvalidCode(res);
    }

    const normalizedCode = code.trim();
    if (await isAdminCode(normalizedCode)) {
      const token = issueToken({ role: "admin" });
      return sendJson(res, 200, { role: "admin", token });
    }

    return rejectInvalidCode(res);
  } catch (error) {
    return handleApiError(res, error, "POST /api/verify-code");
  }
}
