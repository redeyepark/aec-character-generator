# SPEC-SKIN-001: SVG 얼굴 피부색 선택 기능

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-SKIN-001 |
| 제목 | SVG Face Skin Color Selection |
| 생성일 | 2026-02-16 |
| 상태 | Completed |
| 우선순위 | Medium |
| 라이프사이클 | spec-first |
| 담당 | expert-frontend |

---

## 1. Environment (환경)

### 1.1 현재 시스템 환경

| 항목 | 현재 값 |
|------|---------|
| 프레임워크 | Next.js 15, React 19, TypeScript 5 |
| CSS | Tailwind CSS 4 |
| 백엔드 | Firebase (Firestore + Auth) |
| 배포 | Cloudflare Pages (static export, `output: 'export'`) |
| 캐릭터 합성 | Canvas 2D 기반 PNG 레이어 합성 |
| 얼굴 에셋 | PNG 5종 (public/assets/face/, 각 ~100KB) |

### 1.2 목표 환경

| 항목 | 목표 값 |
|------|---------|
| 얼굴 에셋 | SVG 5종 (public/assets/face-svg/, 각 ~11KB) |
| 피부색 | 6~8종 프리셋 팔레트 |
| 렌더링 | SVG 텍스트 조작 후 Canvas에 Image로 렌더링 |
| 데이터 저장 | Firestore `characters` 컬렉션에 `skinTone` 필드 추가 |

### 1.3 SVG 파일 구조 분석

대상 파일 (5종, `_AEC/03_Face_SVG/`):

| 파일명 | 크기 | viewBox |
|--------|------|---------|
| `heart 0.svg` | ~11KB | 2000x2000 |
| `oval 0.svg` | ~11KB | 2000x2000 |
| `round 0.svg` | ~11KB | 2000x2000 |
| `round square jaw 0.svg` | ~11KB | 2000x2000 |
| `square jaw 0.svg` | ~11KB | 2000x2000 |

SVG 내부 구조:
- `fill="white"` path: 피부 영역 (바깥 윤곽)
- `fill="black"` path: 이목구비 (눈, 눈썹 등 얼굴 특징)
- 플랫 구조: `<svg>` 하위에 `<path>` 요소만 존재 (그룹/중첩 없음)

### 1.4 영향 범위

수정 대상 파일:

| 파일 경로 | 역할 | 변경 유형 |
|-----------|------|----------|
| `src/app/lib/types.ts` | 타입 정의 | `SkinTone` 타입, `SKIN_TONE_COLORS` 상수, `WizardState` 확장 |
| `src/app/lib/imageCompositor.ts` | 이미지 합성기 | SVG 로드/색상 교체/Canvas 렌더링 로직 추가 |
| `src/app/lib/assetManager.ts` | 에셋 관리자 | SVG 얼굴 에셋 경로 함수 추가 |
| `src/app/create/page.tsx` | 캐릭터 생성 위자드 | Step 1에 피부색 선택 UI 추가 |
| `src/app/hooks/useCharacter.ts` | 캐릭터 CRUD 훅 | `skinTone` 필드 생성/수정 로직 추가 |
| `src/app/lib/firestore.types.ts` | Firestore 타입 | `FirestoreCharacter`에 `skinTone` 필드 추가 |
| `src/app/data/assetIndex.json` | 에셋 인덱스 | `face-svg` 목록 추가 |

추가 생성 파일:

| 파일 경로 | 역할 |
|-----------|------|
| `src/app/lib/svgProcessor.ts` | SVG 텍스트 로드, 피부색 치환, data URL 변환 유틸리티 |
| `src/app/components/SkinTonePicker.tsx` | 피부색 선택 UI 컴포넌트 |
| `public/assets/face-svg/*.svg` | SVG 얼굴 에셋 5종 (원본에서 복사) |

무드 페이지 영향:

| 파일 경로 | 역할 | 변경 유형 |
|-----------|------|----------|
| `src/app/mood/page.tsx` (또는 관련 페이지) | 일일 무드 캐릭터 렌더링 | 저장된 `skinTone`으로 SVG 얼굴 렌더링 적용 |

---

## 2. Assumptions (가정)

### 2.1 기술적 가정

- **A-TECH-01**: 모든 SVG 파일이 동일한 구조를 가진다 (`fill="white"` = 피부, `fill="black"` = 이목구비). 다른 fill 값은 존재하지 않는다.
- **A-TECH-02**: SVG 텍스트에서 `fill="white"`를 선택된 피부색 hex 값으로 문자열 치환하면 정확하게 피부 영역만 변경된다.
- **A-TECH-03**: SVG 텍스트를 data URL (`data:image/svg+xml;charset=utf-8,{encodedSVG}`)로 변환한 후 `new Image()`로 로드하면 Canvas에 정상 렌더링된다.
- **A-TECH-04**: SVG data URL 방식은 모든 주요 브라우저(Chrome, Safari, Firefox, Edge)에서 Canvas 렌더링을 지원한다.
- **A-TECH-05**: 6~8종 프리셋 피부색은 사용자 요구를 충분히 충족한다 (커스텀 색상 선택기 불필요).
- **A-TECH-06**: SVG 파일 크기(~11KB)는 PNG(~100KB) 대비 약 90% 감소하여 로딩 성능이 개선된다.

