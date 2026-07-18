export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: { id: string; name: string; domain: string | null; curriculum_type: string; subscription_plan: string; fee_due_day: number; created_at: string; updated_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      users: {
        Row: { id: string; school_id: string | null; role: string; full_name: string; phone_number: string; email: string | null; created_at: string; updated_at: string; deleted_at: string | null; last_seen_at: string | null }
        Insert: any
        Update: any; Relationships: any[]
      }
      classes: {
        Row: { id: string; school_id: string; name: string; level: string | null; stream: string | null; class_teacher_id: string | null; created_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      students: {
        Row: { id: string; school_id: string; class_id: string | null; first_name: string; last_name: string; admission_number: string; dob: string | null; created_at: string; deleted_at: string | null }
        Insert: any
        Update: any; Relationships: any[]
      }
      subjects: {
        Row: { id: string; school_id: string; name: string; code: string | null; type: string; created_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      class_subjects: {
        Row: { id: string; school_id: string; class_id: string; subject_id: string; teacher_id: string | null; created_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      fee_structures: {
        Row: { id: string; school_id: string; term_id: string; class_id: string | null; amount: number; description: string | null; created_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      fee_payments: {
        Row: { id: string; school_id: string; student_id: string; amount: number; mpesa_receipt: string | null; payment_date: string; created_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      academic_years: {
        Row: { id: string; school_id: string; name: string; start_date: string; end_date: string; is_active: boolean; created_at: string }
        Insert: any
        Update: any; Relationships: []
      }
      academic_terms: {
        Row: { id: string; school_id: string; year_id: string | null; name: string; start_date: string; end_date: string; is_active: boolean; created_at: string }
        Insert: any
        Update: any; Relationships: [
          {
            foreignKeyName: "academic_terms_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory_ledger: {
        Row: { id: string; school_id: string; item_name: string; quantity: number; transaction_type: string; logged_by: string; created_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      library_books: {
        Row: { id: string; school_id: string; title: string; isbn: string | null; status: string; created_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      exams: {
        Row: { id: string; school_id: string; term_id: string; name: string; max_score: number; created_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      exam_results: {
        Row: { id: string; school_id: string; exam_id: string; student_id: string; subject_id: string; score: number; grade: string | null; remarks: string | null; recorded_by: string | null; created_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      attendance: {
        Row: { id: string; school_id: string; class_id: string; student_id: string; date: string; status: string; notes: string | null; recorded_by: string | null; created_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      announcements: {
        Row: { id: string; school_id: string; title: string; body: string; target_audience: string; author_id: string; created_at: string }
        Insert: any
        Update: any; 
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: { id: string; school_id: string; title: string | null; created_at: string; updated_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      conversation_participants: {
        Row: { id: string; conversation_id: string; user_id: string; last_read_at: string; joined_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      invitations: {
        Row: {
          id: string
          school_id: string
          token: string
          role: string
          target_entity_id: string | null
          target_name: string | null
          target_salutation: string | null
          target_phone: string | null
          used_at: string | null
          reset_otp: string | null
          reset_otp_expires_at: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          school_id: string
          token?: string
          role: string
          target_entity_id?: string | null
          target_name?: string | null
          target_salutation?: string | null
          target_phone?: string | null
          used_at?: string | null
          reset_otp?: string | null
          reset_otp_expires_at?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          token?: string
          role?: string
          target_entity_id?: string | null
          target_name?: string | null
          target_phone?: string | null
          used_at?: string | null
          reset_otp?: string | null
          reset_otp_expires_at?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: { id: string; conversation_id: string; sender_id: string; content: string; created_at: string }
        Insert: any
        Update: any; Relationships: any[]
      }
      [key: string]: any // Fallback for scaffolding
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
