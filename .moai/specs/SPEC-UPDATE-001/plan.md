---
id: SPEC-UPDATE-001
version: "1.0.0"
status: Planned
created: "2026-02-15"
updated: "2026-02-15"
author: manager-spec
priority: High
title: AEC Character Persistence, Mood Diary, Auth & Deployment - Implementation Plan
tags: "supabase, auth, character-persistence, mood-diary, cloudflare-pages, deployment"
---

## HISTORY

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2026-02-15 | 1.0.0 | 최초 구현 계획 작성 | manager-spec |

---

# SPEC-UPDATE-001 구현 계획서

## 1. 구현 전략 개요

### 접근 방식

기존 AEC Character Generator(SPEC-UI-001)의 코드를 최대한 보존하면서 점진적으로 기능을 확장하는 DDD(ANALYZE-PRESERVE-IMPROVE) 접근 방식을 사용한다.

### 핵심 원칙

- **기존 코드 보존**: `assetManager.ts`, `randomEngine.ts`, `imageCompositor.ts`, `types.ts`의 기존 함수는 수정하지 않고 확장한다.
- **점진적 확장**: 각 마일스톤이 독립적으로 작동 가능하도록 단계별로 구현한다.
- **Static Export 우선**: 모든 구현이 `output: 'export'` 모드와 호환되는지 각 단계에서 검증한다.
- **타입 안전성**: 모든 Supabase 상호작용에 TypeScript 타입을 적용한다.

---

## 2. 마일스톤

### 마일스톤 1: 기반 인프라 구성 (Priority: High, 기본 목표)

**목적**: Supabase 연동 및 Static Export 빌드 환경 구성

**작업 항목**:

1. **next.config.ts 수정**
   - `output: 'export'` 추가
   - `trailingSlash: true` 추가
   - `images: { unoptimized: true }` 추가
   - REQ-DEPLOY-001, REQ-DEPLOY-002 충족

2. **Supabase 프로젝트 설정**
   - Supabase 프로젝트 생성 (외부 작업)
   - Email/Password 인증 활성화
   - 환경 변수 파일 구성 (`.env.local`)
   - REQ-DEPLOY-003 충족

3. **Supabase 클라이언트 SDK 설치 및 초기화**
   - `@supabase/supabase-js` 패키지 설치
   - `src/app/lib/supabase.ts` 생성
   - `src/app/lib/database.types.ts` 타입 정의
   - REQ-DEPLOY-004 충족 (service_role 키 미포함 검증)

4. **데이터베이스 스키마 생성**
   - `profiles`, `characters`, `mood_entries` 테이블 생성 (Supabase Dashboard 또는 SQL)
   - RLS 정책 적용
   - S-001, S-002 사양 구현

5. **빌드 검증**
   - `next build` 실행 후 `out/` 디렉토리 생성 확인
   - Static Export 모드에서 에러 없음 확인
   - REQ-DEPLOY-005 충족

**완료 기준**: `next build`가 에러 없이 완료되고, Supabase 클라이언트가 초기화 가능한 상태

**관련 요구사항**: REQ-DEPLOY-001~006

---

### 마일스톤 2: 인증 시스템 구현 (Priority: High, 기본 목표)

**목적**: 이메일/비밀번호 기반 인증 및 보호된 라우팅

**작업 항목**:

1. **인증 Context 및 Hook 구현**
   - `src/app/contexts/AuthContext.tsx`: AuthProvider 구현
   - `src/app/hooks/useAuth.ts`: 인증 상태 관리 hook
   - `onAuthStateChange` 리스너 설정
   - REQ-AUTH-005, REQ-AUTH-006 충족

2. **인증 폼 컴포넌트**
   - `src/app/components/AuthForm.tsx`: 로그인/회원가입 통합 폼
   - 이메일 유효성 검증, 비밀번호 최소 요건
   - 에러 메시지 표시
   - REQ-AUTH-001, REQ-AUTH-002 충족