### 2.2 비즈니스 가정

- **A-BIZ-01**: 피부색 선택은 위자드 Step 1(얼굴 선택)에 통합되며, 별도 스텝으로 분리하지 않는다.
- **A-BIZ-02**: 기본 피부색은 중간 톤(Medium)으로 설정된다.
- **A-BIZ-03**: 기존 PNG 얼굴 에셋은 SVG로 완전 대체된다. PNG 얼굴 파일은 하위 호환을 위해 유지하되 코드에서 참조하지 않는다.

### 2.3 호환성 가정

- **A-COMPAT-01**: 표정(expression), 수염(mustache) 등 다른 레이어는 피부색 변경의 영향을 받지 않는다. 이들은 기존 PNG 방식을 유지한다.
- **A-COMPAT-02**: SVG 얼굴의 2000x2000 viewBox는 기존 PNG 얼굴의 크기와 동일하여 Canvas 합성 시 레이어 정렬이 유지된다.
- **A-COMPAT-03**: SVG 얼굴 파일명은 기존 PNG 파일명과 다르므로 (`heart 0.svg` vs `heart 4.png`), 파일명-얼굴형 매핑 상수를 새로 정의해야 한다.

### 2.4 리스크 가정

- **A-RISK-01**: SVG data URL 방식으로 Canvas 렌더링 시 CORS 이슈는 동일 출처 파일이므로 발생하지 않는다.
- **A-RISK-02**: SVG 문자열 조작(fill 치환)은 정규식 기반으로 충분하며, XML 파서가 필요하지 않다.
- **A-RISK-03**: 기존 캐릭터 데이터(skinTone 필드 없음)와의 하위 호환을 위해 `skinTone` 미존재 시 기본값을 적용한다.

---

## 3. Requirements (요구사항)

### 3.1 SVG 얼굴 렌더링 요구사항

**REQ-SVG-01** [Ubiquitous]
시스템은 **항상** `public/assets/face-svg/` 디렉토리의 SVG 얼굴 파일을 로드하여 캐릭터 합성에 사용해야 한다. 기존 PNG 얼굴 에셋(`public/assets/face/`)은 더 이상 참조하지 않는다.

**REQ-SVG-02** [Event-Driven]
**WHEN** 사용자가 피부색을 선택하면 **THEN** 얼굴 SVG의 `fill="white"` 속성을 선택된 피부색 hex 값으로 교체하고, 교체된 SVG를 Canvas에 렌더링해야 한다.

**REQ-SVG-03** [Ubiquitous]
시스템은 **항상** 6~8종의 프리셋 피부색 팔레트를 제공해야 한다. 커스텀 색상 선택기는 제공하지 않는다.

**REQ-SVG-04** [Event-Driven]
**WHEN** 캐릭터를 합성할 때 **THEN** 피부색이 적용된 SVG 얼굴을 Canvas의 기존 레이어 순서(body -> face -> expression -> mustache -> hair -> glasses)에서 face 레이어로 렌더링해야 한다.

### 3.2 데이터 저장 요구사항

**REQ-SVG-05** [Event-Driven]
**WHEN** 캐릭터를 저장할 때 **THEN** 선택된 피부색 값(`skinTone`)을 Firestore `characters` 컬렉션에 함께 저장해야 한다.

**REQ-SVG-06** [Event-Driven]
**WHEN** 기존 캐릭터를 로드할 때 **THEN** 저장된 `skinTone` 값을 읽어 얼굴 렌더링에 적용해야 한다.

**REQ-SVG-07** [State-Driven]
**IF** 피부색이 선택되지 않았거나 기존 캐릭터 데이터에 `skinTone` 필드가 없으면 **THEN** 기본 피부색(Medium, `#E0A96D`)을 적용해야 한다.

### 3.3 UI 요구사항

**REQ-UI-01** [Ubiquitous]
피부색 선택기(SkinTonePicker)는 **항상** 위자드 Step 1(얼굴 선택) 화면에 얼굴 선택과 함께 표시되어야 한다. 별도의 위자드 스텝으로 분리하지 않는다.

**REQ-UI-02** [Event-Driven]
**WHEN** 피부색이 변경되면 **THEN** 실시간 미리보기가 즉시 업데이트되어야 한다.

### 3.4 호환성 요구사항

