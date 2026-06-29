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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          landlord_id: string
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          landlord_id: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          landlord_id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          id: string
          landlord_id: string
          sender_id: string
          receiver_id: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          landlord_id: string
          sender_id: string
          receiver_id: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          landlord_id?: string
          sender_id?: string
          receiver_id?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {

        Row: {
          amount_paid: number
          created_at: string | null
          date_paid: string
          deductions: Json | null
          id: string
          landlord_id: string
          method: string | null
          receipt_url: string | null
          refund_amount: number | null
          refund_date: string | null
          refund_method: string | null
          status: string | null
          tenant_id: string
          unit_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          date_paid: string
          deductions?: Json | null
          id?: string
          landlord_id: string
          method?: string | null
          receipt_url?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_method?: string | null
          status?: string | null
          tenant_id: string
          unit_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          date_paid?: string
          deductions?: Json | null
          id?: string
          landlord_id?: string
          method?: string | null
          receipt_url?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_method?: string | null
          status?: string | null
          tenant_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string
          expense_date: string | null
          id: string
          is_recurring: boolean | null
          landlord_id: string
          property_id: string | null
          receipt_url: string | null
          recorded_by: string | null
          recurring_frequency: string | null
          status: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description: string
          expense_date?: string | null
          id?: string
          is_recurring?: boolean | null
          landlord_id: string
          property_id?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          recurring_frequency?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string
          expense_date?: string | null
          id?: string
          is_recurring?: boolean | null
          landlord_id?: string
          property_id?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          recurring_frequency?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string | null
          expires_at: string | null
          id: string
          landlord_id: string
          name: string | null
          phone: string | null
          property_id: string | null
          property_ids: Json | null
          reset_otp: string | null
          reset_otp_expires_at: string | null
          role: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          landlord_id: string
          name?: string | null
          phone?: string | null
          property_id?: string | null
          property_ids?: Json | null
          reset_otp?: string | null
          reset_otp_expires_at?: string | null
          role: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          landlord_id?: string
          name?: string | null
          phone?: string | null
          property_id?: string | null
          property_ids?: Json | null
          reset_otp?: string | null
          reset_otp_expires_at?: string | null
          role?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          arrears: number | null
          balance: number | null
          base_rent: number
          created_at: string | null
          credits: number | null
          due_date: string | null
          id: string
          landlord_id: string
          month: number
          paid_amount: number | null
          penalties: number | null
          status: string | null
          tenant_id: string
          total_amount: number | null
          unit_id: string
          year: number
        }
        Insert: {
          arrears?: number | null
          balance?: number | null
          base_rent: number
          created_at?: string | null
          credits?: number | null
          due_date?: string | null
          id?: string
          landlord_id: string
          month: number
          paid_amount?: number | null
          penalties?: number | null
          status?: string | null
          tenant_id: string
          total_amount?: number | null
          unit_id: string
          year: number
        }
        Update: {
          arrears?: number | null
          balance?: number | null
          base_rent?: number
          created_at?: string | null
          credits?: number | null
          due_date?: string | null
          id?: string
          landlord_id?: string
          month?: number
          paid_amount?: number | null
          penalties?: number | null
          status?: string | null
          tenant_id?: string
          total_amount?: number | null
          unit_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      landlords: {
        Row: {
          country_code: string
          created_at: string | null
          currency: string
          default_grace_period_days: number | null
          default_penalty_rate: number | null
          id: string
          locale: string
          name: string
          payment_credentials_id: string | null
          payment_methods: Json | null
          rent_due_day: number | null
          settings: Json | null
          slug: string
          subscription_plan: string | null
          subscription_status: string | null
          timezone: string
          trial_ends_at: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string | null
          currency?: string
          default_grace_period_days?: number | null
          default_penalty_rate?: number | null
          id?: string
          locale?: string
          name: string
          payment_credentials_id?: string | null
          payment_methods?: Json | null
          rent_due_day?: number | null
          settings?: Json | null
          slug: string
          subscription_plan?: string | null
          subscription_status?: string | null
          timezone?: string
          trial_ends_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          currency?: string
          default_grace_period_days?: number | null
          default_penalty_rate?: number | null
          id?: string
          locale?: string
          name?: string
          payment_credentials_id?: string | null
          payment_methods?: Json | null
          rent_due_day?: number | null
          settings?: Json | null
          slug?: string
          subscription_plan?: string | null
          subscription_status?: string | null
          timezone?: string
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      leases: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          deposit_amount: number | null
          document_url: string | null
          end_date: string | null
          grace_period_days: number | null
          id: string
          landlord_id: string
          notice_period_days: number | null
          payment_due_day: number | null
          penalty_amount: number | null
          penalty_cap: number | null
          penalty_type: string | null
          rent_amount: number
          start_date: string
          status: string | null
          tenant_id: string
          unit_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          deposit_amount?: number | null
          document_url?: string | null
          end_date?: string | null
          grace_period_days?: number | null
          id?: string
          landlord_id: string
          notice_period_days?: number | null
          payment_due_day?: number | null
          penalty_amount?: number | null
          penalty_cap?: number | null
          penalty_type?: string | null
          rent_amount: number
          start_date: string
          status?: string | null
          tenant_id: string
          unit_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          deposit_amount?: number | null
          document_url?: string | null
          end_date?: string | null
          grace_period_days?: number | null
          id?: string
          landlord_id?: string
          notice_period_days?: number | null
          payment_due_day?: number | null
          penalty_amount?: number | null
          penalty_cap?: number | null
          penalty_type?: string | null
          rent_amount?: number
          start_date?: string
          status?: string | null
          tenant_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          actual_cost: number | null
          approved_by: string | null
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string
          estimated_cost: number | null
          expense_logged: boolean | null
          id: string
          labor_cost: number | null
          landlord_id: string
          materials_cost: number | null
          photos: Json | null
          property_id: string
          resolution_notes: string | null
          resolution_photos: Json | null
          status: string | null
          submitted_by: string | null
          tenant_id: string | null
          title: string | null
          unit_id: string | null
          urgency: string | null
        }
        Insert: {
          actual_cost?: number | null
          approved_by?: string | null
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          estimated_cost?: number | null
          expense_logged?: boolean | null
          id?: string
          labor_cost?: number | null
          landlord_id: string
          materials_cost?: number | null
          photos?: Json | null
          property_id: string
          resolution_notes?: string | null
          resolution_photos?: Json | null
          status?: string | null
          submitted_by?: string | null
          tenant_id?: string | null
          title?: string | null
          unit_id?: string | null
          urgency?: string | null
        }
        Update: {
          actual_cost?: number | null
          approved_by?: string | null
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          estimated_cost?: number | null
          expense_logged?: boolean | null
          id?: string
          labor_cost?: number | null
          landlord_id?: string
          materials_cost?: number | null
          photos?: Json | null
          property_id?: string
          resolution_notes?: string | null
          resolution_photos?: Json | null
          status?: string | null
          submitted_by?: string | null
          tenant_id?: string | null
          title?: string | null
          unit_id?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_transactions: {
        Row: {
          amount: number
          checkout_request_id: string | null
          created_at: string | null
          id: string
          invoice_id: string | null
          landlord_id: string
          merchant_request_id: string | null
          mpesa_receipt_number: string | null
          phone_number: string
          result_code: string | null
          result_desc: string | null
          status: string | null
          tenant_id: string
          transaction_date: string | null
        }
        Insert: {
          amount: number
          checkout_request_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          landlord_id: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone_number: string
          result_code?: string | null
          result_desc?: string | null
          status?: string | null
          tenant_id: string
          transaction_date?: string | null
        }
        Update: {
          amount?: number
          checkout_request_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          landlord_id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone_number?: string
          result_code?: string | null
          result_desc?: string | null
          status?: string | null
          tenant_id?: string
          transaction_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_transactions_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          profile_id: string
          sender_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          profile_id: string
          sender_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          profile_id?: string
          sender_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          created_at: string | null
          enabled_methods: string[] | null
          landlord_id: string
          mpesa_consumer_key: string | null
          mpesa_consumer_secret: string | null
          mpesa_env: string | null
          mpesa_passkey: string | null
          mpesa_shortcode: string | null
          pesapal_consumer_key: string | null
          pesapal_consumer_secret: string | null
          pesapal_env: string | null
          pesapal_ipn_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled_methods?: string[] | null
          landlord_id: string
          mpesa_consumer_key?: string | null
          mpesa_consumer_secret?: string | null
          mpesa_env?: string | null
          mpesa_passkey?: string | null
          mpesa_shortcode?: string | null
          pesapal_consumer_key?: string | null
          pesapal_consumer_secret?: string | null
          pesapal_env?: string | null
          pesapal_ipn_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled_methods?: string[] | null
          landlord_id?: string
          mpesa_consumer_key?: string | null
          mpesa_consumer_secret?: string | null
          mpesa_env?: string | null
          mpesa_passkey?: string | null
          mpesa_shortcode?: string | null
          pesapal_consumer_key?: string | null
          pesapal_consumer_secret?: string | null
          pesapal_env?: string | null
          pesapal_ipn_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_settings_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: true
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string | null
          landlord_id: string
          method: string | null
          notes: string | null
          payment_date: string | null
          receipt_no: string | null
          receipt_url: string | null
          recorded_by: string | null
          reference: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          landlord_id: string
          method?: string | null
          notes?: string | null
          payment_date?: string | null
          receipt_no?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          reference?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          landlord_id?: string
          method?: string | null
          notes?: string | null
          payment_date?: string | null
          receipt_no?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          reference?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pesapal_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          invoice_id: string | null
          landlord_id: string
          merchant_reference: string
          order_tracking_id: string | null
          payment_method: string | null
          payment_status_description: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          landlord_id: string
          merchant_reference: string
          order_tracking_id?: string | null
          payment_method?: string | null
          payment_status_description?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          landlord_id?: string
          merchant_reference?: string
          order_tracking_id?: string | null
          payment_method?: string | null
          payment_status_description?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pesapal_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pesapal_transactions_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pesapal_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string | null
          email: string
          granted_by: string | null
          id: string
          is_root: boolean
        }
        Insert: {
          created_at?: string | null
          email: string
          granted_by?: string | null
          id: string
          is_root?: boolean
        }
        Update: {
          created_at?: string | null
          email?: string
          granted_by?: string | null
          id?: string
          is_root?: boolean
        }
        Relationships: []
      }
      platform_transactions: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          currency: string | null
          id: string
          landlord_id: string
          mpesa_receipt_number: string | null
          notes: string | null
          payment_method: string | null
          period_end: string | null
          period_months: number | null
          period_start: string | null
          status: string | null
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          landlord_id: string
          mpesa_receipt_number?: string | null
          notes?: string | null
          payment_method?: string | null
          period_end?: string | null
          period_months?: number | null
          period_start?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          landlord_id?: string
          mpesa_receipt_number?: string | null
          notes?: string | null
          payment_method?: string | null
          period_end?: string | null
          period_months?: number | null
          period_start?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_transactions_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_transactions_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          landlord_id: string | null
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          landlord_id?: string | null
          phone?: string | null
          role: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          landlord_id?: string | null
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          amenities: Json | null
          caretaker_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          landlord_id: string
          location_lat: number | null
          location_lng: number | null
          manager_id: string | null
          name: string
          photos: Json | null
          type: string | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          caretaker_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          landlord_id: string
          location_lat?: number | null
          location_lng?: number | null
          manager_id?: string | null
          name: string
          photos?: Json | null
          type?: string | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          caretaker_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          landlord_id?: string
          location_lat?: number | null
          location_lng?: number | null
          manager_id?: string | null
          name?: string
          photos?: Json | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_caretaker_id_fkey"
            columns: ["caretaker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          profile_id: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          profile_id: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          profile_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          landlord_id: string
          name: string
          phone: string
          specialty: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          landlord_id: string
          name: string
          phone: string
          specialty?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          landlord_id?: string
          name?: string
          phone?: string
          specialty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technicians_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          id: string
          id_number: string | null
          landlord_id: string
          move_in_date: string | null
          move_out_date: string | null
          notice_date: string | null
          phone: string
          photo_url: string | null
          profile_id: string | null
          status: string | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          landlord_id: string
          move_in_date?: string | null
          move_out_date?: string | null
          notice_date?: string | null
          phone: string
          photo_url?: string | null
          profile_id?: string | null
          status?: string | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          landlord_id?: string
          move_in_date?: string | null
          move_out_date?: string | null
          notice_date?: string | null
          phone?: string
          photo_url?: string | null
          profile_id?: string | null
          status?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          deleted_at: string | null
          deposit_amount: number | null
          floor: number | null
          id: string
          landlord_id: string
          property_id: string
          rent_amount: number
          status: string | null
          type: string | null
          unit_number: string
          vacant_since: string | null
        }
        Insert: {
          deleted_at?: string | null
          deposit_amount?: number | null
          floor?: number | null
          id?: string
          landlord_id: string
          property_id: string
          rent_amount: number
          status?: string | null
          type?: string | null
          unit_number: string
          vacant_since?: string | null
        }
        Update: {
          deleted_at?: string | null
          deposit_amount?: number | null
          floor?: number | null
          id?: string
          landlord_id?: string
          property_id?: string
          rent_amount?: number
          status?: string | null
          type?: string | null
          unit_number?: string
          vacant_since?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_platform_owner: {
        Args: { p_email: string }
        Returns: undefined
      }
      get_my_landlord_id: { Args: never; Returns: string }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
