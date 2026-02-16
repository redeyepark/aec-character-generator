# 변경 이력

이 문서는 AEC Character Generator 프로젝트의 주요 변경 사항을 기록합니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르며,
버전 관리는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

---

## [1.1.0] - 2026-02-16

### Firebase 마이그레이션 및 안정화 (SPEC-FIREBASE-001)

#### 변경

- Supabase (Auth + PostgreSQL)에서 Firebase (Authentication + Cloud Firestore)로 백엔드 전면 마이그레이션
- 캐릭터 생성은 최초 1회만 가능하도록 수정 (수정 모드 및 내비게이션 링크 제거)

#### 수정

- Firestore `mood_entries` 복합 인덱스(`userId` + `date`) 추가 및 서버 측 쿼리 복원
- 로그인 시 `hasCharacter` 확인 race condition 수정 (캐릭터 확인 완료 후 로딩 종료)
- 오늘의 기분 페이지 레이아웃 개선 (캐릭터 상단 배치)

#### 추가

- `firestore.rules`: Firestore 보안 규칙 (RLS 대체)
- `firestore.indexes.json`: Firestore 복합 인덱스 정의
- `firebase.json`, `.firebaserc`: Firebase 프로젝트 설정

#### 삭제

- Supabase 관련 코드 및 의존성 제거 (`@supabase/supabase-js`, `supabase.ts`, `database.types.ts`)
- 내비게이션 바에서 "캐릭터 수정" 링크 제거

---

## [1.0.0] - 2026-02-15

### Phase 3: UX 개선

#### 추가

- 인증 상태 및 캐릭터 보유 여부에 따른 자동 리다이렉트 흐름 구현
- 카테고리 기반 무드 선택 UI (카테고리 클릭 시 자동 랜덤 생성)
- 표정 및 의상 각각에 대한 "다시 뽑기" 버튼 추가
- `MoodSelector` 컴포넌트 (카테고리 선택기)
- `OutfitSelector` 컴포넌트 (의상 카테고리 선택기)

#### 변경

- 수동 파일 선택 방식에서 카테고리 자동 랜덤 방식으로 UX 단순화
- 기존 `MoodExpressionPicker`, `OutfitPicker` 컴포넌트를 레거시로 전환

#### 수정

- 캐릭터 저장 시 발생하던 Race Condition 문제 해결

#### 디자인

- Pencil MCP를 활용한 전체 UI 리디자인 (5개 화면)
- 디자인 시스템 구축: Outfit 폰트, Warm Cream 배경, Forest Green + Terracotta 액센트
- 랜딩 페이지: Hero 섹션 + 3개 기능 카드 + Footer
- 로그인 페이지: 브랜드 패널 + 로그인/회원가입 폼 분할 레이아웃
- 캐릭터 생성 위자드: 4단계 스텝 인디케이터 + 실시간 미리보기
- 무드 선택: 기분/의상 카테고리 칩 + 다시 뽑기 기능
- 무드 다이어리: 캘린더 뷰 + 날짜별 상세 카드

---

## [0.2.0] - 2026-02-10

### Phase 2 (SPEC-UPDATE-001): 인증, 데이터 영속화, 배포

#### 추가

- Supabase Auth 연동 (이메일/비밀번호 로그인 및 회원가입)
- `AuthContext` 및 `AuthGuard` 컴포넌트로 인증 상태 관리
- `AuthForm` 컴포넌트 (로그인/회원가입 폼)
- 4단계 캐릭터 생성 위자드 (`create/page.tsx`, `WizardStep` 컴포넌트)
- 캐릭터 데이터 영속화 (`useCharacter` 훅, Supabase characters 테이블)
- 무드 다이어리 시스템 (`diary/page.tsx`, `DiaryCalendar`, `DiaryEntryCard` 컴포넌트)
- 무드 항목 CRUD (`useMoodEntries` 훅, Supabase mood_entries 테이블)
- `NavBar` 내비게이션 컴포넌트
- `ClientLayout` 클라이언트 레이아웃 래퍼
- Supabase 데이터베이스 스키마 (`supabase/schema.sql`)
  - `profiles` 테이블: 사용자 프로필
  - `characters` 테이블: 베이스 캐릭터 (사용자당 1개)
  - `mood_entries` 테이블: 일일 무드 기록 (사용자당 하루 1개)
- 모든 테이블에 Row Level Security(RLS) 정책 적용
- Cloudflare Pages 정적 배포 설정 (`output: 'export'`)
- Supabase 생성 타입 (`database.types.ts`)
- 사용자 인증 관련 TypeScript 타입 추가 (`Profile`, `BaseCharacter`, `MoodEntry`, `WizardState`, `DailyMoodState`)

---

## [0.1.0] - 2026-02-01

### Phase 1 (SPEC-UI-001): 캐릭터 생성기 코어

#### 추가

- Next.js 15 (App Router) + React 19 + TypeScript 프로젝트 초기 설정
- Tailwind CSS 4 스타일링 시스템 구성
- 493개 PNG 에셋 관리 시스템 (6개 카테고리)
  - Body (의상): 143개
  - Face (얼굴형): 5개
  - Facial Expression (표정): 41개, 7개 기분 그룹으로 분류
  - Mustache (수염): 51개, 5개 호환성 그룹
  - Hair (헤어스타일): 214개
  - Glasses (안경/선글라스): 39개
- 에셋 로딩 및 인덱싱 시스템 (`assetManager.ts`)
- 사전 빌드 에셋 인덱스 (`assetIndex.json`)
- 7가지 기분 카테고리 정의 (행복, 자신감, 차분, 놀람, 사려깊음, 유쾌, 결연)
- 6가지 의상 카테고리 정의 (캐주얼, 포멀, 스포티, 아우터, 보타이, 전체)
- 얼굴형-수염 호환성 필터링 알고리즘
- 랜덤 조합 엔진 (`randomEngine.ts`)
- Canvas API 기반 6층 레이어 이미지 합성 (`imageCompositor.ts`)
  - 합성 순서: body -> face -> expression -> mustache -> hair -> glasses
- `CharacterCanvas` 실시간 미리보기 컴포넌트
- `AssetPicker` 에셋 선택 그리드 컴포넌트
- `GenerateButton` 생성/다운로드 버튼 컴포넌트
- PNG 이미지 다운로드 기능
- 반응형 UI 구현
- 에셋 복사 스크립트 (`scripts/copyAssets.ts`)
- 에셋 인덱스 빌드 스크립트 (`scripts/buildAssetIndex.ts`)
- TypeScript 타입 정의 (`types.ts`: `MoodCategory`, `OutfitCategory`, `FaceShape`, `LayerType`, `CharacterCombination`, `AssetIndex` 등)
