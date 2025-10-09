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
    PostgrestVersion: "13.0.5"
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
      ai_metrics: {
        Row: {
          client_id: string
          cost_usd: number | null
          created_at: string | null
          error: string | null
          guardrail_triggered: boolean | null
          guardrail_type: string | null
          id: string
          latency_ms: number | null
          question_length: number | null
          request_id: string
          response_length: number | null
          time_to_first_token: number | null
          tokens_used: number | null
          tool_calls_count: number | null
          user_id: string
        }
        Insert: {
          client_id: string
          cost_usd?: number | null
          created_at?: string | null
          error?: string | null
          guardrail_triggered?: boolean | null
          guardrail_type?: string | null
          id?: string
          latency_ms?: number | null
          question_length?: number | null
          request_id: string
          response_length?: number | null
          time_to_first_token?: number | null
          tokens_used?: number | null
          tool_calls_count?: number | null
          user_id: string
        }
        Update: {
          client_id?: string
          cost_usd?: number | null
          created_at?: string | null
          error?: string | null
          guardrail_triggered?: boolean | null
          guardrail_type?: string | null
          id?: string
          latency_ms?: number | null
          question_length?: number | null
          request_id?: string
          response_length?: number | null
          time_to_first_token?: number | null
          tokens_used?: number | null
          tool_calls_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          account_id: string
          account_type: string | null
          amount: number
          balance: number | null
          bank_code: string | null
          branch_code: string | null
          check_number: string | null
          client_id: string
          created_at: string | null
          description: string
          document_id: string
          fit_id: string | null
          id: string
          memo: string | null
          payee: string | null
          post_date: string | null
          reconciled: boolean | null
          reconciled_at: string | null
          transaction_date: string
          transaction_id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          account_type?: string | null
          amount: number
          balance?: number | null
          bank_code?: string | null
          branch_code?: string | null
          check_number?: string | null
          client_id: string
          created_at?: string | null
          description: string
          document_id: string
          fit_id?: string | null
          id?: string
          memo?: string | null
          payee?: string | null
          post_date?: string | null
          reconciled?: boolean | null
          reconciled_at?: string | null
          transaction_date: string
          transaction_id: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          account_type?: string | null
          amount?: number
          balance?: number | null
          bank_code?: string | null
          branch_code?: string | null
          check_number?: string | null
          client_id?: string
          created_at?: string | null
          description?: string
          document_id?: string
          fit_id?: string | null
          id?: string
          memo?: string | null
          payee?: string | null
          post_date?: string | null
          reconciled?: boolean | null
          reconciled_at?: string | null
          transaction_date?: string
          transaction_id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          cnpj: string
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          cnpj: string
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          cnpj?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          client_id: string
          created_at: string | null
          error_message: string | null
          file_size: number
          filename: string
          id: string
          metadata: Json | null
          mime_type: string
          processed_at: string | null
          status: string
          storage_path: string
          type: string
          updated_at: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          error_message?: string | null
          file_size: number
          filename: string
          id?: string
          metadata?: Json | null
          mime_type: string
          processed_at?: string | null
          status?: string
          storage_path: string
          type: string
          updated_at?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          error_message?: string | null
          file_size?: number
          filename?: string
          id?: string
          metadata?: Json | null
          mime_type?: string
          processed_at?: string | null
          status?: string
          storage_path?: string
          type?: string
          updated_at?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          cest: string | null
          cfop: string | null
          cofins_amount: number | null
          cofins_rate: number | null
          created_at: string | null
          discount: number | null
          icms_amount: number | null
          icms_base: number | null
          icms_rate: number | null
          id: string
          invoice_id: string
          ipi_amount: number | null
          ipi_rate: number | null
          item_number: number
          ncm: string | null
          pis_amount: number | null
          pis_rate: number | null
          product_code: string | null
          product_description: string
          quantity: number
          total_price: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          cest?: string | null
          cfop?: string | null
          cofins_amount?: number | null
          cofins_rate?: number | null
          created_at?: string | null
          discount?: number | null
          icms_amount?: number | null
          icms_base?: number | null
          icms_rate?: number | null
          id?: string
          invoice_id: string
          ipi_amount?: number | null
          ipi_rate?: number | null
          item_number: number
          ncm?: string | null
          pis_amount?: number | null
          pis_rate?: number | null
          product_code?: string | null
          product_description: string
          quantity: number
          total_price: number
          unit?: string | null
          unit_price: number
        }
        Update: {
          cest?: string | null
          cfop?: string | null
          cofins_amount?: number | null
          cofins_rate?: number | null
          created_at?: string | null
          discount?: number | null
          icms_amount?: number | null
          icms_base?: number | null
          icms_rate?: number | null
          id?: string
          invoice_id?: string
          ipi_amount?: number | null
          ipi_rate?: number | null
          item_number?: number
          ncm?: string | null
          pis_amount?: number | null
          pis_rate?: number | null
          product_code?: string | null
          product_description?: string
          quantity?: number
          total_price?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          cfop: string | null
          client_id: string
          cofins_amount: number | null
          created_at: string | null
          customer_city: string | null
          customer_cnpj: string | null
          customer_cpf: string | null
          customer_name: string | null
          customer_state: string | null
          discount_amount: number | null
          document_id: string
          freight_amount: number | null
          icms_amount: number | null
          icms_base: number | null
          icms_st_amount: number | null
          id: string
          insurance_amount: number | null
          invoice_number: string
          ipi_amount: number | null
          iss_amount: number | null
          issue_date: string
          net_amount: number
          notes: string | null
          operation_date: string | null
          operation_nature: string | null
          other_expenses: number | null
          pis_amount: number | null
          series: string | null
          status: string
          supplier_city: string | null
          supplier_cnpj: string | null
          supplier_cpf: string | null
          supplier_name: string
          supplier_state: string | null
          total_amount: number
          type: string
          updated_at: string | null
          user_id: string
          xml_key: string | null
        }
        Insert: {
          cfop?: string | null
          client_id: string
          cofins_amount?: number | null
          created_at?: string | null
          customer_city?: string | null
          customer_cnpj?: string | null
          customer_cpf?: string | null
          customer_name?: string | null
          customer_state?: string | null
          discount_amount?: number | null
          document_id: string
          freight_amount?: number | null
          icms_amount?: number | null
          icms_base?: number | null
          icms_st_amount?: number | null
          id?: string
          insurance_amount?: number | null
          invoice_number: string
          ipi_amount?: number | null
          iss_amount?: number | null
          issue_date: string
          net_amount: number
          notes?: string | null
          operation_date?: string | null
          operation_nature?: string | null
          other_expenses?: number | null
          pis_amount?: number | null
          series?: string | null
          status?: string
          supplier_city?: string | null
          supplier_cnpj?: string | null
          supplier_cpf?: string | null
          supplier_name: string
          supplier_state?: string | null
          total_amount: number
          type: string
          updated_at?: string | null
          user_id: string
          xml_key?: string | null
        }
        Update: {
          cfop?: string | null
          client_id?: string
          cofins_amount?: number | null
          created_at?: string | null
          customer_city?: string | null
          customer_cnpj?: string | null
          customer_cpf?: string | null
          customer_name?: string | null
          customer_state?: string | null
          discount_amount?: number | null
          document_id?: string
          freight_amount?: number | null
          icms_amount?: number | null
          icms_base?: number | null
          icms_st_amount?: number | null
          id?: string
          insurance_amount?: number | null
          invoice_number?: string
          ipi_amount?: number | null
          iss_amount?: number | null
          issue_date?: string
          net_amount?: number
          notes?: string | null
          operation_date?: string | null
          operation_nature?: string | null
          other_expenses?: number | null
          pis_amount?: number | null
          series?: string | null
          status?: string
          supplier_city?: string | null
          supplier_cnpj?: string | null
          supplier_cpf?: string | null
          supplier_name?: string
          supplier_state?: string | null
          total_amount?: number
          type?: string
          updated_at?: string | null
          user_id?: string
          xml_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          client_id: string
          created_at: string | null
          employee_code: string | null
          employee_name: string | null
          fgts: number | null
          gross_salary: number
          id: string
          inss_employee: number | null
          inss_employer: number | null
          irrf: number | null
          net_salary: number
          other_discounts: number | null
          payroll_summary_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          employee_code?: string | null
          employee_name?: string | null
          fgts?: number | null
          gross_salary: number
          id?: string
          inss_employee?: number | null
          inss_employer?: number | null
          irrf?: number | null
          net_salary: number
          other_discounts?: number | null
          payroll_summary_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          employee_code?: string | null
          employee_name?: string | null
          fgts?: number | null
          gross_salary?: number
          id?: string
          inss_employee?: number | null
          inss_employer?: number | null
          irrf?: number | null
          net_salary?: number
          other_discounts?: number | null
          payroll_summary_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_payroll_summary_id_fkey"
            columns: ["payroll_summary_id"]
            isOneToOne: false
            referencedRelation: "payroll_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_summaries: {
        Row: {
          client_id: string
          created_at: string | null
          document_id: string
          fgts_enabled: boolean | null
          id: string
          inss_employer_enabled: boolean | null
          reference_month: number
          reference_year: number
          total_employees: number
          total_fgts: number | null
          total_gross_salary: number
          total_inss_employee: number | null
          total_inss_employer: number | null
          total_irrf: number | null
          total_net_salary: number
          total_other_discounts: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          document_id: string
          fgts_enabled?: boolean | null
          id?: string
          inss_employer_enabled?: boolean | null
          reference_month: number
          reference_year: number
          total_employees: number
          total_fgts?: number | null
          total_gross_salary: number
          total_inss_employee?: number | null
          total_inss_employer?: number | null
          total_irrf?: number | null
          total_net_salary: number
          total_other_discounts?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          document_id?: string
          fgts_enabled?: boolean | null
          id?: string
          inss_employer_enabled?: boolean | null
          reference_month?: number
          reference_year?: number
          total_employees?: number
          total_fgts?: number | null
          total_gross_salary?: number
          total_inss_employee?: number | null
          total_inss_employer?: number | null
          total_irrf?: number | null
          total_net_salary?: number
          total_other_discounts?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_summaries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_summaries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_metrics_by_client: {
        Row: {
          avg_latency_ms: number | null
          avg_ttft_ms: number | null
          client_id: string | null
          error_count: number | null
          guardrail_triggers: number | null
          total_cost_usd: number | null
          total_requests: number | null
          total_tokens: number | null
          total_tool_calls: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_metrics_by_user: {
        Row: {
          avg_latency_ms: number | null
          avg_ttft_ms: number | null
          error_count: number | null
          guardrail_triggers: number | null
          total_cost_usd: number | null
          total_requests: number | null
          total_tokens: number | null
          total_tool_calls: number | null
          user_id: string | null
        }
        Relationships: []
      }
      ai_metrics_daily: {
        Row: {
          avg_latency_ms: number | null
          avg_ttft_ms: number | null
          date: string | null
          error_count: number | null
          guardrail_triggers: number | null
          p95_latency_ms: number | null
          p95_ttft_ms: number | null
          total_cost_usd: number | null
          total_requests: number | null
          total_tokens: number | null
        }
        Relationships: []
      }
      payroll_averages: {
        Row: {
          avg_employees: number | null
          avg_gross_salary: number | null
          avg_net_salary: number | null
          avg_salary_per_employee: number | null
          client_id: string | null
          months_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_summaries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_evolution: {
        Row: {
          client_id: string | null
          encargos_percentage: number | null
          reference_month: number | null
          reference_year: number | null
          total_employees: number | null
          total_encargos: number | null
          total_gross_salary: number | null
          total_net_salary: number | null
        }
        Insert: {
          client_id?: string | null
          encargos_percentage?: never
          reference_month?: number | null
          reference_year?: number | null
          total_employees?: number | null
          total_encargos?: never
          total_gross_salary?: number | null
          total_net_salary?: number | null
        }
        Update: {
          client_id?: string | null
          encargos_percentage?: never
          reference_month?: number | null
          reference_year?: number | null
          total_employees?: number | null
          total_encargos?: never
          total_gross_salary?: number | null
          total_net_salary?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_summaries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_old_metrics: {
        Args: Record<PropertyKey, never>
        Returns: number
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
