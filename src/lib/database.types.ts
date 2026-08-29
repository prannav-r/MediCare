// ============================================================
// src/lib/database.types.ts
// TypeScript representation of our Supabase PostgreSQL schema (MVP 3).
// Formatted for @supabase/supabase-js v2.x
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      medicines: {
        Row: {
          id: string
          medicine_name: string
          generic_name: string | null
          brand_name: string | null
          strength: string | null
          dosage_form: string | null
          manufacturer: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          medicine_name: string
          generic_name?: string | null
          brand_name?: string | null
          strength?: string | null
          dosage_form?: string | null
          manufacturer?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          medicine_name?: string
          generic_name?: string | null
          brand_name?: string | null
          strength?: string | null
          dosage_form?: string | null
          manufacturer?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          id: string
          user_id: string
          title: string
          doctor_name: string | null
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          doctor_name?: string | null
          start_date: string
          end_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          doctor_name?: string | null
          start_date?: string
          end_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          id: string
          prescription_id: string
          medicine_id: string
          morning: boolean
          afternoon: boolean
          evening: boolean
          total_required_doses: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          prescription_id: string
          medicine_id: string
          morning?: boolean
          afternoon?: boolean
          evening?: boolean
          total_required_doses?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          prescription_id?: string
          medicine_id?: string
          morning?: boolean
          afternoon?: boolean
          evening?: boolean
          total_required_doses?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          }
        ]
      }
      medicine_inventory: {
        Row: {
          id: string
          user_id: string
          medicine_id: string
          current_doses: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          medicine_id: string
          current_doses?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          medicine_id?: string
          current_doses?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_inventory_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          }
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
