import { createClient } from '@supabase/supabase-js'

// Contoh pengisian yang benar:
const supabaseUrl = 'https://id-proyek-kamu.supabase.co' 
const supabaseKey = 'isi-dengan-anon-public-key-kamu' 

export const supabase = createClient(supabaseUrl, supabaseKey)