3. **로그인 페이지**
   - `src/app/login/page.tsx`: AuthForm 렌더링
   - 로그인/회원가입 탭 전환 UI
   - 인증 성공 시 리다이렉트 로직 (캐릭터 유무에 따라)
   - REQ-UX-003, REQ-UX-004 충족

4. **인증 가드 컴포넌트**
   - `src/app/components/AuthGuard.tsx`: Protected Route 래퍼
   - 미인증 시 `/login`으로 리다이렉트
   - 로딩 상태 표시
   - REQ-AUTH-004 충족

5. **프로필 자동 생성**
   - 회원가입 성공 후 `profiles` 테이블 INSERT 로직
   - REQ-AUTH-008 충족

6. **루트 레이아웃 업데이트**
   - `src/app/layout.tsx`에 AuthProvider 래핑
   - NavBar 조건부 렌더링

**완료 기준**: 회원가입, 로그인, 로그아웃이 정상 작동하고, 미인증 사용자가 보호된 경로에 접근 불가

**관련 요구사항**: REQ-AUTH-001~008, REQ-UX-002~004

---

### 마일스톤 3: 캐릭터 생성 위자드 구현 (Priority: High, 기본 목표)

**목적**: 4단계 Base Character 생성 및 DB 저장

**작업 항목**:

1. **에셋 선택 공통 컴포넌트**
   - `src/app/components/AssetPicker.tsx`: 범용 에셋 선택 UI
   - 그리드 레이아웃, 선택 하이라이트, 썸네일 표시
   - 페이지네이션 (20개 단위) 또는 무한 스크롤
   - 검색/필터 (헤어 에셋 214개 대응)
   - REQ-UX-007 충족

2. **위자드 단계 컴포넌트**
   - `src/app/components/WizardStep.tsx`: 단계별 진행 UI (Progress indicator)
   - 이전/다음 버튼, 단계 간 네비게이션
   - REQ-CHAR-002 충족

3. **캐릭터 생성 페이지**
   - `src/app/create/page.tsx`: 4단계 위자드 조합
   - 단계 1: 얼굴형 선택 (5개 에셋, `getFaceAssets()` 활용)
   - 단계 2: 헤어 선택 (214개, `getHairAssets()` 활용, 페이지네이션)
   - 단계 3: 수염 선택 (선택된 얼굴형 기반 필터, `getCompatibleMustaches()` 활용)
   - 단계 4: 안경 선택 (39개, `getGlassesAssets()` 활용)
   - REQ-CHAR-001, REQ-CHAR-002, REQ-CHAR-003 충족

4. **실시간 미리보기**
   - `CharacterCanvas.tsx` 확장: 부분 레이어 합성 지원
   - 위자드 진행 중 선택된 레이어만으로 미리보기 합성
   - `imageCompositor.ts` 확장: null 레이어 스킵 기능
   - REQ-CHAR-004, REQ-UX-008 충족

5. **캐릭터 CRUD Hook**
   - `src/app/hooks/useCharacter.ts`: 캐릭터 생성, 조회, 수정 로직
   - Supabase `characters` 테이블 CRUD
   - REQ-CHAR-005, REQ-CHAR-006, REQ-CHAR-007 충족

6. **캐릭터 수정 모드**
   - `/create` 페이지에서 기존 캐릭터 데이터 로드 후 수정 허용
   - REQ-CHAR-006 충족

**완료 기준**: 4단계 위자드로 캐릭터 생성/수정이 가능하고, DB에 정상 저장됨

**관련 요구사항**: REQ-CHAR-001~007, REQ-UX-007, REQ-UX-008

---

### 마일스톤 4: 일일 무드 시스템 구현 (Priority: High, 주요 목표)

**목적**: 일일 무드 선택, 캐릭터 합성, DB 저장

**작업 항목**:

