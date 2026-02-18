---
id: SPEC-UI-001
version: "1.0.0"
status: completed
created: "2026-02-15"
updated: "2026-02-15"
author: manager-spec
priority: High
title: AEC Character Generator - 구현 계획서
related-spec: SPEC-UI-001/spec.md
---

## HISTORY

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2026-02-15 | 1.0.0 | 최초 구현 계획서 작성 | manager-spec |

---

# AEC Character Generator - 구현 계획서

## 1. 기술 접근 방식

### 1.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App Router                    │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Mood      │  │ Outfit       │  │ Generate         │  │
│  │ Selector  │  │ Selector     │  │ Button           │  │
│  └─────┬─────┘  └──────┬───────┘  └────────┬─────────┘  │
│        │               │                    │            │
│        └───────┬───────┘                    │            │
│                ▼                            │            │
│  ┌─────────────────────┐                    │            │
│  │ Asset Manager       │◄───────────────────┘            │
│  │ (에셋 인덱싱/분류)  │                                 │
│  └─────────┬───────────┘                                 │
│            ▼                                             │
│  ┌─────────────────────┐                                 │
│  │ Random Engine       │                                 │
│  │ (랜덤 조합 생성)    │                                 │
│  └─────────┬───────────┘                                 │
│            ▼                                             │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │ Image Compositor    │──│ Character Canvas          │  │
│  │ (Canvas 합성)       │  │ (미리보기 + 다운로드)     │  │
│  └─────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.2 핵심 기술 선택

| 영역 | 기술 | 선택 이유 |
|------|------|----------|
| 프레임워크 | Next.js (App Router) | 정적 에셋 서빙, React 기반 컴포넌트, 빌드 최적화 |
| 언어 | TypeScript | 타입 안전성, 에셋 분류 로직의 정확성 보장 |
| 이미지 합성 | HTML5 Canvas API | 브라우저 네이티브, 서버 부하 없음, PNG 내보내기 지원 |
| 스타일 | Tailwind CSS | 반응형 레이아웃 구현 용이, 유틸리티 기반 |
| 에셋 인덱스 | 빌드 타임 JSON 생성 | 런타임 파일 시스템 접근 불필요, 정적 최적화 |

### 1.3 데이터 흐름

```
[사용자 선택]
    ↓ mood: MoodCategory, outfit: OutfitCategory
[Asset Manager]
    ↓ 필터링된 에셋 후보 목록 (레이어별)
[Random Engine]
    ↓ CharacterCombination (6개 레이어 파일 경로)
[Image Compositor]
    ↓ Promise<HTMLCanvasElement>
[Character Canvas]
    ↓ 미리보기 렌더링 + PNG Blob 다운로드
```

---

## 2. 마일스톤 (우선순위 기반)

### 마일스톤 1: 프로젝트 초기화 및 에셋 준비 [Priority: High]

**목표**: Next.js 프로젝트 셋업 및 에셋 인덱싱 시스템 구축

**작업 항목**:

- [ ] Next.js + TypeScript + Tailwind CSS 프로젝트 초기화
- [ ] `_AEC` 폴더 에셋을 `public/assets/` 경로로 복사하는 스크립트 작성
- [ ] 에셋 인덱스 JSON 빌드 스크립트 작성 (`scripts/buildAssetIndex.ts`)
  - 파일명 파싱 로직 구현
  - 의상 카테고리 자동 분류
  - 표정 그룹 번호 추출
  - 수염 얼굴형 호환성 매핑
- [ ] TypeScript 타입 정의 (`types.ts`)
- [ ] `assetIndex.json` 생성 및 검증

**관련 요구사항**: REQ-AM-001, REQ-AM-002, REQ-AM-003

**완료 기준**:
- 493개 에셋이 올바르게 인덱싱되고 카테고리별로 분류됨
- 빌드 스크립트가 에셋 인덱스를 자동 생성함
- 타입 정의가 모든 카테고리와 에셋 구조를 포괄함

---

### 마일스톤 2: 핵심 로직 구현 [Priority: High]

**목표**: 에셋 관리, 랜덤 엔진, 이미지 합성 핵심 로직 완성

**작업 항목**:

- [ ] `assetManager.ts` 구현
  - 에셋 인덱스 로드 및 쿼리 인터페이스
  - 카테고리별 필터링 함수
  - 얼굴형-수염 호환성 필터
- [ ] `randomEngine.ts` 구현
  - 레이어별 랜덤 선택 알고리즘
  - 기분 카테고리 -> 표정 그룹 필터링
  - 의상 카테고리 -> Body 에셋 필터링
  - 수염/안경 "없음" 옵션 확률(30%) 처리
  - 얼굴형 기반 수염 호환성 필터링
