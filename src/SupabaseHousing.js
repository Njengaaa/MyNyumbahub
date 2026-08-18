import { createClient } from '@supabase/supabase-js'

// YOUR Supabase credentials (for housing data)
const supabaseHousingUrl = import.meta.env.VITE_HOUSING_SUPABASE_URL
const supabaseHousingKey = import.meta.env.VITE_HOUSING_SUPABASE_ANON_KEY

export const SupabaseHousing = createClient(supabaseHousingUrl, supabaseHousingKey)