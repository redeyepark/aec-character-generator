---
id: SPEC-UPDATE-001
version: "1.0.0"
status: Completed
created: "2026-02-15"
updated: "2026-02-15"
author: manager-spec
priority: High
title: AEC Character Persistence, Mood Diary, Auth & Deployment
tags: "supabase, auth, character-persistence, mood-diary, cloudflare-pages, deployment"
lifecycle: spec-anchored
related-specs: "SPEC-UI-001"
---

## HISTORY

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2026-02-15 | 1.0.0 | 최초 SPEC 작성 - 인증, 캐릭터 영속성, 무드 다이어리, 배포 | manager-spec |

---

# AEC Character Persistence, Mood Diary, Auth & Deployment - EARS 형식 요구사항 명세서

## 1. 개요

기존 AEC Character Generator(SPEC-UI-001)를 확장하여 사용자 인증, 캐릭터 영속성, 일일 무드 다이어리 기능을 추가한다. Supabase를 백엔드(Auth + Database)로 사용하고, Cloudflare Pages에 정적 사이트로 배포한다.

### 핵심 개념 변경

| 구분 | 기존 (SPEC-UI-001) | 변경 (SPEC-UPDATE-001) |
|------|-------------------|----------------------|
| 캐릭터 생성 | 모든 레이어 랜덤 | 고정 레이어(face, hair, mustache, glasses) + 가변 레이어(body, expression) |
| 선택 방식 | 카테고리 선택 후 랜덤 | 사용자가 직접 개별 에셋 선택 |
| 데이터 저장 | 없음 (stateless) | Supabase DB에 영구 저장 |
| 인증 | 없음 | Supabase Auth (email/password) |
| 배포 | 로컬 개발 전용 | Cloudflare Pages 정적 배포 |
| 용도 | 일회성 캐릭터 생성 | 일일 무드 다이어리 + 캐릭터 아이덴티티 |

### 레이어 분류

| 레이어 유형 | 레이어 | 역할 | 변경 빈도 |
|-----------|--------|------|----------|
| 고정 (Base Character) | face, hair, mustache, glasses | 사용자 아이덴티티 | 최초 1회 설정, 이후 편집 가능 |
| 가변 (Daily Mood) | body (outfit), expression | 오늘의 기분 표현 | 매일 변경 |

---

## 2. 환경 (Environment)

### E-001: 기술 스택

- **프레임워크**: Next.js 15.x (App Router) + React 19 + TypeScript
- **스타일링**: Tailwind CSS 4
- **백엔드 서비스**: Supabase (Auth + PostgreSQL)
- **클라이언트 SDK**: @supabase/supabase-js (클라이언트 사이드 전용)
- **이미지 합성**: HTML5 Canvas API (기존 유지)
- **배포**: Cloudflare Pages (Static Export)
- **빌드 모드**: `output: 'export'` (next.config.ts)

### E-002: Supabase 환경

- Supabase 프로젝트 1개 (Auth + Database + Storage)
- Row Level Security (RLS) 전 테이블 적용
- 환경 변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 서버 사이드 호출 없음 (Static Export 제약)

### E-003: 배포 환경

- Cloudflare Pages: 정적 파일 호스팅
- SSR 불가 (Static Export 전용)
- API Routes 불가 (모든 백엔드 로직은 Supabase 클라이언트 SDK 경유)
- 환경 변수는 Cloudflare Pages 대시보드에서 설정

### E-004: 기존 에셋 환경 (SPEC-UI-001 계승)

- 493개 PNG 에셋, 6개 레이어 (body, face, expression, mustache, hair, glasses)
- `assetIndex.json`: 사전 빌드된 에셋 인덱스
- `public/assets/` 디렉토리에서 정적 서빙

---

## 3. 가정 (Assumptions)

### A-001: Supabase 서비스 가용성

- Supabase 무료 플랜 또는 Pro 플랜이 활성 상태라고 가정한다.
- Supabase Auth의 email/password 인증이 프로젝트 설정에서 활성화되어 있다고 가정한다.
- RLS 정책이 올바르게 설정되어 각 사용자가 자신의 데이터에만 접근 가능하다고 가정한다.

### A-002: Static Export 호환성

