---
id: SPEC-UI-001
version: "1.0.0"
status: Completed
created: "2026-02-15"
updated: "2026-02-15"
author: manager-spec
priority: High
title: AEC Character Generator
tags: "character-generator, avatar, react, nextjs, canvas, image-composition"
lifecycle: spec-first
---

## HISTORY

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2026-02-15 | 1.0.0 | 최초 SPEC 작성 | manager-spec |

---

# AEC Character Generator - EARS 형식 요구사항 명세서

## 1. 개요

`_AEC` 폴더에 포함된 493개의 PNG 아바타 리소스를 활용하여 웹 기반 캐릭터 생성 시스템을 구축한다. 사용자는 기분(mood)과 의상(outfit) 카테고리를 선택하고, 시스템은 해당 범위 내에서 6개 레이어의 랜덤 조합을 생성하여 합성된 단일 PNG 이미지를 출력한다.

### 리소스 구조 (6개 레이어, 하단에서 상단 순서)

| 레이어 순서 | 폴더명 | 파일 수 | 설명 |
|------------|--------|---------|------|
| 1 (최하단) | `01_Body 1` | 143 | 의상/상체 의류 |
| 2 | `03_Face` | 5 | 얼굴형 (heart, oval, round, round square jaw, square jaw) |
| 3 | `04_Facial_Expression` | 41 | 표정 (7개 그룹 x 5~6개 변형) |
| 4 | `05_Mustache` | 51 | 수염 (common, round, slim, square + 특수) |
| 5 | `07_Hair` | 214 | 헤어스타일 및 모자류 |
| 6 (최상단) | `08_Glasses` | 39 | 안경/선글라스 |

---

## 2. 환경 (Environment)

### E-001: 기술 스택

- **프레임워크**: Next.js (App Router) + React
- **언어**: TypeScript
- **이미지 합성**: HTML5 Canvas API (클라이언트 사이드)
- **스타일링**: Tailwind CSS
- **에셋 관리**: Next.js `public` 디렉토리 정적 서빙
- **빌드 도구**: Next.js 내장 빌드 시스템

### E-002: 에셋 환경

- 총 493개 PNG 파일, 6개 카테고리 폴더에 분산
- 모든 이미지는 투명 배경 PNG 형식
- 레이어 합성 순서: `01_Body` -> `03_Face` -> `04_Facial_Expression` -> `05_Mustache` -> `07_Hair` -> `08_Glasses`
- 파일명은 영문 + 색상/유형 조합 (예: `baseball jacket black+white.png`)

### E-003: 브라우저 환경

- 최신 Chrome, Firefox, Safari, Edge 지원
- 모바일 반응형 레이아웃 필수
- Canvas API 지원 브라우저 대상

---

## 3. 가정 (Assumptions)

### A-001: 이미지 호환성

- 모든 PNG 파일은 동일한 캔버스 크기(해상도)를 가진다고 가정한다.
- 레이어 간 정렬(alignment)이 사전에 보장되어 있다고 가정한다.
- 투명도(alpha channel)가 올바르게 설정되어 레이어 합성 시 하위 레이어가 비투명 영역을 통해 보인다.

### A-002: 카테고리 매핑

- 의상 카테고리는 파일명 접두사를 기반으로 분류 가능하다고 가정한다.
- 표정 그룹(1~7)은 파일명의 숫자 패턴(`facial expressionXY`)에서 첫째 자릿수(X)로 식별한다.
- 수염 에셋의 `common` 접두사는 모든 얼굴형에 적용 가능하다고 가정한다.

### A-003: 선택적 레이어

- 수염(05_Mustache)과 안경(08_Glasses) 레이어는 선택적(optional)이다.
- "없음(None)" 옵션을 통해 해당 레이어를 생략할 수 있다.

---

## 4. 요구사항 (Requirements)

### 모듈 1: 에셋 관리 시스템 (Asset Management)

#### REQ-AM-001 [Ubiquitous]

시스템은 **항상** `_AEC` 폴더의 6개 카테고리에서 모든 PNG 에셋을 로드하고 카테고리별 인덱스로 관리해야 한다.

#### REQ-AM-002 [Ubiquitous]

시스템은 **항상** 에셋 파일명을 파싱하여 다음 메타데이터를 추출해야 한다:
- 의상 타입 (baseball jacket, suit, T shirt, sweatshirt, leather jacket 등)
- 색상 변형 (black, white, blue, red 등)
- 수염 얼굴형 호환성 (common, round, slim, square)
- 표정 그룹 번호 (1~7)와 변형 번호

