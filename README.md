# 우리반 일정

## 로컬 실행

1. Node.js를 설치하고 `npm install`을 실행합니다.
2. `.env.example`을 복사해 `.env.local`로 저장하고 서버 환경변수를 입력합니다.
3. `npm run dev`로 개발 서버를 실행합니다.

`OPENAI_API_KEY`는 OpenAI Moderation API를 위한 서버 전용 키입니다. 브라우저에 공개되는 `VITE_` 접두사를 붙이지 마세요. 일정 저장·수정은 AI 검열이 성공해야 진행됩니다. 검열은 부적절한 콘텐츠를 찾기 위한 것이며, 일정의 사실 여부나 과목 적합성을 보증하지 않습니다. 이메일·전화번호 등 명시적인 개인정보 패턴은 AI에 보내기 전에 차단합니다.

## 기존 Supabase에 2학년 반 제거 적용

Supabase SQL Editor에서 `supabase/grade2-subject-based.sql`을 실행합니다. 기존 2학년 반별 일정은 반 정보를 없애고 2학년 과목 일정으로 전환합니다. 과목명 제약도 새 학년별 과목을 허용하도록 갱신하며, 이후 2학년 반 번호는 DB 제약에서도 허용되지 않습니다. 시연 데이터도 최신 과목명으로 바꾸려면 그 뒤 `supabase/seed.sql`을 다시 실행합니다.

## 서버 환경변수

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

`SUPABASE_SERVICE_ROLE_KEY`와 `OPENAI_API_KEY`는 서버에서만 사용합니다.

로그인 없이 누구나 모든 일정의 추가·수정·삭제와 관리자 비밀번호 변경을 할 수 있습니다. 관리 화면의 비밀번호 변경에 `password.<숫자>`를 입력하면 뒤 숫자로 저장된 비밀번호 값을 바꿉니다. 비밀번호 값은 접근을 제한하지 않습니다. Supabase를 사용하는 환경은 `supabase/admin-credentials.sql`을 SQL Editor에서 한 번 실행해야 합니다. 로컬에서는 `.env.local`에 비밀번호 값이 저장됩니다.

## 배포

GitHub Pages는 정적 파일만 제공하므로 일정 API를 실행할 수 없습니다. API가 필요한 사이트는 GitHub 저장소를 Vercel 프로젝트로 가져와 배포하세요. 저장소의 `vercel.json`이 빌드 설정을 지정하고 Vercel은 `api/` 서버 함수를 자동으로 연결합니다. Vercel 프로젝트에 위 환경변수를 등록하고 `supabase/admin-credentials.sql`을 실행한 뒤, Vercel 배포 URL에서 일정 관리를 이용하세요. GitHub Pages 주소에서는 일정 관리와 비밀번호 변경 API가 동작하지 않습니다.
