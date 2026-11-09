import {
  handleApiError,
  HttpError,
  readJsonBody,
  rejectMethod,
  sendJson,
} from "../lib/api.js";
import { changeAdminCode } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return rejectMethod(res, ["POST"]);

  try {
    const { command } = readJsonBody(req);
    const match =
      typeof command === "string" && command.match(/^password\.(\d{1,64})$/);
    if (!match) {
      throw new HttpError(400, "password. 뒤에 새 숫자 비밀번호를 입력해 주세요.");
    }

    await changeAdminCode(match[1]);
    return sendJson(res, 200, { success: true });
  } catch (error) {
    return handleApiError(res, error, "POST /api/admin-password");
  }
}
