# 변경 이력

이 문서는 AEC Character Generator 프로젝트의 주요 변경 사항을 기록합니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르며,
버전 관리는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

---

## [1.5.0] - 2026-02-17

### 오늘의 운세 시스템 (SPEC-FORTUNE-001)

#### 추가

- 사주(四柱)/오행(五行) 기반 운세 계산 엔진 (`src/app/lib/fortune/`, 순수 TypeScript, 외부 의존성 없음)
- 일일 운세 카드 컴포넌트 (`FortuneCard.tsx`) - 운세 등급 표시 (대길/길/보통/주의)
- 행운의 색상 의상 추천 버튼 (`LuckyOutfitButton.tsx`) - 오행 기반 색상 매칭
- 생년월일시 입력 폼 (`BirthInfoForm.tsx`) - 유효성 검증 포함
- 생년월일시 정보 관리 훅 (`useBirthInfo.ts`)
- 운세 계산 및 조회 훅 (`useFortune.ts`)
- 무드 페이지 (`/mood`)에 운세 카드 통합 (캐릭터 미리보기 상단 배치)
- `profiles` 컬렉션에 `birthYear`, `birthMonth`, `birthDay`, `birthHour` 필드 추가

### 설정 페이지 및 회원 탈퇴

#### 추가

- 설정 페이지 (`/settings`) 신규 추가
  - 사주 정보 (생년월일시) 입력 및 수정 섹션
  - 회원 탈퇴 (Danger Zone) 섹션
- 회원 탈퇴 기능
  - 비밀번호 재인증 후 삭제 진행
  - 전체 데이터 정리: `mood_entries`, `characters`, `profiles` 컬렉션 삭제
  - Firebase Authentication 계정 삭제
  - 경고 메시지 및 최종 확인 다이얼로그

#### 변경

- 화면 구성 6개에서 7개로 확장 (설정 페이지 추가)
- 무드 선택 페이지(`/mood`)에 운세 카드 영역 추가

---

## [1.4.0] - 2026-02-17

### Phase 1 UX/UI 개선 (SPEC-UX-001)

#### 추가

- 달력 색상 시각화: 7가지 기분 카테고리별 고유 배경색 매핑 (`MOOD_COLOR_MAP`)
- 선택된 달력 셀에 기분 색상 점(dot) 표시
- 달력 셀 접근성 강화 (`aria-label`에 한국어 기분명 포함)
- 3-slide 온보딩 플로우 (`OnboardingSlides.tsx` 신규 컴포넌트)
- 온보딩 건너뛰기 버튼 및 키보드 내비게이션 (Tab, Enter, Escape, 화살표 키)
- `localStorage` 기반 온보딩 1회 표시 (키: `aec_onboarding_done`)
- 기분 선택 시 부드러운 전환 애니메이션 (scale + opacity)

#### 변경

- 기분 기록 레이아웃 재구성: 기분 선택 → 저장 버튼 → 세부 조정(접이식) → 다운로드 순서로 변경
- 저장 버튼을 주요 액션(Primary CTA)으로 강조 (전체 너비, 대형 크기, 진한 파란색)
- 의상 선택 및 "다시 뽑기" 버튼을 접이식 "세부 조정" 섹션으로 이동
- 다운로드 버튼을 보조 액션(outline) 스타일로 변경
- 캐릭터 생성 페이지에 온보딩 조건부 렌더링 추가 (신규 사용자만)
- 관리자는 온보딩을 건너뜀

---

## [1.3.0] - 2026-02-16

### 관리자 시스템 및 이메일 인증

#### 추가

- 관리자 시스템: `profiles` 컬렉션에 `role` 필드 추가, `isAdmin` 상태 및 `checkIsAdmin()` 함수
- 관리자 전용 캐릭터 편집 모드 (`create/page.tsx`에서 기존 캐릭터 수정 가능)
- 관리자 계정 생성 페이지 (`admin-setup/page.tsx`)
- 회원가입 시 이메일 인증 메일 자동 발송 (`sendEmailVerification()`)
- 인증 메일 재발송 버튼 및 발송 성공/실패 피드백 (`AuthForm.tsx`)

#### 수정

- 이메일 인증 rate limit 처리 (`auth/too-many-requests` 한국어 에러 메시지)
- 메일 발송 실패 시에도 회원가입 정상 진행되도록 처리
- 에셋 빌드 스크립트에 SVG 얼굴 파일 지원 추가 (`03_Face_SVG -> face-svg` 매핑, `.svg` 필터)
- `buildAssetIndex.ts`에 `readSvgFiles()` 함수 및 face-svg 인덱스 자동 생성 추가

---

## [1.2.0] - 2026-02-16

### SVG 얼굴 피부색 선택 (SPEC-SKIN-001)

#### 추가

- SVG 얼굴 에셋 5종 추가 (`public/assets/face-svg/`, PNG 대비 ~90% 용량 절감)
- 8종 프리셋 피부색 팔레트 (밝은 살색 ~ 짙은 갈색)
- `SkinTonePicker` 컴포넌트 (접근성 radiogroup 지원)
- `svgProcessor.ts` SVG 텍스트 로드/피부색 치환/Canvas Image 변환 유틸리티
- Firestore `characters` 컬렉션에 `skinTone` 필드 추가

#### 변경

- 캐릭터 생성 위자드 Step 1에 피부색 선택기 통합
- 얼굴 에셋을 PNG에서 SVG로 전환
- Canvas 이미지 합성기에 SVG face 렌더링 분기 추가
- 무드 페이지 및 다이어리 카드에서 저장된 피부색으로 캐릭터 렌더링

#### 호환성

- 기존 캐릭터 데이터(skinTone 필드 없음) 로드 시 기본값 "medium" 자동 적용
- PNG 얼굴 파일은 삭제하지 않고 유지 (코드에서 비참조)

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
