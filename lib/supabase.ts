import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  console.error('See README.md or SETUP.md for instructions.')
}

// Create Supabase client with fallback to prevent crashes
export const supabase = supabaseUrl && supabaseAnonKey
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
  : createSupabaseClient('https://placeholder.supabase.co', 'placeholder-key')

// For client components
export const createClient = () => createClientComponentClient()

// Storage helpers
export const uploadMedia = async (
  userId: string,
  file: File,
  type: 'photo' | 'video'
) => {
  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error(`File size exceeds 10MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`)
  }

  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const fileName = `${userId}/${timestamp}_${random}.${fileExt}`
  const filePath = `${type}s/${fileName}`

  console.log('📤 Uploading to:', filePath, 'Size:', (file.size / 1024).toFixed(2), 'KB')

  const { data, error } = await supabase.storage
    .from('media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('❌ Upload error:', error)
    throw new Error(`Storage error: ${error.message}. Make sure the 'media' bucket exists and is public.`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(filePath)

  console.log('✅ Upload successful:', publicUrl)

  return { path: filePath, url: publicUrl }
}

export const getMediaUrl = (path: string) => {
  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(path)
  
  return data.publicUrl
}