**REQ-COMPAT-01** [Ubiquitous]
시스템은 **항상** 기존 PNG 레이어(body, expression, mustache, hair, glasses)와의 호환성을 유지해야 한다. SVG는 face 레이어에만 적용된다.

---

## 4. Specifications (명세)

### 4.1 피부색 팔레트 정의

8종 프리셋 피부색:

| 이름 | 한국어명 | Hex 코드 | 설명 |
|------|---------|----------|------|
| Fair | 밝은 살색 | `#FDEBD0` | 가장 밝은 톤 |
| Light | 연한 살색 | `#F5CBA7` | 밝은 톤 |
| Medium | 중간 살색 | `#E0A96D` | 중간 톤 (기본값) |
| Warm | 따뜻한 살색 | `#C68642` | 따뜻한 톤 |
| Tan | 구릿빛 | `#8D5524` | 구릿빛 톤 |
| Brown | 갈색 | `#6B3A2A` | 갈색 톤 |
| Dark | 진한 갈색 | `#4A2511` | 진한 톤 |
| Deep | 짙은 갈색 | `#2C1608` | 가장 짙은 톤 |

### 4.2 SVG 처리 파이프라인

단계별 처리 과정:

1. **SVG 로드**: `fetch()`로 SVG 파일 텍스트를 가져온다
2. **색상 치환**: SVG 텍스트에서 `fill="white"`를 `fill="{selectedColor}"`로 문자열 치환한다
3. **data URL 변환**: 치환된 SVG 텍스트를 `data:image/svg+xml;charset=utf-8,{encodeURIComponent(svgText)}`로 변환한다
4. **Image 로드**: `new Image()`로 data URL을 로드한다
5. **Canvas 렌더링**: 로드된 Image를 Canvas의 face 레이어 위치에 그린다

SVG 처리 유틸리티 (`src/app/lib/svgProcessor.ts`):

```typescript
// SVG 텍스트 캐시 (원본 SVG 텍스트)
const svgTextCache = new Map<string, string>();

// SVG 텍스트 로드 (캐시 사용)
async function loadSvgText(url: string): Promise<string>;

// SVG 피부색 적용 (fill="white" -> fill="{color}")
function applySkinColor(svgText: string, skinColor: string): string;

// SVG를 Canvas Image로 변환
function svgToImage(svgText: string): Promise<HTMLImageElement>;

// 통합 함수: SVG 로드 + 색상 적용 + Image 변환
export async function loadColoredSvgAsImage(
  svgUrl: string,
  skinColor: string
): Promise<HTMLImageElement>;
```

### 4.3 타입 정의 변경

`src/app/lib/types.ts`에 추가:

```typescript
// 피부색 타입
export type SkinTone =
  | "fair"
  | "light"
  | "medium"
  | "warm"
  | "tan"
  | "brown"
  | "dark"
  | "deep";

// 피부색 팔레트 상수
export interface SkinToneInfo {
  id: SkinTone;
  nameKo: string;
  hex: string;
}

export const SKIN_TONE_COLORS: SkinToneInfo[] = [
  { id: "fair", nameKo: "밝은 살색", hex: "#FDEBD0" },
  { id: "light", nameKo: "연한 살색", hex: "#F5CBA7" },
  { id: "medium", nameKo: "중간 살색", hex: "#E0A96D" },
  { id: "warm", nameKo: "따뜻한 살색", hex: "#C68642" },
  { id: "tan", nameKo: "구릿빛", hex: "#8D5524" },
  { id: "brown", nameKo: "갈색", hex: "#6B3A2A" },
  { id: "dark", nameKo: "진한 갈색", hex: "#4A2511" },
  { id: "deep", nameKo: "짙은 갈색", hex: "#2C1608" },
];

export const DEFAULT_SKIN_TONE: SkinTone = "medium";

// SVG 파일명 -> 얼굴형 매핑
export const SVG_FACE_FILENAME_TO_SHAPE: Record<string, FaceShape> = {
  "heart 0.svg": "heart",
  "oval 0.svg": "oval",
  "round 0.svg": "round",
  "round square jaw 0.svg": "round_square_jaw",
  "square jaw 0.svg": "square_jaw",
};
```

`WizardState` 확장:

```typescript
export interface WizardState {
  step: 1 | 2 | 3 | 4;
  face: string | null;
  hair: string | null;
  mustache: string | null;
  glasses: string | null;
  skinTone: SkinTone; // 추가
}
```

### 4.4 Firestore 스키마 변경

`FirestoreCharacter` 타입에 `skinTone` 필드 추가:

