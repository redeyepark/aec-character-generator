# Changelog

이 프로젝트의 모든 주요 변경사항을 기록합니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르며,
버전 관리는 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

---

## [v1.12.0] - 2026-03-21

### 아이템 인벤토리 (옷장) 페이지 (SPEC-INVENTORY-001)

#### 추가

- 아이템 인벤토리 페이지 (`/inventory/`): 보유 장비 아이템을 시각적 그리드로 확인하는 보기 전용 페이지
- 3탭 구성: 의상(body), 착용 소품(body_item), 손 아이템(hand_item)
- 의상 탭 하위 필터: casual, formal, sporty, outerwear, bowtie, SVG 카테고리별 필터링
- 정렬 옵션: 이름순(알파벳) / 획득순(기본 의상 > 출석 보상 > 일일 보상)
- 해금/잠금 아이템 시각적 구분: 잠긴 아이템은 grayscale + 자물쇠 아이콘 표시
- 획득 경로 배지: "기본 의상" / "출석 보상" / "일일 보상" 라벨 표시
- `InventoryGrid.tsx` 컴포넌트: 재사용 가능한 아이템 그리드 (필터/정렬/잠금 상태 지원)
- 반응형 그리드 레이아웃 (3~6열 적응형)
- 스켈레톤 로딩 UI

#### 변경

- `NavBar.tsx`: "옷장" 링크 추가 (`/inventory/`)
- Firestore 쓰기 없이 기존 `rewards`, `event_rewards` 컬렉션 읽기만 수행

---

## [v1.11.0] - 2026-02-18

### SVG 의상 색상 커스터마이징 (SPEC-OUTFIT-001)

#### 추가

