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
        Row: { id: string; school_id: string | null; role: string; full_name: string; phone_number: string; created_at: string; updated_at: string; deleted_at: string | null }
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
      academic_terms: {
        Row: { id: string; school_id: string; name: string; start_date: string; end_date: string; is_active: boolean; created_at: string }
        Insert: any
        Update: any; Relationships: any[]
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
