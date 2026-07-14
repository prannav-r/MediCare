// ============================================================
// src/lib/database.types.ts
// TypeScript representation of our Supabase PostgreSQL schema.
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
      profiles: {
        Row: {
          id: string
          user_id: string
          breakfast_time: string
          lunch_time: string
          dinner_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          breakfast_time?: string
          lunch_time?: string
          dinner_time?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          breakfast_time?: string
          lunch_time?: string
          dinner_time?: string
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
          doctor_name: string
          hospital_name: string
          description: string | null
          start_date: string
          end_date: string
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          doctor_name: string
          hospital_name: string
          description?: string | null
          start_date: string
          end_date: string
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          doctor_name?: string
          hospital_name?: string
          description?: string | null
          start_date?: string
          end_date?: string
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      medicine_catalog: {
        Row: {
          id: string
          external_id: string | null
          medicine_name: string
          generic_name: string | null
          brand_name: string | null
          strength: string | null
          dosage_form: string | null
          manufacturer: string | null
          source: 'manual' | 'external_api' | 'ocr'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          external_id?: string | null
          medicine_name: string
          generic_name?: string | null
          brand_name?: string | null
          strength?: string | null
          dosage_form?: string | null
          manufacturer?: string | null
          source?: 'manual' | 'external_api' | 'ocr'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          external_id?: string | null
          medicine_name?: string
          generic_name?: string | null
          brand_name?: string | null
          strength?: string | null
          dosage_form?: string | null
          manufacturer?: string | null
          source?: 'manual' | 'external_api' | 'ocr'
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
          dosage: string
          meal_type: 'breakfast' | 'lunch' | 'dinner'
          meal_types: ('breakfast' | 'lunch' | 'dinner')[]
          food_relation: 'before_food' | 'after_food' | 'with_food' | 'anytime'
          custom_time: string | null
          daily_frequency: number
          quantity_per_dose: number
          total_quantity_prescribed: number
          remaining_stock: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          prescription_id: string
          medicine_id: string
          dosage: string
          meal_type: 'breakfast' | 'lunch' | 'dinner'
          meal_types?: ('breakfast' | 'lunch' | 'dinner')[]
          food_relation: 'before_food' | 'after_food' | 'with_food' | 'anytime'
          custom_time?: string | null
          daily_frequency?: number
          quantity_per_dose?: number
          total_quantity_prescribed?: number
          remaining_stock?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          prescription_id?: string
          medicine_id?: string
          dosage?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner'
          meal_types?: ('breakfast' | 'lunch' | 'dinner')[]
          food_relation?: 'before_food' | 'after_food' | 'with_food' | 'anytime'
          custom_time?: string | null
          daily_frequency?: number
          quantity_per_dose?: number
          total_quantity_prescribed?: number
          remaining_stock?: number
          notes?: string | null
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
            referencedRelation: "medicine_catalog"
            referencedColumns: ["id"]
          }
        ]
      }
      medication_logs: {
        Row: {
          id: string
          user_id: string
          prescription_item_id: string
          scheduled_date: string
          scheduled_time: string
          status: 'pending' | 'taken' | 'missed' | 'skipped'
          taken_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prescription_item_id: string
          scheduled_date: string
          scheduled_time: string
          status?: 'pending' | 'taken' | 'missed' | 'skipped'
          taken_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prescription_item_id?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: 'pending' | 'taken' | 'missed' | 'skipped'
          taken_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_prescription_item_id_fkey"
            columns: ["prescription_item_id"]
            isOneToOne: false
            referencedRelation: "prescription_items"
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
      prescription_status_enum: 'active' | 'completed' | 'cancelled'
      meal_type_enum: 'breakfast' | 'lunch' | 'dinner'
      food_relation_enum: 'before_food' | 'after_food' | 'with_food' | 'anytime'
      log_status_enum: 'pending' | 'taken' | 'missed' | 'skipped'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
