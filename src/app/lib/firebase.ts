// Firebase 앱 초기화 - 클라이언트 전용
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 환경변수 누락 확인
if (!firebaseConfig.apiKey) {
  console.error(
    "[Firebase 초기화 오류] NEXT_PUBLIC_FIREBASE_API_KEY 환경변수가 설정되지 않았습니다."
  );
}
if (!firebaseConfig.projectId) {
  console.error(
    "[Firebase 초기화 오류] NEXT_PUBLIC_FIREBASE_PROJECT_ID 환경변수가 설정되지 않았습니다."
  );
}

// 중복 초기화 방지
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
