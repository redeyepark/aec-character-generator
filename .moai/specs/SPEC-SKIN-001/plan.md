# SPEC-SKIN-001: 구현 계획

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-SKIN-001 |
| 제목 | SVG Face Skin Color Selection |
| 생성일 | 2026-02-16 |

---

## 구현 단계

### Phase 1: SVG 에셋 준비

**목표**: SVG 얼굴 파일을 public 디렉토리에 배치하고 에셋 인덱스를 업데이트한다.

**작업 내용**:
- `public/assets/face-svg/` 디렉토리 생성
- `_AEC/03_Face_SVG/` 에서 SVG 5종 복사
- `src/app/data/assetIndex.json`에 `face-svg` 키 추가

**영향 파일**:
- `public/assets/face-svg/heart 0.svg` (신규)
- `public/assets/face-svg/oval 0.svg` (신규)
- `public/assets/face-svg/round 0.svg` (신규)
- `public/assets/face-svg/round square jaw 0.svg` (신규)
- `public/assets/face-svg/square jaw 0.svg` (신규)
- `src/app/data/assetIndex.json` (수정)

**우선순위**: Primary Goal

---

### Phase 2: 타입 정의 및 피부색 팔레트

**목표**: SkinTone 타입, 팔레트 상수, SVG 파일명 매핑을 정의한다.

**작업 내용**:
- `SkinTone` 타입 추가
- `SkinToneInfo` 인터페이스 및 `SKIN_TONE_COLORS` 상수 추가 (8종)
- `DEFAULT_SKIN_TONE` 상수 추가 (`"medium"`)
- `SVG_FACE_FILENAME_TO_SHAPE` 매핑 추가
- `WizardState`에 `skinTone` 필드 추가
- `CharacterCombination`에 `skinTone` 선택적 필드 추가
- `BaseCharacter`에 `skinTone` 필드 추가

**영향 파일**:
- `src/app/lib/types.ts` (수정)

**우선순위**: Primary Goal

---

### Phase 3: SVG 처리 엔진

**목표**: SVG 텍스트 로드, 피부색 치환, data URL 변환, Canvas Image 생성 유틸리티를 구현한다.

**작업 내용**:
- `svgProcessor.ts` 신규 생성
- `loadSvgText()`: SVG 파일을 fetch로 로드하고 텍스트 캐시 적용
- `applySkinColor()`: `fill="white"` 문자열을 선택된 색상으로 치환
- `svgToImage()`: SVG 텍스트를 data URL로 변환 후 Image 객체 생성
- `loadColoredSvgAsImage()`: 통합 함수 (로드 + 색상 + Image)

