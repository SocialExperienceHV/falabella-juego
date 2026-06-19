import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Participante = {
  cedula: string
  puntos_total: number
  estacion_1: number
  estacion_2: number
  estacion_3: number
  estacion_4: number
  created_at: string
  updated_at: string
}
