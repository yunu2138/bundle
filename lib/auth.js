import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import jwt from "jsonwebtoken";
import { HttpError } from "./api.js";
import { getSupabase } from "./supabase.js";

const hashCode = (code) => createHash("sha256").update(code).digest("hex");

async function getAdminCodeHash() {
  if (process.env.SUPABASE_URL) {
    const { data, error } = await getSupabase()
      .from("admin_credentials")
      .select("code_hash")
      .eq("id", true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (data) return data.code_hash;
  }

  const adminCode = process.env.ADMIN_CODE;
  if (!adminCode) {
    throw new Error("ADMIN_CODE 환경변수가 없습니다.");
  }
  return hashCode(adminCode);
}

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

export async function isAdminCode(code) {
  const receivedHash = Buffer.from(hashCode(code), "hex");
  const expectedHash = Buffer.from(await getAdminCodeHash(), "hex");
  return timingSafeEqual(receivedHash, expectedHash);
}

export async function changeAdminCode(code) {
  const codeHash = hashCode(code);
  if (process.env.SUPABASE_URL) {
    const { error } = await getSupabase()
      .from("admin_credentials")
      .upsert({ id: true, code_hash: codeHash }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return;
  }

  const envPath = join(process.cwd(), ".env.local");
  let envContent = "";
  try {
    envContent = await readFile(envPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const setting = /^ADMIN_CODE=.*$/m;
  const nextContent = setting.test(envContent)
    ? envContent.replace(setting, `ADMIN_CODE=${code}`)
    : `${envContent}${envContent && !envContent.endsWith("\n") ? "\n" : ""}ADMIN_CODE=${code}\n`;
  const tempPath = `${envPath}.${randomBytes(8).toString("hex")}.tmp`;
  try {
    await writeFile(tempPath, nextContent, "utf8");
    await rename(tempPath, envPath);
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") throw cleanupError;
    }
    throw error;
  }
  process.env.ADMIN_CODE = code;
}
