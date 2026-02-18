---
id: SPEC-UPDATE-001
version: "1.0.0"
status: completed
created: "2026-02-15"
updated: "2026-02-15"
author: manager-spec
priority: High
title: AEC Character Persistence, Mood Diary, Auth & Deployment - Acceptance Criteria
tags: "supabase, auth, character-persistence, mood-diary, cloudflare-pages, deployment"
---

## HISTORY

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2026-02-15 | 1.0.0 | 최초 인수 기준 작성 | manager-spec |

---

# SPEC-UPDATE-001 인수 기준서

## 1. 개요

본 문서는 SPEC-UPDATE-001의 각 모듈별 인수 기준을 Given-When-Then 형식으로 정의한다. 모든 시나리오가 통과해야 해당 모듈의 구현이 완료된 것으로 간주한다.

---

## 2. 모듈 1: 인증 시스템 (Authentication System)

### AC-AUTH-001: 회원가입 성공

**관련 요구사항**: REQ-AUTH-001, REQ-AUTH-008

```gherkin
Scenario: 유효한 이메일과 비밀번호로 회원가입
  Given 사용자가 "/login" 페이지에 접속한 상태이다
    And "회원가입" 탭이 선택되어 있다
  When 사용자가 유효한 이메일 "test@example.com"을 입력한다
    And 비밀번호 "SecurePass123!"을 입력한다
    And "가입하기" 버튼을 클릭한다
  Then Supabase Auth에 새 계정이 생성된다
    And "profiles" 테이블에 해당 user_id로 프로필 레코드가 생성된다
    And 사용자가 "/create" 페이지로 리다이렉트된다
```

### AC-AUTH-002: 로그인 성공 및 캐릭터 유무에 따른 라우팅

**관련 요구사항**: REQ-AUTH-002, REQ-UX-003, REQ-UX-004

```gherkin
Scenario: 캐릭터가 없는 사용자의 로그인
  Given 등록된 사용자 계정이 존재한다
    And 해당 사용자에게 저장된 캐릭터가 없다
  When 사용자가 올바른 이메일과 비밀번호로 로그인한다
  Then 인증 세션이 생성된다
    And 사용자가 캐릭터 생성 위자드 "/create"로 리다이렉트된다

Scenario: 캐릭터가 있는 사용자의 로그인
  Given 등록된 사용자 계정이 존재한다
    And 해당 사용자에게 저장된 캐릭터가 있다
  When 사용자가 올바른 이메일과 비밀번호로 로그인한다
  Then 인증 세션이 생성된다
    And 사용자가 오늘의 기분 페이지 "/mood"로 리다이렉트된다
```

### AC-AUTH-003: 보호된 경로 접근 차단

**관련 요구사항**: REQ-AUTH-004

```gherkin
Scenario: 미인증 사용자의 보호된 경로 접근
  Given 사용자가 로그인하지 않은 상태이다
  When 사용자가 브라우저 주소창에 "/create"를 직접 입력한다
  Then 사용자가 "/login" 페이지로 리다이렉트된다
    And 캐릭터 생성 위자드는 표시되지 않는다

Scenario: 미인증 사용자의 다이어리 접근
  Given 사용자가 로그인하지 않은 상태이다
  When 사용자가 브라우저 주소창에 "/diary"를 직접 입력한다
  Then 사용자가 "/login" 페이지로 리다이렉트된다
```

### AC-AUTH-004: 로그아웃

**관련 요구사항**: REQ-AUTH-003

```gherkin
Scenario: 로그아웃 실행
  Given 사용자가 인증된 상태로 "/mood" 페이지에 있다
  When 네비게이션 바에서 "로그아웃" 버튼을 클릭한다
  Then Supabase 세션이 종료된다
    And 사용자가 랜딩 페이지 "/"로 리다이렉트된다
    And 네비게이션 바에 로그인 관련 메뉴가 표시되지 않는다
```

