import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

//client pour les opérations en lecture seule
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
