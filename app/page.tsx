'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // Check if Supabase is properly initialized
      if (!supabase) {
        setError('Supabase not initialized. Please check your environment variables.')
        return
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('[Home] Session error:', sessionError)
        setError('Failed to check authentication. Please refresh the page.')
        return
      }
      
      if (session) {
        // Check if profile is complete
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('profile_complete')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          console.error('[Home] Profile error:', profileError)
          // If profile doesn't exist, go to onboarding
          if (profileError.code === 'PGRST116') {
            router.push('/onboarding')
            return
          }
        }
        
        if (profile?.profile_complete) {
          router.push('/feed')
        } else {
          router.push('/onboarding')
        }
      } else {
        router.push('/auth')
      }
    } catch (err) {
      console.error('[Home] Error checking user:', err)
      setError('An error occurred. Please refresh the page.')
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="text-center p-6 glass rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary px-4 py-2"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="spinner"></div>
    </div>
  )
}


