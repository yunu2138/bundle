import { handleApiError, HttpError, readJsonBody, rejectMethod, sendJson } from "../lib/api.js";
import { getScheduleWriteIdentity, requireToken } from "../lib/auth.js";
import {
  validatePublicGrade2Schedule,
  validateSchedulePayload,
} from "../lib/schedule-validation.js";
import { moderateSchedule } from "../lib/moderation.js";
import { getSupabase } from "../lib/supabase.js";
import { CLASSES_PER_GRADE, GRADES } from "../src/config.js";

function readQueryInteger(value) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  return Number(value);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const grade = readQueryInteger(req.query.grade);
      const requestedClass = req.query.class;
      if (!GRADES.includes(grade)) {
        throw new HttpError(400, "학년과 반을 확인해 주세요.");
      }

      const allClasses = requestedClass === "all";
      let classNo;
      if (grade === 2) {
        if (!allClasses) {
          throw new HttpError(400, "2학년은 반 없이 과목별 일정을 확인해요.");
        }
        if (req.headers.authorization) requireToken(req);
      } else {
        if (allClasses) {
          requireToken(req);
        } else {
          classNo = readQueryInteger(requestedClass);
          if (!classNo || classNo > CLASSES_PER_GRADE) {
            throw new HttpError(400, "학년과 반을 확인해 주세요.");
          }
        }
      }

      let query = getSupabase().from("schedules").select("*").eq("grade", grade);
      if (grade === 2) {
        query = query.is("class_no", null);
      } else if (!allClasses) {
        query = query.or(`class_no.is.null,class_no.eq.${classNo}`);
      }
      const { data, error } = await query.order("start_date", { ascending: true });

      if (error) throw new Error(error.message);
      return sendJson(res, 200, data);
    } catch (error) {
      return handleApiError(res, error, "GET /api/schedules");
    }
  }

  if (req.method === "POST") {
    try {
      const body = readJsonBody(req);
      const schedule = validateSchedulePayload(body);
      const identity = getScheduleWriteIdentity(req);
      if (identity.role === "grade2_public") {
        validatePublicGrade2Schedule(schedule);
      }
      await moderateSchedule(schedule);
      schedule.updated_by_label =
        identity.role === "grade2_public" ? "2학년 공동" : "관리자";
      const { data, error } = await getSupabase()
        .from("schedules")
        .insert(schedule)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return sendJson(res, 201, data);
    } catch (error) {
      return handleApiError(res, error, "POST /api/schedules");
    }
  }

  return rejectMethod(res, ["GET", "POST"]);
}
