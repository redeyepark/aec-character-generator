"use client";

/**
 * 오늘의 기분 페이지 (간소화 버전)
 * 기분 카테고리와 의상 카테고리만 선택하면 표정/의상이 자동으로 랜덤 선택된다.
 * 6레이어 미리보기: body + face + expression + mustache + hair + glasses
 */
import { useState, useEffect, useCallback } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import CharacterCanvas from "@/app/components/CharacterCanvas";
import { useCharacter } from "@/app/hooks/useCharacter";
import { useMoodEntries } from "@/app/hooks/useMoodEntries";
import { compositeCharacter, downloadAsPNG } from "@/app/lib/imageCompositor";
import type {
  MoodCategory,
  OutfitCategory,
  CharacterCombination,
  DailyMoodState,
} from "@/app/lib/types";
import { MOOD_CATEGORIES, OUTFIT_CATEGORIES } from "@/app/lib/types";
import { getExpressionAssets, getBodyAssets } from "@/app/lib/assetManager";

// 기분별 이모티콘 매핑
const MOOD_ICONS: Record<MoodCategory, string> = {
  happy: "\u{1F60A}",
  confident: "\u{1F60E}",
  calm: "\u{1F60C}",
  surprised: "\u{1F632}",
  thoughtful: "\u{1F914}",
  playful: "\u{1F61C}",
  determined: "\u{1F4AA}",
};

// 의상별 이모티콘 매핑 ("all" 제외)
const OUTFIT_ICONS: Record<Exclude<OutfitCategory, "all">, string> = {
  casual: "\u{1F455}",
  formal: "\u{1F454}",
  sporty: "\u{1F3BD}",
  outerwear: "\u{1F9E5}",
  bowtie: "\u{1F3A9}",
};

// "all" 카테고리를 제외한 의상 카테고리 목록
const SPECIFIC_OUTFIT_CATEGORIES = OUTFIT_CATEGORIES.filter(
  (o) => o.id !== "all"
);

