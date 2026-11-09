import {
  handleApiError,
  readJsonBody,
  rejectMethod,
  sendJson,
} from "../lib/api.js";
import { isAdminCode, issueToken } from "../lib/auth.js";

const INVALID_CODE_MESSAGE = "비밀번호가 올바르지 않아요.";
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export default async function handler(req, res) {
  if (req.method !== "POST") return rejectMethod(res, ["POST"]);

  try {
    const { code } = readJsonBody(req);
    if (typeof code !== "string" || !code.trim() || !(await isAdminCode(code.trim()))) {
      await wait(500);
      return sendJson(res, 401, { error: INVALID_CODE_MESSAGE });
    }

    return sendJson(res, 200, {
      role: "admin",
      token: issueToken(code.trim()),
    });
  } catch (error) {
    return handleApiError(res, error, "POST /api/verify-code");
  }
}
