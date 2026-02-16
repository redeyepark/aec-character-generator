"use client";

/**
 * 오늘의 운세 카드 컴포넌트
 * 운세 등급, 오행 관계, 행운 색상을 시각적으로 표시한다.
 */
import type { DailyFortune, FortuneLevel, FiveElement } from "@/app/lib/fortune/types";
import {
  ELEMENT_INFO,
  FORTUNE_LEVEL_INFO,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
} from "@/app/lib/fortune/types";

// 등급별 스타일 매핑
const LEVEL_STYLES: Record<
  FortuneLevel,
  { border: string; bg: string; icon: string; iconColor: string }
> = {
  very_lucky: {
    border: "border-amber-400",
    bg: "bg-amber-50",
    icon: "\u2605", // ★
    iconColor: "text-amber-500",
  },
  lucky: {
    border: "border-green-400",
    bg: "bg-green-50",
    icon: "\u{1F33F}", // 🌿
    iconColor: "text-green-500",
  },
  neutral: {
    border: "border-gray-300",
    bg: "bg-gray-50",
    icon: "\u25CB", // ○
    iconColor: "text-gray-400",
  },
  caution: {
    border: "border-orange-400",
    bg: "bg-orange-50",
    icon: "\u26A0", // ⚠
    iconColor: "text-orange-500",
  },
};

// 오행별 색상 도트 스타일
const ELEMENT_DOT_COLORS: Record<FiveElement, string> = {
  wood: "bg-green-500",
  fire: "bg-red-500",
  earth: "bg-yellow-500",
  metal: "bg-gray-300",
  water: "bg-blue-500",
};

interface FortuneCardProps {
  fortune: DailyFortune;
}

export default function FortuneCard({ fortune }: FortuneCardProps) {
  const style = LEVEL_STYLES[fortune.fortuneLevel];
  const levelInfo = FORTUNE_LEVEL_INFO[fortune.fortuneLevel];
  const userElementInfo = ELEMENT_INFO[fortune.userElement];
  const todayElementInfo = ELEMENT_INFO[fortune.todayElement];
  const luckyElementInfo = ELEMENT_INFO[fortune.luckyElement];

  // 천간지지 한국어 이름 조합
  const stemInfo = HEAVENLY_STEMS.find((s) => s.id === fortune.todayStem);
  const branchInfo = EARTHLY_BRANCHES.find((b) => b.id === fortune.todayBranch);
  const ganjiName = stemInfo && branchInfo
    ? `${stemInfo.nameHanja}${branchInfo.nameHanja}(${stemInfo.nameKo}${branchInfo.nameKo})`
    : "";

  return (
    <details
      className={`rounded-xl border-2 ${style.border} ${style.bg} overflow-hidden`}
    >
      <summary className="p-4 cursor-pointer select-none hover:opacity-80 transition-opacity">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 등급 아이콘 */}
            <span className={`text-lg ${style.iconColor}`} aria-hidden="true">
              {style.icon}
            </span>
            {/* 등급 배지 */}
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-full ${style.border} border bg-white`}
            >
              {levelInfo.nameKo}
            </span>
            <span className="text-sm font-medium text-gray-700">
              오늘의 운세
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {fortune.date}
          </span>
        </div>
      </summary>

      <div className="px-4 pb-4 flex flex-col gap-3">
        {/* 간지 정보 */}
        <div className="text-sm text-gray-600">
          오늘의 간지:{" "}
          <span className="font-semibold text-gray-800">{ganjiName}</span>
        </div>

        {/* 오행 관계 */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block w-3 h-3 rounded-full ${ELEMENT_DOT_COLORS[fortune.userElement]}`}
              aria-hidden="true"
            />
            <span className="text-gray-600">
              나의 오행:{" "}
              <span className="font-semibold">
                {userElementInfo.nameKo}({userElementInfo.nameHanja})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block w-3 h-3 rounded-full ${ELEMENT_DOT_COLORS[fortune.todayElement]}`}
              aria-hidden="true"
            />
            <span className="text-gray-600">
              오늘의 오행:{" "}
              <span className="font-semibold">
                {todayElementInfo.nameKo}({todayElementInfo.nameHanja})
              </span>
            </span>
          </div>
        </div>

        {/* 행운 색상 */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">추천 색상:</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block w-3 h-3 rounded-full ${ELEMENT_DOT_COLORS[fortune.luckyElement]}`}
              aria-hidden="true"
            />
            <span className="font-semibold text-gray-800">
              {luckyElementInfo.colors.join(", ")}
            </span>
          </div>
        </div>

        {/* 운세 메시지 */}
        <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-200 pt-3 mt-1">
          {fortune.message}
        </p>
      </div>
    </details>
  );
}
