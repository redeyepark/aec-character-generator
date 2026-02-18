# SPEC-OUTFIT-001: 구현 계획

## 메타데이터

| 항목 | 값 |
|------|-----|
| SPEC ID | SPEC-OUTFIT-001 |
| 제목 | SVG Outfit Color Customization |
| 생성일 | 2026-02-18 |
| 참조 SPEC | SPEC-SKIN-001 (아키텍처 패턴 참조) |

---

## 구현 단계

### Phase 1: SVG 에셋 준비 및 검증

**목표**: SVG 의상 파일을 public 디렉토리에 배치하고, 파일 구조를 검증하며, 에셋 인덱스를 업데이트한다.

**작업 내용**:
- `public/assets/body-svg/` 디렉토리 생성
- `_AEC/01_Body_SVG/`에서 SVG 18종 복사
- 각 SVG 파일의 fill 값 검증 (예상: `#919191`, `#C6C6C6`, `#FFFFFF`/`white`, `#000000` 만 존재)
- `src/app/data/assetIndex.json`에 `body-svg` 키 추가

**검증 항목**:
- 모든 SVG 파일에 `fill="#919191"` 패턴 존재 확인
- 모든 SVG 파일에 `fill="#C6C6C6"` 패턴 존재 확인
- 예상 외 fill 값이 존재하는 경우 문서화 및 대응 방안 수립
- SVG viewBox 크기 확인 (2000x2000 기대)

**영향 파일**:
- `public/assets/body-svg/*.svg` (신규 18종)
- `src/app/data/assetIndex.json` (수정)

**우선순위**: Primary Goal

---

### Phase 2: 타입 정의 및 색상 팔레트

**목표**: 의상 색상 관련 타입, 프리셋 팔레트 상수, 기본값을 정의한다.

**작업 내용**:
- `OutfitColorInfo` 인터페이스 추가
- `OUTFIT_COLOR_PRESETS` 상수 추가 (16색)
- `DEFAULT_OUTFIT_MAIN_COLOR`, `DEFAULT_OUTFIT_SUB_COLOR` 상수 추가
- `CharacterCombination`에 `outfitMainColor`, `outfitSubColor` 선택적 필드 추가
- `AssetIndex`에 `body-svg` 키 추가
- `DailyMoodState`에 `outfitMainColor`, `outfitSubColor` 필드 추가

**영향 파일**:
- `src/app/lib/types.ts` (수정)

**우선순위**: Primary Goal

---

### Phase 3: SVG 처리 엔진 확장

**목표**: `svgProcessor.ts`에 의상 3색 동시 교체 기능을 추가한다.

**작업 내용**:
- `OutfitColorOptions` 인터페이스 추가
- `applyOutfitColors()` 함수 구현:
  - `fill="#919191"` -> `mainColor`
  - `fill="#C6C6C6"` -> `subColor`
  - `fill="white"` 및 `fill="#FFFFFF"` -> `skinColor`
- `loadColoredOutfitSvgAsImage()` 통합 함수 구현
- 기존 `loadSvgText()`, `svgToImage()` 재사용

**기술적 접근**:
- 정규식 치환 순서: 메인 -> 서브 -> 피부(white) 순서로 수행
- `fill="#919191"`은 대소문자 무관 매칭 (`/fill="#919191"/gi`)
- `fill="#C6C6C6"`도 동일 처리
- `fill="white"` 및 `fill="#FFFFFF"` 모두 매칭 (기존 `applySkinColor` 패턴 재사용)
- 원본 SVG 텍스트 캐시는 기존 `svgTextCache`를 공유

**영향 파일**:
- `src/app/lib/svgProcessor.ts` (수정)

**우선순위**: Primary Goal

---

### Phase 4: 에셋 관리자 확장

**목표**: SVG 의상 에셋 경로 관리 함수를 추가한다.

**작업 내용**:
- `getBodySvgAssets()` 함수 추가: `assetIndex["body-svg"]` 반환
- `getAssetPath()` 함수 확장: body 레이어에서 `.svg` 확장자 분기 처리
  - body + `.svg` -> `/assets/body-svg/{filename}`
  - body + `.png` -> `/assets/body/{filename}` (기존)

**영향 파일**:
- `src/app/lib/assetManager.ts` (수정)

**우선순위**: Primary Goal

---

### Phase 5: 이미지 합성기 통합

**목표**: Canvas 합성 파이프라인에서 SVG 의상 렌더링을 지원한다.

**작업 내용**:
- `imageCompositor.ts`의 body 레이어 처리 확장
- body 파일 확장자가 `.svg`인 경우:
  - `loadColoredOutfitSvgAsImage(path, options)` 사용
  - `options`에 `mainColor`, `subColor`, `skinColor`(피부톤 hex) 전달
- body 파일 확장자가 `.png`인 경우: 기존 `loadImage()` 사용 (하위 호환)
- `svgProcessor`에서 `loadColoredOutfitSvgAsImage` import 추가

**기술적 접근**:
- 기존 face SVG 분기 패턴(`layer.type === "face" && filename.endsWith(".svg")`)을 참조
- body SVG 분기를 유사하게 추가 (`layer.type === "body" && filename.endsWith(".svg")`)
- `getSkinToneHex()` 함수를 재사용하여 피부톤 hex 값 조회

