import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseAnonKey = process.env.VUE_APP_SUPABASE_ANON_KEY

function isValidUrl(value) {
  if (!value) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch (error) {
    return false
  }
}

const validEnv = Boolean(supabaseAnonKey) && isValidUrl(supabaseUrl)

export const hasSupabaseEnv = validEnv

let client = null
if (validEnv) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    })
  } catch (error) {
    console.warn('[supabase] init failed, fallback to mock db:', error?.message || error)
    client = null
  }
} else {
  console.warn('[supabase] invalid env, fallback to mock db')
}

export const supabase = client