- [ ] `imageCompositor.ts` 구현
  - Canvas 생성 및 레이어 순서 합성
  - Image 객체 비동기 로드
  - PNG Blob 변환 및 다운로드 URL 생성

**관련 요구사항**: REQ-RE-001, REQ-RE-002, REQ-RE-003, REQ-IC-001, REQ-IC-002, REQ-IC-004

**완료 기준**:
- 랜덤 엔진이 균등 분포로 에셋을 선택함
- 얼굴형-수염 호환성이 올바르게 적용됨
- Canvas 합성 결과가 올바른 레이어 순서를 보임
- PNG 다운로드가 정상 동작함

---

### 마일스톤 3: UI 컴포넌트 구현 [Priority: High]

**목표**: 사용자 인터페이스 컴포넌트 완성 및 인터랙션 연결

**작업 항목**:

- [ ] `MoodSelector.tsx` 구현
  - 7개 기분 카테고리 카드/버튼 UI
  - 선택 상태 시각적 피드백
  - 각 기분별 아이콘 또는 이모지 표시
- [ ] `OutfitSelector.tsx` 구현
  - 6개 의상 카테고리 카드/버튼 UI
  - 선택 상태 시각적 피드백
  - 각 카테고리별 대표 이미지 또는 아이콘
- [ ] `CharacterCanvas.tsx` 구현
  - Canvas 기반 합성 이미지 미리보기
  - 합성 완료 후 결과 표시
- [ ] `GenerateButton.tsx` 구현
  - "생성" / "다시 생성" / "다운로드" 버튼 그룹
  - 비활성화 상태 처리 (REQ-SI-004)
  - debounce 처리 (REQ-UX-004)
- [ ] `LoadingIndicator.tsx` 구현
  - 이미지 합성 중 로딩 애니메이션
- [ ] `page.tsx` 메인 페이지 조합
  - 전체 컴포넌트 레이아웃 구성
  - 상태 관리 (useState/useReducer)
  - 컴포넌트 간 데이터 흐름 연결

**관련 요구사항**: REQ-SI-001, REQ-SI-002, REQ-SI-003, REQ-SI-004, REQ-IC-003, REQ-UX-002, REQ-UX-003, REQ-UX-004

**완료 기준**:
- 기분/의상 선택 UI가 모든 카테고리를 표시함
- 생성 버튼이 올바르게 활성화/비활성화됨
- 합성된 캐릭터가 화면에 표시됨
- 다운로드 기능이 정상 동작함

---

### 마일스톤 4: 반응형 디자인 및 UX 개선 [Priority: Medium]

**목표**: 모바일 대응 레이아웃 및 사용자 경험 최적화

**작업 항목**:

- [ ] 반응형 레이아웃 구현
  - 데스크톱: 좌측 선택 패널 + 우측 미리보기 (2열 그리드)
  - 모바일: 상단 선택 -> 하단 미리보기 (1열 스택)
  - Breakpoint: 768px (md)
- [ ] 에셋 프리로드 최적화
  - 선택된 카테고리의 이미지 사전 캐싱
  - Image 객체 풀링(pooling)
- [ ] 로딩/에러 상태 UI 보강
  - Canvas API 미지원 시 안내 메시지
  - 이미지 로드 실패 시 재시도 옵션
- [ ] 접근성(a11y) 기본 대응
  - 키보드 네비게이션 지원
  - aria-label 적용
  - 색상 대비 확인

**관련 요구사항**: REQ-UX-001, REQ-UX-003

**완료 기준**:
- 375px ~ 1920px 화면에서 레이아웃이 깨지지 않음
- 에셋 로드 시간이 체감 가능하게 개선됨
- 키보드만으로 전체 기능 사용 가능

---

### 마일스톤 5: 테스트 및 품질 보증 [Priority: Medium]

**목표**: 단위/통합/E2E 테스트 완성 및 품질 게이트 통과

**작업 항목**:

- [ ] 단위 테스트 작성
  - `assetManager.ts`: 에셋 분류, 필터링 검증
  - `randomEngine.ts`: 랜덤 분포, 호환성 필터 검증
  - `imageCompositor.ts`: 합성 순서, PNG 출력 검증
- [ ] 컴포넌트 테스트 작성
  - `MoodSelector`: 선택 상태 변경, 접근성
  - `OutfitSelector`: 선택 상태 변경, 접근성
  - `GenerateButton`: 활성화/비활성화, debounce
  - `CharacterCanvas`: 합성 결과 렌더링
