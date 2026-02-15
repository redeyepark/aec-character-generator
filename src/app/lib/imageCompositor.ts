/**
 * 이미지 합성기
 * 캐릭터 조합의 각 레이어 이미지를 Canvas에 순서대로 합성한다.
 */
import type { CharacterCombination, LayerType } from "./types";
import { getAssetPath } from "./assetManager";

// 이미지 캐시 (같은 파일을 반복 로드하지 않도록)
const imageCache = new Map<string, HTMLImageElement>();

/**
 * 단일 이미지 로드 (캐시 사용)
 * 이미 로드된 이미지는 캐시에서 즉시 반환한다.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error(`이미지 로드 실패: ${src}`));
    };
    img.src = src;
  });
}

/**
 * 레이어 그리기 순서 정의
 * body → face → expression → mustache → hair → glasses
 */
interface LayerEntry {
  type: LayerType;
  filename: string | null;
}

/**
 * 캐릭터 조합으로부터 레이어 목록 생성 (그리기 순서)
 */
function buildLayerList(combination: CharacterCombination): LayerEntry[] {
  return [
    { type: "body", filename: combination.body },
    { type: "face", filename: combination.face },
    { type: "expression", filename: combination.expression },
    { type: "mustache", filename: combination.mustache },
    { type: "hair", filename: combination.hair },
    { type: "glasses", filename: combination.glasses },
  ];
}

/**
 * 캐릭터 합성
 * 모든 레이어 이미지를 로드한 후 Canvas에 순서대로 그린다.
 * Canvas 크기는 첫 번째 이미지(body)의 크기를 기준으로 한다.
 *
 * @param combination - 캐릭터 레이어 조합
 * @param canvasWidth - 캔버스 너비 (0이면 이미지 원본 크기 사용)
 * @param canvasHeight - 캔버스 높이 (0이면 이미지 원본 크기 사용)
 * @returns 합성된 Canvas 엘리먼트
 */
export async function compositeCharacter(
  combination: CharacterCombination,
  canvasWidth: number = 0,
  canvasHeight: number = 0
): Promise<HTMLCanvasElement> {
  const layers = buildLayerList(combination);

  // null이 아닌 레이어만 필터링하여 이미지 로드
  const loadTasks: { type: LayerType; promise: Promise<HTMLImageElement> }[] = [];
  for (const layer of layers) {
    if (layer.filename) {
      const path = getAssetPath(layer.type, layer.filename);
      loadTasks.push({ type: layer.type, promise: loadImage(path) });
    }
  }

  // 모든 이미지 병렬 로드
  const loadedImages = await Promise.all(
    loadTasks.map(async (task) => ({
      type: task.type,
      image: await task.promise,
    }))
  );

  // Canvas 생성 및 크기 설정
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D 컨텍스트를 생성할 수 없습니다.");
  }

  // 캔버스 크기: 지정값이 있으면 사용, 없으면 첫 번째 이미지 크기 사용
  const firstImage = loadedImages[0]?.image;
  if (!firstImage) {
    throw new Error("합성할 이미지가 없습니다.");
  }

  const width = canvasWidth > 0 ? canvasWidth : firstImage.naturalWidth;
  const height = canvasHeight > 0 ? canvasHeight : firstImage.naturalHeight;
  canvas.width = width;
  canvas.height = height;

  // 레이어 순서대로 그리기 (알파 채널 자동 처리)
  for (const { image } of loadedImages) {
    ctx.drawImage(image, 0, 0, width, height);
  }

  return canvas;
}

/**
 * Canvas를 PNG 파일로 다운로드
 * Blob을 생성하고 임시 다운로드 링크를 통해 저장한다.
 */
export function downloadAsPNG(canvas: HTMLCanvasElement): void {
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error("PNG Blob 생성 실패");
      return;
    }

    const timestamp = Date.now();
    const filename = `aec-character-${timestamp}.png`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // 정리
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, "image/png");
}

/**
 * 이미지 캐시 초기화
 */
export function clearImageCache(): void {
  imageCache.clear();
}
