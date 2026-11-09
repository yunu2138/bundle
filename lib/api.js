export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function sendJson(res, status, body) {
  return res.status(status).json(body);
}

export function rejectMethod(res, allowed) {
  res.setHeader("Allow", allowed.join(", "));
  return sendJson(res, 405, { error: "지원하지 않는 요청이에요." });
}

export function readJsonBody(req) {
  let body = req.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      throw new HttpError(400, "요청 내용을 확인해 주세요.");
    }
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "요청 내용을 확인해 주세요.");
  }

  return body;
}

export function handleApiError(res, error, context) {
  if (error instanceof HttpError) {
    return sendJson(res, error.status, { error: error.message });
  }

  console.error(`${context}: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
  return sendJson(res, 500, { error: "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요." });
}
