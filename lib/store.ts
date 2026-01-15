import { create } from 'zustand'

interface Profile {
  id: string
  name: string
  birthday: string
  bio: string | null
  gender: string | null
  interests: string[]
  city: string | null
  verified: boolean
  media: ProfileMedia[]
  distance?: number
}

interface ProfileMedia {
  id: string
  media_type: 'photo' | 'video'
  storage_path: string
  thumbnail_path: string | null
  display_order: number
}

interface Match {
  id: string
  user_a: string
  user_b: string
  created_at: string
  profile: Profile
  unread_count: number
}

interface Message {
  id: string
  match_id: string
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
}

interface AppState {
  currentUser: Profile | null
  setCurrentUser: (user: Profile | null) => void
  
  feedProfiles: Profile[]
  setFeedProfiles: (profiles: Profile[]) => void
  addFeedProfile: (profile: Profile) => void
  removeCurrentProfile: () => void
  
  matches: Match[]
  setMatches: (matches: Match[]) => void
  addMatch: (match: Match) => void
  
  currentChat: {
    match: Match | null
    messages: Message[]
  }
  setCurrentChat: (match: Match | null, messages: Message[]) => void
  addMessage: (message: Message) => void
  
  showMatchModal: Profile | null
  setShowMatchModal: (profile: Profile | null) => void
  
  unreadMessageCount: number
  setUnreadMessageCount: (count: number) => void
  
  likesYouCount: number
  setLikesYouCount: (count: number) => void
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  feedProfiles: [],
  setFeedProfiles: (profiles) => set({ feedProfiles: profiles }),
  addFeedProfile: (profile) => set((state) => ({ 
    feedProfiles: [...state.feedProfiles, profile] 
  })),
  removeCurrentProfile: () => set((state) => ({ 
    feedProfiles: state.feedProfiles.slice(1) 
  })),
  
  matches: [],
  setMatches: (matches) => set({ matches }),
  addMatch: (match) => set((state) => ({ 
    matches: [match, ...state.matches] 
  })),
  
  currentChat: {
    match: null,
    messages: []
  },
  setCurrentChat: (match, messages) => set({ 
    currentChat: { match, messages } 
  }),
  addMessage: (message) => set((state) => ({
    currentChat: {
      ...state.currentChat,
      messages: [...state.currentChat.messages, message]
    }
  })),
  
  showMatchModal: null,
  setShowMatchModal: (profile) => set({ showMatchModal: profile }),
  
  unreadMessageCount: 0,
  setUnreadMessageCount: (count) => set({ unreadMessageCount: count }),
  
  likesYouCount: 0,
  setLikesYouCount: (count) => set({ likesYouCount: count }),
}))

