"use client";

/**
 * 오늘의 기분 페이지 (간소화 버전)
 * 기분 카테고리와 의상 카테고리만 선택하면 표정/의상이 자동으로 랜덤 선택된다.
 * 6레이어 미리보기: body + face + expression + mustache + hair + glasses
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import AuthGuard from "@/app/components/AuthGuard";
import CharacterCanvas from "@/app/components/CharacterCanvas";
import AttendanceToast from "@/app/components/AttendanceToast";
import RewardInventoryPanel from "@/app/components/RewardInventoryPanel";
import { useCharacter } from "@/app/hooks/useCharacter";
import { useMoodEntries } from "@/app/hooks/useMoodEntries";
import { useBirthInfo } from "@/app/hooks/useBirthInfo";
import { useFortune } from "@/app/hooks/useFortune";
import { useAttendance } from "@/app/hooks/useAttendance";
import { useRewards } from "@/app/hooks/useRewards";
import { useDailyReward } from "@/app/hooks/useDailyReward";
import { compositeCharacter, downloadAsPNG } from "@/app/lib/imageCompositor";
import type {
  MoodCategory,
  OutfitCategory,
  CharacterCombination,
  DailyMoodState,
  SkinTone,
  UnlockedReward,
} from "@/app/lib/types";
import { MOOD_CATEGORIES, OUTFIT_CATEGORIES } from "@/app/lib/types";
import { getExpressionAssets, getBodyAssets, getBodySvgAssets, getUnlockedBodyItemAssets, getUnlockedHandItemAssets } from "@/app/lib/assetManager";
import { DEFAULT_OUTFIT_MAIN_COLOR, DEFAULT_OUTFIT_SUB_COLOR } from "@/app/lib/types";
import OutfitColorPicker from "@/app/components/OutfitColorPicker";

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

  // 운세 관련 훅
  const { birthInfo } = useBirthInfo();
  const { fortune, pickLuckyOutfit } = useFortune(birthInfo);

  // 출석 및 보상 훅
  const { recordAttendance } = useAttendance();
  const { fetchRewards, checkAndUnlockReward, checkAndUnlockItemRewards, getUnlockedItemCounts } = useRewards();

  // 일일 보상 훅
  const { claimDailyReward, fetchEventReward, getDailyRewardItems, eventReward } = useDailyReward();

  // 출석 토스트 상태
  const [toastData, setToastData] = useState<{
    show: boolean;
    streak: number;
    isNewAttendance: boolean;
    unlockedReward: UnlockedReward | null;
    // 일일 보상 필드
    dailyRewardItem: { itemType: "body_item" | "hand_item"; itemFile: string } | null;
    cycleProgress: { current: number; total: number } | null;
    isCycleComplete: boolean;
    bonusItems: { itemType: "body_item" | "hand_item"; itemFile: string }[] | null;
  } | null>(null);

  // 일일 무드 상태
  const [moodState, setMoodState] = useState<DailyMoodState>({
    moodCategory: null,
    expressionFile: null,
    outfitCategory: null,
    outfitFile: null,
    outfitMainColor: DEFAULT_OUTFIT_MAIN_COLOR,
    outfitSubColor: DEFAULT_OUTFIT_SUB_COLOR,
  });

  // 착용 소품 / 손 아이템 상태 (DB에 저장하지 않고 매번 랜덤 생성)
  const [bodyItemFile, setBodyItemFile] = useState<string | null>(null);
  const [handItemFile, setHandItemFile] = useState<string | null>(null);

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

  // 초기 로드: 캐릭터 + 오늘의 무드 항목 + 보상 데이터
  useEffect(() => {
    async function init() {
      setIsInitialLoading(true);
      const char = await fetchCharacter();
      if (!char) {
        // 캐릭터가 없으면 생성 페이지로 이동
        window.location.href = "/create/";
        return;
      }

      // 보상 데이터 로드 후 해금된 아이템 개수 확인
      await fetchRewards();
      // 일일 보상 데이터 로드
      await fetchEventReward();
      const { bodyItemCount, handItemCount } = getUnlockedItemCounts();

      // 티어 해금 아이템 + 일일 보상 아이템 병합
      const tierBodyItems = bodyItemCount > 0 ? getUnlockedBodyItemAssets(bodyItemCount) : [];
      const dailyBodyItems = getDailyRewardItems("body_item");
      const allBodyItems = [...new Set([...tierBodyItems, ...dailyBodyItems])];
      if (allBodyItems.length > 0) setBodyItemFile(pickRandom(allBodyItems));

      const tierHandItems = handItemCount > 0 ? getUnlockedHandItemAssets(handItemCount) : [];
      const dailyHandItems = getDailyRewardItems("hand_item");
      const allHandItems = [...new Set([...tierHandItems, ...dailyHandItems])];
      if (allHandItems.length > 0) setHandItemFile(pickRandom(allHandItems));

      // 오늘의 무드 항목이 이미 있으면 로드
      const todayEntry = await fetchTodayEntry();
      if (todayEntry) {
        setIsEditMode(true);
        setMoodState({
          moodCategory: todayEntry.mood_category as MoodCategory,
          expressionFile: todayEntry.expression_file,
          outfitCategory: null, // 카테고리는 복원하지 않음
          outfitFile: todayEntry.outfit_file,
          outfitMainColor: todayEntry.outfit_main_color,
          outfitSubColor: todayEntry.outfit_sub_color,
        });
      } else {
        // 오늘의 항목이 없으면 랜덤으로 기분/표정/의상을 자동 선택
        const randomMood = pickRandom(MOOD_CATEGORIES);
        const randomExpression = pickRandomExpression(randomMood.id);

        const randomOutfitCategory = pickRandom(SPECIFIC_OUTFIT_CATEGORIES);
        // 행운 의상이 있으면 우선 적용, 없으면 랜덤
        const luckyOutfit = pickLuckyOutfit(randomOutfitCategory.id as Exclude<OutfitCategory, "all">);
        const initialOutfit = luckyOutfit ?? pickRandomOutfit(randomOutfitCategory.id);

        setMoodState({
          moodCategory: randomMood.id,
          expressionFile: randomExpression,
          outfitCategory: randomOutfitCategory.id,
          outfitFile: initialOutfit,
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

    // skinTone을 포함하여 SVG 얼굴에 피부색이 올바르게 적용되도록 한다
    const combination: CharacterCombination = {
      body: moodState.outfitFile ?? "casual_1.png",
      bodyItem: bodyItemFile,
      face: character.face,
      expression: moodState.expressionFile ?? "1_1.png",
      mustache: character.mustache,
      hair: character.hair,
      glasses: character.glasses,
      handItem: handItemFile,
      skinTone: character.skinTone as SkinTone,
      outfitMainColor: moodState.outfitMainColor,
      outfitSubColor: moodState.outfitSubColor,
    };

    setIsPreviewLoading(true);
    compositeCharacter(combination)
      .then(setPreviewCanvas)
      .catch(() => setPreviewCanvas(null))
      .finally(() => setIsPreviewLoading(false));
  }, [character, moodState.outfitFile, moodState.expressionFile, moodState.outfitMainColor, moodState.outfitSubColor, bodyItemFile, handItemFile]);

  // 운세 로드 완료 시 행운 의상 자동 적용 (신규 기록일 때만)
  useEffect(() => {
    if (!fortune || isEditMode || !moodState.outfitCategory) return;
    const luckyOutfit = pickLuckyOutfit(moodState.outfitCategory as Exclude<OutfitCategory, "all">);
    if (luckyOutfit) {
      setMoodState(prev => ({ ...prev, outfitFile: luckyOutfit }));
    }
    // fortune이 처음 로드될 때만 실행 (의존성 배열에 fortune만)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fortune]);

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

  // SVG 의상 에셋 목록 (SPEC-OUTFIT-001)
  const svgOutfitAssets = useMemo(() => getBodySvgAssets(), []);

  // 의상 메인 색상 변경 핸들러 (SPEC-OUTFIT-001)
  const handleOutfitMainColorChange = useCallback((hex: string) => {
    setMoodState((prev) => ({ ...prev, outfitMainColor: hex }));
  }, []);

  // 의상 서브 색상 변경 핸들러 (SPEC-OUTFIT-001)
  const handleOutfitSubColorChange = useCallback((hex: string) => {
    setMoodState((prev) => ({ ...prev, outfitSubColor: hex }));
  }, []);

  // 사용 가능한 착용 소품 목록 (tier + daily 병합, 중복 제거)
  const availableBodyItems = useMemo(() => {
    const { bodyItemCount } = getUnlockedItemCounts();
    const tierItems = bodyItemCount > 0 ? getUnlockedBodyItemAssets(bodyItemCount) : [];
    const dailyItems = getDailyRewardItems("body_item");
    return [...new Set([...tierItems, ...dailyItems])];
  }, [getUnlockedItemCounts, getDailyRewardItems]);

  // 사용 가능한 손 아이템 목록 (tier + daily 병합, 중복 제거)
  const availableHandItems = useMemo(() => {
    const { handItemCount } = getUnlockedItemCounts();
    const tierItems = handItemCount > 0 ? getUnlockedHandItemAssets(handItemCount) : [];
    const dailyItems = getDailyRewardItems("hand_item");
    return [...new Set([...tierItems, ...dailyItems])];
  }, [getUnlockedItemCounts, getDailyRewardItems]);

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
        outfitMainColor: moodState.outfitFile?.endsWith(".svg") ? moodState.outfitMainColor : undefined,
        outfitSubColor: moodState.outfitFile?.endsWith(".svg") ? moodState.outfitSubColor : undefined,
      });
      setSaveSuccess(true);
      setIsEditMode(true);
      // 3초 후 성공 메시지 숨김
      setTimeout(() => setSaveSuccess(false), 3000);

      // 출석 기록 (기분 저장 성공 후 실행, 실패해도 기분 저장에는 영향 없음)
      try {
        const attendanceResult = await recordAttendance();
        if (attendanceResult) {
          let reward: UnlockedReward | null = null;

          // 새 출석이고 마일스톤에 도달한 경우 보상 해금 확인
          if (attendanceResult.isNewAttendance && attendanceResult.milestoneReached) {
            const now = new Date();
            const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            reward = await checkAndUnlockReward(
              attendanceResult.currentStreak,
              yearMonth
            );
          }

          // 출석 스트릭 기반 아이템 해금 처리 (마일스톤과 별개로 항상 확인)
          if (attendanceResult.isNewAttendance) {
            const now = new Date();
            const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            await checkAndUnlockItemRewards(
              attendanceResult.currentStreak,
              yearMonth
            );
          }

          // 일일 보상 수령 (출석 기록 이후 실행)
          let dailyClaimResult = null;
          try {
            dailyClaimResult = await claimDailyReward();
          } catch {
            // 일일 보상 수령 실패는 무시 (기존 흐름에 영향 없음)
          }

          setToastData({
            show: true,
            streak: attendanceResult.currentStreak,
            isNewAttendance: attendanceResult.isNewAttendance,
            unlockedReward: reward,
            dailyRewardItem: dailyClaimResult ? { itemType: dailyClaimResult.itemType, itemFile: dailyClaimResult.itemFile } : null,
            cycleProgress: dailyClaimResult ? { current: dailyClaimResult.dayNumber, total: eventReward?.cycleLength ?? 14 } : null,
            isCycleComplete: dailyClaimResult?.isCycleComplete ?? false,
            bonusItems: dailyClaimResult?.bonusItems ?? null,
          });
        }
      } catch {
        // 출석 기록 실패는 무시 (기분 저장은 이미 성공)
      }
    } catch {
      setPageError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }, [character, canSave, moodState, upsertEntry, recordAttendance, checkAndUnlockReward, checkAndUnlockItemRewards, claimDailyReward, eventReward]);

  // 토스트 닫기 핸들러
  const handleToastClose = useCallback(() => {
    setToastData(null);
  }, []);

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

        {/* 하단: 선택기 패널 (단일 컬럼 플로우) */}
        <div className="flex flex-col gap-4">
          {/* 기분 카테고리 선택 (전체 너비) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              오늘의 기분
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {MOOD_CATEGORIES.map((mood) => {
                const isMoodSelected = moodState.moodCategory === mood.id;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => handleMoodSelect(mood.id)}
                    aria-label={`${mood.nameKo} (${mood.nameEn})`}
                    aria-pressed={isMoodSelected}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg
                               border-2 transition-all duration-300 cursor-pointer
                               focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                               ${
                                 isMoodSelected
                                   ? "border-blue-500 bg-blue-50 shadow-md scale-105"
                                   : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                               }`}
                  >
                    <span className="text-xl" aria-hidden="true">
                      {MOOD_ICONS[mood.id]}
                    </span>
                    <span
                      className={`text-xs font-medium mt-1 ${
                        isMoodSelected ? "text-blue-700" : "text-gray-600"
                      }`}
                    >
                      {mood.nameKo}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 저장 버튼 (Primary CTA, 기분 선택 직후 배치) */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || isSaving || moodLoading}
            className={`w-full py-4 text-lg font-bold text-white rounded-xl
                       transition-all duration-150 cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                       ${
                         !canSave || isSaving || moodLoading
                           ? "bg-gray-300 cursor-not-allowed"
                           : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                       }`}
          >
            {isSaving ? "저장 중..." : "오늘의 기분 저장"}
          </button>

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

          {/* 세부 조정 (접을 수 있는 섹션) */}
          <details className="bg-white rounded-xl border border-gray-200">
            <summary className="p-4 cursor-pointer text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl select-none">
              세부 조정
            </summary>
            <div className="p-4 pt-0 flex flex-col gap-4">
              {/* 의상 카테고리 선택 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-600">
                    의상 카테고리
                  </h4>
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
                      의상 다시 뽑기
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {SPECIFIC_OUTFIT_CATEGORIES.map((outfit) => {
                    const isOutfitSelected = moodState.outfitCategory === outfit.id;
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
                        aria-pressed={isOutfitSelected}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg
                                   border-2 transition-all duration-300 cursor-pointer
                                   focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1
                                   ${
                                     isOutfitSelected
                                       ? "border-green-500 bg-green-50 shadow-md scale-105"
                                       : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                   }`}
                      >
                        <span className="text-xl" aria-hidden="true">
                          {OUTFIT_ICONS[outfit.id as Exclude<OutfitCategory, "all">]}
                        </span>
                        <span
                          className={`text-xs font-medium mt-1 ${
                            isOutfitSelected ? "text-green-700" : "text-gray-600"
                          }`}
                        >
                          {outfit.nameKo}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SVG 의상 선택 (SPEC-OUTFIT-001) */}
              {svgOutfitAssets.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-600 mb-2">
                    SVG 의상 (색상 변경 가능)
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                    {svgOutfitAssets.map((filename) => {
                      const isSelected = moodState.outfitFile === filename;
                      return (
                        <button
                          key={filename}
                          type="button"
                          onClick={() =>
                            setMoodState((prev) => ({
                              ...prev,
                              outfitFile: filename,
                              outfitCategory: null,
                              outfitMainColor: prev.outfitMainColor ?? DEFAULT_OUTFIT_MAIN_COLOR,
                              outfitSubColor: prev.outfitSubColor ?? DEFAULT_OUTFIT_SUB_COLOR,
                            }))
                          }
                          aria-label={filename.replace(/\s*0\.svg$/, "")}
                          aria-pressed={isSelected}
                          className={`relative aspect-square rounded-lg border-2 overflow-hidden
                                     transition-all duration-150 cursor-pointer
                                     focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1
                                     ${
                                       isSelected
                                         ? "border-purple-500 bg-purple-50 shadow-md scale-105"
                                         : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                     }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/assets/body-svg/${encodeURIComponent(filename)}`}
                            alt={filename.replace(/\s*0\.svg$/, "")}
                            className="w-full h-full object-contain p-1"
                            loading="lazy"
                          />
                        </button>
                      );
                    })}
                  </div>
                  {/* SVG 의상이 선택된 경우 색상 선택기 표시 */}
                  {moodState.outfitFile?.endsWith(".svg") && (
                    <OutfitColorPicker
                      mainColor={moodState.outfitMainColor ?? DEFAULT_OUTFIT_MAIN_COLOR}
                      subColor={moodState.outfitSubColor ?? DEFAULT_OUTFIT_SUB_COLOR}
                      onMainColorChange={handleOutfitMainColorChange}
                      onSubColorChange={handleOutfitSubColorChange}
                    />
                  )}
                </div>
              )}

              {/* 표정 다시 뽑기 버튼 (기분 카드 헤더에서 이동) */}
              {moodState.moodCategory && (
                <button
                  type="button"
                  onClick={handleRerollExpression}
                  aria-label="표정 다시 뽑기"
                  className="w-full py-2 text-sm font-medium rounded-lg
                             border border-blue-300 text-blue-600 bg-blue-50
                             hover:bg-blue-100 active:bg-blue-200
                             transition-all duration-150 cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                >
                  표정 다시 뽑기
                </button>
              )}

            </div>
          </details>

          {/* 보상 아이템 선택 (해금된 아이템이 있는 경우 표시) */}
          {(availableBodyItems.length > 0 || availableHandItems.length > 0) && (
            <RewardInventoryPanel
              bodyItems={availableBodyItems}
              handItems={availableHandItems}
              selectedBodyItem={bodyItemFile}
              selectedHandItem={handItemFile}
              onSelectBodyItem={setBodyItemFile}
              onSelectHandItem={setHandItemFile}
            />
          )}

          {/* 다운로드 버튼 (세컨더리 아웃라인 스타일) */}
          {previewCanvas && (
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3 rounded-xl font-medium
                         border border-gray-300 text-gray-600 bg-white hover:bg-gray-50
                         transition-all duration-150 cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              다운로드
            </button>
          )}
        </div>
      </div>

      {/* 출석 알림 토스트 */}
      {toastData && (
        <AttendanceToast
          show={toastData.show}
          streak={toastData.streak}
          isNewAttendance={toastData.isNewAttendance}
          unlockedReward={toastData.unlockedReward}
          dailyRewardItem={toastData.dailyRewardItem}
          cycleProgress={toastData.cycleProgress}
          isCycleComplete={toastData.isCycleComplete}
          bonusItems={toastData.bonusItems}
          onClose={handleToastClose}
        />
      )}
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