### AC-AUTH-005: 세션 영속성

**관련 요구사항**: REQ-AUTH-006

```gherkin
Scenario: 브라우저 새로고침 후 세션 유지
  Given 사용자가 인증된 상태로 "/mood" 페이지에 있다
  When 브라우저를 새로고침한다
  Then 인증 상태가 유지된다
    And "/mood" 페이지가 정상적으로 표시된다
    And 로그인 페이지로 리다이렉트되지 않는다
```

---

## 3. 모듈 2: 캐릭터 관리 (Character Management)

### AC-CHAR-001: 캐릭터 생성 위자드 완료

**관련 요구사항**: REQ-CHAR-001, REQ-CHAR-002

```gherkin
Scenario: 4단계 위자드로 Base Character 생성
  Given 인증된 사용자가 "/create" 페이지에 접속했다
    And 저장된 캐릭터가 없다
  When 1단계에서 얼굴형 "round 4.png"를 선택한다
    And 2단계에서 헤어스타일 "afro hair black.png"를 선택한다
    And 3단계에서 수염 "없음"을 선택한다
    And 4단계에서 안경 "없음"을 선택한다
    And "저장" 버튼을 클릭한다
  Then "characters" 테이블에 새 레코드가 생성된다
    And face 값이 "round 4.png"이다
    And hair 값이 "afro hair black.png"이다
    And mustache 값이 null이다
    And glasses 값이 null이다
    And 사용자가 "/mood" 페이지로 리다이렉트된다
```

### AC-CHAR-002: 얼굴형 기반 수염 필터링

**관련 요구사항**: REQ-CHAR-003

```gherkin
Scenario: round 얼굴형 선택 시 호환 수염만 표시
  Given 인증된 사용자가 캐릭터 생성 위자드의 1단계에 있다
  When 얼굴형으로 "round 4.png"를 선택한다
    And 3단계(수염 선택)로 진행한다
  Then "common" 접두사 수염 에셋이 표시된다
    And "round" 접두사 수염 에셋이 표시된다
    And "special" 접두사 수염 에셋이 표시된다
    And "slim" 접두사 수염 에셋은 표시되지 않는다
    And "square" 접두사 수염 에셋은 표시되지 않는다
    And "없음" 옵션이 표시된다
```

### AC-CHAR-003: 실시간 미리보기 업데이트

**관련 요구사항**: REQ-CHAR-004, REQ-UX-008

```gherkin
Scenario: 위자드 단계 진행 시 Canvas 미리보기 갱신
  Given 인증된 사용자가 1단계에서 얼굴형을 선택했다
  When 2단계에서 헤어스타일을 선택한다
  Then Canvas 미리보기에 선택된 얼굴형과 헤어스타일이 합성되어 표시된다
    And 아직 선택되지 않은 레이어(mustache, glasses)는 미리보기에 포함되지 않는다
```

### AC-CHAR-004: 사용자당 캐릭터 1개 제한

**관련 요구사항**: REQ-CHAR-007

```gherkin
Scenario: 기존 캐릭터 보유 사용자의 중복 생성 차단
  Given 인증된 사용자에게 이미 저장된 캐릭터가 있다
  When 사용자가 "/create" 경로에 접근한다
  Then 시스템은 기존 캐릭터 데이터를 로드하여 수정 모드로 표시한다
    And 새 캐릭터를 생성하는 것이 아닌 기존 캐릭터를 편집하는 UI가 표시된다
```

### AC-CHAR-005: 헤어 에셋 페이지네이션

**관련 요구사항**: REQ-UX-007

```gherkin
Scenario: 214개 헤어 에셋의 페이지네이션 표시
  Given 인증된 사용자가 2단계(헤어 선택)에 있다
  When 헤어 에셋 목록이 로드된다
  Then 최초 20개의 에셋이 그리드로 표시된다
    And "더 보기" 버튼 또는 스크롤 기반 추가 로딩이 제공된다
    And 전체 214개 에셋이 한 번에 렌더링되지 않는다
```