**영향 파일**:
- `src/app/lib/imageCompositor.ts` (수정)

**우선순위**: Primary Goal

---

### Phase 6: 의상 색상 선택 UI 컴포넌트

**목표**: OutfitColorPicker 컴포넌트를 구현한다.

**작업 내용**:
- `OutfitColorPicker.tsx` 신규 생성
- 2개 섹션: "메인 색상" + "서브 색상"
- 각 섹션에 16개 프리셋 색상을 그리드 배치 (4x4 또는 8x2)
- 선택된 색상에 시각적 피드백 (테두리 강조 + 체크 아이콘)
- 접근성: `role="radiogroup"`, 각 버튼에 `role="radio"`, `aria-label`, `aria-checked`
- 반응형: 모바일에서 그리드 열 수 조정 (grid-cols-4 sm:grid-cols-8)
- Tailwind CSS 스타일링

**컴포넌트 Props**:
```typescript
interface OutfitColorPickerProps {
  mainColor: string;
  subColor: string;
  onMainColorChange: (hex: string) => void;
  onSubColorChange: (hex: string) => void;
}
```

**영향 파일**:
- `src/app/components/OutfitColorPicker.tsx` (신규)

**우선순위**: Secondary Goal

---

### Phase 7: OutfitPicker 확장 및 무드 페이지 통합

**목표**: OutfitPicker에 SVG 의상 지원을 추가하고, 무드 페이지에 의상 색상 선택 플로우를 통합한다.

**작업 내용**:

OutfitPicker 확장:
- SVG 의상을 별도 섹션 또는 기존 카테고리에 통합
- SVG 의상 선택 시 `OutfitColorPicker` 표시
- PNG 의상 선택 시 `OutfitColorPicker` 숨김

무드 페이지 통합:
- `outfitMainColor`, `outfitSubColor` 상태 관리 추가
- SVG 의상 선택 시 색상 선택기 조건부 렌더링
- `compositeCharacter()` 호출 시 의상 색상 파라미터 전달
- 미리보기 Canvas에 의상 색상 실시간 반영

**영향 파일**:
- `src/app/components/OutfitPicker.tsx` (수정)
- `src/app/mood/page.tsx` (수정)

**우선순위**: Secondary Goal

---

### Phase 8: Firestore 스키마 및 무드 훅 업데이트

**목표**: 의상 색상을 Firestore에 저장하고, 기존 데이터와의 하위 호환을 보장한다.

**작업 내용**:
- `firestore.types.ts`의 `FirestoreMoodEntry`에 `outfitMainColor?`, `outfitSubColor?` 추가
- `types.ts`의 `MoodEntry`에 `outfit_main_color?`, `outfit_sub_color?` 추가
- `useMoodEntries.ts`의 저장 로직에 의상 색상 필드 포함
- `useMoodEntries.ts`의 로드 로직에 의상 색상 필드 읽기 및 기본값 처리

**하위 호환성**:
- 기존 무드 문서에 `outfitMainColor`, `outfitSubColor` 필드가 없는 경우 -> 기본값 적용
- PNG 의상을 사용하는 기존 엔트리는 색상 필드를 무시

**영향 파일**:
- `src/app/lib/firestore.types.ts` (수정)
- `src/app/lib/types.ts` (수정 - MoodEntry)
- `src/app/hooks/useMoodEntries.ts` (수정)

**우선순위**: Secondary Goal

---

### Phase 9: 다이어리 뷰 통합

**목표**: 다이어리 달력/카드에서 기존 무드 엔트리를 SVG 의상 색상 포함하여 렌더링한다.

**작업 내용**:
- `DiaryEntryCard.tsx`에서 캐릭터 렌더링 시 저장된 의상 색상 전달
- 기존 PNG 의상 엔트리는 변경 없이 동작
- SVG 의상 엔트리는 저장된 `outfitMainColor`, `outfitSubColor`를 `compositeCharacter`에 전달

**영향 파일**:
- `src/app/components/DiaryEntryCard.tsx` (수정)
- `src/app/diary/page.tsx` (필요 시 수정)

**우선순위**: Final Goal

---

## 기술적 접근

### SVG 3색 동시 교체 방식

선택된 접근법: **정규식 순차 치환**

이유:
1. **SPEC-SKIN-001과의 일관성**: 기존 `applySkinColor()`의 정규식 치환 패턴을 확장
2. **단순성**: 3개 fill 값이 고정된 hex 코드이므로 정규식으로 충분
3. **성능**: 문자열 치환 3회로 완료, XML 파서 불필요
4. **안전성**: 각 fill 값이 고유하므로 오치환 위험 없음

치환 순서 및 정규식:
```
1. /fill="#919191"/gi  ->  fill="${mainColor}"
2. /fill="#C6C6C6"/gi  ->  fill="${subColor}"
3. /fill="white"/g     ->  fill="${skinColor}"
   /fill="#FFFFFF"/gi   ->  fill="${skinColor}"
```

