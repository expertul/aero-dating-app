'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Heart, Mail, Lock, User } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        })
        
        if (error) throw error
        
        // Wait a moment for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Update or create profile with name
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ 
              id: data.user.id,
              name: name 
            })
          
          if (profileError) {
            // Profile error
          }
        }
        
        router.push('/onboarding')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        router.push('/feed')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 rounded-full gradient-red opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full gradient-turquoise opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-3xl p-8 relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-red mb-4"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Heart className="w-8 h-8 text-white fill-white" />
          </motion.div>
          <h1 className="text-3xl font-bold">Welcome to AERO</h1>
          <p className="text-gray-400 mt-2">
            {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-surface border-2 border-white/10 rounded-xl focus:outline-none focus:border-primary-red focus:ring-4 focus:ring-primary-red/20 transition-all duration-300 placeholder:text-neutral-500 text-white"
                  placeholder="Your name"
                  required
                />
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-red to-primary-red/80 rounded-full scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-dark-surface border-2 border-white/10 rounded-xl focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/20 transition-all duration-300 placeholder:text-neutral-500 text-white"
                placeholder="your@email.com"
                required
              />
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-blue to-primary-turquoise rounded-full scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-dark-surface border-2 border-white/10 rounded-xl focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/20 transition-all duration-300 placeholder:text-neutral-500 text-white"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-blue to-primary-turquoise rounded-full scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full btn-primary gradient-red text-white font-semibold disabled:opacity-50"
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </motion.button>
        </form>

        {/* Toggle mode */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-primary-turquoise hover:underline"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

