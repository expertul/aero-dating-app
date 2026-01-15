# ⚡ Quick Start Guide

Get Spark Dating running in 5 minutes!

## 1️⃣ Install Dependencies

```bash
npm install
```

## 2️⃣ Set Up Supabase

### Create Project
1. Visit [supabase.com](https://supabase.com) → **New Project**
2. Name it `spark-dating` (or anything you like)
3. Choose a secure database password

### Run Database Setup
1. Go to **SQL Editor** in Supabase dashboard
2. Copy all contents from `supabase/schema.sql`
3. Paste and click **Run**

### Create Storage Bucket
1. Go to **Storage** → **New Bucket**
2. Name: `media`
3. Set to **Public** ✅
4. Click **Create**

## 3️⃣ Configure Environment

Create `.env.local`:

```bash
cp .env.example .env.local
```

Get your keys from **Settings** → **API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
https://mfdsbkidrowfrnkhtyit.supabase.co
## 4️⃣ Run the App

```bash
npm run dev
```

Open **http://localhost:3000** 🎉

## 5️⃣ Create Your First Account

1. Click **Sign up**
2. Fill in basic info
3. Upload at least 2 photos
4. Write a bio
5. Choose interests
6. Start swiping!

---

## 🧪 Testing Matches

Need two accounts to test matching:

**Browser 1** (Normal window):
```
Email: alice@example.com
```

**Browser 2** (Incognito):
```
Email: bob@example.com
```

Like each other → Match! 🎊

---

## 🐛 Common Issues

### Photos won't upload?
- Bucket must be **Public**
- Check `.env.local` has correct Supabase URL

### Can't sign up?
- Check **Authentication** is enabled in Supabase
- Email provider should be ON

### Messages not real-time?
- Enable Realtime in **Database** → **Replication**
- Enable for `messages` and `matches` tables

---

## 🚀 Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Initial commit"
git push

# Then in Vercel:
# 1. Import repository
# 2. Add environment variables
# 3. Deploy!
```

---

## 📱 Convert to Android

### Option A: Capacitor (Fastest)
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npx cap add android
npm run build
npx cap copy
npx cap open android
```

### Option B: React Native (More Native)
- Reuse all `lib/` and business logic
- Recreate UI with React Native components
- Use `@supabase/supabase-js` (same client!)

---

## 🎯 Next Features to Add

- [ ] Video profiles (already supported in schema!)
- [ ] Push notifications
- [ ] User verification
- [ ] AI matching algorithm
- [ ] Voice messages
- [ ] Story feature
- [ ] Group dating events

---

## 💡 Pro Tips

1. **Use the browser DevTools** to test mobile responsive
2. **Check Supabase Logs** for debugging (Settings → Logs)
3. **Enable RLS policies** for security (already done in schema)
4. **Test with real images** for best experience

---

## 📚 Full Documentation

See [README.md](./README.md) for complete docs.

Need help? Check [SETUP.md](./SETUP.md) for detailed setup.

---

**Happy Dating! 💕**


