/**
 * 에셋 복사 스크립트
 * _AEC 폴더의 원본 에셋을 public/assets/ 로 정규화된 폴더명으로 복사한다.
 */
import * as fs from "fs";
import * as path from "path";

// 폴더명 매핑: 원본 → 정규화
const FOLDER_MAP: Record<string, string> = {
  "01_Body 1": "body",
  "02_Body Item": "body-item",
  "03_Face": "face",
  "03_Face_SVG": "face-svg",
  "04_Facial_Expression": "expression",
  "05_Mustache": "mustache",
  "07_Hair": "hair",
  "08_Glasses": "glasses",
  "10_Hand item 4": "hand-item",
};

// 프로젝트 루트 경로
const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "_AEC");
const TARGET_DIR = path.join(ROOT, "public", "assets");

/**
 * 디렉토리가 없으면 재귀적으로 생성
 */
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 소스 폴더에서 대상 폴더로 PNG/SVG 파일 복사
 */
function copyFolder(sourceName: string, targetName: string): number {
  const srcPath = path.join(SOURCE_DIR, sourceName);
  const dstPath = path.join(TARGET_DIR, targetName);

  if (!fs.existsSync(srcPath)) {
    console.error(`[오류] 소스 폴더를 찾을 수 없음: ${srcPath}`);
    return 0;
  }

  ensureDir(dstPath);

  const files = fs.readdirSync(srcPath).filter((f) => f.endsWith(".png") || f.endsWith(".svg"));
  let copied = 0;

  for (const file of files) {
    const srcFile = path.join(srcPath, file);
    const dstFile = path.join(dstPath, file);
    fs.copyFileSync(srcFile, dstFile);
    copied++;
  }

  return copied;
}

/**
 * 메인 실행
 */
function main(): void {
  console.log("=== AEC 에셋 복사 시작 ===");
  console.log(`소스: ${SOURCE_DIR}`);
  console.log(`대상: ${TARGET_DIR}`);
  console.log("");

  // 기존 대상 폴더 정리
  if (fs.existsSync(TARGET_DIR)) {
    fs.rmSync(TARGET_DIR, { recursive: true });
    console.log("기존 assets 폴더 제거 완료");
  }

  ensureDir(TARGET_DIR);

  let totalFiles = 0;

  for (const [sourceName, targetName] of Object.entries(FOLDER_MAP)) {
    const count = copyFolder(sourceName, targetName);
    console.log(`  ${sourceName} → ${targetName}: ${count}개 파일`);
    totalFiles += count;
  }

  console.log("");
  console.log(`=== 복사 완료: 총 ${totalFiles}개 파일 ===`);
}

main();
