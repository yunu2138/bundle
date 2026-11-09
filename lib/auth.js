import { createHash, randomBytes } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getSupabase } from "./supabase.js";

const hashCode = (code) => createHash("sha256").update(code).digest("hex");

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
}