- SVG 의상 에셋 13종 추가 (`public/assets/body-svg/`): T shirt, baseball jacket, european suit, hood T shirt, inner fur jacket, leather jacket, pocket shirt (2종), puffer vest, sheriff (2종), shirt tie, T shirt short
- `OutfitColorPicker.tsx` 컴포넌트: 메인/서브 의상 색상을 16개 프리셋 팔레트에서 선택하는 UI (WCAG 2.1 AA 접근성 준수)
- `svgProcessor.ts`에 `applyOutfitColors()`, `loadColoredOutfitSvgAsImage()` 함수 추가: SVG 3색 동시 교체 (메인 #919191, 서브 #C6C6C6, 피부 #FFFFFF)
- `assetManager.ts`에 `getBodySvgAssets()` 함수 및 body-svg 경로 라우팅 추가
- `OutfitColorInfo` 타입, `OUTFIT_COLOR_PRESETS` 16색 팔레트 상수 추가
- `assetIndex.json`에 `body-svg` 키 추가 (13종 SVG 파일 목록)

#### 변경

- `imageCompositor.ts`: body 레이어에 SVG 의상 렌더링 분기 추가 (파일 확장자 `.svg` 기반)
- `mood/page.tsx`: SVG 의상 선택 그리드 및 색상 피커 통합, 의상 색상 상태 관리
- `useMoodEntries.ts`: 의상 색상 저장/로드 로직 추가 (`outfitMainColor`, `outfitSubColor`)
- `DiaryEntryCard.tsx`: 다이어리 카드에서 저장된 의상 색상 렌더링 지원
- `CharacterCombination`, `DailyMoodState`, `MoodEntry`, `AssetIndex` 타입 확장
- `FirestoreMoodEntry`에 `outfitMainColor`, `outfitSubColor` optional 필드 추가

#### 호환성

- 기존 PNG 의상 시스템과 완전 호환 (파일 확장자 기반 분기)
- 기존 Firestore 데이터 하위 호환 (optional 필드로 추가)

---

## [v1.10.0] - 2026-02-18

### 보상 아이템 인벤토리 선택 UI

#### 추가

- `RewardInventoryPanel.tsx` 컴포넌트: 보유한 보상 아이템(착용 소품/손 아이템)을 썸네일 그리드로 표시하는 시각적 인벤토리 패널
- 아이템별 "랜덤" 버튼: 착용 소품/손 아이템 각각 랜덤 선택 기능
- 아이템별 "해제" 버튼: 착용 소품/손 아이템 각각 해제 기능
- 접이식(details/summary) 패널 구조로 화면 공간 절약

#### 변경

- `mood/page.tsx`: 기존 `handleRerollBodyItem`, `handleRerollHandItem` 콜백을 `useMemo` 훅(`availableBodyItems`, `availableHandItems`)으로 교체
- "세부 조정" 섹션에서 착용 소품/손 아이템 "다시 뽑기" 버튼 제거
- "세부 조정" 섹션 하단에 `RewardInventoryPanel` 컴포넌트 배치
- 아이템 선택 방식을 랜덤 전용에서 시각적 인벤토리 직접 선택으로 개선

---

## [v1.9.0] - 2026-02-18

### 일일 아이템 보상 이벤트 (SPEC-EVENT-002)

#### 추가

- 일일 아이템 보상 이벤트 시스템: 매일 출석 시 body_item 또는 hand_item 풀에서 랜덤 아이템 1개 지급
- 14일 주기 이벤트: 주기 내 모든 날을 채우면 보너스 아이템 지급 (body_item 1 + hand_item 2)
- 주기 완주 후 자동 새 주기 시작 (연속 출석 불요, 총 일수 기반)
- 일일 보상 순수 로직 유틸리티 (`daily-reward-utils.ts`) - 7개 순수 함수
- 일일 보상 관리 훅 (`useDailyReward.ts`) - Firestore event_rewards 컬렉션 CRUD
- 주기 진행 현황 카드 (`DailyRewardCard.tsx`) - 14개 원형 아이콘 그리드, 프로그레스 바, 완주 보너스 미리보기
- Firestore `event_rewards` 컬렉션: 사용자별 이벤트 보상 진행 상태
- 58개 단위 테스트 (`daily-reward-utils.test.ts`)

#### 변경

- `AttendanceToast.tsx`: 일일 보상 아이템 정보 및 주기 진행 현황 표시 추가
- `mood/page.tsx`: 무드 저장 시 일일 보상 자동 수령, 토스트에 보상 정보 포함
- 착용 소품/손 아이템 풀에 일일 보상 아이템 병합 (티어 해금 + 일일 보상 통합)
- 다시 뽑기 버튼에서 일일 보상 아이템도 포함하여 랜덤 선택
- 데이터베이스 스키마 5개 -> 6개 컬렉션으로 확장

---

## [v1.8.0] - 2026-02-17

### 출석체크 Unit Test 추가

#### 추가

- Vitest 테스트 환경 구성 (Vitest 4 + Testing Library + jsdom)
- 출석체크 순수 비즈니스 로직 유틸리티 (`attendance-utils.ts`)
- 63개 단위 테스트 (날짜 포매팅, 스트릭 계산, 마일스톤 매칭 등)
- TypeScript 테스트 설정 (`tsconfig.test.json`)

#### 수정

- `mood/page.tsx`에서 미사용 import 제거 (`ITEM_UNLOCK_TIERS`)
- `tsconfig.json` 테스트 파일 제외 설정 추가

---

## [v1.7.0] - 2026-02-17

### 착용 소품 및 손 아이템 레이어 추가

#### 추가

- 착용 소품 레이어 (Body Item, 레이어 02): 힙색, 망토, 가디건, 헤드폰, 머플러 등 60종
- 손 아이템 레이어 (Hand Item, 레이어 10): 음료, 꽃, 운동기구, 악기, 우산 등 116종
- 8층 레이어 합성 시스템으로 확장 (기존 6층 -> 8층)
- 합성 순서: body -> bodyItem -> face -> expression -> mustache -> hair -> glasses -> handItem
- 무드 페이지에 "착용 소품 다시 뽑기" / "손 아이템 다시 뽑기" 버튼 추가
- `getBodyItemAssets()`, `getHandItemAssets()` 에셋 매니저 함수 추가
- `AssetIndex`에 `body-item`, `hand-item` 카테고리 추가
- `public/assets/body-item/`, `public/assets/hand-item/` 에셋 디렉토리 추가
- 출석 스트릭 기반 아이템 해금 티어 (3/7/14/30일)

#### 변경

- `LayerType`에 `bodyItem`, `handItem` 타입 추가
- `CharacterCombination` 인터페이스에 `bodyItem`, `handItem` 필드 추가
- 랜덤 엔진에서 착용 소품과 손 아이템 항상 랜덤 선택 (null 없음)
- 에셋 복사 스크립트에 `02_Body Item` -> `body-item`, `10_Hand item 4` -> `hand-item` 매핑 추가
- 에셋 인덱스 빌드 스크립트에 body-item, hand-item 카테고리 추가
- 다이어리 카드에서 착용 소품/손 아이템 랜덤 표시 (DB 미저장)
- 총 에셋 수: 493개 -> 669개 (176개 추가)

---

## [v1.6.0] - 2026-02-17

### 출석 체크 이벤트 시스템 (SPEC-EVENT-001)

#### 추가

- 출석 체크 이벤트 시스템: 무드 기록 시 자동 출석 인정
- 연속 출석 스트릭 추적 및 월별 초기화
- 마일스톤 보상 시스템 (3/7/14/30일 연속 출석 시 특별 의상/표정 영구 해금)
- 출석 관리 훅 (`useAttendance.ts`) - 월별 출석 문서 CRUD, 스트릭 계산
- 보상 관리 훅 (`useRewards.ts`) - 마일스톤 보상 해금 판정
- 출석 현황 카드 (`AttendanceCard.tsx`) - 연속 출석, 총 출석, 최대 연속 통계
- 마일스톤 프로그레스 바 (`MilestoneProgress.tsx`) - 4단계 마일스톤 진행도 시각화
- 출석 토스트 알림 (`AttendanceToast.tsx`) - 무드 저장 후 출석 인정 및 보상 해금 알림
- 보상 배지 컴포넌트 (`RewardBadge.tsx`) - 마일스톤 달성 상태 표시
- Firestore `attendance` 컬렉션: 월별 출석 기록 (`{userId}_{YYYY-MM}` 문서)
- Firestore `rewards` 컬렉션: 사용자별 영구 보상 해금 기록
- Firestore 보안 규칙: attendance, rewards 컬렉션 사용자 범위 접근 제어
- Google 소셜 로그인 추가

#### 변경

- 무드 저장 페이지(`/mood`): 저장 성공 후 출석 자동 기록 및 토스트 표시
- 다이어리 페이지(`/diary`): 출석 현황 카드 추가 (월별 통계 표시)
- `OutfitPicker.tsx`: 보상 해금 의상 목록 통합
- `MoodExpressionPicker.tsx`: 보상 해금 표정 목록 통합
- 데이터베이스 스키마 3개 -> 5개 컬렉션으로 확장

#### 수정

- 출석 기록 미생성 버그 수정
- Firestore 보안 규칙 개선
- 다이어리 표시 개선

---

## [v1.5.1] - 2026-02-17

### UX 개선 및 운세 시스템 간소화

#### 변경

- 캐릭터 생성 위자드 4단계 -> 5단계로 확장 (사주 정보 입력 단계 추가)
- 무드 페이지에서 운세 카드 UI 제거, 행운 의상 백그라운드 자동 적용으로 변경
- 생년월일 입력 폼에서 시(時) 필드 제거, 음력/양력 선택 기능 추가
- 네비게이션 바에 설정 페이지(/settings) 링크 추가

#### 삭제

- `FortuneCard.tsx` 컴포넌트 제거 (운세 카드 UI 폐기)
- `LuckyOutfitButton.tsx` 컴포넌트 제거 (행운 의상 자동 적용으로 대체)

#### 수정

- 사주 데이터 Firestore 저장 시 발생하던 버그 수정

---

## [v1.5.0] - 2026-02-17

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

## [v1.4.0] - 2026-02-17

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

- 기분 기록 레이아웃 재구성: 기분 선택 -> 저장 버튼 -> 세부 조정(접이식) -> 다운로드 순서로 변경
- 저장 버튼을 주요 액션(Primary CTA)으로 강조 (전체 너비, 대형 크기, 진한 파란색)
- 의상 선택 및 "다시 뽑기" 버튼을 접이식 "세부 조정" 섹션으로 이동
- 다운로드 버튼을 보조 액션(outline) 스타일로 변경
- 캐릭터 생성 페이지에 온보딩 조건부 렌더링 추가 (신규 사용자만)
- 관리자는 온보딩을 건너뜀

---

## [v1.3.0] - 2026-02-16

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

## [v1.2.0] - 2026-02-16

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

## [v1.1.0] - 2026-02-16

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

## [v1.0.0] - 2026-02-15

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

## [v0.2.0] - 2026-02-10

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

## [v0.1.0] - 2026-02-01

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
