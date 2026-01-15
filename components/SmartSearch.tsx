'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, MessageCircle, User, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SearchResult {
  id: string
  type: 'match' | 'message' | 'profile'
  name: string
  preview?: string
  avatar?: string
}

export default function SmartSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'matches' | 'messages'>('all')
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    const search = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const allResults: SearchResult[] = []

        // Search matches
        if (activeFilter === 'all' || activeFilter === 'matches') {
          const { data: matches } = await supabase
            .from('matches')
            .select(`
              id,
              profile_a:profiles!matches_user_a_fkey(id, name, media:profile_media(storage_path)),
              profile_b:profiles!matches_user_b_fkey(id, name, media:profile_media(storage_path))
            `)
            .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

          matches?.forEach((match: any) => {
            const otherProfile = match.user_a === user.id ? match.profile_b : match.profile_a
            if (otherProfile?.name?.toLowerCase().includes(query.toLowerCase())) {
              allResults.push({
                id: match.id,
                type: 'match',
                name: otherProfile.name,
                avatar: otherProfile.media?.[0]?.storage_path,
              })
            }
          })
        }

        // Search messages
        if (activeFilter === 'all' || activeFilter === 'messages') {
          const { data: messages } = await supabase
            .from('messages')
            .select(`
              id,
              body,
              match_id,
              matches!inner(
                profile_a:profiles!matches_user_a_fkey(id, name),
                profile_b:profiles!matches_user_b_fkey(id, name)
              )
            `)
            .ilike('body', `%${query}%`)
            .limit(10)

          messages?.forEach((msg: any) => {
            const match = msg.matches
            const otherProfile = match.user_a === user.id ? match.profile_b : match.profile_a
            if (otherProfile) {
              allResults.push({
                id: msg.id,
                type: 'message',
                name: otherProfile.name,
                preview: msg.body,
              })
            }
          })
        }

        setResults(allResults)
      } catch (error) {
        console.error('[Search] Error:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(search, 300)
    return () => clearTimeout(debounce)
  }, [query, activeFilter])

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'match') {
      router.push(`/chat/${result.id}`)
    } else if (result.type === 'message') {
      router.push(`/chat/${result.id}`)
    }
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div ref={searchRef} className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full glass border border-white/10 hover:bg-white/5 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Search className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-12 right-0 w-80 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search matches, messages..."
                  className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary-blue"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    activeFilter === 'all' ? 'gradient-red text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter('matches')}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    activeFilter === 'matches' ? 'gradient-red text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Matches
                </button>
                <button
                  onClick={() => setActiveFilter('messages')}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    activeFilter === 'messages' ? 'gradient-red text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Messages
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading && (
                <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
              )}
              {!loading && results.length === 0 && query && (
                <div className="p-4 text-center text-gray-400 text-sm">No results found</div>
              )}
              {!loading && results.length > 0 && (
                <div className="p-2">
                  {results.map((result) => (
                    <motion.button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full p-3 rounded-lg hover:bg-white/5 transition-all text-left flex items-center gap-3"
                      whileHover={{ x: 4 }}
                    >
                      {result.type === 'match' && <User className="w-5 h-5 text-primary-blue" />}
                      {result.type === 'message' && <MessageCircle className="w-5 h-5 text-primary-turquoise" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{result.name}</div>
                        {result.preview && (
                          <div className="text-xs text-gray-400 truncate mt-0.5">{result.preview}</div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

