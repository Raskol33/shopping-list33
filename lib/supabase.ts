import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour TypeScript
export interface User {
  id: string
  username: string
  password: string
  is_admin: boolean
  created_at?: string
  updated_at?: string
}

export interface ShoppingItem {
  id: string
  name: string
  category: string
  description?: string
  price?: number
  weight?: string
  store?: string
  remarks?: string
  completed: boolean
  user_id: string
  created_at?: string
  updated_at?: string
}

export interface CustomCategory {
  id: string
  name: string
  created_at?: string
}

export interface UserSettings {
  id: string
  user_id: string
  group_by_category: boolean
  created_at?: string
  updated_at?: string
}

export interface ProductHistory {
  id: string
  name: string
  category: string
  description?: string
  price?: number
  weight?: string
  store?: string
  remarks?: string
  user_id: string
  usage_count: number
  last_used: string
  created_at?: string
  updated_at?: string
}
