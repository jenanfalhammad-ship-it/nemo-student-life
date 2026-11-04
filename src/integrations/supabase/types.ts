export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      countdowns: {
        Row: {
          category: string
          color: string
          course_id: string | null
          created_at: string
          id: string
          target_at: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          color?: string
          course_id?: string | null
          created_at?: string
          id?: string
          target_at: string
          title: string
          user_id?: string
        }
        Update: {
          category?: string
          color?: string
          course_id?: string | null
          created_at?: string
          id?: string
          target_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "countdowns_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_files: {
        Row: {
          course_id: string
          created_at: string
          id: string
          mime: string | null
          name: string
          path: string
          size: number | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          mime?: string | null
          name: string
          path: string
          size?: number | null
          user_id?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          mime?: string | null
          name?: string
          path?: string
          size?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_files_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_notes: {
        Row: {
          content: string
          course_id: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          course_id: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string
          course_id?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          archived: boolean
          code: string | null
          color: string
          created_at: string
          description: string | null
          id: string
          instructor: string | null
          name: string
          semester: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          code?: string | null
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          instructor?: string | null
          name: string
          semester?: string | null
          user_id?: string
        }
        Update: {
          archived?: boolean
          code?: string | null
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          instructor?: string | null
          name?: string
          semester?: string | null
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          ends_at: string
          id: string
          kind: string
          link: string | null
          location: string | null
          recurrence: string
          starts_at: string
          title: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          kind?: string
          link?: string | null
          location?: string | null
          recurrence?: string
          starts_at: string
          title: string
          user_id?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          kind?: string
          link?: string | null
          location?: string | null
          recurrence?: string
          starts_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_decks: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_decks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          difficulty: number
          due_at: string
          front: string
          id: string
          reps: number
          stability: number
          state: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          difficulty?: number
          due_at?: string
          front: string
          id?: string
          reps?: number
          stability?: number
          state?: string
          user_id?: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          difficulty?: number
          due_at?: string
          front?: string
          id?: string
          reps?: number
          stability?: number
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          actual_minutes: number
          completed: boolean
          course_id: string | null
          ended_at: string
          id: string
          mode: string
          pearls: number
          planned_minutes: number
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          actual_minutes: number
          completed?: boolean
          course_id?: string | null
          ended_at?: string
          id?: string
          mode?: string
          pearls?: number
          planned_minutes: number
          started_at: string
          task_id?: string | null
          user_id?: string
        }
        Update: {
          actual_minutes?: number
          completed?: boolean
          course_id?: string | null
          ended_at?: string
          id?: string
          mode?: string
          pearls?: number
          planned_minutes?: number
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          course_count: number | null
          created_at: string
          daily_focus_goal: number
          display_name: string | null
          id: string
          language: string
          major: string | null
          onboarded: boolean
          semester: string | null
          session_minutes: number
          show_quran: boolean
          study_goal: string | null
          theme: string
          time_format: string
          university: string | null
          updated_at: string
          week_start: number
        }
        Insert: {
          course_count?: number | null
          created_at?: string
          daily_focus_goal?: number
          display_name?: string | null
          id: string
          language?: string
          major?: string | null
          onboarded?: boolean
          semester?: string | null
          session_minutes?: number
          show_quran?: boolean
          study_goal?: string | null
          theme?: string
          time_format?: string
          university?: string | null
          updated_at?: string
          week_start?: number
        }
        Update: {
          course_count?: number | null
          created_at?: string
          daily_focus_goal?: number
          display_name?: string | null
          id?: string
          language?: string
          major?: string | null
          onboarded?: boolean
          semester?: string | null
          session_minutes?: number
          show_quran?: boolean
          study_goal?: string | null
          theme?: string
          time_format?: string
          university?: string | null
          updated_at?: string
          week_start?: number
        }
        Relationships: []
      }
      reminders: {
        Row: {
          category: string
          created_at: string
          description: string | null
          done: boolean
          id: string
          priority: string
          remind_at: string
          repeat: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          done?: boolean
          id?: string
          priority?: string
          remind_at: string
          repeat?: string
          title: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          done?: boolean
          id?: string
          priority?: string
          remind_at?: string
          repeat?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      room_members: {
        Row: {
          display_name: string | null
          joined_at: string
          room_id: string
          status: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          joined_at?: string
          room_id: string
          status?: string
          user_id?: string
        }
        Update: {
          display_name?: string | null
          joined_at?: string
          room_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_rooms: {
        Row: {
          code: string
          created_at: string
          goal: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          code?: string
          created_at?: string
          goal?: string | null
          id?: string
          name: string
          owner_id?: string
        }
        Update: {
          code?: string
          created_at?: string
          goal?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string
          completed_at: string | null
          course_id: string | null
          created_at: string
          description: string | null
          due_at: string | null
          estimated_minutes: number | null
          id: string
          priority: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          estimated_minutes?: number | null
          id?: string
          priority?: string
          status?: string
          title: string
          user_id?: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          estimated_minutes?: number | null
          id?: string
          priority?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_animals: {
        Row: {
          animal_key: string
          discovered_at: string
          id: string
          nickname: string | null
          user_id: string
        }
        Insert: {
          animal_key: string
          discovered_at?: string
          id?: string
          nickname?: string | null
          user_id?: string
        }
        Update: {
          animal_key?: string
          discovered_at?: string
          id?: string
          nickname?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_room_member: { Args: { _room: string }; Returns: boolean }
      join_room_by_code: {
        Args: { _code: string; _name: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
