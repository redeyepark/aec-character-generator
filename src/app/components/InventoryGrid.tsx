"use client";

/**
 * 인벤토리 그리드 컴포넌트
 * 아이템 목록을 썸네일 그리드로 표시한다.
 * 서브 필터, 정렬, 잠금 상태를 지원한다.
 */
import { useMemo } from "react";
import Image from "next/image";

// 인벤토리 아이템 타입
export interface InventoryItem {
  filename: string;
  assetPath: string;
  unlocked: boolean;
  source: "default" | "attendance" | "daily" | "locked";
  category?: string;
  isSvg?: boolean;
}

// 인벤토리 그리드 Props
export interface InventoryGridProps {
  items: InventoryItem[];
  totalCount: number;
  itemType: "body" | "body_item" | "hand_item";
  subFilters?: { id: string; label: string }[];
  activeSubFilter?: string;
  onSubFilterChange?: (id: string) => void;
  sortBy: "name" | "source";
  onSortChange: (sort: "name" | "source") => void;
  loading: boolean;
}

// 획득 경로 배지 색상 매핑
const SOURCE_BADGE_STYLES: Record<InventoryItem["source"], { bg: string; text: string; label: string }> = {
  default: { bg: "bg-blue-100", text: "text-blue-700", label: "기본 의상" },
  attendance: { bg: "bg-green-100", text: "text-green-700", label: "출석 보상" },
  daily: { bg: "bg-yellow-100", text: "text-yellow-700", label: "일일 보상" },
  locked: { bg: "bg-gray-100", text: "text-gray-500", label: "잠김" },
};

// 정렬 우선순위 (획득순)
const SOURCE_SORT_ORDER: Record<InventoryItem["source"], number> = {
  default: 0,
  attendance: 1,
  daily: 2,
  locked: 3,
};

export default function InventoryGrid({
  items,
  totalCount,
  itemType,
  subFilters,
  activeSubFilter,
  onSubFilterChange,
  sortBy,
  onSortChange,
  loading,
}: InventoryGridProps) {
  // 정렬된 아이템 목록
  const sortedItems = useMemo(() => {
    const sorted = [...items];
    if (sortBy === "name") {
      sorted.sort((a, b) => a.filename.localeCompare(b.filename));
    } else {
      // 획득순: default → attendance → daily → locked
      sorted.sort((a, b) => {
        const orderDiff = SOURCE_SORT_ORDER[a.source] - SOURCE_SORT_ORDER[b.source];
        if (orderDiff !== 0) return orderDiff;
        return a.filename.localeCompare(b.filename);
      });
    }
    return sorted;
  }, [items, sortBy]);

  // 해금된 아이템 수
  const unlockedCount = useMemo(
    () => items.filter((item) => item.unlocked).length,
    [items]
  );

  // 로딩 스켈레톤
  if (loading) {
    return (
      <div className="space-y-4">
        {/* 스켈레톤 필터 바 */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
        </div>
        {/* 스켈레톤 그리드 */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 서브 필터 칩 (의상 탭 전용) */}
        {subFilters && onSubFilterChange && (
          <div className="flex flex-wrap gap-1.5">
            {subFilters.map((filter) => {
              const isActive = activeSubFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => onSubFilterChange(filter.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                    ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  aria-pressed={isActive}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 정렬 토글 */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSortChange("name")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
              ${
                sortBy === "name"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            aria-pressed={sortBy === "name"}
          >
            이름순
          </button>
          <button
            type="button"
            onClick={() => onSortChange("source")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
              ${
                sortBy === "source"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            aria-pressed={sortBy === "source"}
          >
            획득순
          </button>
        </div>
      </div>

      {/* 보유 아이템 카운트 */}
      <p className="text-sm text-gray-500">
        보유 아이템: {unlockedCount}/{totalCount}개
      </p>

      {/* 아이템 그리드 */}
      <div
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
        role="list"
        aria-label={`${itemType} 아이템 목록`}
      >
        {sortedItems.map((item) => {
          const badge = SOURCE_BADGE_STYLES[item.source];
          // 파일명에서 확장자 제거
          const displayName = item.filename.replace(/\.(png|svg)$/i, "");

          return (
            <div
              key={item.filename}
              role="listitem"
              aria-label={`${displayName} - ${badge.label}`}
              className={`relative rounded-lg border-2 overflow-hidden transition-all duration-150
                ${
                  item.unlocked
                    ? "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    : "border-gray-100 bg-gray-50 grayscale opacity-50"
                }`}
            >
              {/* 썸네일 */}
              <div className="aspect-square p-1.5 flex items-center justify-center">
                <Image
                  src={item.assetPath}
                  alt={displayName}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
                {/* 잠금 오버레이 */}
                {!item.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* 아이템 정보 */}
              <div className="px-1.5 pb-1.5 space-y-0.5">
                {/* 아이템 이름 */}
                <p className="text-[10px] text-gray-600 truncate leading-tight" title={displayName}>
                  {displayName}
                </p>
                {/* 획득 경로 배지 */}
                <span
                  className={`inline-block px-1.5 py-0.5 text-[9px] font-medium rounded-full ${badge.bg} ${badge.text}`}
                >
                  {badge.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 아이템 없음 */}
      {sortedItems.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">
          표시할 아이템이 없습니다.
        </p>
      )}
    </div>
  );
}