#### REQ-AM-003 [Ubiquitous]

시스템은 **항상** 에셋을 다음 의상 카테고리로 분류해야 한다:

| 카테고리 ID | 카테고리명 | 포함 의상 타입 | 예상 파일 수 |
|------------|-----------|--------------|------------|
| `casual` | 캐주얼 | T shirt, raglan, sweatshirt, hood T shirt | ~46 |
| `formal` | 포멀 | suit, european suit, shirt+tie 조합 | ~45 |
| `sporty` | 스포티 | baseball jacket, sheriff | ~20 |
| `outerwear` | 아우터 | leather jacket, rider jacket, pilot jacket, inner fur jacket | ~12 |
| `bowtie` | 보타이 | boe tie 시리즈 | ~10 |
| `all` | 전체 | 모든 의상 (기본값) | 143 |

---

### 모듈 2: 기분/의상 선택 UI (Selection Interface)

#### REQ-SI-001 [Ubiquitous]

시스템은 **항상** 사용자에게 7개 기분(mood) 카테고리 선택 인터페이스를 제공해야 한다:

| 기분 ID | 기분명 (한글) | 기분명 (영문) | 표정 그룹 | 변형 수 |
|--------|-------------|-------------|----------|--------|
| `happy` | 행복/쾌활 | Happy/Cheerful | Group 1 (11~16) | 5 |
| `confident` | 자신감/쿨 | Confident/Cool | Group 2 (21~26) | 6 |
| `calm` | 차분/편안 | Calm/Relaxed | Group 3 (31~36) | 6 |
| `surprised` | 놀람/흥분 | Surprised/Excited | Group 4 (41~46) | 6 |
| `thoughtful` | 사려깊음/진지 | Thoughtful/Serious | Group 5 (51~56) | 6 |
| `playful` | 유쾌/재미 | Playful/Fun | Group 6 (61~66) | 6 |
| `determined` | 결연/강인 | Determined/Strong | Group 7 (71~76) | 6 |

#### REQ-SI-002 [Ubiquitous]

시스템은 **항상** 사용자에게 6개 의상(outfit) 카테고리 선택 인터페이스를 제공해야 한다 (REQ-AM-003의 카테고리 참조).

#### REQ-SI-003 [Event-Driven]

**WHEN** 사용자가 기분과 의상 카테고리를 모두 선택한 후 "생성" 버튼을 클릭하면, **THEN** 시스템은 선택된 범위 내에서 랜덤 캐릭터 조합을 생성해야 한다.

#### REQ-SI-004 [State-Driven]

**IF** 사용자가 기분 또는 의상 카테고리를 하나라도 선택하지 않은 상태라면, **THEN** "생성" 버튼은 비활성화(disabled) 상태를 유지해야 한다.

---

### 모듈 3: 랜덤 조합 엔진 (Randomization Engine)

#### REQ-RE-001 [Event-Driven]

**WHEN** 캐릭터 생성 요청이 발생하면, **THEN** 시스템은 다음 6개 레이어에서 각각 하나의 에셋을 랜덤으로 선택해야 한다:

| 레이어 | 선택 방식 | 제약 조건 |
|--------|----------|----------|
| 01_Body | 랜덤 | 선택된 의상 카테고리 범위 내 |
| 03_Face | 랜덤 | 전체 5개 중 1개 |
| 04_Facial_Expression | 랜덤 | 선택된 기분 그룹 범위 내 |
| 05_Mustache | 랜덤 | 선택된 얼굴형과 호환되는 수염 + "없음" 옵션 포함 |
| 07_Hair | 랜덤 | 전체 214개 중 1개 |
| 08_Glasses | 랜덤 | 전체 39개 중 1개 + "없음" 옵션 포함 |

#### REQ-RE-002 [State-Driven]

**IF** 얼굴형이 선택되었다면 (예: `round`), **THEN** 수염 에셋은 해당 얼굴형 접두사(`round`) 또는 공통(`common`) 접두사를 가진 에셋만 후보에 포함해야 한다.

#### REQ-RE-003 [Ubiquitous]

시스템은 **항상** 공정한 분배(uniform distribution)를 사용하여 각 레이어의 에셋을 선택해야 한다. 수염과 안경의 "없음" 옵션은 전체 후보 수 대비 30% 확률로 설정한다.

---

### 모듈 4: 이미지 합성 엔진 (Image Composition)

#### REQ-IC-001 [Event-Driven]

**WHEN** 6개 레이어의 에셋이 모두 선택되면, **THEN** 시스템은 HTML5 Canvas API를 사용하여 하단(01_Body)부터 상단(08_Glasses) 순서로 레이어를 합성해야 한다.

