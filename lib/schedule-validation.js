import dayjs from "dayjs";
import {
  CLASSES_PER_GRADE,
  GRADES,
  LEGACY_SUBJECTS,
  SCHEDULE_TYPES,
  SCHOOL_SUBJECT,
  getSubjectsForGrade,
} from "../src/config.js";
import { HttpError } from "./api.js";

const legacySubjects = new Set(LEGACY_SUBJECTS);
const allowedTypes = new Set(SCHEDULE_TYPES.map((item) => item.value));
const isValidGrade = (value) => Number.isInteger(value) && GRADES.includes(value);
const isValidClassNo = (value) =>
  value === null ||
  (Number.isInteger(value) && value >= 1 && value <= CLASSES_PER_GRADE);

function characterLength(value) {
  return [...value].length;
}

function isValidDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    dayjs(value).isValid() &&
    dayjs(value).format("YYYY-MM-DD") === value
  );
}

function readText(value, field, maximum, optional = false) {
  if (value === undefined && optional) return "";
  if (typeof value !== "string" || characterLength(value) > maximum) {
    throw new HttpError(400, `${field}은(는) ${maximum}자 이내로 입력해 주세요.`);
  }
  return value.trim();
}

export function validateSchedulePayload(body) {
  const grade = body.grade;
  const classNo = body.class_no;
  const subject = body.subject;
  const type = body.type;
  const title = readText(body.title, "제목", 40);
  const content = readText(body.content, "범위·내용", 500, true);
  const materials = readText(body.materials, "준비물", 200, true);
  const weight =
    body.weight === undefined || body.weight === null || body.weight === ""
      ? null
      : readText(body.weight, "반영 비율", 20);
  const startDate = body.start_date;
  const endDate = body.end_date === "" ? null : body.end_date ?? null;

  if (!isValidGrade(grade)) {
    throw new HttpError(400, "학년을 확인해 주세요.");
  }
  if (!isValidClassNo(classNo)) {
    throw new HttpError(400, "반을 확인해 주세요.");
  }
  if (grade === 2 && classNo !== null) {
    throw new HttpError(400, "2학년 일정은 반을 지정하지 않아요.");
  }
  if (!allowedTypes.has(type)) {
    throw new HttpError(400, "일정 종류를 확인해 주세요.");
  }
  if (!title) {
    throw new HttpError(400, "제목을 입력해 주세요.");
  }
  if (!isValidDate(startDate) || (endDate !== null && !isValidDate(endDate))) {
    throw new HttpError(400, "날짜를 확인해 주세요.");
  }
  if (endDate && endDate < startDate) {
    throw new HttpError(400, "종료일은 시작일보다 빠를 수 없어요.");
  }

  const isSchoolDate = type === "event" || type === "holiday";
  if (
    subject !== SCHOOL_SUBJECT &&
    !getSubjectsForGrade(grade).includes(subject) &&
    !legacySubjects.has(subject)
  ) {
    throw new HttpError(400, "과목을 확인해 주세요.");
  }
  if ((subject === SCHOOL_SUBJECT) !== isSchoolDate) {
    throw new HttpError(400, "학교 행사와 휴일은 과목을 '학교'로 선택해 주세요.");
  }

  return {
    grade,
    class_no: classNo,
    subject,
    type,
    title,
    start_date: startDate,
    end_date: endDate,
    content,
    materials,
    weight,
    updated_by_label: "관리자",
  };
}

export function validatePublicGrade2Schedule(schedule) {
  if (
    schedule.grade !== 2 ||
    schedule.class_no !== null ||
    !getSubjectsForGrade(2).includes(schedule.subject) ||
    !["performance", "exam", "assignment", "other"].includes(schedule.type)
  ) {
    throw new HttpError(403, "2학년 과목 일정만 수정할 수 있어요.");
  }
}
