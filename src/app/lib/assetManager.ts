/**
 * 에셋 매니저
 * assetIndex.json을 기반으로 각 레이어별 에셋 목록을 제공한다.
 */
import assetIndex from "@/app/data/assetIndex.json";
import type {
  AssetIndex,
  FaceShape,
  LayerType,
  MoodCategory,
  OutfitCategory,
} from "./types";
import { FACE_MUSTACHE_COMPATIBILITY, MOOD_CATEGORIES } from "./types";

// JSON을 AssetIndex 타입으로 캐스팅
const index = assetIndex as AssetIndex;

/**
 * 의상 카테고리에 해당하는 body 에셋 목록 반환
 */
export function getBodyAssets(category: OutfitCategory): string[] {
  return index.body[category] ?? [];
}

/**
 * 얼굴 에셋 목록 반환 (5종)
 */
export function getFaceAssets(): string[] {
  return index.face;
}

/**
 * 기분 카테고리에 해당하는 표정 에셋 목록 반환
 * MoodCategory → expressionGroup 번호 → 해당 그룹의 표정 파일들
 */
export function getExpressionAssets(mood: MoodCategory): string[] {
  const moodInfo = MOOD_CATEGORIES.find((m) => m.id === mood);
  if (!moodInfo) return [];

  const groupKey = String(moodInfo.expressionGroup);
  return index.expression[groupKey] ?? [];
}

/**
 * 얼굴형에 호환되는 수염 에셋 목록 반환
 * 얼굴형별 호환 카테고리(common, round, slim, square, special)를 합산
 */
export function getCompatibleMustaches(faceShape: FaceShape): string[] {
  const compatibleTypes = FACE_MUSTACHE_COMPATIBILITY[faceShape];
  if (!compatibleTypes) return [];

  const result: string[] = [];
  for (const type of compatibleTypes) {
    const key = type as keyof typeof index.mustache;
    const files = index.mustache[key];
    if (files) {
      result.push(...files);
    }
  }
  return result;
}

/**
 * 헤어 에셋 목록 반환 (214종)
 */
export function getHairAssets(): string[] {
  return index.hair;
}

/**
 * 안경 에셋 목록 반환 (39종)
 */
export function getGlassesAssets(): string[] {
  return index.glasses;
}

/**
 * SVG 얼굴 에셋 목록 반환 (5종)
 * assetIndex.json의 "face-svg" 키에서 파일명 배열을 가져온다.
 */
export function getFaceSvgAssets(): string[] {
  return index["face-svg"] || [];
}

/**
 * SVG 얼굴 에셋의 전체 경로 반환
 * 반환값: /assets/face-svg/{filename} (public 기준 경로)
 */
export function getSvgAssetPath(filename: string): string {
  return `/assets/face-svg/${encodeURIComponent(filename)}`;
}

/**
 * 레이어 종류와 파일명으로 에셋 경로 생성
 * face 레이어에서 .svg 파일인 경우 face-svg 디렉토리 경로를 반환한다.
 * 반환값: /assets/{layer}/{filename} (public 기준 경로)
 */
export function getAssetPath(layer: LayerType, filename: string): string {
  // SVG 얼굴 파일은 face-svg 디렉토리에서 제공
  if (layer === "face" && filename.endsWith(".svg")) {
    return `/assets/face-svg/${encodeURIComponent(filename)}`;
  }
  return `/assets/${layer}/${encodeURIComponent(filename)}`;
}
