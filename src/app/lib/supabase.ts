/**
 * Supabase 클라이언트 초기화
 * 환경변수에서 URL과 익명 키를 읽어 클라이언트를 생성한다.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error(
    '[Supabase 초기화 오류] NEXT_PUBLIC_SUPABASE_URL 환경변수가 설정되지 않았습니다. ' +
    '.env.local 파일을 확인하세요.'
  );
}

if (!supabaseAnonKey) {
  console.error(
    '[Supabase 초기화 오류] NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다. ' +
    '.env.local 파일을 확인하세요.'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