- Next.js `output: 'export'` 모드에서 모든 페이지가 정적으로 빌드 가능하다고 가정한다.
- 동적 라우팅은 클라이언트 사이드 라우팅으로 처리한다고 가정한다.
- Supabase SDK의 모든 호출은 클라이언트 사이드에서만 실행된다고 가정한다.

### A-003: 에셋 인덱스 활용

- 기존 `assetIndex.json`의 구조가 캐릭터 생성 위자드에서도 동일하게 사용 가능하다고 가정한다.
- 개별 에셋 선택 UI에서 에셋 썸네일을 표시하기 위해 동일한 `public/assets/` 경로를 사용한다고 가정한다.

### A-004: 일일 1건 제약

- 무드 다이어리는 사용자당 하루 1건으로 제한한다고 가정한다.
- 같은 날 재작성 시 기존 항목을 업데이트(UPSERT)한다고 가정한다.

---

## 4. 요구사항 (Requirements)

### 모듈 1: 인증 시스템 (Authentication System)

#### REQ-AUTH-001 [Event-Driven]

**WHEN** 사용자가 회원가입 폼에 유효한 이메일과 비밀번호를 입력하고 "가입하기" 버튼을 클릭하면, **THEN** 시스템은 Supabase Auth `signUp` API를 호출하여 새 계정을 생성해야 한다.

#### REQ-AUTH-002 [Event-Driven]

**WHEN** 사용자가 로그인 폼에 등록된 이메일과 비밀번호를 입력하고 "로그인" 버튼을 클릭하면, **THEN** 시스템은 Supabase Auth `signInWithPassword` API를 호출하여 세션을 생성해야 한다.

#### REQ-AUTH-003 [Event-Driven]

**WHEN** 사용자가 "로그아웃" 버튼을 클릭하면, **THEN** 시스템은 Supabase Auth `signOut` API를 호출하여 세션을 종료하고 랜딩 페이지로 리다이렉트해야 한다.

#### REQ-AUTH-004 [State-Driven]

**IF** 사용자가 인증되지 않은 상태에서 보호된 경로(`/create`, `/mood`, `/diary`)에 접근하면, **THEN** 시스템은 로그인 페이지(`/login`)로 리다이렉트해야 한다.

#### REQ-AUTH-005 [Ubiquitous]

시스템은 **항상** Supabase `onAuthStateChange` 리스너를 통해 인증 상태 변경을 실시간으로 감지하고 UI를 동기화해야 한다.

#### REQ-AUTH-006 [Ubiquitous]

시스템은 **항상** 세션 토큰을 Supabase SDK의 기본 메커니즘(localStorage)을 통해 유지하여 브라우저 새로고침 후에도 로그인 상태를 보존해야 한다.

#### REQ-AUTH-007 [Unwanted]

시스템은 비밀번호를 클라이언트 측 localStorage나 sessionStorage에 평문으로 저장하는 것을 **허용하지 않아야 한다**.

#### REQ-AUTH-008 [Event-Driven]

**WHEN** 회원가입이 성공하면, **THEN** 시스템은 `profiles` 테이블에 해당 사용자의 프로필 레코드를 자동 생성해야 한다 (Supabase Database Trigger 또는 클라이언트 측 INSERT).

---

### 모듈 2: 캐릭터 관리 (Character Management)

#### REQ-CHAR-001 [Event-Driven]

**WHEN** 인증된 사용자가 캐릭터 생성 위자드를 완료하고 "저장" 버튼을 클릭하면, **THEN** 시스템은 선택된 고정 레이어(face, hair, mustache, glasses)를 `characters` 테이블에 INSERT해야 한다.

#### REQ-CHAR-002 [Ubiquitous]

시스템은 **항상** 캐릭터 생성 위자드에서 다음 4단계를 순차적으로 제공해야 한다:

| 단계 | 선택 대상 | 에셋 수 | 필수 여부 |
|------|----------|---------|----------|
| 1 | 얼굴형 (face) | 5 | 필수 |
| 2 | 헤어스타일 (hair) | 214 | 필수 |
| 3 | 수염 (mustache) | 가변 (얼굴형 기반) | 선택 |
| 4 | 안경 (glasses) | 39 | 선택 |

