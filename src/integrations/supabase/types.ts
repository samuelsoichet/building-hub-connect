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
  public: {
    Tables: {
      notifications: {
        Row: {
          created_at: string
          email_sent: boolean
          email_sent_at: string | null
          id: string
          message: string | null
          read: boolean
          read_at: string | null
          related_id: string | null
          related_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          message?: string | null
          read?: boolean
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          message?: string | null
          read?: boolean
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          suite_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          suite_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          suite_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          name: string
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      tenant_balances: {
        Row: {
          created_at: string
          current_balance: number
          id: string
          last_payment_date: string | null
          next_payment_due: string | null
          rent_amount: number
          suite_number: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          id?: string
          last_payment_date?: string | null
          next_payment_due?: string | null
          rent_amount?: number
          suite_number?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          id?: string
          last_payment_date?: string | null
          next_payment_due?: string | null
          rent_amount?: number
          suite_number?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          floor: number | null
          id: string
          property_id: string | null
          rent_amount: number | null
          square_feet: number | null
          tenant_id: string | null
          unit_number: string
          updated_at: string
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          floor?: number | null
          id?: string
          property_id?: string | null
          rent_amount?: number | null
          square_feet?: number | null
          tenant_id?: string | null
          unit_number: string
          updated_at?: string
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          floor?: number | null
          id?: string
          property_id?: string | null
          rent_amount?: number | null
          square_feet?: number | null
          tenant_id?: string | null
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      work_order_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          is_internal: boolean
          user_id: string
          work_order_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          is_internal?: boolean
          user_id: string
          work_order_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          user_id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_comments_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_history: {
        Row: {
          changed_at: string
          changed_by: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          work_order_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          work_order_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          photo_type: string | null
          photo_url: string
          uploaded_by: string | null
          work_order_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_type?: string | null
          photo_url: string
          uploaded_by?: string | null
          work_order_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_type?: string | null
          photo_url?: string
          uploaded_by?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_photos_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          priority: Database["public"]["Enums"]["work_order_priority"]
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          signed_off_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["work_order_status"]
          tenant_feedback: string | null
          tenant_id: string
          tenant_rating: number | null
          tenant_signature: string | null
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          priority?: Database["public"]["Enums"]["work_order_priority"]
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          signed_off_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          tenant_feedback?: string | null
          tenant_id: string
          tenant_rating?: number | null
          tenant_signature?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          priority?: Database["public"]["Enums"]["work_order_priority"]
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          signed_off_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          tenant_feedback?: string | null
          tenant_id?: string
          tenant_rating?: number | null
          tenant_signature?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_tenant_to_unit: {
        Args: { unit_num: string; user_email: string }
        Returns: undefined
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: { user_uuid: string }; Returns: boolean }
      is_maintenance: { Args: { user_uuid: string }; Returns: boolean }
      is_staff: { Args: { user_uuid: string }; Returns: boolean }
      make_user_admin: { Args: { user_email: string }; Returns: undefined }
      make_user_maintenance: {
        Args: { user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      notification_type:
        | "work_order_created"
        | "work_order_approved"
        | "work_order_rejected"
        | "work_order_in_progress"
        | "work_order_completed"
        | "work_order_signed_off"
        | "payment_received"
        | "payment_due"
        | "general"
      payment_status: "pending" | "paid" | "failed" | "refunded" | "cancelled"
      user_role: "admin" | "tenant" | "maintenance"
      work_order_priority: "low" | "medium" | "high" | "emergency"
      work_order_status:
        | "pending"
        | "approved"
        | "in_progress"
        | "completed"
        | "signed_off"
        | "rejected"
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
    Enums: {
      notification_type: [
        "work_order_created",
        "work_order_approved",
        "work_order_rejected",
        "work_order_in_progress",
        "work_order_completed",
        "work_order_signed_off",
        "payment_received",
        "payment_due",
        "general",
      ],
      payment_status: ["pending", "paid", "failed", "refunded", "cancelled"],
      user_role: ["admin", "tenant", "maintenance"],
      work_order_priority: ["low", "medium", "high", "emergency"],
      work_order_status: [
        "pending",
        "approved",
        "in_progress",
        "completed",
        "signed_off",
        "rejected",
      ],
    },
  },
} as const
