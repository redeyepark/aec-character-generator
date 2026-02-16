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