#### REQ-CHAR-003 [State-Driven]

**IF** 3단계(수염 선택)에서 얼굴형이 선택된 상태라면, **THEN** 시스템은 `FACE_MUSTACHE_COMPATIBILITY` 매핑에 따라 호환되는 수염 에셋만 후보로 표시해야 한다.

#### REQ-CHAR-004 [Event-Driven]

**WHEN** 위자드의 각 단계에서 에셋을 선택하면, **THEN** 시스템은 Canvas API로 현재까지 선택된 레이어를 실시간 합성하여 미리보기를 업데이트해야 한다.

#### REQ-CHAR-005 [State-Driven]

**IF** 사용자가 이미 저장된 캐릭터를 보유하고 있다면, **THEN** 시스템은 캐릭터 생성 위자드 대신 일일 무드 페이지(`/mood`)로 이동해야 한다.

#### REQ-CHAR-006 [Event-Driven]

**WHEN** 사용자가 "캐릭터 수정" 기능을 사용하면, **THEN** 시스템은 기존 선택값을 위자드에 로드한 상태에서 수정을 허용하고, 완료 시 `characters` 테이블을 UPDATE해야 한다.

#### REQ-CHAR-007 [Ubiquitous]

시스템은 **항상** 사용자당 최대 1개의 캐릭터만 허용해야 한다 (1:1 관계, `user_id` UNIQUE 제약).

---

### 모듈 3: 무드 다이어리 시스템 (Mood Diary System)

#### REQ-MOOD-001 [Event-Driven]

**WHEN** 인증된 사용자가 무드 카테고리(7종)를 선택하면, **THEN** 시스템은 해당 무드 그룹에 속하는 표정(expression) 에셋 목록을 표시하여 사용자가 직접 선택할 수 있게 해야 한다.

#### REQ-MOOD-002 [Event-Driven]

**WHEN** 사용자가 의상 카테고리(6종)를 선택하면, **THEN** 시스템은 해당 카테고리에 속하는 의상(body) 에셋 목록을 표시하여 사용자가 직접 선택할 수 있게 해야 한다.

#### REQ-MOOD-003 [Event-Driven]

**WHEN** 사용자가 표정과 의상을 모두 선택한 후 "오늘의 기분 저장" 버튼을 클릭하면, **THEN** 시스템은 다음 데이터를 `mood_entries` 테이블에 UPSERT해야 한다:
- `user_id`: 현재 인증된 사용자 ID
- `character_id`: 사용자의 캐릭터 ID
- `date`: 오늘 날짜 (UTC 기준, YYYY-MM-DD)
- `mood_category`: 선택된 무드 카테고리
- `outfit_file`: 선택된 의상 파일명
- `expression_file`: 선택된 표정 파일명

#### REQ-MOOD-004 [Ubiquitous]

시스템은 **항상** 무드 기록 저장 시 Base Character(face, hair, mustache, glasses) + 오늘 선택한 outfit + expression을 합성한 미리보기를 표시해야 한다.

#### REQ-MOOD-005 [State-Driven]

**IF** 오늘 날짜에 이미 무드 기록이 존재한다면, **THEN** 시스템은 기존 기록의 선택값을 로드하고 "수정" 모드로 전환하여 기존 값을 업데이트할 수 있게 해야 한다.

#### REQ-MOOD-006 [Event-Driven]

**WHEN** 사용자가 무드 다이어리 페이지(`/diary`)에 접속하면, **THEN** 시스템은 해당 사용자의 무드 기록을 날짜 역순으로 조회하여 캘린더 뷰 또는 리스트 뷰로 표시해야 한다.

#### REQ-MOOD-007 [Event-Driven]

**WHEN** 사용자가 캘린더의 특정 날짜를 클릭하면, **THEN** 시스템은 해당 날짜의 무드 기록을 로드하고 합성된 캐릭터 이미지와 무드 정보를 상세 표시해야 한다.

#### REQ-MOOD-008 [Event-Driven]

**WHEN** 사용자가 무드 미리보기 화면에서 "다운로드" 버튼을 클릭하면, **THEN** 시스템은 합성된 캐릭터 이미지를 PNG 파일로 다운로드해야 한다 (기존 `downloadAsPNG` 함수 재활용).

