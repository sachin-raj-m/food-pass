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
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'vendor' | 'volunteer'
          created_at: string
          email: string | null
        }
        Insert: {
          id: string
          role: 'admin' | 'vendor' | 'volunteer'
          created_at?: string
          email?: string | null
        }
        Update: {
          id?: string
          role?: 'admin' | 'vendor' | 'volunteer'
          created_at?: string
          email?: string | null
        }
      }
      events: {
        Row: {
          id: string
          title: string
          venue: string
          event_date: string
          start_time: string
          end_time: string
          coupon_expiry_time: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          venue: string
          event_date: string
          start_time: string
          end_time: string
          coupon_expiry_time: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          venue?: string
          event_date?: string
          start_time?: string
          end_time?: string
          coupon_expiry_time?: string
          created_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          ticket_number: number
          event_id: string
          meal_type: 'breakfast' | 'lunch' | 'snacks' | 'dinner'
          expires_at: string
          status: 'unused' | 'used' | 'expired'
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          expires_at: string
          status?: 'unused' | 'used' | 'expired'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          expires_at?: string
          status?: 'unused' | 'used' | 'expired'
          created_at?: string
        }
      }
      redemptions: {
        Row: {
          id: string
          coupon_id: string
          redeemed_by: string
          role: 'vendor' | 'volunteer'
          redeemed_at: string
        }
        Insert: {
          id?: string
          coupon_id: string
          redeemed_by: string
          role: 'vendor' | 'volunteer'
          redeemed_at?: string
        }
        Update: {
          id?: string
          coupon_id?: string
          redeemed_by?: string
          role?: 'vendor' | 'volunteer'
          redeemed_at?: string
        }
      }
    }
    Functions: {
      redeem_coupon: {
        Args: {
          coupon_uuid: string
        }
        Returns: Json
      }
      get_event_stats: {
        Args: {
          event_uuid: string
        }
        Returns: {
          meal_type: string
          total_count: number
          used_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
