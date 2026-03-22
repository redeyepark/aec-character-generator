"use client";

/**
 * 아이템 인벤토리(옷장) 페이지
 * 보유 아이템을 카테고리별로 조회한다.
 * 의상, 착용 소품, 손 아이템 3개 탭으로 구성된다.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import AuthGuard from "@/app/components/AuthGuard";
import { useRewards } from "@/app/hooks/useRewards";
import { useDailyReward } from "@/app/hooks/useDailyReward";
import NavBar from "@/app/components/NavBar";
import InventoryGrid from "@/app/components/InventoryGrid";
import type { InventoryItem } from "@/app/components/InventoryGrid";
import {
  getBodyAssets,
  getBodySvgAssets,
  getBodyItemAssets,
  getHandItemAssets,
  getUnlockedBodyItemAssets,
  getUnlockedHandItemAssets,
  getAssetPath,
} from "@/app/lib/assetManager";
import { OUTFIT_CATEGORIES } from "@/app/lib/types";
import type { OutfitCategory } from "@/app/lib/types";

// 탭 정의
type TabId = "body" | "body_item" | "hand_item";

interface TabConfig {
  id: TabId;
  label: string;
}

const TABS: TabConfig[] = [
  { id: "body", label: "의상" },
  { id: "body_item", label: "착용 소품" },
  { id: "hand_item", label: "손 아이템" },
];

// 의상 탭 서브 필터 정의
const OUTFIT_SUB_FILTERS = [
  { id: "all", label: "전체" },
  { id: "casual", label: "캐주얼" },
  { id: "formal", label: "포멀" },
  { id: "sporty", label: "스포티" },
  { id: "outerwear", label: "아우터" },
  { id: "bowtie", label: "보타이" },
  { id: "svg", label: "SVG" },
];

function InventoryPageContent() {
  const { user } = useAuth();
  const { fetchRewards, getUnlockedItemCounts, loading: rewardsLoading } = useRewards();
  const { fetchEventReward, getDailyRewardItems, loading: dailyLoading } = useDailyReward();

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabId>("body");
  // 의상 서브 필터
  const [outfitSubFilter, setOutfitSubFilter] = useState("all");
  // 정렬 기준
  const [sortBy, setSortBy] = useState<"name" | "source">("name");
  // 데이터 로딩 완료 여부
  const [dataLoaded, setDataLoaded] = useState(false);

  // 마운트 시 데이터 로드
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      await Promise.all([fetchRewards(), fetchEventReward()]);
      setDataLoaded(true);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 의상 탭 아이템 목록 (PNG + SVG, 모두 해금 상태)
  const bodyItems: InventoryItem[] = useMemo(() => {
    if (!dataLoaded) return [];

    const items: InventoryItem[] = [];

    // SVG 필터가 아닌 경우: PNG 의상
    if (outfitSubFilter !== "svg") {
      // 특정 카테고리 또는 전체
      const categories: OutfitCategory[] =
        outfitSubFilter === "all"
          ? OUTFIT_CATEGORIES.filter((c) => c.id !== "all").map((c) => c.id)
          : [outfitSubFilter as OutfitCategory];

      for (const category of categories) {
        const files = getBodyAssets(category);
        for (const filename of files) {
          // 중복 방지 (all 카테고리에 다른 카테고리 파일이 포함될 수 있음)
          if (!items.some((item) => item.filename === filename)) {
            items.push({
              filename,
              assetPath: getAssetPath("body", filename),
              unlocked: true,
              source: "default",
              category,
            });
          }
        }
      }
    }

    // 전체 또는 SVG 필터: SVG 의상
    if (outfitSubFilter === "all" || outfitSubFilter === "svg") {
      const svgFiles = getBodySvgAssets();
      for (const filename of svgFiles) {
        items.push({
          filename,
          assetPath: getAssetPath("body", filename),
          unlocked: true,
          source: "default",
          isSvg: true,
        });
      }
    }

    return items;
  }, [dataLoaded, outfitSubFilter]);

  // 착용 소품 탭 아이템 목록
  const bodyItemItems: InventoryItem[] = useMemo(() => {
    if (!dataLoaded) return [];

    const { bodyItemCount } = getUnlockedItemCounts();
    const tierItems = getUnlockedBodyItemAssets(bodyItemCount);
    const dailyItems = getDailyRewardItems("body_item");
    // 해금된 아이템 합산 (중복 제거)
    const unlockedSet = new Set([...tierItems, ...dailyItems]);
    // 전체 아이템 목록
    const allItems = getBodyItemAssets();

    return allItems.map((filename) => {
      const inTier = tierItems.includes(filename);
      const inDaily = dailyItems.includes(filename);
      const unlocked = unlockedSet.has(filename);

      // 획득 경로 결정
      let source: InventoryItem["source"];
      if (inTier) {
        source = "attendance"; // 출석 보상 우선
      } else if (inDaily) {
        source = "daily";
      } else {
        source = "locked";
      }

      return {
        filename,
        assetPath: getAssetPath("bodyItem", filename),
        unlocked,
        source,
      };
    });
  }, [dataLoaded, getUnlockedItemCounts, getDailyRewardItems]);

  // 손 아이템 탭 아이템 목록
  const handItemItems: InventoryItem[] = useMemo(() => {
    if (!dataLoaded) return [];

    const { handItemCount } = getUnlockedItemCounts();
    const tierItems = getUnlockedHandItemAssets(handItemCount);
    const dailyItems = getDailyRewardItems("hand_item");
    // 해금된 아이템 합산 (중복 제거)
    const unlockedSet = new Set([...tierItems, ...dailyItems]);
    // 전체 아이템 목록
    const allItems = getHandItemAssets();

    return allItems.map((filename) => {
      const inTier = tierItems.includes(filename);
      const inDaily = dailyItems.includes(filename);
      const unlocked = unlockedSet.has(filename);

      // 획득 경로 결정
      let source: InventoryItem["source"];
      if (inTier) {
        source = "attendance"; // 출석 보상 우선
      } else if (inDaily) {
        source = "daily";
      } else {
        source = "locked";
      }

      return {
        filename,
        assetPath: getAssetPath("handItem", filename),
        unlocked,
        source,
      };
    });
  }, [dataLoaded, getUnlockedItemCounts, getDailyRewardItems]);

  // 현재 탭에 맞는 아이템 목록 선택
  const currentItems = useMemo(() => {
    switch (activeTab) {
      case "body":
        return bodyItems;
      case "body_item":
        return bodyItemItems;
      case "hand_item":
        return handItemItems;
    }
  }, [activeTab, bodyItems, bodyItemItems, handItemItems]);

  // 총 아이템 수 (의상 탭은 전체 기준, 나머지는 전체 에셋 수)
  const totalCount = useMemo(() => {
    switch (activeTab) {
      case "body":
        return currentItems.length; // 의상은 모두 해금이므로 전체 = 보유
      case "body_item":
        return getBodyItemAssets().length;
      case "hand_item":
        return getHandItemAssets().length;
    }
  }, [activeTab, currentItems]);

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((sort: "name" | "source") => {
    setSortBy(sort);
  }, []);

  // 서브 필터 변경 핸들러
  const handleSubFilterChange = useCallback((id: string) => {
    setOutfitSubFilter(id);
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    // 탭 변경 시 정렬 초기화
    setSortBy("name");
  }, []);

  const isLoading = !dataLoaded || rewardsLoading || dailyLoading;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* 페이지 제목 */}
        <h1 className="text-xl font-bold text-gray-800 mb-4">옷장</h1>

        {/* 탭 바 */}
        <div className="flex border-b border-gray-200 mb-6" role="tablist" aria-label="인벤토리 카테고리">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer
                  border-b-2 -mb-px
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset
                  ${
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 탭 패널 */}
        <div
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-label={TABS.find((t) => t.id === activeTab)?.label}
        >
          <InventoryGrid
            items={currentItems}
            totalCount={totalCount}
            itemType={activeTab}
            subFilters={activeTab === "body" ? OUTFIT_SUB_FILTERS : undefined}
            activeSubFilter={activeTab === "body" ? outfitSubFilter : undefined}
            onSubFilterChange={activeTab === "body" ? handleSubFilterChange : undefined}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            loading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}

// AuthGuard로 래핑
export default function InventoryPage() {
  return (
    <AuthGuard>
      <InventoryPageContent />
    </AuthGuard>
  );
}