#### REQ-IC-002 [Ubiquitous]

시스템은 **항상** 투명도(alpha channel)를 올바르게 처리하여 하위 레이어가 상위 레이어의 투명 영역을 통해 보이도록 해야 한다.

#### REQ-IC-003 [Event-Driven]

**WHEN** 이미지 합성이 완료되면, **THEN** 합성된 캐릭터를 화면 중앙에 미리보기로 표시해야 한다.

#### REQ-IC-004 [Event-Driven]

**WHEN** 사용자가 "다운로드" 버튼을 클릭하면, **THEN** 시스템은 합성된 이미지를 단일 PNG 파일로 내보내기(export)하여 다운로드해야 한다.

---

### 모듈 5: 사용자 경험 (User Experience)

#### REQ-UX-001 [Ubiquitous]

시스템은 **항상** 반응형 레이아웃을 제공하여 데스크톱(1024px+)과 모바일(375px+) 환경에서 모두 사용 가능해야 한다.

#### REQ-UX-002 [Event-Driven]

**WHEN** 사용자가 "다시 생성" 버튼을 클릭하면, **THEN** 시스템은 현재 선택된 기분/의상 카테고리를 유지한 채 새로운 랜덤 조합을 생성해야 한다.

#### REQ-UX-003 [State-Driven]

**IF** 이미지 합성이 진행 중이라면, **THEN** 시스템은 로딩 인디케이터를 표시하고, "생성" 버튼을 비활성화해야 한다.

#### REQ-UX-004 [Unwanted]

시스템은 이미지 합성 중 사용자가 중복 생성 요청을 보내는 것을 **허용하지 않아야 한다** (debounce 처리).

---

## 5. 사양 (Specifications)

### S-001: 에셋 분류 알고리즘

```
의상 카테고리 분류 규칙:
- casual: 파일명이 "T shirt", "raglan", "sweatshirt", "hood T shirt"으로 시작
- formal: 파일명에 "suit", "shirt"+"tie" 조합 포함
- sporty: 파일명이 "baseball jacket", "sheriff"로 시작
- outerwear: 파일명에 "leather jacket", "rider jacket", "pilot jacket", "inner fur"로 시작
- bowtie: 파일명이 "boe tie"로 시작
- all: 모든 파일 포함 (기본값)

수염 얼굴형 호환성 규칙:
- heart, oval -> common 접두사 에셋만 사용
- round -> common + round 접두사 에셋 사용
- round square jaw -> common + round + square 접두사 에셋 사용
- square jaw -> common + square 접두사 에셋 사용

특수 에셋 (chick bandate, nose bandate, two bandate) -> 모든 얼굴형 호환
```

### S-002: 레이어 합성 순서

```
Canvas 합성 순서 (drawImage 호출 순서):
1. ctx.drawImage(bodyImage, 0, 0)        // 01_Body - 최하단
2. ctx.drawImage(faceImage, 0, 0)        // 03_Face
3. ctx.drawImage(expressionImage, 0, 0)  // 04_Facial_Expression
4. ctx.drawImage(mustacheImage, 0, 0)    // 05_Mustache (선택적)
5. ctx.drawImage(hairImage, 0, 0)        // 07_Hair
6. ctx.drawImage(glassesImage, 0, 0)     // 08_Glasses (선택적)
```

### S-003: 파일 구조

```
AEC_today01/
├── _AEC/                      # 원본 에셋 (읽기 전용)
│   ├── 01_Body 1/             # 143개 의상 PNG
│   ├── 03_Face/               # 5개 얼굴형 PNG
│   ├── 04_Facial_Expression/  # 41개 표정 PNG
│   ├── 05_Mustache/           # 51개 수염 PNG
│   ├── 07_Hair/               # 214개 헤어 PNG
│   └── 08_Glasses/            # 39개 안경 PNG
├── src/
│   └── app/                   # Next.js App Router
│       ├── layout.tsx         # 루트 레이아웃
│       ├── page.tsx           # 메인 페이지 (캐릭터 생성기)
│       ├── components/
│       │   ├── MoodSelector.tsx       # 기분 선택 컴포넌트
│       │   ├── OutfitSelector.tsx     # 의상 선택 컴포넌트
│       │   ├── CharacterCanvas.tsx    # Canvas 합성 + 미리보기
│       │   ├── GenerateButton.tsx     # 생성/다시생성/다운로드 버튼
│       │   └── LoadingIndicator.tsx   # 로딩 상태 표시
│       ├── lib/
│       │   ├── assetManager.ts        # 에셋 로드/분류/인덱싱
│       │   ├── randomEngine.ts        # 랜덤 조합 알고리즘
│       │   ├── imageCompositor.ts     # Canvas 이미지 합성
│       │   └── types.ts              # 타입 정의
│       └── data/
│           └── assetIndex.json        # 사전 생성된 에셋 인덱스
├── public/
│   └── assets/                # _AEC 에셋 복사본 (정적 서빙)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### S-004: 핵심 타입 정의

```typescript
// 기분 카테고리
type MoodCategory = 'happy' | 'confident' | 'calm' | 'surprised' | 'thoughtful' | 'playful' | 'determined';

