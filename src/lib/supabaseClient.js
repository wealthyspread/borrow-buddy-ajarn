import { createClient } from '@supabase/supabase-js'

// ใช้เฉพาะ publishable key ห้ามใส่ service role key ในโค้ดฝั่งเว็บ
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
