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
  public: {
    Tables: {
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
  public: {
    Enums: {},
  },
} as const
