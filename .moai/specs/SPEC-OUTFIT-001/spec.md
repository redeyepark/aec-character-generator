# SPEC-OUTFIT-001: SVG 의상 색상 커스터마이징

---
id: SPEC-OUTFIT-001
version: 1.0.0
status: Draft
created: 2026-02-18
updated: 2026-02-18
author: MoAI
priority: Medium
lifecycle: spec-first
assigned: expert-frontend
---

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-OUTFIT-001 |
| 제목 | SVG Outfit Color Customization |
| 생성일 | 2026-02-18 |
| 상태 | Draft |
| 우선순위 | Medium |
| 라이프사이클 | spec-first |
| 담당 | expert-frontend |
| 참조 SPEC | SPEC-SKIN-001 (SVG Face Skin Color Selection) |

---

## HISTORY

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-02-18 | 1.0.0 | 초기 SPEC 문서 작성 |

---

## 1. Environment (환경)

### 1.1 현재 시스템 환경

| 항목 | 현재 값 |
|------|---------|
| 프레임워크 | Next.js 15, React 19, TypeScript 5 |
| CSS | Tailwind CSS 4 |
| 백엔드 | Firebase (Firestore + Auth) |
| 배포 | Cloudflare Pages (static export, `output: 'export'`) |
| 캐릭터 합성 | Canvas 2D 기반 8레이어 PNG 합성 |
| 의상(body) 에셋 | PNG 파일 (6개 카테고리, `public/assets/body/`) |
| SVG 처리 | `svgProcessor.ts` - face 레이어 전용 피부색 교체 (SPEC-SKIN-001 구현 완료) |
| 피부톤 시스템 | 8종 프리셋 피부톤, `SkinTone` 타입, `SKIN_TONE_COLORS` 상수 |

### 1.2 목표 환경

| 항목 | 목표 값 |
|------|---------|
| 의상(body) 에셋 | SVG 18종 (`public/assets/body-svg/`) + 기존 PNG 유지 |
| 의상 색상 | 메인 색상 + 서브 색상 2가지 사용자 선택 |
| 렌더링 | SVG 텍스트 3색 교체 후 Canvas에 Image로 렌더링 |
| 데이터 저장 | Firestore `mood_entries` 또는 관련 상태에 `outfitMainColor`, `outfitSubColor` 저장 |
| SVG 처리 | `svgProcessor.ts` 확장 - 의상 전용 multi-color 교체 지원 |

### 1.3 SVG 파일 구조 분석

대상 파일 (18종, `_AEC/01_Body_SVG/`):

| 파일명 | 용도 |
|--------|------|
| `baseball jacket 0.svg` | 야구 재킷 |
| `euroupean suit 0.svg` | 유러피안 수트 |
| `hood T shirt 0.svg` | 후드 티셔츠 |
| `inner fur jarket 0.svg` | 이너 퍼 재킷 |
| `leather jacket 0.svg` | 가죽 재킷 |
| `pocket shirt 0.svg` | 포켓 셔츠 |
| `pocket shirt_1 0.svg` | 포켓 셔츠 변형 |
| `puffer vest 0.svg` | 패딩 조끼 |
| `sheriff 0.svg` | 셰리프 |
| `sheriff short 0.svg` | 셰리프 반팔 |
| `shirt tie 0.svg` | 셔츠 타이 |
| `T shirt 0.svg` | 티셔츠 |
| `T shirt short 0.svg` | 반팔 티셔츠 |

SVG 내부 3색 구조:

| 색상 | Hex 코드 | 용도 | 변경 여부 |
|------|----------|------|----------|
| 메인 색상 | `#919191` | 주요 의상 fill (몸통, 주요 부위) | 사용자 선택 메인 색상으로 교체 |
| 서브 색상 | `#C6C6C6` | 보조 의상 fill (소매, 트림, 악센트) | 사용자 선택 서브 색상으로 교체 |
| 피부 영역 | `#FFFFFF` | 팔, 목 등 피부 노출 영역 | 사용자 피부톤(SkinTone)으로 교체 |
| 디테일/윤곽 | `#000000` | 윤곽선, 디테일, 장식 | 변경하지 않음 (고정) |

