import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
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

  if (!process.env.ADMIN_CODE) {
    throw new Error("ADMIN_CODE 환경변수가 없습니다.");
  }
  return hashCode(process.env.ADMIN_CODE);
}

function getTokenSecret() {
  const secret = process.env.TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("TOKEN_SECRET 환경변수는 32자 이상이어야 합니다.");
  }
  return secret;
}

function credentialVersion(codeHash) {
  return createHmac("sha256", getTokenSecret()).update(codeHash).digest("hex");
}

export function issueToken(code) {
  return jwt.sign(
    { role: "admin", credentialVersion: credentialVersion(hashCode(code)) },
    getTokenSecret(),
    {
      algorithm: "HS256",
      expiresIn: "2h",
      issuer: "schedule-management",
    },
  );
}

export async function requireToken(req) {
  const authorization = req.headers?.authorization;
  const match =
    typeof authorization === "string" && authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new HttpError(401, "관리자 비밀번호를 다시 입력해 주세요.");
  }

  let claims;
  try {
    claims = jwt.verify(match[1], getTokenSecret(), {
      algorithms: ["HS256"],
      issuer: "schedule-management",
    });
  } catch {
    throw new HttpError(401, "관리자 인증이 만료됐어요. 비밀번호를 다시 입력해 주세요.");
  }

  if (
    !claims ||
    typeof claims !== "object" ||
    claims.role !== "admin" ||
    typeof claims.credentialVersion !== "string"
  ) {
    throw new HttpError(401, "관리자 인증이 만료됐어요. 비밀번호를 다시 입력해 주세요.");
  }

  const expectedVersion = credentialVersion(await getAdminCodeHash());
  const received = Buffer.from(claims.credentialVersion, "hex");
  const expected = Buffer.from(expectedVersion, "hex");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new HttpError(401, "관리자 인증이 만료됐어요. 비밀번호를 다시 입력해 주세요.");
  }
  return { role: "admin" };
}

export async function isAdminCode(code) {
  const receivedHash = Buffer.from(hashCode(code), "hex");
  const expectedHex = await getAdminCodeHash();
  if (typeof expectedHex !== "string" || !/^[a-f\d]{64}$/i.test(expectedHex)) {
    throw new Error("저장된 관리자 비밀번호 형식이 올바르지 않습니다.");
  }
  return timingSafeEqual(receivedHash, Buffer.from(expectedHex, "hex"));
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