#### REQ-MOOD-009 [Optional]

**가능하면** 시스템은 `composite_image_url` 필드를 통해 합성된 이미지를 Supabase Storage에 저장하고, 다이어리 조회 시 재합성 없이 저장된 이미지를 사용하는 기능을 제공한다.

---

### 모듈 4: UI/UX 흐름 (UI/UX Flow)

#### REQ-UX-001 [Ubiquitous]

시스템은 **항상** 다음 페이지 구조를 제공해야 한다:

| 경로 | 페이지명 | 접근 권한 | 설명 |
|------|---------|----------|------|
| `/` | 랜딩 페이지 | Public | 서비스 소개, "시작하기" CTA |
| `/login` | 로그인/회원가입 | Public | 이메일/비밀번호 인증 |
| `/create` | 캐릭터 생성 위자드 | Protected | 4단계 Base Character 생성 |
| `/mood` | 오늘의 기분 | Protected | 일일 무드 선택 및 저장 |
| `/diary` | 무드 다이어리 | Protected | 캘린더/리스트 무드 기록 조회 |

#### REQ-UX-002 [Event-Driven]

**WHEN** 미인증 사용자가 랜딩 페이지의 "시작하기" 버튼을 클릭하면, **THEN** 시스템은 `/login` 페이지로 이동해야 한다.

#### REQ-UX-003 [Event-Driven]

**WHEN** 인증 성공 후 사용자에게 저장된 캐릭터가 없으면, **THEN** 시스템은 캐릭터 생성 위자드(`/create`)로 자동 이동해야 한다.

#### REQ-UX-004 [Event-Driven]

**WHEN** 인증 성공 후 사용자에게 저장된 캐릭터가 있으면, **THEN** 시스템은 오늘의 기분 페이지(`/mood`)로 자동 이동해야 한다.

#### REQ-UX-005 [Ubiquitous]

시스템은 **항상** 인증된 사용자에게 네비게이션 바를 제공하여 "오늘의 기분", "다이어리", "캐릭터 수정", "로그아웃" 메뉴에 접근할 수 있게 해야 한다.

#### REQ-UX-006 [Ubiquitous]

시스템은 **항상** 반응형 레이아웃을 유지하여 모바일(375px+)과 데스크톱(1024px+) 환경에서 모두 최적화된 UI를 제공해야 한다 (SPEC-UI-001 REQ-UX-001 계승).

#### REQ-UX-007 [State-Driven]

**IF** 헤어 에셋 목록(214개)을 표시해야 하는 상태라면, **THEN** 시스템은 페이지네이션 또는 무한 스크롤을 적용하여 한 번에 최대 20개씩 표시하고, 검색/필터 기능을 제공해야 한다.

#### REQ-UX-008 [Event-Driven]

**WHEN** 캐릭터 생성 위자드에서 에셋 선택 시, **THEN** 시스템은 선택된 에셋의 썸네일 이미지를 Canvas 미리보기에 실시간으로 반영하여 합성 결과를 즉시 확인할 수 있게 해야 한다.

---

### 모듈 5: 배포 (Deployment)

#### REQ-DEPLOY-001 [Ubiquitous]

시스템은 **항상** Next.js 정적 내보내기(`output: 'export'`) 모드로 빌드되어 Cloudflare Pages에서 호스팅 가능해야 한다.

#### REQ-DEPLOY-002 [Ubiquitous]

시스템은 **항상** 서버 사이드 기능(SSR, API Routes, Server Actions, Middleware)을 사용하지 않고, 모든 백엔드 통신은 Supabase 클라이언트 SDK를 통해 수행해야 한다.

#### REQ-DEPLOY-003 [Ubiquitous]

시스템은 **항상** 다음 환경 변수를 `NEXT_PUBLIC_` 접두사로 노출하여 클라이언트 사이드에서 접근 가능하게 해야 한다:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키

#### REQ-DEPLOY-004 [Unwanted]

시스템은 Supabase `service_role` 키를 클라이언트 사이드 코드에 포함하는 것을 **허용하지 않아야 한다**.

#### REQ-DEPLOY-005 [Event-Driven]