### 1.4 영향 범위

수정 대상 파일:

| 파일 경로 | 역할 | 변경 유형 |
|-----------|------|----------|
| `src/app/lib/svgProcessor.ts` | SVG 색상 교체 엔진 | `applyOutfitColors()` 함수 추가 (3색 동시 교체) |
| `src/app/lib/imageCompositor.ts` | 이미지 합성기 | body 레이어 SVG 분기 처리 추가 |
| `src/app/lib/types.ts` | 타입 정의 | `OutfitColor` 타입, `OUTFIT_COLOR_PRESETS` 상수, `CharacterCombination` 확장 |
| `src/app/lib/assetManager.ts` | 에셋 관리자 | `getBodySvgAssets()`, body-svg 경로 함수 추가 |
| `src/app/data/assetIndex.json` | 에셋 인덱스 | `body-svg` 키 추가 |
| `src/app/lib/firestore.types.ts` | Firestore 타입 | `FirestoreMoodEntry`에 의상 색상 필드 추가 |
| `src/app/hooks/useMoodEntries.ts` | 무드 CRUD 훅 | 의상 색상 저장/로드 로직 추가 |
| `src/app/components/OutfitPicker.tsx` | 의상 선택기 | SVG 의상 지원 및 색상 선택기 통합 |
| `src/app/mood/page.tsx` | 무드 선택 페이지 | 의상 색상 상태 관리 및 미리보기 연동 |

추가 생성 파일:

| 파일 경로 | 역할 |
|-----------|------|
| `src/app/components/OutfitColorPicker.tsx` | 의상 메인/서브 색상 선택 UI 컴포넌트 |
| `public/assets/body-svg/*.svg` | SVG 의상 에셋 18종 (원본에서 복사) |

---

## 2. Assumptions (가정)

### 2.1 기술적 가정

- **A-TECH-01**: 모든 SVG 의상 파일이 동일한 3색 구조를 따른다. `fill="#919191"` (메인), `fill="#C6C6C6"` (서브), `fill="#FFFFFF"` 또는 `fill="white"` (피부), `fill="#000000"` (디테일/고정).
- **A-TECH-02**: SVG 텍스트에서 3가지 fill 값을 정규식으로 동시 치환하면 각 영역이 정확하게 교체된다. 다른 fill 값은 존재하지 않는다.
- **A-TECH-03**: SPEC-SKIN-001에서 검증된 SVG data URL -> Canvas Image 렌더링 방식이 의상 SVG에도 동일하게 적용된다.
- **A-TECH-04**: SVG 의상 파일의 viewBox는 기존 PNG 의상 파일과 동일한 비율/크기(2000x2000)이므로 Canvas 합성 시 레이어 정렬이 유지된다.
- **A-TECH-05**: `svgProcessor.ts`의 기존 캐싱 메커니즘(`svgTextCache`)을 의상 SVG에도 공유할 수 있다.
- **A-TECH-06**: 의상 색상 프리셋 팔레트로 사용자 요구를 충족할 수 있다. 향후 커스텀 색상 선택기(Color Picker)는 별도 SPEC에서 다룬다.

### 2.2 비즈니스 가정

- **A-BIZ-01**: 의상 색상 선택은 무드 다이어리 의상 선택 단계에서 수행된다. 캐릭터 생성 위자드에서는 의상을 선택하지 않으므로 영향이 없다.
- **A-BIZ-02**: 기본 의상 색상은 원본 SVG 색상(메인: `#919191`, 서브: `#C6C6C6`)을 유지하며, 사용자가 명시적으로 색상을 선택하지 않으면 원본 색상이 적용된다.
- **A-BIZ-03**: SVG 의상은 기존 PNG 의상과 별도의 카테고리로 제공된다. 기존 PNG 의상 카테고리 시스템(casual, formal, sporty, outerwear, bowtie, all)은 유지한다.
- **A-BIZ-04**: SVG 의상 18종은 단일 카테고리("svg" 또는 별도 탭)로 제공하거나, 기존 카테고리에 통합할 수 있다. 구현 시 UX를 고려하여 결정한다.

