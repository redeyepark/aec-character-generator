---
spec_id: SPEC-UX-001
type: implementation-plan
version: 1.0.0
created: 2026-02-17
updated: 2026-02-17
---

# SPEC-UX-001 구현 계획

## 1. 구현 전략

### 1.1 접근 방식

기존 컴포넌트와 스타일링 시스템을 최대한 활용하여 최소한의 변경으로 최대의 UX 개선을 달성한다. 새로운 라이브러리 없이 Tailwind CSS 4 + React 19 조합만으로 구현한다.

### 1.2 기술 의존성

| 기술 | 현재 버전 | 용도 | 비고 |
|------|----------|------|------|
| Next.js | 15.1+ | App Router, 페이지 라우팅 | 기존 사용 중 |
| React | 19.0+ | 컴포넌트 상태 관리 | 기존 사용 중 |
| Tailwind CSS | 4.0+ | 스타일링, 색상 클래스 | 기존 사용 중 |
| TypeScript | 5.0+ | 타입 안전성 | 기존 사용 중 |

**새로운 라이브러리 추가 없음.**

---

## 2. 마일스톤

### Primary Goal: 달력 색상 시각화

기분 카테고리별 색상 매핑을 달력 셀에 적용하여 "Year in Pixels" 스타일의 시각화를 구현한다.

**서브태스크:**

| # | 태스크 | 영향 파일 | 요구사항 |
|---|--------|-----------|---------|
| 1-1 | `MOOD_COLOR_MAP` 상수 정의 | `src/app/lib/types.ts` | REQ-UX-001-01 |
| 1-2 | DiaryCalendar 셀 배경색 로직 수정 | `src/app/components/DiaryCalendar.tsx` | REQ-UX-001-02, 03, 04 |
| 1-3 | 선택된 셀의 무드 색상 도트 표시 | `src/app/components/DiaryCalendar.tsx` | REQ-UX-001-03 |
| 1-4 | 접근성: aria-label에 기분명 포함 | `src/app/components/DiaryCalendar.tsx` | REQ-UX-001-16 |
| 1-5 | 기존 날짜 클릭 동작 검증 | `src/app/diary/page.tsx` | REQ-UX-001-05 |

**구현 방향:**

- `DiaryCalendar.tsx`의 달력 그리드 렌더링부에서 `entryMap`으로 해당 날짜의 MoodEntry를 조회
- MoodEntry가 존재하면 `MOOD_COLOR_MAP[entry.mood_category]`에서 bg/text 클래스를 가져와 적용
- `isSelected` 상태일 때는 기존 파란색 배경을 유지하되, 무드 색상을 작은 도트(`w-2 h-2 rounded-full`)로 표시
- 기존 이모지 표시는 유지하여 색맹 사용자 접근성 보장

---

### Secondary Goal: 기분 기록 간소화

저장 버튼을 주요 액션으로 강조하고, 의상/세부 옵션을 접이식 섹션으로 분리하여 핵심 흐름을 단순화한다.

**서브태스크:**

| # | 태스크 | 영향 파일 | 요구사항 |
|---|--------|-----------|---------|
| 2-1 | 저장 버튼 시각적 강조 (크기, 색상, 위치) | `src/app/mood/page.tsx` | REQ-UX-001-07 |
| 2-2 | 의상 선택을 "세부 조정" 접이식 섹션으로 이동 | `src/app/mood/page.tsx` | REQ-UX-001-08 |
| 2-3 | 다운로드 버튼 보조 액션 스타일 적용 | `src/app/mood/page.tsx` | REQ-UX-001-09 |
| 2-4 | 기분 선택 시 전환 애니메이션 추가 | `src/app/mood/page.tsx` | REQ-UX-001-10 |
| 2-5 | 기분 선택 후 자동 활성화 흐름 검증 | `src/app/mood/page.tsx` | REQ-UX-001-06 |

**구현 방향:**

- 기존 2열 그리드(`grid-cols-1 md:grid-cols-2`)에서 기분 선택을 최상단, 저장 버튼을 바로 아래에 배치
- 의상 선택 영역을 `<details>`/`<summary>` 또는 Tailwind의 `group`/`peer` 패턴으로 접이식 구현
- 저장 버튼: `w-full py-4 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl`
- 다운로드 버튼: `border border-gray-300 text-gray-600 bg-white hover:bg-gray-50`

**레이아웃 변경 (기분 기록 페이지):**

```
[캐릭터 미리보기]
[기분 카테고리 선택] ← 항상 보임
[==== 저장 버튼 ====] ← 주요 CTA, 전체 너비, 강조
[세부 조정 (접기/펼치기)] ← 기본 접힘
  ├─ 의상 카테고리 선택
  ├─ 표정 다시 뽑기
  └─ 의상 다시 뽑기
[다운로드 (보조)] ← outline 스타일
```

