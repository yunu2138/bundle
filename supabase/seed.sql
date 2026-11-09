insert into public.schedules (
  id, grade, class_no, subject, type, title, start_date, end_date,
  content, materials, weight, updated_by_label, created_at, updated_at
)
values
  ('00000000-0000-4000-8000-000000000001', 2, null, '독서와 작문', 'exam', '2학기 기말고사 · 국어', current_date + 21, current_date + 21, '문학 작품 분석, 현대시와 소설 단원', '컴퓨터용 사인펜', null, '관리자', now(), now()),
  ('00000000-0000-4000-8000-000000000002', 2, null, '미적분 I', 'exam', '2학기 기말고사 · 수학', current_date + 22, current_date + 22, '함수의 극한과 연속, 미분법', '컴퓨터용 사인펜', null, '관리자', now(), now()),
  ('00000000-0000-4000-8000-000000000003', 2, null, '영어 II', 'exam', '2학기 기말고사 · 영어', current_date + 23, current_date + 23, '교과서 5~7과, 수업 자료', '컴퓨터용 사인펜', null, '관리자', now(), now()),
  ('00000000-0000-4000-8000-000000000004', 2, null, '학교', 'event', '가을 체육대회', current_date + 7, current_date + 7, '학년별 이어달리기와 반 대항 경기', '운동복, 물', null, '관리자', now(), now()),
  ('00000000-0000-4000-8000-000000000005', 2, null, '학교', 'holiday', '개교기념일', current_date + 32, current_date + 32, '학교 개교기념일로 수업이 없습니다.', '', null, '관리자', now(), now()),
  ('00000000-0000-4000-8000-000000000006', 2, null, '학교', 'holiday', '겨울방학 시작', current_date + 40, current_date + 54, '겨울방학이 시작됩니다.', '', null, '관리자', now(), now()),
  ('00000000-0000-4000-8000-000000000007', 1, null, '학교', 'event', '1학년 진로 체험의 날', current_date + 9, current_date + 9, '진로 체험처별 현장 활동', '필기도구, 학생증', null, '관리자', now(), now()),
  ('00000000-0000-4000-8000-000000000008', 3, null, '화법과 언어', 'exam', '화법과 언어 단원 평가', current_date + 12, current_date + 12, '담화의 맥락과 언어 규범', '컴퓨터용 사인펜', null, '관리자', now(), now()),

  ('00000000-0000-4000-8000-000000000009', 2, null, '독서와 작문', 'performance', '시 낭송 발표', current_date + 2, null, '좋아하는 시 한 편을 골라 낭송하고 감상을 발표해요.', '발표 자료', '15%', '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000010', 2, null, '미적분 I', 'assignment', '수학 문제 풀이 제출', current_date + 3, null, '수업 시간에 안내한 문제 1~20번 풀이', '수학 공책', null, '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000011', 2, null, '생활과 과학 탐구', 'assignment', '실험 보고서 제출', current_date + 11, null, '용액의 농도 실험 결과와 오차 분석', '실험 노트', null, '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000012', 2, null, '사회와 문화', 'performance', '지역 문제 조사 발표', current_date + 18, null, '우리 지역의 문제를 조사하고 해결 방안을 발표해요.', '조사 자료', '20%', '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000013', 2, null, '영어 II', 'assignment', '영어 단어 학습지', current_date + 25, null, '이번 단원 핵심 어휘를 예문과 함께 정리해요.', '영어 학습지', null, '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000014', 2, null, '정보', 'performance', '자료 분석 실습', current_date + 33, null, '표 자료를 분석하고 결과를 정리해요.', '실습 활동지', '10%', '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000015', 2, null, '음악 연주와 창작', 'performance', '리코더 연주 평가', current_date - 4, null, '수업에서 연습한 곡을 연주해요.', '리코더', '10%', '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000016', 2, null, '미술 창작', 'assignment', '포스터 작품 제출', current_date + 40, null, '학교 안전 캠페인 포스터를 완성해 제출해요.', '완성 작품', null, '2학년 공동', now(), now()),

  ('00000000-0000-4000-8000-000000000017', 2, null, '영어 II', 'performance', '영어 에세이 쓰기', current_date + 1, null, '환경 보호를 위한 실천 방법을 영어로 작성해요.', '초안과 사전', '20%', '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000018', 2, null, '미술 창작', 'assignment', '포스터 작품 제출', current_date + 5, null, '학교 안전 캠페인 포스터를 완성해 제출해요.', '완성 작품', null, '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000019', 2, null, '음악 연주와 창작', 'performance', '리코더 연주 평가', current_date + 14, null, '수업에서 연습한 곡을 연주해요.', '리코더', '10%', '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000020', 2, null, '미적분 I', 'assignment', '수학 탐구 활동지', current_date + 19, null, '생활 속 함수의 예를 찾아 그래프로 정리해요.', '탐구 활동지', null, '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000021', 2, null, '세계사', 'performance', '역사 인물 카드 만들기', current_date + 26, null, '수업에서 다룬 인물의 업적과 시대 배경을 정리해요.', '활동지', '15%', '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000022', 2, null, '생활과 과학 탐구', 'assignment', '과학 개념 정리', current_date + 31, null, '이번 단원의 핵심 개념을 정리해 제출해요.', '과학 공책', null, '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000023', 2, null, '독서와 작문', 'assignment', '독서 기록장 제출', current_date - 6, null, '읽은 책의 인상 깊은 부분과 생각을 기록해요.', '독서 기록장', null, '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000024', 2, null, '스포츠 생활2', 'performance', '배드민턴 기능 평가', current_date + 38, null, '기본 서브와 랠리 동작을 평가합니다.', '운동복, 실내화', '10%', '2학년 공동', now(), now()),

  ('00000000-0000-4000-8000-000000000025', 2, null, '독서와 작문', 'performance', '독서 토론 준비', current_date + 2, null, '모둠별로 정한 책을 읽고 토론 질문을 준비해요.', '읽을 책, 메모', '15%', '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000026', 2, null, '미적분 I', 'assignment', '수학 탐구 과제 마감', current_date + 3, null, '생활 속 함수의 예를 찾아 그래프로 정리해요.', '탐구 활동지', null, '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000027', 2, null, '정보', 'assignment', '프로그래밍 실습 제출', current_date + 8, null, '조건문을 활용한 프로그램을 작성해 제출해요.', '실습 파일', null, '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000028', 2, null, '스포츠 생활2', 'performance', '왕복 오래달리기 측정', current_date + 16, null, '체력 측정 수업 시간에 진행합니다.', '운동복, 운동화', '10%', '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000029', 2, null, '영어 II', 'performance', '영어 에세이 쓰기', current_date + 23, null, '환경 보호를 위한 실천 방법을 영어로 작성해요.', '초안과 사전', '20%', '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000030', 2, null, '생활과 과학 탐구', 'assignment', '실험 보고서 제출', current_date + 29, null, '용액의 농도 실험 결과와 오차 분석', '실험 노트', null, '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000031', 2, null, '미술 창작', 'assignment', '디자인 작품 제출', current_date - 3, null, '생활 속 불편을 개선하는 제품 디자인을 표현해요.', '완성 작품', null, '2학년 공동', now(), now()),
  ('00000000-0000-4000-8000-000000000032', 2, null, '사회와 문화', 'performance', '지역 문제 조사 발표', current_date + 41, null, '우리 지역의 문제를 조사하고 해결 방안을 발표해요.', '조사 자료', '20%', '2학년 공동', now(), now())
on conflict (id) do update set
  grade = excluded.grade,
  class_no = excluded.class_no,
  subject = excluded.subject,
  type = excluded.type,
  title = excluded.title,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  content = excluded.content,
  materials = excluded.materials,
  weight = excluded.weight,
  updated_by_label = excluded.updated_by_label,
  updated_at = now();