**WHEN** `next build` 명령이 실행되면, **THEN** 시스템은 `out/` 디렉토리에 완전한 정적 사이트를 생성하고, 해당 출력물이 Cloudflare Pages에 배포 가능해야 한다.

#### REQ-DEPLOY-006 [Ubiquitous]

시스템은 **항상** Cloudflare Pages의 SPA 폴백을 위해 `_redirects` 파일 또는 동등한 설정을 포함하여, 클라이언트 사이드 라우팅이 정상 작동하도록 해야 한다.

---

## 5. 사양 (Specifications)

### S-001: Supabase 데이터베이스 스키마

```sql
-- profiles 테이블
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- characters 테이블
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  face TEXT NOT NULL,           -- 얼굴형 파일명 (예: "round 4.png")
  hair TEXT NOT NULL,           -- 헤어 파일명 (예: "afro hair black.png")
  mustache TEXT,                -- 수염 파일명 (nullable = 수염 없음)
  glasses TEXT,                 -- 안경 파일명 (nullable = 안경 없음)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)              -- 사용자당 1캐릭터
);

-- mood_entries 테이블
CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  date DATE NOT NULL,                     -- 기록 날짜 (YYYY-MM-DD)
  mood_category TEXT NOT NULL,            -- MoodCategory 값
  outfit_file TEXT NOT NULL,              -- 선택된 의상 파일명
  expression_file TEXT NOT NULL,          -- 선택된 표정 파일명
  composite_image_url TEXT,               -- 합성 이미지 URL (선택적)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)                   -- 사용자당 날짜별 1건
);
```

### S-002: Row Level Security (RLS) 정책

```sql
-- profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- characters RLS
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own character" ON characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own character" ON characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own character" ON characters FOR UPDATE USING (auth.uid() = user_id);

-- mood_entries RLS
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own entries" ON mood_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON mood_entries FOR UPDATE USING (auth.uid() = user_id);
```

### S-003: Supabase 클라이언트 초기화

```typescript
// src/app/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### S-004: 확장된 타입 정의

```typescript
// 기존 types.ts에 추가

// 사용자 프로필
interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
}

// Base Character (고정 레이어)
interface BaseCharacter {
  id: string;
  user_id: string;
  face: string;
  hair: string;
  mustache: string | null;
  glasses: string | null;
  created_at: string;
  updated_at: string;
}

// 무드 다이어리 항목
interface MoodEntry {
  id: string;
  user_id: string;
  character_id: string;
  date: string;              // YYYY-MM-DD
  mood_category: MoodCategory;
  outfit_file: string;
  expression_file: string;
  composite_image_url: string | null;
  created_at: string;
  updated_at: string;
}

// 캐릭터 생성 위자드 상태
interface WizardState {
  step: 1 | 2 | 3 | 4;
  face: string | null;
  hair: string | null;
  mustache: string | null;
  glasses: string | null;
}