1. **무드 표정 선택기**
   - `src/app/components/MoodExpressionPicker.tsx`
   - 무드 카테고리 선택 (기존 `MoodSelector` 스타일 활용)
   - 카테고리 선택 후 해당 표정 에셋 그리드 표시
   - `getExpressionAssets(mood)` 활용
   - REQ-MOOD-001 충족

2. **의상 개별 선택기**
   - `src/app/components/OutfitPicker.tsx`
   - 의상 카테고리 선택 (기존 `OutfitSelector` 스타일 활용)
   - 카테고리 선택 후 해당 의상 에셋 그리드 표시
   - `getBodyAssets(category)` 활용
   - REQ-MOOD-002 충족

3. **오늘의 기분 페이지**
   - `src/app/mood/page.tsx`
   - Base Character 로드 + 가변 레이어(outfit, expression) 선택
   - 전체 6레이어 합성 미리보기
   - "오늘의 기분 저장" 버튼
   - REQ-MOOD-003, REQ-MOOD-004 충족

4. **무드 기록 CRUD Hook**
   - `src/app/hooks/useMoodEntries.ts`
   - UPSERT 로직 (같은 날짜 업데이트)
   - 날짜별 조회, 월별 목록 조회
   - REQ-MOOD-003, REQ-MOOD-005 충족

5. **기존 기록 로드 (수정 모드)**
   - 오늘 날짜에 기록이 존재하면 해당 값 프리로드
   - 수정 후 UPSERT로 업데이트
   - REQ-MOOD-005 충족

6. **다운로드 기능**
   - 기존 `downloadAsPNG()` 함수 재활용
   - REQ-MOOD-008 충족

**완료 기준**: 일일 무드 선택 및 저장이 가능하고, 같은 날 수정이 정상 동작

**관련 요구사항**: REQ-MOOD-001~005, REQ-MOOD-008

---

### 마일스톤 5: 무드 다이어리 뷰 구현 (Priority: Medium, 부차 목표)

**목적**: 무드 기록 열람 (캘린더 + 리스트 뷰)

**작업 항목**:

1. **캘린더 뷰 컴포넌트**
   - `src/app/components/DiaryCalendar.tsx`
   - 월별 캘린더 그리드 (기록 있는 날짜 하이라이트)
   - 월 이동 네비게이션 (이전/다음 월)
   - REQ-MOOD-006 충족

2. **다이어리 항목 카드**
   - `src/app/components/DiaryEntryCard.tsx`
   - 날짜, 무드 카테고리, 합성 캐릭터 미리보기 표시
   - 다운로드 버튼
   - REQ-MOOD-007 충족

3. **다이어리 페이지**
   - `src/app/diary/page.tsx`
   - 캘린더 뷰 / 리스트 뷰 전환
   - 특정 날짜 클릭 시 상세 표시
   - REQ-MOOD-006, REQ-MOOD-007 충족

4. **캐릭터 재합성 로직**
   - 다이어리 조회 시 Base Character + 해당 날짜의 outfit/expression으로 Canvas 합성
   - 성능 최적화: 표시 시점에 합성 (lazy rendering)

**완료 기준**: 캘린더/리스트 뷰로 과거 무드 기록 조회 가능

**관련 요구사항**: REQ-MOOD-006~009

---

### 마일스톤 6: 네비게이션 및 UX 통합 (Priority: Medium, 부차 목표)

**목적**: 전체 페이지 연결 및 UX 최적화

**작업 항목**:

1. **네비게이션 바**
   - `src/app/components/NavBar.tsx`
   - 인증 상태에 따른 조건부 메뉴 표시
   - 모바일 반응형 (햄버거 메뉴)
   - REQ-UX-005 충족

2. **랜딩 페이지 리뉴얼**
   - `src/app/page.tsx` 리뉴얼 (현재 캐릭터 생성기 -> 서비스 소개 + CTA)
   - "시작하기" 버튼 -> `/login` 이동
   - REQ-UX-001, REQ-UX-002 충족

3. **반응형 레이아웃 검증**
   - 모든 페이지의 모바일/데스크톱 레이아웃 검증
   - REQ-UX-006 충족

