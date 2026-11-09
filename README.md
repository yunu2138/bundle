# 우리반 일정

## 로컬 실행

1. Node.js를 설치하고 `npm install`을 실행합니다.
2. `.env.example`을 복사해 `.env.local`로 저장하고 서버 환경변수를 입력합니다.
3. `npm run dev`로 개발 서버를 실행합니다.

일정 저장 시 AI 검열은 실행하지 않습니다. 필수 입력값과 일정 형식은 서버에서 계속 검증합니다.

## 기존 Supabase에 2학년 반 제거 적용

Supabase SQL Editor에서 `supabase/grade2-subject-based.sql`을 실행합니다. 기존 2학년 반별 일정은 반 정보를 없애고 2학년 과목 일정으로 전환합니다. 과목명 제약도 새 학년별 과목을 허용하도록 갱신하며, 이후 2학년 반 번호는 DB 제약에서도 허용되지 않습니다. 시연 데이터도 최신 과목명으로 바꾸려면 그 뒤 `supabase/seed.sql`을 다시 실행합니다.

## 서버 환경변수

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_CODE` (초기 비밀번호 또는 Supabase 자격 증명 행이 없을 때의 대체값)
- `TOKEN_SECRET` (32자 이상의 무작위 비밀값)

`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_CODE`, `TOKEN_SECRET`은 서버에서만 사용합니다. 관리자 비밀번호를 맞게 입력한 사용자만 관리 화면과 일정 쓰기 API를 사용할 수 있습니다. 발급된 관리자 세션은 2시간 뒤 만료되고, 비밀번호를 바꾸면 기존 세션도 만료됩니다.

관리 화면의 비밀번호 변경에 `password.<숫자>`를 입력하면 뒤 숫자로 비밀번호를 바꿉니다. Supabase를 사용하는 환경은 `supabase/admin-credentials.sql`을 SQL Editor에서 한 번 실행해야 합니다. 로컬에서는 `.env.local`에 비밀번호 값이 저장됩니다.

## 배포

GitHub Pages는 정적 파일만 제공하므로 로그인·일정 API를 실행할 수 없습니다. 일정 관리가 필요하면 GitHub 저장소를 Vercel 프로젝트로 가져와 배포한 뒤 **Vercel 배포 URL**을 사용하세요. Vercel은 저장소의 `api/` 서버 함수를 자동으로 연결합니다. Vercel 프로젝트의 환경변수에 위 항목을 등록하고 `supabase/admin-credentials.sql`을 SQL Editor에서 실행해야 합니다. GitHub Pages 주소에서는 일정 추가·수정·삭제 및 비밀번호 검증이 작동하지 않습니다.