---

## 4. 모듈 3: 무드 다이어리 시스템 (Mood Diary System)

### AC-MOOD-001: 일일 무드 기록 저장

**관련 요구사항**: REQ-MOOD-001, REQ-MOOD-002, REQ-MOOD-003

```gherkin
Scenario: 오늘의 무드 선택 및 저장
  Given 인증된 사용자에게 저장된 Base Character가 있다
    And 사용자가 "/mood" 페이지에 접속했다
    And 오늘 날짜에 기존 무드 기록이 없다
  When 무드 카테고리 "happy"를 선택한다
    And 해당 그룹의 표정 에셋 "facial expression11.png"를 선택한다
    And 의상 카테고리 "casual"을 선택한다
    And 해당 카테고리의 의상 에셋 "T shirt black.png"을 선택한다
    And "오늘의 기분 저장" 버튼을 클릭한다
  Then "mood_entries" 테이블에 새 레코드가 생성된다
    And mood_category 값이 "happy"이다
    And expression_file 값이 "facial expression11.png"이다
    And outfit_file 값이 "T shirt black.png"이다
    And date 값이 오늘 날짜(YYYY-MM-DD)이다
    And 합성된 캐릭터 미리보기가 표시된다
```

### AC-MOOD-002: 같은 날 무드 기록 수정

**관련 요구사항**: REQ-MOOD-005

```gherkin
Scenario: 오늘 이미 작성한 무드 기록 수정
  Given 인증된 사용자가 "/mood" 페이지에 접속했다
    And 오늘 날짜에 이미 무드 기록이 존재한다 (mood_category: "happy")
  When 페이지가 로드된다
  Then 기존 선택값이 UI에 프리로드된다
    And 무드 카테고리 "happy"가 선택된 상태로 표시된다
    And 기존 표정과 의상이 선택된 상태로 표시된다
  When 사용자가 무드 카테고리를 "calm"으로 변경한다
    And 새 표정과 의상을 선택한다
    And "오늘의 기분 저장" 버튼을 클릭한다
  Then 기존 레코드가 UPDATE된다 (새 레코드가 INSERT되지 않는다)
    And mood_category 값이 "calm"으로 변경된다
    And "mood_entries" 테이블에서 해당 user_id + date 조합의 레코드는 1건이다
```

### AC-MOOD-003: 무드 카테고리 선택 후 표정 에셋 표시

**관련 요구사항**: REQ-MOOD-001

```gherkin
Scenario: 무드 카테고리 선택 시 해당 표정 그룹 표시
  Given 인증된 사용자가 "/mood" 페이지에 있다
  When 무드 카테고리 "surprised"를 선택한다
  Then Group 4에 해당하는 표정 에셋 목록이 표시된다
    And 각 에셋이 썸네일 이미지로 표시된다
    And 사용자가 개별 표정을 선택할 수 있다
    And 다른 그룹의 표정 에셋은 표시되지 않는다
```

### AC-MOOD-004: 합성 미리보기 표시

**관련 요구사항**: REQ-MOOD-004

```gherkin
Scenario: Base Character + 오늘의 선택으로 합성 미리보기
  Given 사용자의 Base Character가 face="round 4.png", hair="afro hair black.png", mustache=null, glasses=null이다
  When 사용자가 outfit "suit black.png"와 expression "facial expression21.png"를 선택한다
  Then Canvas에 다음 순서로 합성된 이미지가 표시된다:
    | 레이어 순서 | 파일 |
    | 1 (최하단) | suit black.png (outfit) |
    | 2 | round 4.png (face) |
    | 3 | facial expression21.png (expression) |
    | 4 | (수염 없음 - 스킵) |
    | 5 | afro hair black.png (hair) |
    | 6 (최상단) | (안경 없음 - 스킵) |
```

### AC-MOOD-005: 다이어리 캘린더 뷰