대안 검토:
- **XML 파서 기반**: DOMParser로 SVG를 파싱하여 fill 속성을 변경. 정확하지만 과도한 복잡도와 성능 오버헤드
- **CSS 변수 기반**: SVG에 CSS 변수를 사용하여 동적 색상 변경. SVG 원본 수정이 필요하고 data URL 방식과 호환성 불확실

### 캐싱 전략

- **원본 SVG 텍스트 캐시**: 기존 `svgTextCache` (Map<url, text>) 공유
- **색상 적용 Image 캐시**: 의상은 색상 조합이 다양하므로 캐시하지 않음. 원본 텍스트만 캐시하고 색상 교체는 매번 수행 (문자열 치환 비용이 낮음)
- **기존 PNG 이미지 캐시**: `imageCompositor.ts`의 `imageCache` 유지

### 에셋 전환 전략

- SVG 의상 파일을 `public/assets/body-svg/`에 별도 배치
- 기존 `public/assets/body/` PNG 파일은 유지 (삭제하지 않음)
- `assetIndex.json`에 `body-svg` 키를 추가하고, 기존 `body` 키는 유지
- 코드에서 확장자(`.svg` / `.png`)로 렌더링 방식 분기

---

## 리스크 및 대응

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| SVG 파일에 예상 외 fill 값 존재 | 높음 | Phase 1에서 모든 SVG 파일의 fill 값을 스캔/검증. 예외 케이스 문서화 |
| 메인/서브 색상 교체 시 의도하지 않은 영역 변경 | 중간 | `fill="#919191"` / `fill="#C6C6C6"` 정확 매칭으로 한정. 대소문자 무관 매칭 적용 |
| SVG body + SVG face 피부색 불일치 | 중간 | 동일한 `skinTone` hex 값을 face와 body 모두에 적용. `getSkinToneHex()` 함수 공유 |
| 18개 SVG 파일 초기 로딩 성능 | 낮음 | SVG 텍스트 캐시로 2회차부터 즉시 반환. 의상 선택 시 lazy 로딩 |
| 기존 무드 데이터와의 하위 호환성 | 낮음 | 의상 색상 필드를 optional로 정의. 미존재 시 기본값 적용 |
| 메인/서브 색상이 동일하여 디테일 소실 | 낮음 | UI에서 현재 선택된 색상 조합의 미리보기를 제공하여 사용자가 확인 |

---

## 아키텍처 설계 방향

### 모듈 구조

```
src/app/lib/
  svgProcessor.ts      (수정) applyOutfitColors, loadColoredOutfitSvgAsImage 추가
  imageCompositor.ts   (수정) body 레이어 SVG 지원 추가
  assetManager.ts      (수정) body-svg 에셋 경로 함수 추가
  types.ts             (수정) OutfitColorInfo, 프리셋 상수, CharacterCombination 확장
  firestore.types.ts   (수정) FirestoreMoodEntry 확장

src/app/components/
  OutfitColorPicker.tsx (신규) 의상 메인/서브 색상 선택 UI
  OutfitPicker.tsx      (수정) SVG 의상 지원 및 색상 선택기 통합

src/app/hooks/
  useMoodEntries.ts     (수정) 의상 색상 저장/로드

src/app/mood/
  page.tsx              (수정) 의상 색상 상태 관리, 미리보기 연동

public/assets/
  body-svg/             (신규) SVG 의상 에셋 18종
```

### 데이터 흐름

```
[사용자: SVG 의상 선택] + [사용자: 메인 색상 선택] + [사용자: 서브 색상 선택]
          |
          v
[DailyMoodState: outfitFile="T shirt 0.svg", outfitMainColor="#E74C3C", outfitSubColor="#3498DB"]
          |
          v
[svgProcessor: SVG 로드 -> 3색 치환 (메인/서브/피부) -> data URL -> Image]
          |
          v
[imageCompositor: body(SVG Image) + bodyItem(PNG) + face(SVG Image) + expression(PNG) + ...]
          |
          v
[Canvas: 합성된 캐릭터 미리보기]
          |
          v (저장 시)
[Firestore: mood_entries/{id} = { outfitFile, outfitMainColor, outfitSubColor, ... }]
```

### SPEC-SKIN-001과의 아키텍처 패턴 비교

| 항목 | SPEC-SKIN-001 (얼굴) | SPEC-OUTFIT-001 (의상) |
|------|----------------------|----------------------|
| SVG 위치 | `public/assets/face-svg/` | `public/assets/body-svg/` |
| 색상 교체 수 | 1개 (`fill="white"` -> 피부톤) | 3개 (메인/서브/피부) |
| 처리 함수 | `applySkinColor()` | `applyOutfitColors()` |
| 통합 함수 | `loadColoredSvgAsImage()` | `loadColoredOutfitSvgAsImage()` |
| 레이어 | face | body |
| 색상 저장 | `characters.skinTone` | `mood_entries.outfitMainColor/SubColor` |
| UI 컴포넌트 | `SkinTonePicker` (8색 원형) | `OutfitColorPicker` (16색 그리드 x2) |
| 캐시 | `svgTextCache` 공유 | `svgTextCache` 공유 |
