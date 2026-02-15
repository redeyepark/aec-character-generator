"use client";

/**
 * 에셋 그리드 선택기 컴포넌트
 * 레이어별 에셋을 그리드 형태로 표시하고 선택할 수 있다.
 * 페이지네이션과 검색 필터를 지원한다.
 */
import { useState, useMemo, useCallback } from "react";
import type { LayerType } from "@/app/lib/types";
import { getAssetPath } from "@/app/lib/assetManager";

interface AssetPickerProps {
  /** 에셋 파일명 목록 */
  assets: string[];
  /** 레이어 종류 (경로 생성용) */
  layerType: LayerType;
  /** 현재 선택된 에셋 파일명 */
  selected: string | null;
  /** 에셋 선택 핸들러 */
  onSelect: (filename: string | null) => void;
  /** 선택사항 여부 (true면 "없음" 옵션 표시) */
  optional?: boolean;
}

// 페이지당 항목 수
const ITEMS_PER_PAGE = 20;

export default function AssetPicker({
  assets,
  layerType,
  selected,
  onSelect,
  optional = false,
}: AssetPickerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // 검색 필터링
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const query = searchQuery.toLowerCase();
    return assets.filter((filename) => filename.toLowerCase().includes(query));
  }, [assets, searchQuery]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const pagedAssets = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredAssets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssets, currentPage]);

  // 검색어 변경 시 첫 페이지로 이동
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(0);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* 검색 필터 (에셋이 20개 초과일 때만 표시) */}
      {assets.length > ITEMS_PER_PAGE && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="에셋 검색..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300
                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                     text-sm text-gray-900 placeholder-gray-400"
        />
      )}

      {/* 에셋 그리드 */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {/* "없음" 옵션 (optional일 때 첫 페이지에서만 표시) */}
        {optional && currentPage === 0 && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`aspect-square rounded-lg border-2 transition-all duration-150
                       flex items-center justify-center cursor-pointer
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                       ${
                         selected === null
                           ? "border-blue-500 bg-blue-50 shadow-md"
                           : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                       }`}
          >
            <span className={`text-sm font-medium ${
              selected === null ? "text-blue-700" : "text-gray-500"
            }`}>
              없음
            </span>
          </button>
        )}

        {/* 에셋 항목 */}
        {pagedAssets.map((filename) => {
          const isSelected = selected === filename;
          const imgSrc = getAssetPath(layerType, filename);

          return (
            <button
              key={filename}
              type="button"
              onClick={() => onSelect(filename)}
              title={filename}
              className={`aspect-square rounded-lg border-2 transition-all duration-150
                         overflow-hidden cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                         ${
                           isSelected
                             ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-300"
                             : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                         }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={filename}
                className="w-full h-full object-contain p-1"
                loading="lazy"
              />
            </button>
          );
        })}
      </div>

      {/* 페이지네이션 (2페이지 이상일 때만 표시) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer
                       ${
                         currentPage === 0
                           ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                           : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                       }`}
          >
            이전
          </button>
          <span className="text-sm text-gray-500">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer
                       ${
                         currentPage >= totalPages - 1
                           ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                           : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                       }`}
          >
            다음
          </button>
        </div>
      )}

      {/* 결과 없음 */}
      {filteredAssets.length === 0 && searchQuery && (
        <p className="text-center text-sm text-gray-400 py-4">
          검색 결과가 없습니다.
        </p>
      )}
    </div>
  );
}
