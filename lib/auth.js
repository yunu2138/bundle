import { createHash, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { HttpError } from "./api.js";

function getTokenSecret() {
  const secret = process.env.TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("TOKEN_SECRET 환경변수는 32자 이상이어야 합니다.");
  }
  return secret;
}

export function issueToken(claims) {
  return jwt.sign(claims, getTokenSecret(), { expiresIn: "2h" });
}

export function requireToken(req) {
  const authorization = req.headers.authorization;
  const match =
    typeof authorization === "string" && authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new HttpError(401, "편집 코드를 다시 확인해 주세요.");
  }

  const secret = getTokenSecret();
  let claims;
  try {
    claims = jwt.verify(match[1], secret);
  } catch {
    throw new HttpError(401, "편집 코드를 다시 확인해 주세요.");
  }

  if (!claims || typeof claims !== "object") {
    throw new HttpError(401, "편집 코드를 다시 확인해 주세요.");
  }

  if (claims.role === "admin") return { role: "admin" };
  throw new HttpError(401, "편집 코드를 다시 확인해 주세요.");
}

export function getScheduleWriteIdentity(req) {
  const authorization = req.headers?.authorization;
  if (typeof authorization === "string" && authorization.trim()) {
    return requireToken(req);
  }
  return { role: "grade2_public", grade: 2, class_no: null };
}

export function isAdminCode(code) {
  const adminCode = process.env.ADMIN_CODE;
  if (!adminCode) {
    throw new Error("ADMIN_CODE 환경변수가 없습니다.");
  }

  const receivedHash = createHash("sha256").update(code).digest();
  const expectedHash = createHash("sha256").update(adminCode).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}