- [ ] E2E 테스트 작성
  - 전체 생성 플로우 (선택 -> 생성 -> 미리보기 -> 다운로드)
  - 모바일/데스크톱 뷰포트 테스트
- [ ] 코드 품질 점검
  - TypeScript 타입 커버리지 확인
  - ESLint/Prettier 적용
  - 번들 사이즈 분석

**관련 요구사항**: 전체 REQ-* 추적성 검증

**완료 기준**:
- 테스트 커버리지 85% 이상
- TypeScript strict 모드 에러 0건
- ESLint 경고 0건
- 모든 E2E 시나리오 통과

---

## 3. 기술 설계 방향

### 3.1 에셋 인덱스 사전 빌드 전략

런타임에 파일 시스템을 순회하는 대신, 빌드 타임에 에셋 인덱스 JSON을 생성한다.

```
빌드 스크립트 (scripts/buildAssetIndex.ts):
1. _AEC 폴더의 6개 하위 디렉토리를 순회
2. 각 파일명을 파싱하여 메타데이터 추출
3. 카테고리별로 분류된 인덱스 JSON 생성
4. src/app/data/assetIndex.json으로 출력

인덱스 구조:
{
  "body": {
    "casual": ["T shirt black.png", ...],
    "formal": ["black suit black tie.png", ...],
    ...
  },
  "face": ["heart 4.png", "oval 4.png", ...],
  "expression": {
    "1": ["facial expression11.png", ...],
    "2": ["facial expression21.png", ...],
    ...
  },
  "mustache": {
    "common": [...],
    "round": [...],
    "slim": [...],
    "square": [...],
    "special": [...]
  },
  "hair": [...],
  "glasses": [...]
}
```

### 3.2 Canvas 합성 최적화

```
이미지 로딩 전략:
1. 생성 요청 시 6개 이미지를 Promise.all로 병렬 로드
2. 로드 완료 후 순차적으로 drawImage 호출
3. 이미 로드된 이미지는 캐시에서 재사용
4. toBlob('image/png')으로 다운로드 가능한 Blob 생성

캐싱 전략:
- Map<string, HTMLImageElement> 구조로 이미지 캐시
- LRU 방식으로 최대 50개 이미지 캐시 유지
- 카테고리 변경 시 해당 카테고리 에셋 프리로드
```

### 3.3 상태 관리 설계

```
메인 페이지 상태:
- selectedMood: MoodCategory | null
- selectedOutfit: OutfitCategory | null
- currentCombination: CharacterCombination | null
- isGenerating: boolean
- canvasReady: boolean

상태 흐름:
1. 사용자가 mood 선택 -> selectedMood 업데이트
2. 사용자가 outfit 선택 -> selectedOutfit 업데이트
3. 두 값 모두 존재 -> "생성" 버튼 활성화
4. "생성" 클릭 -> isGenerating = true -> 랜덤 조합 생성
5. 이미지 합성 완료 -> currentCombination 업데이트 -> isGenerating = false
```

---

## 4. 리스크 및 대응 방안

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 에셋 이미지 크기/해상도 불일치 | 높음 | 빌드 스크립트에서 이미지 크기 검증, 불일치 시 경고 |
| 파일명 특수문자로 인한 URL 인코딩 이슈 | 중간 | `encodeURIComponent()` 적용, 파일명 정규화 검토 |
| 대량 이미지 로드로 인한 메모리 부족 | 중간 | LRU 캐시 제한(50개), 필요 시 로드/해제 |
| Canvas API 미지원 브라우저 | 낮음 | 기능 감지(feature detection) + 안내 메시지 |
| 수염-얼굴형 호환성 매핑 오류 | 중간 | 단위 테스트로 전수 검증, 폴백(common 전용) |

---

## 5. 전문가 상담 권장

### 5.1 Frontend 전문가 (expert-frontend)

- React 19 + Next.js App Router 패턴 적용
- Canvas API 최적 활용 방안
- 반응형 레이아웃 설계 검토
- 이미지 프리로드/캐싱 전략

### 5.2 UI/UX 전문가 (expert-stitch)

- 기분/의상 선택 UI 디자인 방향
- 모바일 사용성 최적화
- 접근성(a11y) 요구사항 구체화

---

## 6. 다음 단계

1. `/moai run SPEC-UI-001` 명령으로 DDD 구현 시작
2. 마일스톤 1 완료 후 에셋 인덱스 검증
3. 마일스톤 2-3 병렬 진행 (핵심 로직 + UI)
4. 마일스톤 4-5 순차 진행 (UX + 테스트)
5. `/moai sync SPEC-UI-001` 명령으로 문서화 및 배포 준비
