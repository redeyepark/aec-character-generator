/**
 * 랜덤 캐릭터 생성 엔진
 * 기분과 의상 카테고리를 받아 각 레이어별 에셋을 무작위로 조합한다.
 */
import type {
  CharacterCombination,
  FaceShape,
  MoodCategory,
  OutfitCategory,
} from "./types";
import { FACE_FILENAME_TO_SHAPE } from "./types";
import {
  getBodyAssets,
  getBodyItemAssets,
  getCompatibleMustaches,
  getExpressionAssets,
  getFaceAssets,
  getGlassesAssets,
  getHairAssets,
  getHandItemAssets,
} from "./assetManager";

/**
 * 배열에서 균등 분포로 무작위 항목 하나를 선택
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 파일명에서 FaceShape 추출
 * FACE_FILENAME_TO_SHAPE 매핑을 사용한다.
 */
function getFaceShapeFromFilename(filename: string): FaceShape {
  return FACE_FILENAME_TO_SHAPE[filename] ?? "oval";
}

/**
 * 캐릭터 조합 생성
 *
 * 생성 순서:
 * 1. Body: 의상 카테고리로 필터링 후 무작위 선택
 * 2. Face: 5종 중 무작위 선택
 * 3. Expression: 기분의 표정 그룹에서 무작위 선택
 * 4. Mustache: 얼굴형 호환 수염 중 무작위 (30% 확률로 없음)
 * 5. Hair: 전체 214종 중 무작위
 * 6. Glasses: 전체 39종 중 무작위 (30% 확률로 없음)
 */
export function generateCharacter(
  mood: MoodCategory,
  outfit: OutfitCategory
): CharacterCombination {
  // 1. Body 선택
  const bodyAssets = getBodyAssets(outfit);
  const body = pickRandom(bodyAssets);

  // 1-1. BodyItem 선택 (항상 랜덤, null 없음)
  const bodyItem = pickRandom(getBodyItemAssets());

  // 2. Face 선택
  const faceAssets = getFaceAssets();
  const face = pickRandom(faceAssets);

  // 3. Expression 선택 (기분 그룹 기반)
  const expressionAssets = getExpressionAssets(mood);
  const expression = pickRandom(expressionAssets);

  // 4. Mustache 선택 (얼굴형 호환 + 30% 확률로 null)
  let mustache: string | null = null;
  if (Math.random() > 0.3) {
    const faceShape = getFaceShapeFromFilename(face);
    const compatibleMustaches = getCompatibleMustaches(faceShape);
    if (compatibleMustaches.length > 0) {
      mustache = pickRandom(compatibleMustaches);
    }
  }

  // 5. Hair 선택
  const hairAssets = getHairAssets();
  const hair = pickRandom(hairAssets);

  // 6. Glasses 선택 (30% 확률로 null)
  let glasses: string | null = null;
  if (Math.random() > 0.3) {
    const glassesAssets = getGlassesAssets();
    glasses = pickRandom(glassesAssets);
  }

  // 7. HandItem 선택 (항상 랜덤, null 없음)
  const handItem = pickRandom(getHandItemAssets());

  return { body, bodyItem, face, expression, mustache, hair, glasses, handItem };
}
