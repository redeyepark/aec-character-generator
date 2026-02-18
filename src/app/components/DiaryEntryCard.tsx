"use client";

/**
 * 다이어리 항목 카드 컴포넌트
 * 선택된 날짜의 무드 항목 상세 정보를 표시한다.
 * 캐릭터 미리보기와 다운로드 기능을 포함한다.
 */
import { useEffect, useState, useCallback } from "react";
import type { MoodEntry, BaseCharacter, CharacterCombination, SkinTone } from "@/app/lib/types";
import { MOOD_CATEGORIES } from "@/app/lib/types";
import { compositeCharacter, downloadAsPNG } from "@/app/lib/imageCompositor";
import CharacterCanvas from "./CharacterCanvas";

interface DiaryEntryCardProps {
  /** 무드 항목 데이터 */
  entry: MoodEntry;
  /** 베이스 캐릭터 데이터 */
  character: BaseCharacter;
}

// 기분별 이모티콘
const MOOD_EMOJI: Record<string, string> = {
  happy: "\u{1F60A}",
  confident: "\u{1F60E}",
  calm: "\u{1F60C}",
  surprised: "\u{1F632}",
  thoughtful: "\u{1F914}",
  playful: "\u{1F61C}",
  determined: "\u{1F4AA}",
};

export default function DiaryEntryCard({ entry, character }: DiaryEntryCardProps) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 기분 카테고리 한글명
  const moodInfo = MOOD_CATEGORIES.find((m) => m.id === entry.mood_category);
  const moodNameKo = moodInfo?.nameKo ?? entry.mood_category;

  // 날짜 포맷
  const formattedDate = (() => {
    const parts = entry.date.split("-");
    return `${parts[0]}년 ${parseInt(parts[1])}월 ${parseInt(parts[2])}일`;
  })();

  // 캐릭터 합성 (착용 소품/손 아이템은 DB에 저장되지 않으므로 null 처리)
  useEffect(() => {
    // skinTone을 포함하여 SVG 얼굴에 피부색이 올바르게 적용되도록 한다
    const combination: CharacterCombination = {
      body: entry.outfit_file,
      bodyItem: null,
      face: character.face,
      expression: entry.expression_file,
      mustache: character.mustache,
      hair: character.hair,
      glasses: character.glasses,
      handItem: null,
      skinTone: character.skinTone as SkinTone,
      outfitMainColor: entry.outfit_main_color,
      outfitSubColor: entry.outfit_sub_color,
    };

    setIsLoading(true);
    compositeCharacter(combination)
      .then(setCanvas)
      .catch(() => setCanvas(null))
      .finally(() => setIsLoading(false));
  }, [entry, character]);

  // 다운로드 핸들러
  const handleDownload = useCallback(() => {
    if (canvas) {
      downloadAsPNG(canvas);
    }
  }, [canvas]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* 날짜와 기분 정보 */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl" aria-hidden="true">
          {MOOD_EMOJI[entry.mood_category] ?? "\u{1F60A}"}
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-800">{formattedDate}</p>
          <p className="text-xs text-gray-500">{moodNameKo}</p>
        </div>
      </div>

      {/* 캐릭터 미리보기 */}
      <div className="mb-4">
        <CharacterCanvas composited={canvas} isLoading={isLoading} />
      </div>

      {/* 다운로드 버튼 */}
      {canvas && (
        <button
          type="button"
          onClick={handleDownload}
          className="w-full px-4 py-2.5 rounded-lg font-medium text-sm
                     bg-green-500 text-white hover:bg-green-600 active:bg-green-700
                     transition-all duration-150 cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
        >
          다운로드
        </button>
      )}
    </div>
  );
}
