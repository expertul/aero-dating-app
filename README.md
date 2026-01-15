# 💕 Spark Dating App

A modern, TikTok-inspired dating app built with Next.js, Supabase, and Framer Motion.

## ✨ Features

- 🎬 **TikTok-Style Interface**: Vertical swipe feed with smooth animations
- 💬 **Real-Time Chat**: Instant messaging with typing indicators
- 🎯 **Smart Matching**: AI-powered compatibility scoring
- 📸 **Photo & Video Profiles**: Upload multiple media with video support
- 🛡️ **Safety First**: Block, report, and content moderation features
- 🌍 **Location-Based**: Find matches near you
- 🎨 **Beautiful UI**: Modern design with red, blue, and turquoise theme
- 📱 **Progressive Web App**: Installable on mobile devices

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management**: Zustand
- **Deployment**: Vercel (web), React Native/Capacitor (Android)

## 📦 Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd dating
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**
- Create a new Supabase project at [supabase.com](https://supabase.com)
- Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
- Create a storage bucket named `media` with public access
- Enable Realtime for the `messages` table

4. **Configure environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Database Schema

### Core Tables
- **profiles**: User profile data (name, bio, interests, location)
- **profile_media**: Photos and videos
- **preferences**: User matching preferences
- **likes**: Swipe actions (like, superlike, pass)
- **matches**: Mutual likes
- **messages**: Real-time chat messages
- **blocks**: Blocked users
- **reports**: Safety reports

### Key Features
- **Row Level Security (RLS)**: All tables have security policies
- **Automatic Matching**: Triggers create matches on mutual likes
- **Location-Based**: PostGIS extension for distance calculations
- **Real-Time**: Supabase Realtime for instant updates

## 🎨 Design System

### Colors
- **Primary Red**: `#FF2D55` - Likes, CTAs
- **Primary Blue**: `#2F6BFF` - UI elements, links
- **Turquoise**: `#19D3C5` - Accents, notifications
- **Dark Background**: `#070A0F`
- **Card Background**: `#0F1419`

### Components
- Round buttons with smooth animations
- Glass morphism effects
- Vertical swipe cards
- Smooth spring transitions
- Micro-interactions (haptics ready)

## 🔐 Security

- Supabase Row Level Security (RLS) on all tables
- Users can only access their own data
- Messages only accessible by match participants
- Secure media upload with size/type validation
- Content moderation hooks ready

## 📊 Features Roadmap

### Phase 1: MVP (Current)
- [x] Authentication & Onboarding
- [x] Profile creation with media upload
- [x] TikTok-style swipe feed
- [x] Like/Pass/SuperLike actions
- [x] Automatic matching
- [x] Real-time chat
- [x] Block & Report

### Phase 2: Smart Features
- [ ] AI matching algorithm
- [ ] Profile quality scoring
- [ ] Icebreaker suggestions
- [ ] Video call integration
- [ ] Push notifications
- [ ] User verification (photo verification)

### Phase 3: Growth
- [ ] Advanced filters
- [ ] Premium features (boosts, unlimited likes)
- [ ] Events & group activities
- [ ] Story/feed feature
- [ ] Voice messages
- [ ] GIF support

### Phase 4: Android App
- [ ] React Native conversion
- [ ] Native gestures & haptics
- [ ] Background notifications
- [ ] Play Store deployment

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Deployment

### Web (Vercel)
```bash
vercel deploy
```

### Android (React Native)
1. Convert to React Native using React Native CLI
2. Reuse Supabase client and business logic
3. Add native modules for camera, location, notifications
4. Build APK/AAB and submit to Play Store

### Android (Capacitor - Faster)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npm run build
npx cap copy
npx cap open android
```

## 📖 API Documentation

### Authentication
```typescript
// Sign up
await supabase.auth.signUp({ email, password })

// Sign in
await supabase.auth.signInWithPassword({ email, password })

// Sign out
await supabase.auth.signOut()
```

### Profiles
```typescript
// Get profile
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()

// Update profile
await supabase
  .from('profiles')
  .update({ bio, interests })
  .eq('id', userId)
```

### Likes & Matches
```typescript
// Send like
await supabase
  .from('likes')
  .insert({ from_user: userId, to_user: targetId, kind: 'like' })

// Get matches
const { data } = await supabase
  .from('matches')
  .select('*, profiles(*)')
  .or(`user_a.eq.${userId},user_b.eq.${userId}`)
```

### Real-Time Chat
```typescript
// Subscribe to messages
const channel = supabase
  .channel(`match:${matchId}`)
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      // Handle new message
    }
  )
  .subscribe()
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Design inspiration: Tinder, Bumble, Hinge
- UI inspiration: TikTok
- Built with love using Next.js and Supabase

## 📞 Support

For questions or support:
- Open an issue on GitHub
- Email: support@sparkdating.app
- Discord: [Join our community](#)

---

Made with ❤️ by the Spark team


