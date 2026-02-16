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