### 2.3 호환성 가정

- **A-COMPAT-01**: 기존 PNG body 레이어 렌더링은 그대로 유지된다. SVG body는 파일 확장자(`.svg`)로 분기한다.
- **A-COMPAT-02**: SVG body의 `#FFFFFF` 영역은 사용자가 SPEC-SKIN-001에서 선택한 피부톤(`skinTone`)과 동일한 색상으로 교체되어야 한다. 얼굴과 팔/목의 피부색이 일치해야 한다.
- **A-COMPAT-03**: 다른 레이어(bodyItem, face, expression, mustache, hair, glasses, handItem)는 의상 색상 변경의 영향을 받지 않는다.
- **A-COMPAT-04**: 기존 Firestore `mood_entries` 문서에 의상 색상 필드가 없는 기존 데이터와의 하위 호환을 보장한다.

### 2.4 리스크 가정

- **A-RISK-01**: 일부 SVG 파일에서 `fill="#919191"` 또는 `fill="#C6C6C6"` 이외의 회색 계열 fill 값이 존재할 수 있다. Phase 1에서 모든 SVG 파일의 fill 값을 검증해야 한다.
- **A-RISK-02**: 메인 색상과 서브 색상이 동일하거나 유사한 경우 의상 디테일이 사라질 수 있다. UI에서 적절한 가이드를 제공한다.
- **A-RISK-03**: 18개 SVG 파일의 크기 합이 큰 경우 초기 로딩 성능에 영향을 줄 수 있다. 캐싱 전략으로 완화한다.

---

## 3. Requirements (요구사항)

### 3.1 SVG 의상 렌더링 요구사항

**REQ-OUTFIT-01** [Ubiquitous]
시스템은 **항상** `public/assets/body-svg/` 디렉토리의 SVG 의상 파일을 로드하여 캐릭터 합성의 body 레이어로 사용할 수 있어야 한다. 기존 PNG 의상(`public/assets/body/`)도 계속 사용 가능해야 한다.

**REQ-OUTFIT-02** [Event-Driven]
**WHEN** 사용자가 SVG 의상을 선택하고 메인 색상을 변경하면 **THEN** SVG의 `fill="#919191"` 속성을 선택된 메인 색상 hex 값으로 교체하고, 교체된 SVG를 Canvas에 렌더링해야 한다.

**REQ-OUTFIT-03** [Event-Driven]
**WHEN** 사용자가 SVG 의상을 선택하고 서브 색상을 변경하면 **THEN** SVG의 `fill="#C6C6C6"` 속성을 선택된 서브 색상 hex 값으로 교체하고, 교체된 SVG를 Canvas에 렌더링해야 한다.

**REQ-OUTFIT-04** [Event-Driven]
**WHEN** SVG 의상을 Canvas에 렌더링할 때 **THEN** SVG의 `fill="#FFFFFF"` (또는 `fill="white"`) 영역을 사용자가 캐릭터 생성 시 선택한 피부톤(`skinTone`)의 hex 색상으로 교체해야 한다. 얼굴(face SVG)과 팔/목(body SVG)의 피부색이 동일해야 한다.

**REQ-OUTFIT-05** [Ubiquitous]
시스템은 **항상** SVG 의상의 `fill="#000000"` (디테일/윤곽선) 영역을 변경하지 않아야 한다.

### 3.2 의상 색상 선택 UI 요구사항

**REQ-UI-01** [Event-Driven]
**WHEN** 사용자가 SVG 의상을 선택하면 **THEN** 메인 색상과 서브 색상을 각각 선택할 수 있는 색상 선택기(OutfitColorPicker)가 표시되어야 한다.

**REQ-UI-02** [Event-Driven]
**WHEN** 의상의 메인 색상 또는 서브 색상이 변경되면 **THEN** 미리보기 Canvas가 즉시 업데이트되어야 한다.