// 일일 무드 선택 상태
interface DailyMoodState {
  moodCategory: MoodCategory | null;
  expressionFile: string | null;
  outfitCategory: OutfitCategory | null;
  outfitFile: string | null;
}
```

### S-005: 확장된 파일 구조

```
src/app/
├── page.tsx                    # 랜딩 페이지 (Public)
├── layout.tsx                  # 루트 레이아웃 + AuthProvider
├── login/
│   └── page.tsx                # 로그인/회원가입 (Public)
├── create/
│   └── page.tsx                # 캐릭터 생성 위자드 (Protected)
├── mood/
│   └── page.tsx                # 오늘의 기분 (Protected)
├── diary/
│   └── page.tsx                # 무드 다이어리 (Protected)
├── components/
│   ├── MoodSelector.tsx        # 기분 카테고리 선택기 (기존)
│   ├── OutfitSelector.tsx      # 의상 카테고리 선택기 (기존)
│   ├── CharacterCanvas.tsx     # Canvas 미리보기 (기존, 확장)
│   ├── GenerateButton.tsx      # 생성/다운로드 버튼 (기존)
│   ├── AuthForm.tsx            # 로그인/회원가입 폼 (신규)
│   ├── AuthGuard.tsx           # 인증 가드 래퍼 (신규)
│   ├── NavBar.tsx              # 네비게이션 바 (신규)
│   ├── WizardStep.tsx          # 위자드 단계 컴포넌트 (신규)
│   ├── AssetPicker.tsx         # 에셋 개별 선택 UI (신규)
│   ├── MoodExpressionPicker.tsx # 무드 내 표정 선택 (신규)
│   ├── OutfitPicker.tsx        # 카테고리 내 의상 선택 (신규)
│   ├── DiaryCalendar.tsx       # 캘린더 뷰 (신규)
│   └── DiaryEntryCard.tsx      # 다이어리 항목 카드 (신규)
├── lib/
│   ├── types.ts                # 타입 정의 (확장)
│   ├── assetManager.ts         # 에셋 인덱스 조회 (기존)
│   ├── randomEngine.ts         # 랜덤 조합 엔진 (기존, 유지)
│   ├── imageCompositor.ts      # Canvas 이미지 합성 (기존, 확장)
│   ├── supabase.ts             # Supabase 클라이언트 (신규)
│   ├── database.types.ts       # Supabase 타입 생성 (신규)
│   └── auth.ts                 # 인증 유틸리티 함수 (신규)
├── hooks/
│   ├── useAuth.ts              # 인증 상태 관리 hook (신규)
│   ├── useCharacter.ts         # 캐릭터 CRUD hook (신규)
│   └── useMoodEntries.ts       # 무드 기록 CRUD hook (신규)
├── contexts/
│   └── AuthContext.tsx          # 인증 Context Provider (신규)
└── data/
    └── assetIndex.json          # 에셋 인덱스 (기존)
```

### S-006: next.config.ts 변경

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,  // Static Export에서는 Image Optimization 비활성화
  },
};

export default nextConfig;
```

### S-007: 인증 흐름 상태 다이어그램

```
[미인증] --"시작하기"--> [/login]
[/login] --"회원가입 성공"--> [profiles INSERT] --> [/create]
[/login] --"로그인 성공, 캐릭터 없음"--> [/create]
[/login] --"로그인 성공, 캐릭터 있음"--> [/mood]
[/create] --"위자드 완료"--> [characters INSERT] --> [/mood]
[/mood] --"기분 저장"--> [mood_entries UPSERT] --> [미리보기 표시]
[NavBar] --"다이어리"--> [/diary]
[NavBar] --"캐릭터 수정"--> [/create] (편집 모드)
[NavBar] --"로그아웃"--> [/]
```

---

## 6. 제약사항 (Constraints)

### C-001: Static Export 제약

- `output: 'export'` 모드 필수: SSR, API Routes, Server Actions, Middleware 사용 불가
- `next/image` 최적화 비활성화 필수 (`images: { unoptimized: true }`)
- 동적 라우팅은 `generateStaticParams` 또는 클라이언트 사이드 처리
- `next/headers`, `next/cookies` 사용 불가

### C-002: Supabase 클라이언트 사이드 제약

- `service_role` 키 사용 금지 (클라이언트 노출 위험)
- 모든 데이터 접근은 RLS를 통해 인증된 사용자로 제한
- 복잡한 서버 사이드 로직 불가 (Edge Functions 별도 고려 필요 시 향후 SPEC)

### C-003: 성능 제약

- 에셋 선택 UI: 214개 헤어 에셋 로딩 시 lazy loading + 페이지네이션 필수
- Canvas 합성: 기존 3초 이내 제약 유지 (SPEC-UI-001 C-001)
- Supabase 호출: 네트워크 지연 고려, 로딩 상태 표시 필수

### C-004: 데이터 무결성 제약

- `characters` 테이블: `user_id` UNIQUE 제약 (사용자당 1캐릭터)
- `mood_entries` 테이블: `(user_id, date)` UNIQUE 제약 (날짜별 1건)
- 외래 키: `mood_entries.character_id` -> `characters.id` (CASCADE DELETE)

---

## 7. 추적성 (Traceability)

