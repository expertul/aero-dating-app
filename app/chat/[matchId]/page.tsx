'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase, getMediaUrl } from '@/lib/supabase'
import { ArrowLeft, Send, MoreVertical, Flag, Ban, Smile, Heart, Calendar, X, Camera, Video, MapPin, Gift } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useStore } from '@/lib/store'
import Icebreakers from '@/components/Icebreakers'
import DateSuggestions from '@/components/DateSuggestions'
import CompatibilityScore from '@/components/CompatibilityScore'

interface Message {
  id: string
  match_id: string
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
}

interface Profile {
  id: string
  name: string
  media: Array<{
    storage_path: string
  }>
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params?.matchId as string
  const { setUnreadMessageCount } = useStore()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [canChat, setCanChat] = useState(true) // Matched users can always chat freely
  const [hasSentFirst, setHasSentFirst] = useState(false) // Not used for matched users
  const [otherSentFirst, setOtherSentFirst] = useState(false) // Not used for matched users
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false) // Not used for matched users
  const [canSendOneMessage, setCanSendOneMessage] = useState(false) // Not used for matched users
  const [isOtherTyping, setIsOtherTyping] = useState(false) // Is other person typing
  const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({}) // message_id -> reactions[]
  const [showCompatibility, setShowCompatibility] = useState(false) // Show compatibility score
  const [showDateSuggestions, setShowDateSuggestions] = useState(false) // Show date suggestions
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null) // message_id for reaction picker
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)
  const typingChannelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const presencePollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update unread count helper
  const updateUnreadCount = async (currentUserId: string) => {
    const { data: matches } = await supabase
      .from('matches')
      .select('id')
      .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`)
    
    if (matches && matches.length > 0) {
      const matchIds = matches.map(m => m.id)
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('match_id', matchIds)
        .neq('sender_id', currentUserId)
        .is('read_at', null)
      
      setUnreadMessageCount(count || 0)
    } else {
      setUnreadMessageCount(0)
    }
  }

  // Mark all messages as read when viewing chat
  useEffect(() => {
    if (!userId || !matchId || messages.length === 0) return
    
    // Mark all unread messages from other user as read
    const unreadMessages = messages.filter(
      m => m.sender_id !== userId && !m.read_at
    )
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(m => m.id)
      supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds)
        .then(() => {
          // Update messages in state
          setMessages((prev) =>
            prev.map((m) => 
              messageIds.includes(m.id) 
                ? { ...m, read_at: new Date().toISOString() }
                : m
            )
          )
          
          // Update unread count
          updateUnreadCount(userId)
        })
    }
  }, [messages, userId, matchId])

  // Load message reactions
  useEffect(() => {
    if (!matchId || messages.length === 0) return
    
    const loadReactions = async () => {
      const messageIds = messages.map(m => m.id)
      const { data: reactions } = await supabase
        .from('message_reactions')
        .select('message_id, reaction')
        .in('message_id', messageIds)
      
      if (reactions) {
        const reactionsMap: Record<string, string[]> = {}
        reactions.forEach(r => {
          if (!reactionsMap[r.message_id]) {
            reactionsMap[r.message_id] = []
          }
          reactionsMap[r.message_id].push(r.reaction)
        })
        setMessageReactions(reactionsMap)
      }
    }
    
    loadReactions()
  }, [matchId, messages])

  useEffect(() => {
    if (!matchId) return
    
    loadChat()
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    return () => {
      if (channelRef.current) {
        // Clear polling interval if it exists
        if ((channelRef.current as any).pollInterval) {
          clearInterval((channelRef.current as any).pollInterval)
        }
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current)
        typingChannelRef.current = null
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      if (presencePollIntervalRef.current) {
        clearInterval(presencePollIntervalRef.current)
        presencePollIntervalRef.current = null
      }
    }
  }, [matchId, userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Matched users can always chat - no need to watch for confirmation

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      setUserId(user.id)

      // Get match details
      const { data: match } = await supabase
        .from('matches')
        .select(`
          *,
          profile_a:profiles!matches_user_a_fkey(id, name, media:profile_media(*)),
          profile_b:profiles!matches_user_b_fkey(id, name, media:profile_media(*))
        `)
        .eq('id', matchId)
        .single()

      if (!match) {
        router.push('/matches')
        return
      }

      const other = match.user_a === user.id ? match.profile_b : match.profile_a
      setOtherProfile(other as Profile)

      // Load messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      const messagesList = messagesData || []
      setMessages(messagesList)
      
      // Load message reactions
      if (messagesList.length > 0) {
        const messageIds = messagesList.map(m => m.id)
        const { data: reactionsData } = await supabase
          .from('message_reactions')
          .select('message_id, reaction')
          .in('message_id', messageIds)
        
        if (reactionsData) {
          const reactionsMap: Record<string, string[]> = {}
          reactionsData.forEach((r: any) => {
            if (!reactionsMap[r.message_id]) {
              reactionsMap[r.message_id] = []
            }
            reactionsMap[r.message_id].push(r.reaction)
          })
          setMessageReactions(reactionsMap)
        }
      }

      // Matched users can always chat - no confirmation needed
      setCanChat(true)
      setCanSendOneMessage(false)
      setWaitingForConfirmation(false)
      setHasSentFirst(true)
      setOtherSentFirst(true)

      // Set loading to false immediately after data is loaded
      setLoading(false)

      // Mark messages as read (non-blocking, don't wait)
      supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .neq('sender_id', user.id)
        .is('read_at', null)
        .then(() => {
          // Refresh unread count after marking messages as read
          updateUnreadCount(user.id)
        })

      // Set up typing indicator presence channel
      const typingChannelName = `typing:${matchId}`
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current)
      }
      
      typingChannelRef.current = supabase
        .channel(typingChannelName, {
          config: {
            presence: {
              key: user.id
            }
          }
        })
        .on('presence', { event: 'sync' }, () => {
          const state = typingChannelRef.current.presenceState()
          const otherUserId = other?.id
          if (otherUserId) {
            const otherPresence = state[otherUserId] as any
            
            if (otherPresence && otherPresence[0]?.typing) {
              setIsOtherTyping(true)
            } else {
              setIsOtherTyping(false)
            }
          }
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
          const otherUserId = other?.id
          if (key === otherUserId && newPresences && newPresences[0]?.typing) {
            setIsOtherTyping(true)
          }
        })
        .on('presence', { event: 'leave' }, ({ key }: any) => {
          const otherUserId = other?.id
          if (key === otherUserId) {
            setIsOtherTyping(false)
          }
        })
        // Poll presence state periodically to catch updates (for bot typing)
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track presence
            if (typingChannelRef.current) {
              await typingChannelRef.current.track({
                typing: false,
                userId: user.id
              })
            }
            
            // Poll presence state every 1 second to catch bot typing updates (reduced frequency)
            // Clear any existing interval first
            if (presencePollIntervalRef.current) {
              clearInterval(presencePollIntervalRef.current)
            }
            
            presencePollIntervalRef.current = setInterval(() => {
              if (!typingChannelRef.current) {
                if (presencePollIntervalRef.current) {
                  clearInterval(presencePollIntervalRef.current)
                  presencePollIntervalRef.current = null
                }
                return
              }
              const state = typingChannelRef.current.presenceState()
              const otherUserId = other?.id
              if (otherUserId) {
                const otherPresence = state[otherUserId] as any
                if (otherPresence && otherPresence[0]?.typing) {
                  setIsOtherTyping(true)
                } else {
                  setIsOtherTyping(false)
                }
              }
            }, 1000) // Reduced to 1 second instead of 500ms
          }
        })

      // Subscribe to new messages - use a unique channel name
      const channelName = `chat:${matchId}:${user.id}:${Date.now()}`
      
      // Remove any existing channel first
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      
      channelRef.current = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`
          },
          (payload) => {
            const newMsg = payload.new as Message
            
            // Double-check match_id (extra safety)
            if (newMsg.match_id !== matchId) {
              return
            }
            
            console.log('[Chat] New message received via real-time:', {
              id: newMsg.id,
              sender_id: newMsg.sender_id,
              body: newMsg.body.substring(0, 50),
              match_id: newMsg.match_id
            })
            
            // Add message directly (optimized - no full refresh)
            setMessages((prev) => {
              // Check if message already exists (avoid duplicates)
              const exists = prev.some(m => m.id === newMsg.id)
              if (exists) {
                return prev
              }
              
              // Add message and sort by created_at to ensure correct order
              const updated = [...prev, newMsg].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )
              
              // Show browser notification if user is not on this chat page
              if (document.hidden && newMsg.sender_id !== user.id && 'Notification' in window && Notification.permission === 'granted') {
                const messagePreview = newMsg.body === '👋' ? 'sent you a wave' : newMsg.body
                new Notification(`${otherProfile?.name || 'Someone'} sent a message`, {
                  body: messagePreview,
                  icon: '/icon-192.png',
                  badge: '/icon-192.png',
                  tag: `chat-${matchId}`,
                  requireInteraction: false
                })
              }
              
              return updated
            })
            
            // Scroll to bottom when new message arrives
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
            
            // Mark as read if from other user and we're viewing the chat
            if (newMsg.sender_id !== user.id && !newMsg.read_at) {
              // Mark as read immediately when viewing
              supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', newMsg.id)
                .then(() => {
                  // Update the message in state to reflect read status
                  setMessages((prev) =>
                    prev.map((m) => (m.id === newMsg.id ? { ...m, read_at: new Date().toISOString() } : m))
                  )
                  
                  // Update unread count
                  updateUnreadCount(user.id)
                })
            } else {
              // User sent a message - update unread count
              setTimeout(() => {
                supabase
                  .from('matches')
                  .select('id')
                  .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
                  .then(({ data: matches }) => {
                    if (matches && matches.length > 0) {
                      const matchIds = matches.map(m => m.id)
                      supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .in('match_id', matchIds)
                        .neq('sender_id', user.id)
                        .is('read_at', null)
                        .then(({ count }) => {
                          setUnreadMessageCount(count || 0)
                        })
                    }
                  })
              }, 200)
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Chat] Message subscription active for match:', matchId)
            // Messages are already loaded in loadChat, no need to sync again
            // Real-time updates will handle new messages via postgres_changes
          } else if (err) {
            console.error('[Chat] Subscription error:', err)
          }
        })
      
      // Fallback: Poll for new messages every 3 seconds as backup (in case real-time fails)
      const messagePollInterval = setInterval(async () => {
        if (!userId || !matchId) return
        
        try {
          const { data: latestMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('match_id', matchId)
            .order('created_at', { ascending: false })
            .limit(1)
          
          if (latestMessages && latestMessages.length > 0) {
            const latestMessage = latestMessages[0]
            setMessages((prev) => {
              const exists = prev.some(m => m.id === latestMessage.id)
              if (!exists) {
                console.log('[Chat] Found new message via polling:', latestMessage.id)
                return [...prev, latestMessage].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
              }
              return prev
            })
          }
        } catch (error) {
          console.error('[Chat] Error polling messages:', error)
        }
      }, 3000) // Poll every 3 seconds as backup
      
      // Store interval for cleanup
      ;(channelRef.current as any).pollInterval = messagePollInterval

    } catch (error) {
      console.error('[Chat] Error loading chat:', error)
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !userId || sending) return
    
    // Matched users can always send messages
    if (!canChat) return

    setSending(true)
    const messageText = newMessage.trim()
    setNewMessage('')

    // Optimistically add message to UI immediately
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      match_id: matchId,
      sender_id: userId,
      body: messageText,
      read_at: null,
      created_at: new Date().toISOString()
    }
    setMessages((prev) => {
      const updated = [...prev, optimisticMessage]
      
      // Matched users can always chat - no confirmation needed
      
      return updated
    })

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: userId,
          body: messageText
        })
        .select()
        .single()

      if (error) throw error

      // Replace optimistic message with real one
      if (data) {
        setMessages((prev) => prev.filter(m => m.id !== tempId).concat([data]))
        
        // Check if other user is a bot and handle bot response (non-blocking)
        if (otherProfile?.id) {
          console.log('[Chat] Checking if other user is a bot...', { 
            otherProfileId: otherProfile.id, 
            otherProfileName: otherProfile.name
          })
          
          // Don't await - let bot response happen in background
          const triggerBotResponse = async () => {
            try {
              const { isBot } = await import('@/lib/botService')
              const isOtherUserBot = await isBot(otherProfile.id)
              
              console.log('[Chat] Bot check result:', { 
                otherProfileId: otherProfile.id, 
                otherProfileName: otherProfile.name,
                isBot: isOtherUserBot 
              })
              
              if (isOtherUserBot) {
                console.log('[Chat] User is a bot! Triggering bot response...')
                // Handle bot response (non-blocking)
                const { handleUserMessageToBot } = await import('@/lib/botService')
                await handleUserMessageToBot(otherProfile.id, userId, matchId, messageText)
                console.log('[Chat] Bot response handler completed')
              } else {
                console.log('[Chat] User is not a bot, skipping bot response')
              }
            } catch (error) {
              console.error('[Chat] Error in bot detection/response:', error)
            }
          }
          triggerBotResponse()
        } else {
          console.log('[Chat] No otherProfile.id available, skipping bot check')
        }
      }
    } catch (error) {
      // Error sending message
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== tempId))
      setNewMessage(messageText)
    } finally {
      setSending(false)
    }
  }

  const handleBlock = async () => {
    if (!userId || !otherProfile) return

    if (confirm(`Block ${otherProfile.name}? You won't see each other anymore.`)) {
      try {
        await supabase
          .from('blocks')
          .insert({
            blocker_id: userId,
            blocked_id: otherProfile.id
          })

        router.push('/matches')
      } catch (error) {
        // Error blocking user
      }
    }
  }

  const handleReport = async () => {
    if (!userId || !otherProfile) return

    const reason = prompt('Please describe the issue:')
    if (!reason) return

    try {
      await supabase
        .from('reports')
        .insert({
          reporter_id: userId,
          reported_id: otherProfile.id,
          reason: 'inappropriate',
          details: reason
        })

      alert('Report submitted. Thank you for keeping Spark safe.')
      setShowMenu(false)
    } catch (error) {
      // Error reporting user
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!otherProfile) {
    return null
  }

  const profileImage = otherProfile.media[0]
    ? getMediaUrl(otherProfile.media[0].storage_path)
    : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%231C2128" width="200" height="200"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="20"%3ENo Photo%3C/text%3E%3C/svg%3E'

  return (
    <div className="h-screen bg-dark-bg flex flex-col">
      {/* Header */}
      <div className="safe-top bg-dark-card border-b border-dark-border px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-1.5 hover:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push(`/profile/${otherProfile.id}`)}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary-red">
              <img
                src={profileImage}
                alt={otherProfile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-base font-semibold">{otherProfile.name}</h1>
          </button>
        </div>

        <div className="relative flex items-center gap-2">
          {/* Compatibility Score Button */}
          <motion.button
            onClick={() => setShowCompatibility(!showCompatibility)}
            className="p-2.5 hover:bg-white/10 rounded-full transition-all backdrop-blur-sm"
            title="View Compatibility"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className="w-5 h-5 text-primary-red" />
          </motion.button>

          {/* Date Suggestions Button */}
          {messages.length > 5 && (
            <motion.button
              onClick={() => setShowDateSuggestions(!showDateSuggestions)}
              className="p-2.5 hover:bg-white/10 rounded-full transition-all backdrop-blur-sm"
              title="Date Ideas"
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Calendar className="w-5 h-5 text-primary-turquoise" />
            </motion.button>
          )}

          <motion.button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2.5 hover:bg-white/10 rounded-full transition-all backdrop-blur-sm"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreVertical className="w-6 h-6 text-white" />
          </motion.button>

          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-12 glass rounded-xl overflow-hidden min-w-[200px] shadow-xl z-50"
            >
              <button
                onClick={handleReport}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
              >
                <Flag className="w-5 h-5 text-yellow-500" />
                <span>Report</span>
              </button>
              <button
                onClick={handleBlock}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-red-400"
              >
                <Ban className="w-5 h-5" />
                <span>Block</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Compatibility Score Modal */}
      {showCompatibility && userId && otherProfile?.id && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <CompatibilityScore
              userId={userId}
              otherUserId={otherProfile.id}
              onClose={() => setShowCompatibility(false)}
            />
          </motion.div>
        </div>
      )}

      {/* Date Suggestions Modal */}
      {showDateSuggestions && userId && otherProfile?.id && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full max-h-[80vh] overflow-y-auto glass rounded-2xl border border-white/10"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Date Ideas</h3>
              <button
                onClick={() => setShowDateSuggestions(false)}
                className="p-1 rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DateSuggestions
              userId={userId}
              otherUserId={otherProfile.id}
              onSelect={(suggestion) => {
                // Send date suggestion as message
                setNewMessage(`I'd love to ${suggestion.title.toLowerCase()} with you! ${suggestion.description}`)
                setShowDateSuggestions(false)
              }}
            />
          </motion.div>
        </div>
      )}

      {/* Click outside to close reaction picker */}
      {showReactionPicker && (
        <div
          className="fixed inset-0 z-[15]"
          onClick={() => setShowReactionPicker(null)}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center h-full text-gray-400"
          >
            <div className="text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-4xl mb-2"
              >
                💬
              </motion.div>
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          </motion.div>
        )}
        {messages.map((message, index) => {
          const isOwn = message.sender_id === userId
          const showTimestamp =
            index === 0 ||
            new Date(message.created_at).getTime() -
              new Date(messages[index - 1].created_at).getTime() >
              300000 // 5 minutes
          
          // Format timestamp professionally
          const messageDate = new Date(message.created_at)
          const formatTime = (date: Date) => {
            const now = new Date()
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
            
            if (diffInSeconds < 60) return 'Just now'
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
            
            // Same day
            if (date.toDateString() === now.toDateString()) {
              return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            }
            
            // Yesterday
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            if (date.toDateString() === yesterday.toDateString()) {
              return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
            }
            
            // This week
            const daysDiff = Math.floor(diffInSeconds / 86400)
            if (daysDiff < 7) {
              return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
            }
            
            // Older
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
          }

          return (
            <div key={message.id}>
              {showTimestamp && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-4"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
                    <div className="w-1 h-1 bg-primary-turquoise rounded-full" />
                    <span className="text-xs font-medium text-gray-300">{formatTime(messageDate)}</span>
                    <div className="w-1 h-1 bg-primary-turquoise rounded-full" />
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25,
                  delay: Math.min(index * 0.03, 0.3)
                }}
                className="w-full"
              >
                {message.body === '👋' ? (
                  // Wave message with animation
                  <motion.div
                    className={`flex items-center gap-2 ${
                      isOwn ? 'flex-row-reverse' : 'flex-row'
                    }`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 200, 
                      damping: 12,
                      delay: index * 0.05
                    }}
                  >
                    <motion.div
                      className="text-5xl"
                      animate={{
                        rotate: [0, 14, -14, 14, -14, 0],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                    >
                      👋
                    </motion.div>
                    {isOwn && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xs text-gray-400"
                      >
                        Wave sent!
                      </motion.span>
                    )}
                  </motion.div>
                ) : (
                  // Normal message
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className="group relative max-w-[75%]">
                      <motion.div
                        initial={{ 
                          opacity: 0, 
                          x: isOwn ? 20 : -20,
                          scale: 0.9
                        }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          scale: 1
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 400, 
                          damping: 25,
                          delay: Math.min(index * 0.03, 0.2)
                        }}
                        className={`px-4 py-3 rounded-2xl text-sm relative backdrop-blur-md shadow-lg ${
                          isOwn
                            ? 'gradient-blue text-white rounded-br-sm'
                            : 'bg-gradient-to-br from-white/15 to-white/5 text-primary-turquoise rounded-bl-sm border border-white/10'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{message.body}</p>
                        {/* Read receipt and timestamp for own messages */}
                        {isOwn && (
                          <div className="absolute -bottom-5 right-0 flex items-center gap-2">
                            {message.read_at && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1"
                              >
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                                  className="w-1.5 h-1.5 bg-primary-blue rounded-full"
                                />
                                Read
                              </motion.div>
                            )}
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                              {formatTime(new Date(message.created_at))}
                            </span>
                          </div>
                        )}
                        {/* Timestamp for received messages */}
                        {!isOwn && (
                          <div className="absolute -bottom-5 left-0 text-[10px] text-gray-500 whitespace-nowrap mt-1">
                            {formatTime(new Date(message.created_at))}
                          </div>
                        )}
                      </motion.div>
                      
                      {/* Message Reactions */}
                      {messageReactions[message.id] && messageReactions[message.id].length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-1.5 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          {messageReactions[message.id].map((reaction, idx) => (
                            <motion.span 
                              key={idx} 
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ 
                                type: "spring", 
                                stiffness: 300, 
                                damping: 15,
                                delay: idx * 0.1
                              }}
                              className="text-lg bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20"
                            >
                              {reaction}
                            </motion.span>
                          ))}
                        </motion.div>
                      )}
                      
                      {/* Reaction Button */}
                      <motion.button
                        onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ opacity: 1, scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/20 hover:from-white/30 hover:to-white/20 shadow-lg z-10 ${
                          isOwn ? '-left-10' : '-right-10'
                        }`}
                      >
                        <Smile className="w-4 h-4 text-white" />
                      </motion.button>
                      
                      {/* Reaction Picker */}
                      {showReactionPicker === message.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className={`absolute top-1/2 -translate-y-1/2 z-20 ${
                            isOwn ? '-left-32' : '-right-32'
                          }`}
                        >
                          <div className="flex gap-2 p-2 glass rounded-2xl border border-white/20 shadow-xl">
                            {['❤️', '😂', '👍', '😍', '🔥'].map((reaction) => (
                              <motion.button
                                key={reaction}
                                onClick={async () => {
                                  if (!userId) return
                                  
                                  // Add reaction
                                  await supabase
                                    .from('message_reactions')
                                    .upsert({
                                      message_id: message.id,
                                      user_id: userId,
                                      reaction: reaction
                                    }, {
                                      onConflict: 'message_id,user_id'
                                    })
                                  
                                  // Update local state
                                  setMessageReactions((prev) => ({
                                    ...prev,
                                    [message.id]: [...(prev[message.id] || []), reaction]
                                  }))
                                  
                                  setShowReactionPicker(null)
                                }}
                                whileHover={{ scale: 1.3, rotate: 10 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-2xl p-2 hover:bg-white/10 rounded-full transition-colors"
                              >
                                {reaction}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )
        })}
        
        {/* Typing Indicator */}
        {isOtherTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex justify-start mb-2"
          >
            <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/10 rounded-bl-sm shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">
                  {otherProfile?.name || 'Someone'} is typing
                </span>
                <div className="flex gap-1.5">
                  <motion.div
                    className="w-2 h-2 bg-primary-blue rounded-full"
                    animate={{ 
                      y: [0, -6, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity, 
                      delay: 0,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-primary-turquoise rounded-full"
                    animate={{ 
                      y: [0, -6, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity, 
                      delay: 0.2,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-primary-red rounded-full"
                    animate={{ 
                      y: [0, -6, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity, 
                      delay: 0.4,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Icebreakers - Show when no messages */}
      {messages.length === 0 && (
        <Icebreakers 
          matchId={matchId} 
          onSend={(message) => {
            setNewMessage(message)
            // Send the message directly
            setTimeout(async () => {
              if (!userId || sending) return
              setSending(true)
              const messageText = message.trim()
              setNewMessage('')
              
              try {
                const { data, error } = await supabase
                  .from('messages')
                  .insert({
                    match_id: matchId,
                    sender_id: userId,
                    body: messageText
                  })
                  .select()
                  .single()
                
                if (error) throw error
                
                if (data) {
                  setMessages((prev) => [...prev, data])
                  
                  // Check if bot (non-blocking)
                  if (otherProfile?.id) {
                    // Don't await - let bot response happen in background
                    (async () => {
                      try {
                        const { isBot } = await import('@/lib/botService')
                        const isOtherUserBot = await isBot(otherProfile.id)
                        
                        console.log('[Chat] Icebreaker - Checking if user is bot:', { 
                          otherProfileId: otherProfile.id, 
                          isBot: isOtherUserBot 
                        })
                        
                        if (isOtherUserBot) {
                          const { handleUserMessageToBot } = await import('@/lib/botService')
                          handleUserMessageToBot(otherProfile.id, userId, matchId, messageText).catch(err => {
                            console.error('[Chat] Icebreaker - Error handling bot response:', err)
                          })
                          console.log('[Chat] Icebreaker - Bot response handler called')
                        }
                      } catch (error) {
                        console.error('[Chat] Icebreaker - Error checking if bot:', error)
                      }
                    })()
                  }
                }
              } catch (error) {
                setNewMessage(messageText)
              } finally {
                setSending(false)
              }
            }, 100)
          }} 
        />
      )}

      {/* Input - Matched users can always chat */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="safe-bottom bg-gradient-to-t from-dark-card via-dark-card/95 to-transparent border-t border-white/10 backdrop-blur-xl px-4 py-3 space-y-2"
      >
        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 px-2">
          <motion.button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = (e: any) => {
                const file = e.target.files[0]
                if (file) {
                  // Handle photo upload
                  alert('Photo upload feature coming soon!')
                }
              }
              input.click()
            }}
            className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Camera className="w-4 h-4 text-primary-blue" />
            <span className="text-xs font-medium">Photo</span>
          </motion.button>
          
          <motion.button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'video/*'
              input.onchange = (e: any) => {
                const file = e.target.files[0]
                if (file) {
                  alert('Video upload feature coming soon!')
                }
              }
              input.click()
            }}
            className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Video className="w-4 h-4 text-primary-red" />
            <span className="text-xs font-medium">Video</span>
          </motion.button>
          
          <motion.button
            onClick={() => {
              if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const { latitude, longitude } = position.coords
                    const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`
                    setNewMessage(locationUrl)
                    alert(`Location ready! Click send to share:\n${locationUrl}`)
                  },
                  () => {
                    alert('Unable to get your location. Please enable location services.')
                  }
                )
              } else {
                alert('Location not supported on this device')
              }
            }}
            className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MapPin className="w-4 h-4 text-primary-turquoise" />
            <span className="text-xs font-medium">Location</span>
          </motion.button>
          
          <motion.button
            onClick={() => {
              const gifts = ['🎁', '🌹', '💝', '🎉', '💐', '🍫', '🎈', '⭐']
              const randomGift = gifts[Math.floor(Math.random() * gifts.length)]
              setNewMessage(randomGift + ' Gift for you!')
            }}
            className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Gift className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium">Gift</span>
          </motion.button>
        </div>
        
        {/* Message Input Row */}
        <div className="flex items-center gap-3">
              <motion.input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  
                  // Track typing status
                  if (typingChannelRef.current && canChat) {
                    typingChannelRef.current.track({
                      typing: true,
                      userId: userId
                    })
                    
                    // Clear existing timeout
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current)
                    }
                    
                    // Stop typing after 3 seconds of inactivity
                    typingTimeoutRef.current = setTimeout(() => {
                      if (typingChannelRef.current) {
                        typingChannelRef.current.track({
                          typing: false,
                          userId: userId
                        })
                      }
                    }, 3000)
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    // Stop typing when sending
                    if (typingChannelRef.current) {
                      typingChannelRef.current.track({
                        typing: false,
                        userId: userId
                      })
                    }
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current)
                    }
                    handleSend()
                  }
                }}
                placeholder="Type a message..."
                className="relative flex-1 px-4 py-3 text-sm bg-dark-surface border-2 border-white/10 rounded-full focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/20 transition-all duration-300 placeholder:text-neutral-500 text-white"
                disabled={sending}
              />
            <motion.button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="w-12 h-12 rounded-full gradient-turquoise flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg relative overflow-hidden"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9, rotate: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div
                animate={sending ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 1, repeat: sending ? Infinity : 0, ease: "linear" }}
              >
                <Send className="w-5 h-5 text-white relative z-10" />
              </motion.div>
              {!newMessage.trim() && (
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
          </div>
      </motion.div>
    </div>
  )
}

