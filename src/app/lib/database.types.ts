/**
 * Supabase 데이터베이스 타입 정의
 * profiles, characters, mood_entries 테이블의 Row/Insert/Update 타입을 포함한다.
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      characters: {
        Row: {
          id: string;
          user_id: string;
          face: string;
          hair: string;
          mustache: string | null;
          glasses: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          face: string;
          hair: string;
          mustache?: string | null;
          glasses?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          face?: string;
          hair?: string;
          mustache?: string | null;
          glasses?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mood_entries: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          date: string;
          mood_category: string;
          outfit_file: string;
          expression_file: string;
          composite_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_id: string;
          date: string;
          mood_category: string;
          outfit_file: string;
          expression_file: string;
          composite_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          character_id?: string;
          date?: string;
          mood_category?: string;
          outfit_file?: string;
          expression_file?: string;
          composite_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