4. **에러 처리 및 로딩 상태**
   - Supabase 호출 실패 시 사용자 피드백
   - 네트워크 에러, 권한 에러 처리
   - 전체 페이지 로딩 스켈레톤

**완료 기준**: 모든 페이지가 연결되고 전체 사용자 플로우가 완결

**관련 요구사항**: REQ-UX-001~008

---

### 마일스톤 7: Cloudflare Pages 배포 (Priority: High, 최종 목표)

**목적**: 프로덕션 배포

**작업 항목**:

1. **빌드 스크립트 검증**
   - `npm run build` -> `out/` 디렉토리 생성 확인
   - 정적 에셋(493개 PNG) 포함 확인
   - REQ-DEPLOY-005 충족

2. **SPA 폴백 설정**
   - `public/_redirects` 파일 생성: `/* /index.html 200`
   - 또는 `public/_headers` 파일로 캐시 설정
   - REQ-DEPLOY-006 충족

3. **Cloudflare Pages 프로젝트 설정**
   - Git 리포지토리 연결 또는 Direct Upload
   - 빌드 명령: `npm run build`
   - 빌드 출력 디렉토리: `out`
   - 환경 변수 설정: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **배포 후 검증**
   - 모든 페이지 접근 가능 확인
   - 인증 플로우 정상 작동 확인
   - 에셋 로딩 및 Canvas 합성 정상 확인
   - Supabase RLS 동작 확인

**완료 기준**: Cloudflare Pages에 배포 완료, 전 기능 정상 작동

**관련 요구사항**: REQ-DEPLOY-001~006

---

## 3. 기술 접근 방식

### 3.1 인증 아키텍처

```
AuthContext (React Context)
├── AuthProvider: onAuthStateChange 리스너
├── useAuth hook: { user, loading, signUp, signIn, signOut }
└── AuthGuard: 미인증 시 리다이렉트
```

- Supabase SDK가 세션 관리를 자동 처리 (localStorage 기반)
- `onAuthStateChange`로 실시간 상태 동기화
- Protected Route는 AuthGuard 래퍼 컴포넌트로 구현

### 3.2 캐릭터 데이터 흐름

```
위자드 UI (WizardStep + AssetPicker)
  -> WizardState (React state)
    -> Canvas 미리보기 (imageCompositor.ts)
    -> "저장" -> useCharacter.create()
      -> Supabase INSERT characters
```

- 기존 `assetManager.ts`의 함수를 그대로 활용하여 에셋 목록 제공
- 기존 `imageCompositor.ts`의 `compositeCharacter` 함수 확장 (부분 레이어 지원)

### 3.3 무드 데이터 흐름

```
오늘의 기분 UI (MoodExpressionPicker + OutfitPicker)
  -> DailyMoodState (React state)
    -> Base Character + outfit + expression -> Canvas 합성
    -> "저장" -> useMoodEntries.upsert()
      -> Supabase UPSERT mood_entries (ON CONFLICT user_id, date)
```

- UPSERT 패턴으로 같은 날 재작성 시 기존 기록 업데이트
- Base Character 데이터는 `useCharacter` hook에서 캐싱

### 3.4 Static Export 호환성 전략

| 기능 | 일반적 구현 | Static Export 호환 구현 |
|------|-----------|----------------------|
| 인증 가드 | Middleware | 클라이언트 AuthGuard 컴포넌트 |
| API 호출 | API Routes | Supabase 클라이언트 SDK 직접 호출 |
| 동적 라우팅 | generateStaticParams | 클라이언트 사이드 라우팅 (SPA) |
| 이미지 최적화 | next/image | unoptimized: true |
| 환경 변수 | 서버 사이드 | NEXT_PUBLIC_ 접두사 |

### 3.5 기존 코드 재활용 맵