**REQ-UI-03** [State-Driven]
**IF** 선택된 의상이 PNG 파일이면 **THEN** 색상 선택기는 표시되지 않는다 (PNG 의상은 색상 변경 불가).

**REQ-UI-04** [Ubiquitous]
의상 색상 선택기는 **항상** 접근성 기준(WCAG 2.1 AA)을 준수해야 한다. `role="radiogroup"`, `aria-label`, `aria-checked` 속성을 적절히 사용한다.

### 3.3 데이터 저장 요구사항

**REQ-DATA-01** [Event-Driven]
**WHEN** 무드 다이어리를 저장할 때 **THEN** 선택된 의상 파일명, 메인 색상, 서브 색상을 함께 저장해야 한다.

**REQ-DATA-02** [Event-Driven]
**WHEN** 기존 무드 다이어리를 로드할 때 **THEN** 저장된 의상 색상 값을 읽어 Canvas 렌더링에 적용해야 한다.

**REQ-DATA-03** [State-Driven]
**IF** 의상 색상이 선택되지 않았거나 기존 데이터에 의상 색상 필드가 없으면 **THEN** 기본값(메인: `#919191`, 서브: `#C6C6C6`)을 적용해야 한다.

### 3.4 호환성 요구사항

**REQ-COMPAT-01** [Ubiquitous]
시스템은 **항상** 기존 PNG 의상 선택 및 렌더링 기능과의 호환성을 유지해야 한다. SVG 의상은 추가 옵션이지 대체가 아니다.

**REQ-COMPAT-02** [Ubiquitous]
시스템은 **항상** SVG body의 피부 영역 색상과 SVG face의 피부톤 색상을 동일하게 적용해야 한다.

---

## 4. Specifications (명세)

### 4.1 의상 색상 프리셋 팔레트 정의

메인 색상과 서브 색상에 공통으로 사용되는 프리셋 팔레트:

| 이름 | 한국어명 | Hex 코드 | 계열 |
|------|---------|----------|------|
| Red | 빨강 | `#E74C3C` | 따뜻한 계열 |
| Coral | 코랄 | `#FF6B6B` | 따뜻한 계열 |
| Orange | 주황 | `#F39C12` | 따뜻한 계열 |
| Yellow | 노랑 | `#F1C40F` | 따뜻한 계열 |
| Green | 초록 | `#27AE60` | 자연 계열 |
| Teal | 청록 | `#1ABC9C` | 자연 계열 |
| Blue | 파랑 | `#3498DB` | 차가운 계열 |
| Navy | 네이비 | `#2C3E50` | 차가운 계열 |
| Purple | 보라 | `#9B59B6` | 차가운 계열 |
| Pink | 핑크 | `#E91E8F` | 따뜻한 계열 |
| White | 하양 | `#FFFFFF` | 무채색 |
| LightGray | 밝은 회색 | `#BDC3C7` | 무채색 |
| Gray | 회색 | `#919191` | 무채색 (원본 메인) |
| DarkGray | 진한 회색 | `#555555` | 무채색 |
| Black | 검정 | `#2C2C2C` | 무채색 |
| Brown | 갈색 | `#8B4513` | 자연 계열 |

기본값:
- 메인 색상 기본값: `#919191` (Gray, 원본 SVG 색상)
- 서브 색상 기본값: `#C6C6C6` (원본 SVG 색상)

### 4.2 SVG 처리 파이프라인 확장

SPEC-SKIN-001에서 구현된 `svgProcessor.ts`를 확장하여 의상 3색 동시 교체를 지원한다.

추가 함수 설계:

```typescript
/**
 * 의상 색상 교체용 옵션 인터페이스
 */
export interface OutfitColorOptions {
  mainColor: string;    // 메인 의상 색상 (#919191 교체)
  subColor: string;     // 서브 의상 색상 (#C6C6C6 교체)
  skinColor: string;    // 피부 영역 색상 (#FFFFFF 교체)
}

/**
 * SVG 텍스트에 의상 색상 적용 (3색 동시 교체)
 * - fill="#919191" -> mainColor
 * - fill="#C6C6C6" -> subColor
 * - fill="white" / fill="#FFFFFF" -> skinColor
 * - fill="#000000" (디테일) -> 변경하지 않음
 */
export function applyOutfitColors(
  svgText: string,
  options: OutfitColorOptions
): string;

/**
 * SVG 의상 파일을 색상이 적용된 Image로 로드하는 통합 함수
 * loadSvgText -> applyOutfitColors -> svgToImage 파이프라인 실행
 */
export async function loadColoredOutfitSvgAsImage(
  svgUrl: string,
  options: OutfitColorOptions
): Promise<HTMLImageElement>;
```

처리 파이프라인:

1. **SVG 로드**: `loadSvgText(url)` - 기존 캐시 메커니즘 공유
2. **3색 교체**: `applyOutfitColors(svgText, options)` - 순차 정규식 치환
   - `fill="#919191"` -> `fill="${mainColor}"`
   - `fill="#C6C6C6"` -> `fill="${subColor}"`
   - `fill="white"` 또는 `fill="#FFFFFF"` -> `fill="${skinColor}"`
3. **data URL 변환**: 기존 `svgToImage()` 재사용
4. **Image 로드**: Canvas에 그릴 수 있는 HTMLImageElement 반환

### 4.3 타입 정의 변경

`src/app/lib/types.ts`에 추가:

```typescript
// 의상 색상 정보
export interface OutfitColorInfo {
  id: string;
  nameKo: string;
  hex: string;
}

// 의상 색상 프리셋 팔레트
export const OUTFIT_COLOR_PRESETS: OutfitColorInfo[] = [
  { id: "red", nameKo: "빨강", hex: "#E74C3C" },
  { id: "coral", nameKo: "코랄", hex: "#FF6B6B" },
  { id: "orange", nameKo: "주황", hex: "#F39C12" },
  { id: "yellow", nameKo: "노랑", hex: "#F1C40F" },
  { id: "green", nameKo: "초록", hex: "#27AE60" },
  { id: "teal", nameKo: "청록", hex: "#1ABC9C" },
  { id: "blue", nameKo: "파랑", hex: "#3498DB" },
  { id: "navy", nameKo: "네이비", hex: "#2C3E50" },
  { id: "purple", nameKo: "보라", hex: "#9B59B6" },
  { id: "pink", nameKo: "핑크", hex: "#E91E8F" },
  { id: "white", nameKo: "하양", hex: "#FFFFFF" },
  { id: "lightgray", nameKo: "밝은 회색", hex: "#BDC3C7" },
  { id: "gray", nameKo: "회색", hex: "#919191" },
  { id: "darkgray", nameKo: "진한 회색", hex: "#555555" },
  { id: "black", nameKo: "검정", hex: "#2C2C2C" },
  { id: "brown", nameKo: "갈색", hex: "#8B4513" },
];

// 기본 의상 색상
export const DEFAULT_OUTFIT_MAIN_COLOR = "#919191";
export const DEFAULT_OUTFIT_SUB_COLOR = "#C6C6C6";
```

`CharacterCombination` 인터페이스 확장:

```typescript
export interface CharacterCombination {
  body: string;
  bodyItem: string | null;
  face: string;
  expression: string;
  mustache: string | null;
  hair: string;
  glasses: string | null;
  handItem: string | null;
  skinTone?: SkinTone;
  outfitMainColor?: string;  // 추가: 의상 메인 색상 hex
  outfitSubColor?: string;   // 추가: 의상 서브 색상 hex
}
```

`AssetIndex` 인터페이스 확장:

```typescript
export interface AssetIndex {
  // ... 기존 필드 유지
  "body-svg"?: string[];  // 추가: SVG 의상 파일 목록
}
```

`DailyMoodState` 인터페이스 확장:

```typescript
export interface DailyMoodState {
  moodCategory: MoodCategory | null;
  expressionFile: string | null;
  outfitCategory: OutfitCategory | null;
  outfitFile: string | null;
  outfitMainColor: string;  // 추가
  outfitSubColor: string;   // 추가
}
```