---

### Final Goal: 온보딩 플로우

새로운 사용자가 앱의 핵심 가치를 이해한 후 캐릭터 생성을 시작하도록 3-slide 온보딩을 추가한다.

**서브태스크:**

| # | 태스크 | 영향 파일 | 요구사항 |
|---|--------|-----------|---------|
| 3-1 | `OnboardingSlides` 컴포넌트 신규 생성 | `src/app/components/OnboardingSlides.tsx` | REQ-UX-001-11, 12, 14 |
| 3-2 | 슬라이드 내용 및 SVG 아이콘 구현 | `src/app/components/OnboardingSlides.tsx` | REQ-UX-001-12 |
| 3-3 | localStorage 연동 (완료 상태 저장/확인) | `src/app/create/page.tsx` | REQ-UX-001-13, 15 |
| 3-4 | `create/page.tsx`에 온보딩 조건부 렌더링 통합 | `src/app/create/page.tsx` | REQ-UX-001-11, 15 |
| 3-5 | 키보드 내비게이션 지원 | `src/app/components/OnboardingSlides.tsx` | REQ-UX-001-17 |

**구현 방향:**

- `OnboardingSlides`는 독립 컴포넌트로 `onComplete` 콜백만 받음
- 내부 state로 `currentSlide` (0-2)를 관리
- 인라인 SVG 아이콘 사용 (외부 라이브러리 없이)
- `create/page.tsx`의 `CreatePageContent` 내부에서 조건부 렌더링:

```
IF (!localStorage.getItem('aec_onboarding_done') && !isAdmin):
  render <OnboardingSlides onComplete={markOnboardingDone} />
ELSE:
  render existing wizard
```

- 관리자(isAdmin)는 온보딩을 건너뛴다

---

## 3. 파일 수정 목록

| 파일 | 변경 유형 | 변경 내용 |
|------|----------|----------|
| `src/app/lib/types.ts` | 수정 | `MOOD_COLOR_MAP` 상수 추가 (~15줄) |
| `src/app/components/DiaryCalendar.tsx` | 수정 | 셀 배경색 로직 변경 (~30줄 수정) |
| `src/app/mood/page.tsx` | 수정 | 레이아웃 재구성, 저장 버튼 강조, 접이식 섹션 (~60줄 수정) |
| `src/app/components/OnboardingSlides.tsx` | 신규 | 3-slide 온보딩 컴포넌트 (~150줄) |
| `src/app/create/page.tsx` | 수정 | 온보딩 조건부 렌더링 추가 (~20줄 수정) |

**총 예상 변경량:** 기존 파일 4개 수정 + 신규 파일 1개 생성 (~275줄)

---

## 4. 위험 분석 및 대응

| 위험 | 심각도 | 발생 가능성 | 대응 방안 |
|------|--------|-----------|----------|
| Tailwind 색상 클래스가 purge 시 제거됨 | 높음 | 중간 | `safelist`에 사용 색상 추가 또는 동적 클래스 대신 정적 매핑 사용 |
| 색상 대비 부족으로 접근성 기준 미달 | 중간 | 낮음 | WCAG AA 기준(4.5:1) 이상의 대비율 확보, 200 레벨 배경 + 900 레벨 텍스트 조합 |
| 온보딩이 기존 관리자 편집 플로우와 충돌 | 중간 | 낮음 | `isAdmin` 체크로 관리자는 온보딩 건너뛰기 |
| localStorage 접근 불가 (SSR 환경) | 중간 | 중간 | `useEffect` 내에서만 localStorage 접근, 클라이언트 사이드 체크 보장 |
| 기분 기록 레이아웃 변경이 기존 사용자에게 혼란 | 낮음 | 중간 | 핵심 기능(기분 선택, 저장)은 동일하게 유지, 부가 기능만 접이식으로 이동 |

---

## 5. 구현 순서 권장

```
1. types.ts에 MOOD_COLOR_MAP 추가 (다른 변경의 의존성)
   ↓
2. DiaryCalendar.tsx 색상 적용 (독립적 변경)
   ↓
3. mood/page.tsx 레이아웃 재구성 (독립적 변경)
   ↓
4. OnboardingSlides.tsx 컴포넌트 생성 (독립적 변경)
   ↓
5. create/page.tsx 온보딩 통합 (4번에 의존)
```

Step 2와 Step 3은 병렬 작업 가능하다.

---

## 6. 전문가 상담 권장

| 도메인 | 에이전트 | 상담 사유 |
|--------|---------|----------|
| Frontend | expert-frontend | 접이식 섹션 UI 패턴, 애니메이션, 반응형 레이아웃 최적화 |
| UI/UX | expert-stitch | 색상 팔레트 접근성 검증, 온보딩 슬라이드 비주얼 디자인 |