**관련 요구사항**: REQ-MOOD-006, REQ-MOOD-007

```gherkin
Scenario: 캘린더에서 무드 기록 조회
  Given 인증된 사용자가 "/diary" 페이지에 접속했다
    And 2026년 2월에 3건의 무드 기록이 있다 (2/10, 2/13, 2/15)
  When 2026년 2월 캘린더가 표시된다
  Then 2/10, 2/13, 2/15 날짜에 기록 표시(하이라이트)가 있다
    And 기록이 없는 날짜에는 하이라이트가 없다
  When 사용자가 2/13 날짜를 클릭한다
  Then 해당 날짜의 무드 기록 상세가 표시된다
    And 합성된 캐릭터 이미지가 표시된다
    And 무드 카테고리 정보가 표시된다
```

### AC-MOOD-006: PNG 다운로드

**관련 요구사항**: REQ-MOOD-008

```gherkin
Scenario: 합성된 캐릭터 이미지 다운로드
  Given 사용자가 "/mood" 페이지에서 무드를 선택하고 미리보기가 표시된 상태이다
  When "다운로드" 버튼을 클릭한다
  Then 합성된 캐릭터 이미지가 PNG 파일로 다운로드된다
    And 파일명에 날짜 정보가 포함된다
```

---

## 5. 모듈 4: UI/UX 흐름 (UI/UX Flow)

### AC-UX-001: 랜딩 페이지 CTA

**관련 요구사항**: REQ-UX-001, REQ-UX-002

```gherkin
Scenario: 랜딩 페이지에서 시작하기
  Given 미인증 사용자가 "/" 페이지에 접속했다
  When "시작하기" 버튼이 표시된다
    And 사용자가 "시작하기" 버튼을 클릭한다
  Then 사용자가 "/login" 페이지로 이동한다
```

### AC-UX-002: 네비게이션 바 메뉴

**관련 요구사항**: REQ-UX-005

```gherkin
Scenario: 인증된 사용자의 네비게이션 메뉴
  Given 사용자가 인증된 상태이다
  When 임의의 보호된 페이지에 접속한다
  Then 네비게이션 바에 다음 메뉴가 표시된다:
    | 메뉴명 | 경로 |
    | 오늘의 기분 | /mood |
    | 다이어리 | /diary |
    | 캐릭터 수정 | /create |
    | 로그아웃 | (로그아웃 액션) |

Scenario: 미인증 사용자의 네비게이션
  Given 사용자가 로그인하지 않은 상태이다
  When "/" 페이지에 접속한다
  Then 네비게이션 바에 보호된 경로 메뉴가 표시되지 않는다
```

### AC-UX-003: 반응형 레이아웃

**관련 요구사항**: REQ-UX-006

```gherkin
Scenario: 모바일 뷰포트에서 레이아웃
  Given 사용자가 375px 너비의 모바일 뷰포트를 사용한다
  When "/mood" 페이지에 접속한다
  Then 모든 UI 요소가 화면 너비를 초과하지 않는다
    And 네비게이션이 모바일에 최적화된 형태(햄버거 메뉴 등)로 표시된다
    And 에셋 선택 그리드가 모바일에 맞게 조정된다

Scenario: 데스크톱 뷰포트에서 레이아웃
  Given 사용자가 1440px 너비의 데스크톱 뷰포트를 사용한다
  When "/mood" 페이지에 접속한다
  Then 넓은 화면을 활용한 다열 레이아웃이 적용된다
    And 미리보기와 선택기가 나란히 표시된다
```

---

## 6. 모듈 5: 배포 (Deployment)

### AC-DEPLOY-001: Static Export 빌드 성공

**관련 요구사항**: REQ-DEPLOY-001, REQ-DEPLOY-002, REQ-DEPLOY-005

