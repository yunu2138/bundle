# 우리반 일정

## 로컬 실행

1. Node.js를 설치하고 `npm install`을 실행합니다.
2. `.env.example`을 복사해 `.env.local`로 저장하고 서버 환경변수를 입력합니다.
3. `npm run dev`로 개발 서버를 실행합니다.

`OPENAI_API_KEY`는 OpenAI Moderation API를 위한 서버 전용 키입니다. 브라우저에 공개되는 `VITE_` 접두사를 붙이지 마세요. 일정 저장·수정은 AI 검열이 성공해야 진행됩니다. 검열은 부적절한 콘텐츠를 찾기 위한 것이며, 일정의 사실 여부나 과목 적합성을 보증하지 않습니다. 이메일·전화번호 등 명시적인 개인정보 패턴은 AI에 보내기 전에 차단합니다.

## 기존 Supabase에 2학년 반 제거 적용

Supabase SQL Editor에서 `supabase/grade2-subject-based.sql`을 실행합니다. 기존 2학년 반별 일정은 반 정보를 없애고 2학년 과목 일정으로 전환합니다. 과목명 제약도 새 학년별 과목을 허용하도록 갱신하며, 이후 2학년 반 번호는 DB 제약에서도 허용되지 않습니다. 시연 데이터도 최신 과목명으로 바꾸려면 그 뒤 `supabase/seed.sql`을 다시 실행합니다.

## Vercel 환경변수

다음 값을 Vercel 프로젝트의 환경변수로 등록하고 재배포합니다.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_CODE`
- `TOKEN_SECRET`
- `OPENAI_API_KEY`

`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_CODE`, `TOKEN_SECRET`, `OPENAI_API_KEY`는 서버에서만 사용합니다.