**기술적 접근**:
- SVG 텍스트 캐시: `Map<string, string>`으로 원본 SVG 텍스트를 캐시
- 색상 치환: `svgText.replace(/fill="white"/g, `fill="${color}"`)`
- data URL: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`
- Image 로드: `new Image()` + `onload` 프라미스

**영향 파일**:
- `src/app/lib/svgProcessor.ts` (신규)

**우선순위**: Primary Goal

---

### Phase 4: 이미지 합성기 통합

**목표**: 기존 Canvas 합성 파이프라인에 SVG 얼굴 렌더링을 통합한다.

**작업 내용**:
- `imageCompositor.ts`의 face 레이어 처리 확장
- face 파일 확장자가 `.svg`인 경우: `svgProcessor.loadColoredSvgAsImage()` 사용
- face 파일 확장자가 `.png`인 경우: 기존 `loadImage()` 사용 (하위 호환)
- `compositeCharacter()` 함수에 `skinTone` 파라미터 전달 처리
- 기존 이미지 캐시와 SVG 캐시 병행 운영

**기술적 접근**:
- `buildLayerList()` 에서 face 레이어를 특별 처리
- SVG face일 경우 `loadColoredSvgAsImage(path, skinColor)`로 Image 생성
- 나머지 레이어(body, expression 등)는 기존 PNG 방식 유지

**영향 파일**:
- `src/app/lib/imageCompositor.ts` (수정)

**우선순위**: Primary Goal

---

### Phase 5: 피부색 선택 UI 컴포넌트

**목표**: SkinTonePicker 컴포넌트를 구현한다.

**작업 내용**:
- `SkinTonePicker.tsx` 신규 생성
- 8개 원형 색상 버튼을 가로 배열로 렌더링
- 선택된 색상에 시각적 피드백 (테두리 강조 또는 체크 아이콘)
- 접근성: `role="radiogroup"`, 각 버튼에 `role="radio"`, `aria-label`, `aria-checked`
- 반응형 디자인: 모바일/데스크톱 모두 한 줄에 표시
- Tailwind CSS 스타일링

**컴포넌트 Props**:
```typescript
interface SkinTonePickerProps {
  selected: SkinTone;
  onSelect: (tone: SkinTone) => void;
}
```

**영향 파일**:
- `src/app/components/SkinTonePicker.tsx` (신규)

**우선순위**: Secondary Goal

---

### Phase 6: 위자드 Step 1 통합

**목표**: 캐릭터 생성 위자드 Step 1에 피부색 선택기를 통합하고, 미리보기를 연동한다.

**작업 내용**:
- `create/page.tsx`의 WizardState 초기값에 `skinTone: "medium"` 추가
- Step 1 UI에 `SkinTonePicker` 배치 (얼굴 선택 AssetPicker 하단)
- 미리보기 업데이트 로직에 `skinTone` 의존성 추가
- `compositeCharacter()` 호출 시 `skinTone` 전달
- 저장 핸들러에 `skinTone` 포함
- `getFaceSvgAssets()` 사용하여 SVG 얼굴 에셋 목록 로드
- `SVG_FACE_FILENAME_TO_SHAPE` 매핑 사용

**영향 파일**:
- `src/app/create/page.tsx` (수정)

**우선순위**: Secondary Goal

---

### Phase 7: Firestore 스키마 업데이트 및 캐릭터 훅 변경

**목표**: Firestore 타입에 skinTone 필드를 추가하고, 캐릭터 CRUD에 반영한다.

**작업 내용**:
- `firestore.types.ts`의 `FirestoreCharacter`에 `skinTone: string` 추가
- `useCharacter.ts`의 캐릭터 생성/수정 로직에 `skinTone` 포함
- 캐릭터 조회 시 `skinTone` 필드 반환 (미존재 시 기본값 적용)
- `assetManager.ts`에 `getFaceSvgAssets()` 및 `getSvgAssetPath()` 함수 추가

**하위 호환성**:
- 기존 캐릭터 문서에 `skinTone` 필드가 없는 경우 → `"medium"` 기본값 적용
- Firestore 스키마 마이그레이션 불필요 (클라이언트 측 기본값 처리)

**영향 파일**:
- `src/app/lib/firestore.types.ts` (수정)
- `src/app/hooks/useCharacter.ts` (수정)
- `src/app/lib/assetManager.ts` (수정)

**우선순위**: Secondary Goal

---

### Phase 8: 무드 페이지 통합

**목표**: 무드 페이지에서 캐릭터 렌더링 시 저장된 피부색을 적용한다.

**작업 내용**:
- 무드 페이지의 캐릭터 렌더링 로직에서 `skinTone` 참조
- `compositeCharacter()` 호출 시 저장된 `skinTone` 전달
- 기존 PNG face 참조를 SVG face로 전환

**영향 파일**:
- 무드 관련 페이지/컴포넌트 (수정)
- `src/app/hooks/useMoodEntries.ts` (필요 시 수정)

**우선순위**: Final Goal

---

## 기술적 접근

### SVG -> Canvas 렌더링 방식

선택된 접근법: **SVG 텍스트 치환 + data URL + Image**

이유:
1. **단순성**: SVG 파일이 플랫 구조(`<path>` 요소만)이므로 문자열 치환으로 충분
2. **성능**: SVG 텍스트를 캐시하고, 색상 변경 시 치환 + Image 생성만 수행
3. **호환성**: data URL 방식은 모든 주요 브라우저에서 지원
4. **기존 아키텍처와의 일관성**: Canvas 2D 합성 파이프라인을 유지하면서 face 레이어만 확장

대안 검토:
- **Path2D API**: SVG path를 직접 Canvas에 그리는 방식. 복잡한 SVG에서 성능 우수하나, 단순 SVG에는 과도한 복잡도
- **DOM SVG 렌더링**: SVG를 DOM에 삽입하여 렌더링. Canvas 합성과 방식이 다르므로 기존 아키텍처와 불일치

### 캐싱 전략

- **원본 SVG 텍스트 캐시**: `Map<svgUrl, svgText>` - SVG 파일 fetch 결과 캐시
- **색상 적용 Image 캐시**: `Map<svgUrl+color, HTMLImageElement>` - 색상별 Image 캐시 (선택사항)
- **기존 PNG 이미지 캐시**: `imageCompositor.ts`의 `imageCache` 유지

### 에셋 전환 전략

- SVG 얼굴 파일을 `public/assets/face-svg/`에 별도 배치
- 기존 `public/assets/face/` PNG 파일은 유지 (삭제하지 않음)
- 코드 레벨에서 face 에셋 참조를 SVG로 전환
- `assetIndex.json`에 `face-svg` 키를 추가하고, 기존 `face` 키는 유지

---

## 리스크 및 대응

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| SVG data URL이 특정 브라우저에서 Canvas 렌더링 실패 | 높음 | Image fallback으로 원본 SVG 직접 사용, 또는 PNG fallback |
| SVG fill 치환 시 의도하지 않은 요소의 색상 변경 | 중간 | SVG 구조 검증을 Phase 1에서 수행, 치환 대상을 정확히 `fill="white"`로 한정 |
| 기존 캐릭터 데이터와의 하위 호환성 문제 | 중간 | skinTone 기본값 처리, face 파일명 변경(PNG->SVG)에 대한 마이그레이션 고려 |
| Canvas 합성 시 SVG + PNG 레이어 간 크기/해상도 불일치 | 낮음 | SVG viewBox(2000x2000)와 PNG 크기 동일 확인, drawImage 크기 지정으로 통일 |

---

## 아키텍처 설계 방향

### 모듈 구조

```
src/app/lib/
  svgProcessor.ts      (신규) SVG 로드/색상 치환/Image 변환
  imageCompositor.ts   (수정) face 레이어 SVG 지원 추가
  assetManager.ts      (수정) SVG 에셋 경로 함수 추가
  types.ts             (수정) SkinTone 타입/상수 추가
  firestore.types.ts   (수정) FirestoreCharacter 확장

src/app/components/
  SkinTonePicker.tsx   (신규) 피부색 선택 UI

src/app/create/
  page.tsx             (수정) Step 1에 SkinTonePicker 통합

public/assets/
  face-svg/            (신규) SVG 얼굴 에셋 5종
```

### 데이터 흐름

```
[사용자: 얼굴형 선택] + [사용자: 피부색 선택]
          |
          v
[WizardState: face="round 0.svg", skinTone="warm"]
          |
          v
[svgProcessor: SVG 로드 -> fill 치환 -> data URL -> Image]
          |
          v
[imageCompositor: body(PNG) + face(SVG Image) + expression(PNG) + ...]
          |
          v
[Canvas: 합성된 캐릭터 미리보기]
          |
          v (저장 시)
[Firestore: characters/{id} = { face, hair, skinTone, ... }]
```
