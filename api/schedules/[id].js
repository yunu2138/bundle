import { handleApiError, HttpError, readJsonBody, rejectMethod, sendJson } from "../../lib/api.js";
import {
  validateSchedulePayload,
} from "../../lib/schedule-validation.js";
import { getSupabase } from "../../lib/supabase.js";
import { requireToken } from "../../lib/auth.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readId(value) {
  const id = Array.isArray(value) ? value[0] : value;
  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    throw new HttpError(400, "일정 번호를 확인해 주세요.");
  }
  return id;
}

async function findSchedule(supabase, id) {
  const { data, error } = await supabase
    .from("schedules")
    .select("id, grade, class_no, subject, type")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new HttpError(404, "일정을 찾을 수 없어요.");
  return data;
}

export default async function handler(req, res) {
  if (req.method !== "PUT" && req.method !== "DELETE") {
    return rejectMethod(res, ["PUT", "DELETE"]);
  }

  try {
    await requireToken(req);
    const id = readId(req.query.id);
    const supabase = getSupabase();
    await findSchedule(supabase, id);

    if (req.method === "DELETE") {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return sendJson(res, 200, { success: true });
    }
    const schedule = validateSchedulePayload(readJsonBody(req));
    schedule.updated_by_label = "관리자";
    const { data, error } = await supabase
      .from("schedules")
      .update(schedule)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return sendJson(res, 200, data);
  } catch (error) {
    return handleApiError(res, error, `${req.method} /api/schedules/:id`);
  }
}
