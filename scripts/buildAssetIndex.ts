/**
 * 에셋 인덱스 빌드 스크립트
 * public/assets/ 폴더를 스캔하여 파일명에서 메타데이터를 추출하고
 * src/app/data/assetIndex.json 파일을 생성한다.
 */
import * as fs from "fs";
import * as path from "path";

// 프로젝트 루트 경로
const ROOT = path.resolve(__dirname, "..");
const ASSETS_DIR = path.join(ROOT, "public", "assets");
const OUTPUT_PATH = path.join(ROOT, "src", "app", "data", "assetIndex.json");

// 의상 카테고리 분류 규칙
interface CategoryRule {
  category: string;
  matcher: (filename: string) => boolean;
}

/**
 * 의상 카테고리 분류 규칙 정의
 * 파일명 소문자 기준으로 매칭한다.
 */
const OUTFIT_RULES: CategoryRule[] = [
  {
    category: "casual",
    matcher: (f) =>
      f.startsWith("t shirt") ||
      f.startsWith("raglan") ||
      f.startsWith("sweatshirt") ||
      f.startsWith("hood t shirt"),
  },
  {
    category: "formal",
    matcher: (f) =>
      f.includes("suit") ||
      (f.includes("shirt") && f.includes("tie")),
  },
  {
    category: "sporty",
    matcher: (f) =>
      f.startsWith("baseball jacket") ||
      f.startsWith("sheriff"),
  },
  {
    category: "outerwear",
    matcher: (f) =>
      f.startsWith("leather jacket") ||
      f.startsWith("rider jacket") ||
      f.startsWith("pilot jacket") ||
      f.startsWith("inner fur"),
  },
  {
    category: "bowtie",
    matcher: (f) => f.startsWith("boe tie"),
  },
];

/**
 * 폴더에서 PNG 파일 목록 읽기
 */
function readPngFiles(folderName: string): string[] {
  const dirPath = path.join(ASSETS_DIR, folderName);
  if (!fs.existsSync(dirPath)) {
    console.error(`[오류] 폴더를 찾을 수 없음: ${dirPath}`);
    return [];
  }
  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".png"))
    .sort();
}

/**
 * 의상(body) 에셋을 카테고리별로 분류
 */
function classifyBodyAssets(
  files: string[]
): Record<string, string[]> {
  const result: Record<string, string[]> = {
    casual: [],
    formal: [],
    sporty: [],
    outerwear: [],
    bowtie: [],
    all: [],
  };

  for (const file of files) {
    const lower = file.toLowerCase();
    // 'all' 카테고리에는 모든 파일 추가
    result.all.push(file);

    // 규칙 기반 카테고리 분류
    for (const rule of OUTFIT_RULES) {
      if (rule.matcher(lower)) {
        result[rule.category].push(file);
      }
    }
  }

  return result;
}

/**
 * 표정 파일에서 그룹 번호 추출
 * "facial expressionXY.png" → 그룹 X
 */
function classifyExpressions(
  files: string[]
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  for (const file of files) {
    // "facial expression" 뒤의 숫자에서 첫 번째 자리가 그룹 번호
    const match = file.match(/facial expression(\d)(\d)\.png/);
    if (match) {
      const groupNum = match[1];
      if (!groups[groupNum]) {
        groups[groupNum] = [];
      }
      groups[groupNum].push(file);
    }
  }

  return groups;
}

/**
 * 수염 파일을 얼굴형 호환성 기준으로 분류
 * 접두사: common, round, slim, square
 * 특수: chick bandate, nose bandate, two bandate
 */
function classifyMustaches(
  files: string[]
): Record<string, string[]> {
  const result: Record<string, string[]> = {
    common: [],
    round: [],
    slim: [],
    square: [],
    special: [],
  };

  for (const file of files) {
    const lower = file.toLowerCase();
    if (lower.startsWith("common")) {
      result.common.push(file);
    } else if (lower.startsWith("round")) {
      result.round.push(file);
    } else if (lower.startsWith("slim")) {
      result.slim.push(file);
    } else if (lower.startsWith("square")) {
      result.square.push(file);
    } else {
      // chick bandate, nose bandate, two bandate 등
      result.special.push(file);
    }
  }

  return result;
}

/**
 * 메인 실행: 에셋 인덱스 JSON 생성
 */
function main(): void {
  console.log("=== 에셋 인덱스 빌드 시작 ===");

  // 각 레이어별 파일 목록 읽기
  const bodyFiles = readPngFiles("body");
  const faceFiles = readPngFiles("face");
  const expressionFiles = readPngFiles("expression");
  const mustacheFiles = readPngFiles("mustache");
  const hairFiles = readPngFiles("hair");
  const glassesFiles = readPngFiles("glasses");

  console.log(`  body: ${bodyFiles.length}개`);
  console.log(`  face: ${faceFiles.length}개`);
  console.log(`  expression: ${expressionFiles.length}개`);
  console.log(`  mustache: ${mustacheFiles.length}개`);
  console.log(`  hair: ${hairFiles.length}개`);
  console.log(`  glasses: ${glassesFiles.length}개`);

  // 분류 수행
  const bodyClassified = classifyBodyAssets(bodyFiles);
  const expressionGroups = classifyExpressions(expressionFiles);
  const mustacheClassified = classifyMustaches(mustacheFiles);

  // 카테고리별 파일 수 출력
  console.log("");
  console.log("  [의상 카테고리]");
  for (const [cat, files] of Object.entries(bodyClassified)) {
    console.log(`    ${cat}: ${files.length}개`);
  }

  console.log("  [표정 그룹]");
  for (const [group, files] of Object.entries(expressionGroups)) {
    console.log(`    그룹 ${group}: ${files.length}개`);
  }

  console.log("  [수염 분류]");
  for (const [type, files] of Object.entries(mustacheClassified)) {
    console.log(`    ${type}: ${files.length}개`);
  }

  // 인덱스 객체 생성
  const assetIndex = {
    body: bodyClassified,
    face: faceFiles,
    expression: expressionGroups,
    mustache: mustacheClassified,
    hair: hairFiles,
    glasses: glassesFiles,
  };

  // 출력 디렉토리 확인 후 JSON 저장
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(assetIndex, null, 2), "utf-8");

  console.log("");
  console.log(`=== 인덱스 저장 완료: ${OUTPUT_PATH} ===`);
}

main();