| 요구사항 ID | 모듈 | 관련 파일 | 검증 방법 |
|------------|------|----------|----------|
| REQ-AUTH-001 | 인증 | AuthForm.tsx, auth.ts, supabase.ts | E2E 테스트 |
| REQ-AUTH-002 | 인증 | AuthForm.tsx, auth.ts | E2E 테스트 |
| REQ-AUTH-003 | 인증 | NavBar.tsx, auth.ts | E2E 테스트 |
| REQ-AUTH-004 | 인증 | AuthGuard.tsx, useAuth.ts | 컴포넌트 테스트 |
| REQ-AUTH-005 | 인증 | AuthContext.tsx, useAuth.ts | 단위 테스트 |
| REQ-AUTH-006 | 인증 | supabase.ts | 통합 테스트 |
| REQ-AUTH-007 | 인증 | auth.ts | 보안 검토 |
| REQ-AUTH-008 | 인증 | auth.ts, supabase.ts | 통합 테스트 |
| REQ-CHAR-001 | 캐릭터 | create/page.tsx, useCharacter.ts | E2E 테스트 |
| REQ-CHAR-002 | 캐릭터 | WizardStep.tsx, AssetPicker.tsx | 컴포넌트 테스트 |
| REQ-CHAR-003 | 캐릭터 | AssetPicker.tsx, assetManager.ts | 단위 테스트 |
| REQ-CHAR-004 | 캐릭터 | CharacterCanvas.tsx, imageCompositor.ts | 시각 검증 |
| REQ-CHAR-005 | 캐릭터 | create/page.tsx, useCharacter.ts | E2E 테스트 |
| REQ-CHAR-006 | 캐릭터 | create/page.tsx, useCharacter.ts | E2E 테스트 |
| REQ-CHAR-007 | 캐릭터 | characters 테이블 UNIQUE 제약 | DB 제약 테스트 |
| REQ-MOOD-001 | 무드 다이어리 | MoodExpressionPicker.tsx | 컴포넌트 테스트 |
| REQ-MOOD-002 | 무드 다이어리 | OutfitPicker.tsx | 컴포넌트 테스트 |
| REQ-MOOD-003 | 무드 다이어리 | mood/page.tsx, useMoodEntries.ts | E2E 테스트 |
| REQ-MOOD-004 | 무드 다이어리 | CharacterCanvas.tsx | 시각 검증 |
| REQ-MOOD-005 | 무드 다이어리 | mood/page.tsx, useMoodEntries.ts | E2E 테스트 |
| REQ-MOOD-006 | 무드 다이어리 | DiaryCalendar.tsx, useMoodEntries.ts | 컴포넌트 테스트 |
| REQ-MOOD-007 | 무드 다이어리 | DiaryCalendar.tsx, DiaryEntryCard.tsx | E2E 테스트 |
| REQ-MOOD-008 | 무드 다이어리 | imageCompositor.ts | 단위 테스트 |
| REQ-MOOD-009 | 무드 다이어리 | Supabase Storage | 통합 테스트 |
| REQ-UX-001 | UI/UX | layout.tsx, NavBar.tsx | 시각 검증 |
| REQ-UX-002 | UI/UX | page.tsx (랜딩) | E2E 테스트 |
| REQ-UX-003 | UI/UX | AuthContext.tsx, useCharacter.ts | E2E 테스트 |
| REQ-UX-004 | UI/UX | AuthContext.tsx, useCharacter.ts | E2E 테스트 |
| REQ-UX-005 | UI/UX | NavBar.tsx | 컴포넌트 테스트 |
| REQ-UX-006 | UI/UX | 전체 컴포넌트 | 반응형 테스트 |
| REQ-UX-007 | UI/UX | AssetPicker.tsx | 컴포넌트 테스트 |
| REQ-UX-008 | UI/UX | CharacterCanvas.tsx | 시각 검증 |
| REQ-DEPLOY-001 | 배포 | next.config.ts | 빌드 테스트 |
| REQ-DEPLOY-002 | 배포 | 전체 코드베이스 | 정적 분석 |
| REQ-DEPLOY-003 | 배포 | .env.local, next.config.ts | 환경 변수 검증 |
| REQ-DEPLOY-004 | 배포 | 전체 코드베이스 | 보안 검토 |
| REQ-DEPLOY-005 | 배포 | next.config.ts, package.json | 빌드 테스트 |
| REQ-DEPLOY-006 | 배포 | public/_redirects | 배포 후 검증 |