### 4.4 Firestore 스키마 변경

`FirestoreMoodEntry` 타입에 의상 색상 필드 추가:

```typescript
export interface FirestoreMoodEntry {
  userId: string;
  characterId: string;
  date: string;
  moodCategory: string;
  outfitFile: string;
  expressionFile: string;
  compositeImageUrl: string | null;
  outfitMainColor?: string;  // 추가: 의상 메인 색상 hex (SVG 의상 전용)
  outfitSubColor?: string;   // 추가: 의상 서브 색상 hex (SVG 의상 전용)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

도메인 타입 `MoodEntry`에도 동일 추가:

```typescript
export interface MoodEntry {
  // ... 기존 필드 유지
  outfit_main_color?: string;  // 추가
  outfit_sub_color?: string;   // 추가
}
```

### 4.5 이미지 합성기 변경 (`imageCompositor.ts`)

`compositeCharacter` 함수의 body 레이어 처리를 확장:

- body 파일 확장자가 `.svg`인 경우: `loadColoredOutfitSvgAsImage()` 사용
- body 파일 확장자가 `.png`인 경우: 기존 `loadImage()` 사용 (하위 호환)
- SVG body 렌더링 시 `outfitMainColor`, `outfitSubColor`, `skinTone`(hex 변환) 3가지 색상을 전달

```typescript
// body 레이어 처리 분기
if (layer.type === "body" && layer.filename.endsWith(".svg")) {
  const skinHex = getSkinToneHex(combination.skinTone ?? DEFAULT_SKIN_TONE);
  const options: OutfitColorOptions = {
    mainColor: combination.outfitMainColor ?? DEFAULT_OUTFIT_MAIN_COLOR,
    subColor: combination.outfitSubColor ?? DEFAULT_OUTFIT_SUB_COLOR,
    skinColor: skinHex,
  };
  loadTasks.push({
    type: layer.type,
    promise: loadColoredOutfitSvgAsImage(path, options),
  });
}
```

### 4.6 에셋 관리자 변경 (`assetManager.ts`)

SVG 의상 에셋 전용 함수 추가:

```typescript
// SVG 의상 에셋 목록 반환
export function getBodySvgAssets(): string[];

