import type { Timestamp } from "firebase/firestore";

// Firestore 문서 타입 (camelCase)
export interface FirestoreProfile {
  userId: string;
  displayName: string | null;
  role?: string; // 사용자 역할 (예: 'admin', 'user'). 없으면 기본 'user'
  createdAt: Timestamp;
}

export interface FirestoreCharacter {
  userId: string;
  face: string;
  hair: string;
  mustache: string | null;
  glasses: string | null;
  skinTone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreMoodEntry {
  userId: string;
  characterId: string;
  date: string;
  moodCategory: string;
  outfitFile: string;
  expressionFile: string;
  compositeImageUrl: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** 월별 출석 기록 (Firestore attendance/{userId}_{YYYY-MM}) */
export interface FirestoreAttendance {
  userId: string;
  yearMonth: string;             // "YYYY-MM"
  attendedDates: string[];       // ["2026-02-01", "2026-02-02", ...]
  currentStreak: number;
  maxStreak: number;
  totalDays: number;
  updatedAt: Timestamp;
}

/** 사용자 보상 기록 (Firestore rewards/{userId}) */
export interface FirestoreReward {
  userId: string;
  unlockedRewards: {
    milestone: number;           // 3, 7, 14, 30
    rewardType: "expression" | "outfit" | "outfit_set";
    rewardFiles: string[];
    unlockedAt: Timestamp;
    unlockedMonth: string;       // "YYYY-MM"
  }[];
  updatedAt: Timestamp;
}

/** 이벤트 보상 기록 (Firestore event_rewards/{userId}) */
export interface FirestoreEventReward {
  userId: string;
  cycleLength: number;
  cycleNumber: number;
  cycleStartDate: string;
  dailyClaims: {
    dayNumber: number;
    claimedDate: string;
    itemType: "body_item" | "hand_item";
    itemFile: string;
    claimedAt: Timestamp;
  }[];
  cycleCompleted: boolean;
  completionBonusClaimed: boolean;
  completedCycles: number;
  allClaimedItems: {
    itemType: "body_item" | "hand_item";
    itemFile: string;
  }[];
  updatedAt: Timestamp;
}
