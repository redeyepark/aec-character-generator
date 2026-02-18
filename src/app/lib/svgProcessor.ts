/**
 * SVG 처리 엔진
 * SVG 얼굴 파일을 로드하고, 피부색을 교체하고,
 * Canvas 호환 Image 엘리먼트로 변환하는 유틸리티 모듈.
 */

// 원본 SVG 텍스트 캐시 (URL -> SVG 텍스트)
// 색상이 자주 변경되므로 원본 텍스트만 캐시한다.
const svgTextCache = new Map<string, string>();

/**
 * SVG 파일을 텍스트로 로드 (캐시 사용)
 * 이미 로드된 URL은 캐시에서 즉시 반환한다.
 *
 * @param url - SVG 파일 URL
 * @returns SVG 텍스트 문자열
 */
async function loadSvgText(url: string): Promise<string> {
  const cached = svgTextCache.get(url);
  if (cached) {
    return cached;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`SVG 로드 실패: ${url} (${response.status})`);
  }

  const svgText = await response.text();
  svgTextCache.set(url, svgText);
  return svgText;
}

/**
 * SVG 텍스트에 피부색 적용
 * fill="white" 속성을 지정된 hex 색상으로 교체한다.
 * fill="black" (이목구비) 영역은 영향받지 않는다.
 *
 * @param svgText - 원본 SVG 텍스트
 * @param hexColor - 적용할 피부색 hex 코드 (예: "#C68642")
 * @returns 피부색이 적용된 SVG 텍스트
 */
export function applySkinColor(svgText: string, hexColor: string): string {
  return svgText.replace(/fill="white"/g, `fill="${hexColor}"`);
}

/**
 * 의상 색상 교체 옵션
 */
export interface OutfitColorOptions {
  mainColor: string;    // 메인 의상 색상 (#919191 교체)
  subColor: string;     // 서브 의상 색상 (#C6C6C6 교체)
  skinColor: string;    // 피부 영역 색상 (white 교체)
}

/**
 * SVG 텍스트에 의상 색상 적용 (3색 동시 교체)
 * - fill="#919191" -> mainColor (메인 의상 색상)
 * - fill="#C6C6C6" -> subColor (서브 의상 색상)
 * - fill="white" -> skinColor (피부 영역)
 * fill="black" (디테일/윤곽선)과 fill="none"은 변경하지 않는다.
 *
 * @param svgText - 원본 SVG 텍스트
 * @param options - 교체할 색상 옵션
 * @returns 색상이 적용된 SVG 텍스트
 */
export function applyOutfitColors(
  svgText: string,
  options: OutfitColorOptions
): string {
  let result = svgText;
  // 메인 색상 교체 (#919191)
  result = result.replace(/fill="#919191"/gi, `fill="${options.mainColor}"`);
  // 서브 색상 교체 (#C6C6C6)
  result = result.replace(/fill="#C6C6C6"/gi, `fill="${options.subColor}"`);
  // 피부 영역 교체 (white)
  result = result.replace(/fill="white"/g, `fill="${options.skinColor}"`);
  return result;
}

/**
 * SVG 텍스트를 HTMLImageElement로 변환
 * encodeURIComponent를 사용하여 data URL을 생성하고,
 * Image 객체에 로드한다.
 *
 * @param svgText - SVG 텍스트 (색상 적용 완료된 상태)
 * @returns Canvas에 그릴 수 있는 Image 엘리먼트
 */
function svgToImage(svgText: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(svgText);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`;

    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error("SVG data URL을 Image로 변환하는 데 실패했습니다."));
    };
    img.src = dataUrl;
  });
}

/**
 * SVG 얼굴 파일을 피부색이 적용된 Image로 로드하는 통합 함수
 * loadSvgText -> applySkinColor -> svgToImage 파이프라인을 실행한다.
 *
 * imageCompositor에서 face 레이어 렌더링 시 호출하는 메인 진입점.
 *
 * @param svgUrl - SVG 파일 URL (예: "/assets/face-svg/round%200.svg")
 * @param skinColor - 적용할 피부색 hex 코드 (예: "#C68642")
 * @returns Canvas에 그릴 수 있는 피부색 적용 Image 엘리먼트
 */
export async function loadColoredSvgAsImage(
  svgUrl: string,
  skinColor: string
): Promise<HTMLImageElement> {
  const originalSvg = await loadSvgText(svgUrl);
  const coloredSvg = applySkinColor(originalSvg, skinColor);
  return svgToImage(coloredSvg);
}

/**
 * SVG 의상 파일을 색상이 적용된 Image로 로드하는 통합 함수
 * loadSvgText -> applyOutfitColors -> svgToImage 파이프라인을 실행한다.
 *
 * imageCompositor에서 body 레이어 렌더링 시 호출하는 메인 진입점.
 *
 * @param svgUrl - SVG 의상 파일 URL (예: "/assets/body-svg/T%20shirt%200.svg")
 * @param options - 의상 색상 옵션 (메인, 서브, 피부)
 * @returns Canvas에 그릴 수 있는 색상 적용 Image 엘리먼트
 */
export async function loadColoredOutfitSvgAsImage(
  svgUrl: string,
  options: OutfitColorOptions
): Promise<HTMLImageElement> {
  const originalSvg = await loadSvgText(svgUrl);
  const coloredSvg = applyOutfitColors(originalSvg, options);
  return svgToImage(coloredSvg);
}
