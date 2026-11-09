import { HttpError } from "./api.js";

export async function moderateSchedule(schedule) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new HttpError(503, "AI 검열 설정이 없어 일정을 저장할 수 없어요.");
  }

  const text = [schedule.title, schedule.content, schedule.materials].join("\n");
  const containsPersonalData =
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text) ||
    /\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b/.test(text) ||
    /\b\d{6}[-\s]?[1-4]\d{6}\b/.test(text);
  if (containsPersonalData) {
    throw new HttpError(400, "이메일·전화번호 등 개인정보는 일정에 입력할 수 없어요.");
  }

  const input = [
    `과목: ${schedule.subject}`,
    `일정 종류: ${schedule.type}`,
    `제목: ${schedule.title}`,
    `내용: ${schedule.content}`,
    `준비물: ${schedule.materials}`,
  ].join("\n");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`AI moderation returned HTTP ${response.status}`);
      throw new HttpError(503, "AI 검열을 완료하지 못해 일정을 저장하지 않았어요. 잠시 후 다시 시도해 주세요.");
    }

    const result = await response.json();
    const flagged = result?.results?.[0]?.flagged;
    if (typeof flagged !== "boolean") {
      console.error("AI moderation returned an invalid response");
      throw new HttpError(503, "AI 검열 응답을 확인할 수 없어 일정을 저장하지 않았어요.");
    }
    if (flagged) {
      throw new HttpError(422, "AI 검열 결과 등록할 수 없는 내용이 포함되어 있어요.");
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error("AI moderation request failed");
    throw new HttpError(503, "AI 검열에 연결하지 못해 일정을 저장하지 않았어요. 잠시 후 다시 시도해 주세요.");
  } finally {
    clearTimeout(timeout);
  }
}