| 기존 모듈 | 재활용 방식 | 변경 사항 |
|----------|-----------|----------|
| `types.ts` | 확장 | 신규 타입 추가 (BaseCharacter, MoodEntry 등) |
| `assetManager.ts` | 그대로 사용 | 변경 없음 |
| `randomEngine.ts` | 그대로 유지 | 기존 랜덤 생성 페이지 유지 시 사용 |
| `imageCompositor.ts` | 확장 | 부분 레이어 합성 함수 추가 |
| `MoodSelector.tsx` | 참조/재활용 | 무드 카테고리 UI 패턴 재활용 |
| `OutfitSelector.tsx` | 참조/재활용 | 의상 카테고리 UI 패턴 재활용 |
| `CharacterCanvas.tsx` | 확장 | 다양한 합성 시나리오 지원 |
| `GenerateButton.tsx` | 유지 | 기존 랜덤 생성 페이지 유지 시 사용 |

---

## 4. 리스크 및 대응 방안

### R-001: Static Export와 인증 호환성

- **리스크**: Next.js `output: 'export'`에서 Middleware 사용 불가, 인증 가드 구현 제약
- **대응**: 클라이언트 사이드 AuthGuard 컴포넌트로 구현. 초기 로딩 시 깜빡임 방지를 위해 로딩 스켈레톤 적용

### R-002: 대량 에셋 로딩 성능

- **리스크**: 214개 헤어 에셋 썸네일을 한 번에 로딩 시 성능 저하
- **대응**: 페이지네이션(20개 단위) + Intersection Observer 기반 lazy loading. 썸네일 크기 최적화 (CSS transform scale)

### R-003: Canvas 합성 성능 (위자드 실시간 미리보기)

- **리스크**: 에셋 선택마다 Canvas 재합성 시 UI 지연
- **대응**: 이미지 캐싱 (메모리 캐시), debounce 적용, 선택된 레이어만 재합성

### R-004: Supabase 무료 플랜 제한

- **리스크**: API 호출 제한, 데이터베이스 크기 제한
- **대응**: 클라이언트 캐싱으로 불필요한 API 호출 최소화. composite_image_url은 Optional로 설정 (저장소 절약)

### R-005: SPA 라우팅 폴백

- **리스크**: Cloudflare Pages에서 직접 URL 접근 시 404 에러
- **대응**: `_redirects` 파일 또는 Cloudflare Pages 설정에서 SPA 모드 활성화

---

## 5. 의존성 맵

```
마일스톤 1 (기반 인프라)
  └── 마일스톤 2 (인증)
        └── 마일스톤 3 (캐릭터 위자드)
              └── 마일스톤 4 (일일 무드)
                    └── 마일스톤 5 (다이어리 뷰)
  마일스톤 6 (네비게이션/UX) -- 마일스톤 2~5와 병행 가능, 최종 통합 필요
  마일스톤 7 (배포) -- 마일스톤 1~6 완료 후 실행
```

---

## 6. 신규 패키지 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@supabase/supabase-js` | ^2.x | Supabase 클라이언트 SDK (Auth + DB) |

**참고**: 추가 UI 라이브러리(date-fns, react-calendar 등)는 구현 단계에서 필요 시 expert-frontend 에이전트가 최신 안정 버전을 확인하여 결정한다.

---

## 7. 전문가 상담 권장

### expert-backend 상담 권장

- **대상**: Supabase 스키마 설계, RLS 정책 최적화, UPSERT 패턴
- **이유**: 데이터베이스 설계와 보안 정책이 전체 시스템의 데이터 무결성에 직접 영향

### expert-frontend 상담 권장

- **대상**: 위자드 UX 패턴, 대량 에셋 그리드 성능, 캘린더 뷰 구현
- **이유**: 214개 에셋의 효율적 렌더링과 직관적인 위자드 UX 설계 필요

### expert-security 상담 권장

- **대상**: RLS 정책 검증, 클라이언트 사이드 인증 보안, 환경 변수 관리
- **이유**: 모든 인증/데이터 접근이 클라이언트 사이드에서 이루어지므로 보안 취약점 검토 필수