// body 레이어 경로 생성 시 SVG 분기 처리
// body 파일이 .svg 확장자이면 body-svg 디렉토리 경로 반환
export function getAssetPath(layer: LayerType, filename: string): string {
  // ... 기존 face SVG 분기 유지
  if (layer === "body" && filename.endsWith(".svg")) {
    return `/assets/body-svg/${encodeURIComponent(filename)}`;
  }
  // ... 기존 로직 유지
}
```

### 4.7 OutfitColorPicker 컴포넌트

`src/app/components/OutfitColorPicker.tsx`:

- 메인 색상과 서브 색상을 각각 선택하는 2개 섹션
- 각 섹션에 16개 프리셋 색상을 4x4 그리드로 표시
- 선택된 색상에 체크 표시 또는 테두리 강조
- 접근성: `role="radiogroup"`, 각 버튼에 `role="radio"`, `aria-label`, `aria-checked`
- 반응형 디자인: 모바일에서는 그리드 열 수 조정

Props 인터페이스:

```typescript
interface OutfitColorPickerProps {
  mainColor: string;
  subColor: string;
  onMainColorChange: (hex: string) => void;
  onSubColorChange: (hex: string) => void;
}
```

### 4.8 OutfitPicker 컴포넌트 확장

기존 `OutfitPicker.tsx`를 확장하여 SVG 의상을 지원:

- SVG 의상 탭 또는 섹션 추가
- SVG 의상 선택 시 `OutfitColorPicker` 표시
- PNG 의상 선택 시 `OutfitColorPicker` 숨김
- SVG 의상 미리보기에 선택된 색상 반영

### 4.9 assetIndex.json 변경

`body-svg` 키 추가:

```json
{
  "body-svg": [
    "baseball jacket 0.svg",
    "euroupean suit 0.svg",
    "hood T shirt 0.svg",
    "inner fur jarket 0.svg",
    "leather jacket 0.svg",
    "pocket shirt 0.svg",
    "pocket shirt_1 0.svg",
    "puffer vest 0.svg",
    "sheriff 0.svg",
    "sheriff short 0.svg",
    "shirt tie 0.svg",
    "T shirt 0.svg",
    "T shirt short 0.svg"
  ]
}
```

### 4.10 무드 페이지 통합

`src/app/mood/page.tsx` 변경:

- `DailyMoodState`에 `outfitMainColor`, `outfitSubColor` 상태 추가
- SVG 의상 선택 시 `OutfitColorPicker`를 조건부 렌더링
- `compositeCharacter()` 호출 시 의상 색상 파라미터 전달
- 저장 시 의상 색상을 Firestore에 포함
- 다이어리 로드 시 저장된 의상 색상 복원

---

## 5. 추적성 (Traceability)

| 요구사항 ID | 대상 파일 | 테스트 시나리오 |
|------------|-----------|---------------|
| REQ-OUTFIT-01 | `assetManager.ts`, `assetIndex.json`, `public/assets/body-svg/` | SVG 의상 파일 경로로 에셋 로드 확인, PNG 의상도 정상 동작 확인 |
| REQ-OUTFIT-02 | `svgProcessor.ts` | `fill="#919191"` -> 선택된 메인 색상으로 치환 확인 |
| REQ-OUTFIT-03 | `svgProcessor.ts` | `fill="#C6C6C6"` -> 선택된 서브 색상으로 치환 확인 |
| REQ-OUTFIT-04 | `svgProcessor.ts`, `imageCompositor.ts` | `fill="#FFFFFF"` -> 사용자 피부톤 색상으로 치환 확인, face SVG와 동일 피부색 확인 |
| REQ-OUTFIT-05 | `svgProcessor.ts` | `fill="#000000"` 영역 변경 없음 확인 |
| REQ-UI-01 | `OutfitColorPicker.tsx`, `OutfitPicker.tsx` | SVG 의상 선택 시 색상 선택기 표시 확인 |
| REQ-UI-02 | `mood/page.tsx` | 색상 변경 시 미리보기 즉시 업데이트 확인 |
| REQ-UI-03 | `OutfitPicker.tsx` | PNG 의상 선택 시 색상 선택기 미표시 확인 |
| REQ-UI-04 | `OutfitColorPicker.tsx` | 스크린 리더 접근성 확인 |
| REQ-DATA-01 | `useMoodEntries.ts`, `firestore.types.ts` | 무드 저장 시 의상 색상 필드 포함 확인 |
| REQ-DATA-02 | `useMoodEntries.ts`, `imageCompositor.ts` | 기존 무드 로드 시 저장된 색상 적용 확인 |
| REQ-DATA-03 | `useMoodEntries.ts`, `imageCompositor.ts` | 의상 색상 미존재 시 기본값 적용 확인 |
| REQ-COMPAT-01 | `imageCompositor.ts`, `OutfitPicker.tsx` | PNG 의상 선택/렌더링 정상 동작 확인 |
| REQ-COMPAT-02 | `imageCompositor.ts` | body SVG 피부 영역과 face SVG 피부톤 동일 확인 |

---

## 6. 전문가 상담 권장

이 SPEC은 다음 도메인 전문가 상담을 권장한다:

### expert-frontend (권장)

- SVG 3색 동시 정규식 치환의 안전성 및 엣지 케이스 검증
- OutfitColorPicker UI/UX 디자인 검토 (색상 그리드 배치, 모바일 반응형)
- Canvas 합성 시 SVG body + SVG face + PNG 레이어 혼합 렌더링 품질 검증
- 메인/서브 색상 조합의 시각적 미리보기 성능 최적화
- WCAG 2.1 AA 접근성 검증 (색상 대비, 스크린 리더 지원)

### expert-backend (선택)

- Firestore 스키마 확장에 따른 보안 규칙(Security Rules) 업데이트 필요 여부 확인
- 기존 데이터와의 하위 호환성 마이그레이션 전략 검토