```typescript
export interface FirestoreCharacter {
  userId: string;
  face: string;          // SVG 파일명 (예: "round 0.svg")
  hair: string;
  mustache: string | null;
  glasses: string | null;
  skinTone: string;      // 추가: 피부색 ID (예: "medium")
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

도메인 타입 `BaseCharacter`에도 `skinTone` 필드 추가:

```typescript
export interface BaseCharacter {
  id: string;
  user_id: string;
  face: string;
  hair: string;
  mustache: string | null;
  glasses: string | null;
  skinTone: string;      // 추가
  created_at: string;
  updated_at: string;
}
```

### 4.5 이미지 합성기 변경 (`imageCompositor.ts`)

현재 `compositeCharacter` 함수의 face 레이어 처리를 확장:

- `CharacterCombination`에 `skinTone` 필드 추가 (선택적, 기본값 `"medium"`)
- face 레이어 처리 시: 파일 확장자가 `.svg`이면 `svgProcessor`를 통해 색상 적용 후 로드
- 기존 PNG face 파일도 하위 호환을 위해 지원 (확장자 분기)

```typescript
export interface CharacterCombination {
  body: string;
  face: string;
  expression: string;
  mustache: string | null;
  hair: string;
  glasses: string | null;
  skinTone?: SkinTone;    // 추가 (선택적)
}
```

### 4.6 에셋 관리자 변경 (`assetManager.ts`)

SVG 얼굴 에셋 전용 함수 추가:

```typescript
// SVG 얼굴 에셋 목록 반환
export function getFaceSvgAssets(): string[];

// SVG 에셋 경로 생성
export function getSvgAssetPath(filename: string): string;
// 반환값: /assets/face-svg/{filename}
```

### 4.7 SkinTonePicker 컴포넌트

`src/app/components/SkinTonePicker.tsx`:

- 8개 원형 색상 버튼을 가로 배열로 표시
- 선택된 색상에 체크 표시 또는 테두리 강조
- 접근성: `role="radiogroup"`, 각 버튼에 `aria-label` (피부색 이름)
- 반응형: 모바일에서도 한 줄에 표시

### 4.8 위자드 Step 1 통합

`src/app/create/page.tsx` Step 1 영역:

```
[얼굴 선택 (AssetPicker)]
[피부색 선택 (SkinTonePicker)]  <-- 얼굴 선택 아래에 추가
```

- 얼굴을 선택하면 현재 피부색이 즉시 미리보기에 반영
- 피부색을 변경하면 미리보기가 즉시 업데이트
- 위자드 초기 상태에서 `skinTone`은 `"medium"` (기본값)

### 4.9 assetIndex.json 변경

`face-svg` 키 추가:

```json
{
  "face-svg": [
    "heart 0.svg",
    "oval 0.svg",
    "round 0.svg",
    "round square jaw 0.svg",
    "square jaw 0.svg"
  ]
}
```

---

## 5. 추적성 (Traceability)

| 요구사항 ID | 대상 파일 | 테스트 시나리오 |
|------------|-----------|---------------|
| REQ-SVG-01 | `assetManager.ts`, `assetIndex.json`, `public/assets/face-svg/` | SVG 파일 경로로 얼굴 에셋 로드 확인 |
| REQ-SVG-02 | `svgProcessor.ts` | fill="white" -> 선택 색상으로 치환 확인 |
| REQ-SVG-03 | `types.ts` (SKIN_TONE_COLORS) | 8종 팔레트 상수 존재 확인 |
| REQ-SVG-04 | `imageCompositor.ts` | SVG 얼굴이 올바른 레이어 순서로 Canvas에 렌더링 확인 |
| REQ-SVG-05 | `useCharacter.ts`, `firestore.types.ts` | 캐릭터 저장 시 skinTone 필드 포함 확인 |
| REQ-SVG-06 | `useCharacter.ts`, `imageCompositor.ts` | 기존 캐릭터 로드 시 저장된 skinTone 적용 확인 |
| REQ-SVG-07 | `svgProcessor.ts`, `useCharacter.ts` | skinTone 미존재 시 기본값(medium) 적용 확인 |
| REQ-UI-01 | `create/page.tsx`, `SkinTonePicker.tsx` | Step 1에 피부색 선택기 표시 확인 |
| REQ-UI-02 | `create/page.tsx` | 피부색 변경 시 미리보기 즉시 업데이트 확인 |
| REQ-COMPAT-01 | `imageCompositor.ts` | PNG 레이어(body, expression 등)와 SVG 얼굴 혼합 합성 정상 동작 확인 |

---

## 6. 전문가 상담 권장

이 SPEC은 다음 도메인 전문가 상담을 권장한다:

### expert-frontend (권장)

- SVG data URL -> Canvas 렌더링의 크로스 브라우저 호환성 검증
- SVG 문자열 치환 방식 vs DOM 파싱 방식의 성능/안정성 비교
- SkinTonePicker 컴포넌트의 접근성(a11y) 검증
- Canvas 합성 시 SVG + PNG 혼합 렌더링 품질 검증