/**
 * 배열에서 균등 분포로 무작위 항목 하나를 선택
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function MoodPageContent() {
  const { character, fetchCharacter } = useCharacter();
  const {
    fetchTodayEntry,
    upsertEntry,
    loading: moodLoading,
    error: moodError,
  } = useMoodEntries();

  // 일일 무드 상태
  const [moodState, setMoodState] = useState<DailyMoodState>({
    moodCategory: null,
    expressionFile: null,
    outfitCategory: null,
    outfitFile: null,
  });

  // 미리보기 관련 상태
  const [previewCanvas, setPreviewCanvas] =
    useState<HTMLCanvasElement | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  /**
   * 주어진 기분 카테고리에서 랜덤 표정을 선택하여 반환
   */
  const pickRandomExpression = useCallback(
    (mood: MoodCategory): string | null => {
      const expressions = getExpressionAssets(mood);
      return expressions.length > 0 ? pickRandom(expressions) : null;
    },
    []
  );

  /**
   * 주어진 의상 카테고리에서 랜덤 의상을 선택하여 반환
   */
  const pickRandomOutfit = useCallback(
    (category: OutfitCategory): string | null => {
      const outfits = getBodyAssets(category);
      return outfits.length > 0 ? pickRandom(outfits) : null;
    },
    []
  );

  // 초기 로드: 캐릭터 + 오늘의 무드 항목
  useEffect(() => {
    async function init() {
      setIsInitialLoading(true);
      const char = await fetchCharacter();
      if (!char) {
        // 캐릭터가 없으면 생성 페이지로 이동
        window.location.href = "/create/";
        return;
      }

      // 오늘의 무드 항목이 이미 있으면 로드
      const todayEntry = await fetchTodayEntry();
      if (todayEntry) {
        setIsEditMode(true);
        setMoodState({
          moodCategory: todayEntry.mood_category as MoodCategory,
          expressionFile: todayEntry.expression_file,
          outfitCategory: null, // 카테고리는 복원하지 않음
          outfitFile: todayEntry.outfit_file,
        });
      } else {
        // 오늘의 항목이 없으면 랜덤으로 기분/표정/의상을 자동 선택
        const randomMood = pickRandom(MOOD_CATEGORIES);
        const randomExpression = pickRandomExpression(randomMood.id);

        const randomOutfitCategory = pickRandom(SPECIFIC_OUTFIT_CATEGORIES);
        const randomOutfit = pickRandomOutfit(randomOutfitCategory.id);

        setMoodState({
          moodCategory: randomMood.id,
          expressionFile: randomExpression,
          outfitCategory: randomOutfitCategory.id,
          outfitFile: randomOutfit,
        });
      }

      setIsInitialLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 6레이어 미리보기 업데이트
  useEffect(() => {
    if (!character) return;

    const combination: CharacterCombination = {
      body: moodState.outfitFile ?? "casual_1.png",
      face: character.face,
      expression: moodState.expressionFile ?? "1_1.png",
      mustache: character.mustache,
      hair: character.hair,
      glasses: character.glasses,
    };

    setIsPreviewLoading(true);
    compositeCharacter(combination)
      .then(setPreviewCanvas)
      .catch(() => setPreviewCanvas(null))
      .finally(() => setIsPreviewLoading(false));
  }, [character, moodState.outfitFile, moodState.expressionFile]);

  // 기분 카테고리 클릭 핸들러 (자동 랜덤 표정 선택)
  const handleMoodSelect = useCallback(
    (mood: MoodCategory) => {
      const randomExpression = pickRandomExpression(mood);
      setMoodState((prev) => ({
        ...prev,
        moodCategory: mood,
        expressionFile: randomExpression,
      }));
    },
    [pickRandomExpression]
  );

  // 의상 카테고리 클릭 핸들러 (자동 랜덤 의상 선택)
  const handleOutfitSelect = useCallback(
    (category: Exclude<OutfitCategory, "all">) => {
      const randomOutfit = pickRandomOutfit(category);
      setMoodState((prev) => ({
        ...prev,
        outfitCategory: category,
        outfitFile: randomOutfit,
      }));
    },
    [pickRandomOutfit]
  );

  // 표정 다시 뽑기
  const handleRerollExpression = useCallback(() => {
    if (!moodState.moodCategory) return;
    const randomExpression = pickRandomExpression(moodState.moodCategory);
    setMoodState((prev) => ({
      ...prev,
      expressionFile: randomExpression,
    }));
  }, [moodState.moodCategory, pickRandomExpression]);

  // 의상 다시 뽑기
  const handleRerollOutfit = useCallback(() => {
    if (!moodState.outfitCategory) return;
    const randomOutfit = pickRandomOutfit(moodState.outfitCategory);
    setMoodState((prev) => ({
      ...prev,
      outfitFile: randomOutfit,
    }));
  }, [moodState.outfitCategory, pickRandomOutfit]);

  // 저장 가능 여부
  const canSave =
    moodState.moodCategory !== null &&
    moodState.expressionFile !== null &&
    moodState.outfitFile !== null;

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!character || !canSave) return;

    setIsSaving(true);
    setPageError(null);
    setSaveSuccess(false);

    try {
      await upsertEntry({
        characterId: character.id,
        date: getTodayDateString(),
        moodCategory: moodState.moodCategory!,
        outfitFile: moodState.outfitFile!,
        expressionFile: moodState.expressionFile!,
      });
      setSaveSuccess(true);
      setIsEditMode(true);
      // 3초 후 성공 메시지 숨김
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setPageError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }, [character, canSave, moodState, upsertEntry]);

  // 다운로드 핸들러
  const handleDownload = useCallback(() => {
    if (previewCanvas) {
      downloadAsPNG(previewCanvas);
    }
  }, [previewCanvas]);

  // 초기 로딩 중
  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"
            aria-hidden="true"
          />
          <span className="text-sm text-gray-500">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* 헤더 */}
      <header className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          오늘의 기분
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEditMode
            ? "오늘의 기분을 수정할 수 있습니다."
            : "카테고리를 선택하면 자동으로 표정과 의상이 선택됩니다."}
        </p>
      </header>

      {/* 메인 콘텐츠 - 단일 컬럼 레이아웃 (캐릭터 상단, 선택기 하단) */}
      <div className="max-w-3xl mx-auto flex flex-col gap-6 md:gap-8">
        {/* 상단: 캐릭터 미리보기 */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            캐릭터 미리보기
          </h3>
          <CharacterCanvas
            composited={previewCanvas}
            isLoading={isPreviewLoading}
          />
        </div>

        {/* 하단: 선택기 패널 */}
        <div className="flex flex-col gap-6">
          {/* 기분/의상 카테고리 - 데스크톱에서 2열 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기분 카테고리 선택 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  오늘의 기분
                </h3>
                {moodState.moodCategory && (
                  <button
                    type="button"
                    onClick={handleRerollExpression}
                    aria-label="표정 다시 뽑기"
                    className="px-3 py-1 text-xs font-medium rounded-full
                               border border-blue-300 text-blue-600 bg-blue-50
                               hover:bg-blue-100 active:bg-blue-200
                               transition-all duration-150 cursor-pointer
                               focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                  >
                    다시 뽑기
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-4 gap-2">
                {MOOD_CATEGORIES.map((mood) => {
                  const isSelected = moodState.moodCategory === mood.id;
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => handleMoodSelect(mood.id)}
                      aria-label={`${mood.nameKo} (${mood.nameEn})`}
                      aria-pressed={isSelected}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg
                                 border-2 transition-all duration-150 cursor-pointer
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                                 ${
                                   isSelected
                                     ? "border-blue-500 bg-blue-50 shadow-md"
                                     : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                 }`}
                    >
                      <span className="text-xl" aria-hidden="true">
                        {MOOD_ICONS[mood.id]}
                      </span>
                      <span
                        className={`text-xs font-medium mt-1 ${
                          isSelected ? "text-blue-700" : "text-gray-600"
                        }`}
                      >
                        {mood.nameKo}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 의상 카테고리 선택 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  오늘의 의상
                </h3>
                {moodState.outfitCategory && (
                  <button
                    type="button"
                    onClick={handleRerollOutfit}
                    aria-label="의상 다시 뽑기"
                    className="px-3 py-1 text-xs font-medium rounded-full
                               border border-green-300 text-green-600 bg-green-50
                               hover:bg-green-100 active:bg-green-200
                               transition-all duration-150 cursor-pointer
                               focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
                  >
                    다시 뽑기
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-3 gap-2">
                {SPECIFIC_OUTFIT_CATEGORIES.map((outfit) => {
                  const isSelected = moodState.outfitCategory === outfit.id;
                  return (
                    <button
                      key={outfit.id}
                      type="button"
                      onClick={() =>
                        handleOutfitSelect(
                          outfit.id as Exclude<OutfitCategory, "all">
                        )
                      }
                      aria-label={`${outfit.nameKo} (${outfit.nameEn})`}
                      aria-pressed={isSelected}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg
                                 border-2 transition-all duration-150 cursor-pointer
                                 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1
                                 ${
                                   isSelected
                                     ? "border-green-500 bg-green-50 shadow-md"
                                     : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                 }`}
                    >
                      <span className="text-xl" aria-hidden="true">
                        {OUTFIT_ICONS[outfit.id as Exclude<OutfitCategory, "all">]}
                      </span>
                      <span
                        className={`text-xs font-medium mt-1 ${
                          isSelected ? "text-green-700" : "text-gray-600"
                        }`}
                      >
                        {outfit.nameKo}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || isSaving || moodLoading}
              className={`flex-1 px-6 py-3 rounded-lg font-medium text-white
                         transition-all duration-150 cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                         ${
                           !canSave || isSaving || moodLoading
                             ? "bg-gray-300 cursor-not-allowed"
                             : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                         }`}
            >
              {isSaving ? "저장 중..." : "오늘의 기분 저장"}
            </button>

            {previewCanvas && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 px-6 py-3 rounded-lg font-medium
                           bg-green-500 text-white hover:bg-green-600 active:bg-green-700
                           transition-all duration-150 cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
              >
                다운로드
              </button>
            )}
          </div>

          {/* 성공 메시지 */}
          {saveSuccess && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              오늘의 기분이 저장되었습니다!
            </div>
          )}

          {/* 에러 메시지 */}
          {(pageError || moodError) && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {pageError || moodError}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// AuthGuard로 래핑
export default function MoodPage() {
  return (
    <AuthGuard>
      <MoodPageContent />
    </AuthGuard>
  );
}
