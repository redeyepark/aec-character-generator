"use client";

/**
 * 보상 아이템 인벤토리 패널 컴포넌트
 * 해금된 착용 소품(body item)과 손 아이템(hand item)을
 * 썸네일 그리드로 표시하고 수동 선택할 수 있다.
 * 접이식(details/summary) UI로 공간을 절약한다.
 */
import { useCallback } from "react";
import Image from "next/image";

interface RewardInventoryPanelProps {
  /** 사용 가능한 착용 소품 파일명 배열 (tier + daily 합산, 중복 제거 완료) */
  bodyItems: string[];
  /** 사용 가능한 손 아이템 파일명 배열 (tier + daily 합산, 중복 제거 완료) */
  handItems: string[];
  /** 현재 선택된 착용 소품 파일명 */
  selectedBodyItem: string | null;
  /** 현재 선택된 손 아이템 파일명 */
  selectedHandItem: string | null;
  /** 착용 소품 선택 콜백 */
  onSelectBodyItem: (file: string | null) => void;
  /** 손 아이템 선택 콜백 */
  onSelectHandItem: (file: string | null) => void;
}

export default function RewardInventoryPanel({
  bodyItems,
  handItems,
  selectedBodyItem,
  selectedHandItem,
  onSelectBodyItem,
  onSelectHandItem,
}: RewardInventoryPanelProps) {
  // 랜덤 선택 핸들러
  const handleRandomBodyItem = useCallback(() => {
    if (bodyItems.length === 0) return;
    const randomIndex = Math.floor(Math.random() * bodyItems.length);
    onSelectBodyItem(bodyItems[randomIndex]);
  }, [bodyItems, onSelectBodyItem]);

  const handleRandomHandItem = useCallback(() => {
    if (handItems.length === 0) return;
    const randomIndex = Math.floor(Math.random() * handItems.length);
    onSelectHandItem(handItems[randomIndex]);
  }, [handItems, onSelectHandItem]);

  return (
    <details
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200
                 dark:border-gray-700 shadow-sm"
    >
      <summary
        className="px-4 py-3 cursor-pointer select-none text-sm font-semibold
                   text-gray-700 dark:text-gray-200 hover:bg-gray-50
                   dark:hover:bg-gray-750 rounded-xl transition-colors"
      >
        보상 아이템 선택
      </summary>

      <div className="px-4 pb-4 space-y-5">
        {/* 착용 소품 섹션 */}
        <ItemSection
          title="착용 소품"
          items={bodyItems}
          selectedItem={selectedBodyItem}
          assetPathPrefix="/assets/body-item/"
          onSelect={onSelectBodyItem}
          onRandom={handleRandomBodyItem}
          emptyMessage="아직 해금된 착용 소품이 없습니다"
        />

        {/* 손 아이템 섹션 */}
        <ItemSection
          title="손 아이템"
          items={handItems}
          selectedItem={selectedHandItem}
          assetPathPrefix="/assets/hand-item/"
          onSelect={onSelectHandItem}
          onRandom={handleRandomHandItem}
          emptyMessage="아직 해금된 손 아이템이 없습니다"
        />
      </div>
    </details>
  );
}

// --- 내부 하위 컴포넌트 ---

interface ItemSectionProps {
  /** 섹션 제목 */
  title: string;
  /** 아이템 파일명 배열 */
  items: string[];
  /** 현재 선택된 아이템 파일명 */
  selectedItem: string | null;
  /** 에셋 경로 접두사 (예: /assets/body-item/) */
  assetPathPrefix: string;
  /** 아이템 선택 콜백 */
  onSelect: (file: string | null) => void;
  /** 랜덤 선택 콜백 */
  onRandom: () => void;
  /** 아이템 없을 때 표시 메시지 */
  emptyMessage: string;
}

function ItemSection({
  title,
  items,
  selectedItem,
  assetPathPrefix,
  onSelect,
  onRandom,
  emptyMessage,
}: ItemSectionProps) {
  return (
    <section aria-label={title}>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          {title}
        </h4>
        {items.length > 0 && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onRandom}
              className="px-2 py-0.5 text-xs font-medium rounded-md
                         bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400
                         hover:bg-blue-100 dark:hover:bg-blue-900/50
                         transition-colors cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
              aria-label={`${title} 랜덤 선택`}
            >
              랜덤
            </button>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={`px-2 py-0.5 text-xs font-medium rounded-md transition-colors cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1
                         ${
                           selectedItem === null
                             ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                             : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                         }`}
              aria-label={`${title} 해제`}
              aria-pressed={selectedItem === null}
            >
              해제
            </button>
          </div>
        )}
      </div>

      {/* 아이템 없음 상태 */}
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 py-2">
          {emptyMessage}
        </p>
      ) : (
        /* 썸네일 그리드 */
        <div
          className="grid grid-cols-5 gap-2"
          role="radiogroup"
          aria-label={`${title} 선택`}
        >
          {items.map((filename) => {
            const isSelected = selectedItem === filename;
            const imgSrc = `${assetPathPrefix}${encodeURIComponent(filename)}`;

            return (
              <button
                key={filename}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={filename}
                onClick={() => onSelect(filename)}
                title={filename}
                className={`aspect-square rounded-lg border-2 transition-all duration-150
                           overflow-hidden cursor-pointer p-0.5
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                           ${
                             isSelected
                               ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md ring-2 ring-blue-300 dark:ring-blue-600"
                               : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-650"
                           }`}
              >
                <Image
                  src={imgSrc}
                  alt={filename}
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
