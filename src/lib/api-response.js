export async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!/^application\/(?:[\w.-]+\+)?json(?:\s*;|$)/i.test(contentType)) {
    const hostname = window.location.hostname;
    if (hostname === "github.io" || hostname.endsWith(".github.io")) {
      throw new Error(
        "현재 GitHub Pages 주소에서는 일정 API를 사용할 수 없어요. Vercel에 배포된 사이트 주소에서 이용해 주세요.",
      );
    }
    throw new Error(
      "API 서버가 JSON이 아닌 응답을 보냈어요. API 서버가 배포되어 있는지 확인해 주세요.",
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error("인증 서버 응답을 읽을 수 없어요. 잠시 후 다시 시도해 주세요.");
  }
}