```gherkin
Scenario: Next.js Static Export 빌드
  Given next.config.ts에 output: 'export'가 설정되어 있다
    And package.json에 모든 의존성이 설치되어 있다
  When "npm run build" 명령을 실행한다
  Then 빌드가 에러 없이 완료된다
    And "out/" 디렉토리가 생성된다
    And "out/index.html" 파일이 존재한다
    And "out/login/index.html" 파일이 존재한다
    And "out/create/index.html" 파일이 존재한다
    And "out/mood/index.html" 파일이 존재한다
    And "out/diary/index.html" 파일이 존재한다
    And "out/assets/" 디렉토리에 에셋 파일이 포함된다
```

### AC-DEPLOY-002: 환경 변수 보안

**관련 요구사항**: REQ-DEPLOY-003, REQ-DEPLOY-004

```gherkin
Scenario: 환경 변수 설정 검증
  Given 프로젝트 코드베이스를 검사한다
  When Supabase 관련 환경 변수를 검색한다
  Then "NEXT_PUBLIC_SUPABASE_URL" 환경 변수가 사용되고 있다
    And "NEXT_PUBLIC_SUPABASE_ANON_KEY" 환경 변수가 사용되고 있다
    And "service_role" 키가 코드 어디에도 포함되지 않는다
    And ".env.local" 파일이 ".gitignore"에 포함되어 있다
```

### AC-DEPLOY-003: SPA 폴백 동작

**관련 요구사항**: REQ-DEPLOY-006

```gherkin
Scenario: 클라이언트 사이드 라우팅 폴백
  Given 애플리케이션이 Cloudflare Pages에 배포되어 있다
    And SPA 폴백 설정이 적용되어 있다
  When 사용자가 브라우저 주소창에 "https://example.com/mood"를 직접 입력한다
  Then 404 에러가 발생하지 않는다
    And "/mood" 페이지가 정상적으로 로드된다
    And AuthGuard가 인증 상태를 확인하여 적절히 처리한다
```

---

## 7. 품질 게이트 (Quality Gates)

### QG-001: 기능 완성도

| 기준 | 목표 |
|------|------|
| 전체 시나리오 통과율 | 100% |
| 핵심 시나리오 (Auth + Character + Mood) 통과율 | 100% |
| Optional 시나리오 (REQ-MOOD-009) | 구현 여부 선택 가능 |

### QG-002: 코드 품질

| 기준 | 목표 |
|------|------|
| TypeScript 컴파일 에러 | 0건 |
| ESLint 에러 | 0건 |
| `next build` 에러 | 0건 |
| `next build` 경고 | 최소화 |

### QG-003: 보안 검증

| 기준 | 검증 방법 |
|------|----------|
| service_role 키 미노출 | 코드 검색 (AC-DEPLOY-002) |
| RLS 정책 작동 | Supabase Dashboard에서 검증 |
| 비밀번호 평문 저장 미존재 | 코드 검토 (REQ-AUTH-007) |

### QG-004: 성능 기준

| 기준 | 목표 |
|------|------|
| Canvas 합성 완료 시간 | 3초 이내 |
| 에셋 목록 초기 로드 | 2초 이내 |
| 페이지 전환 응답 시간 | 1초 이내 |
| Lighthouse Performance Score | 70+ |

---

## 8. Definition of Done

SPEC-UPDATE-001이 "완료"로 간주되기 위한 최종 체크리스트:

- [ ] 모듈 1~5의 모든 필수(Required) 인수 기준 시나리오 통과
- [ ] `npm run build` (Static Export) 에러 없이 성공
- [ ] TypeScript 컴파일 에러 0건
- [ ] ESLint 에러 0건
- [ ] Supabase RLS 정책 3개 테이블 모두 적용
- [ ] 환경 변수에 service_role 키 미포함
- [ ] 모바일(375px) 및 데스크톱(1440px) 반응형 확인
- [ ] Cloudflare Pages 배포 성공 및 전 페이지 접근 확인
- [ ] SPA 폴백으로 직접 URL 접근 시 정상 동작 확인