// 의상 카테고리
type OutfitCategory = 'casual' | 'formal' | 'sporty' | 'outerwear' | 'bowtie' | 'all';

// 얼굴형
type FaceShape = 'heart' | 'oval' | 'round' | 'round_square_jaw' | 'square_jaw';

// 에셋 레이어
type LayerType = 'body' | 'face' | 'expression' | 'mustache' | 'hair' | 'glasses';

// 캐릭터 조합
interface CharacterCombination {
  body: string;       // 01_Body 파일 경로
  face: string;       // 03_Face 파일 경로
  expression: string; // 04_Facial_Expression 파일 경로
  mustache: string | null;  // 05_Mustache 파일 경로 (null = 없음)
  hair: string;       // 07_Hair 파일 경로
  glasses: string | null;   // 08_Glasses 파일 경로 (null = 없음)
}
```

---

## 6. 제약사항 (Constraints)

### C-001: 성능 제약

- 이미지 합성 시간: 6개 레이어 합성 완료까지 3초 이내
- 에셋 사전 로드(preload): 선택된 카테고리의 에셋은 사전에 Image 객체로 캐싱
- 초기 페이지 로드: 에셋 인덱스(JSON)만 로드, 실제 이미지는 생성 시 로드

### C-002: 보안 제약

- 원본 `_AEC` 에셋은 읽기 전용으로 유지
- 클라이언트 사이드에서만 이미지 합성 수행 (서버 부하 방지)
- 사용자 업로드 기능 없음 (에셋 고정)

### C-003: 호환성 제약

- HTML5 Canvas API 미지원 브라우저에서는 기능 제한 안내 메시지 표시
- CORS 이슈 방지를 위해 에셋은 같은 도메인에서 서빙

---

## 7. 추적성 (Traceability)

| 요구사항 ID | 모듈 | 관련 파일 | 검증 방법 |
|------------|------|----------|----------|
| REQ-AM-001 | 에셋 관리 | assetManager.ts | 단위 테스트 |
| REQ-AM-002 | 에셋 관리 | assetManager.ts | 단위 테스트 |
| REQ-AM-003 | 에셋 관리 | assetManager.ts, assetIndex.json | 단위 테스트 |
| REQ-SI-001 | 선택 UI | MoodSelector.tsx | 컴포넌트 테스트 |
| REQ-SI-002 | 선택 UI | OutfitSelector.tsx | 컴포넌트 테스트 |
| REQ-SI-003 | 선택 UI | page.tsx, GenerateButton.tsx | E2E 테스트 |
| REQ-SI-004 | 선택 UI | GenerateButton.tsx | 컴포넌트 테스트 |
| REQ-RE-001 | 랜덤 엔진 | randomEngine.ts | 단위 테스트 |
| REQ-RE-002 | 랜덤 엔진 | randomEngine.ts | 단위 테스트 |
| REQ-RE-003 | 랜덤 엔진 | randomEngine.ts | 통계 테스트 |
| REQ-IC-001 | 이미지 합성 | imageCompositor.ts | 통합 테스트 |
| REQ-IC-002 | 이미지 합성 | imageCompositor.ts | 시각 검증 |
| REQ-IC-003 | 이미지 합성 | CharacterCanvas.tsx | 컴포넌트 테스트 |
| REQ-IC-004 | 이미지 합성 | CharacterCanvas.tsx | E2E 테스트 |
| REQ-UX-001 | 사용자 경험 | layout.tsx, 전체 컴포넌트 | 반응형 테스트 |
| REQ-UX-002 | 사용자 경험 | GenerateButton.tsx | 컴포넌트 테스트 |
| REQ-UX-003 | 사용자 경험 | LoadingIndicator.tsx | 컴포넌트 테스트 |
| REQ-UX-004 | 사용자 경험 | GenerateButton.tsx | 단위 테스트 |
