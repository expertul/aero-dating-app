# 🚀 Spark Dating App - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works fine)
- Git

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in your project details
4. Wait for the project to be created (takes ~2 minutes)

### 2.2 Run the Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute

This will create:
- All necessary tables (profiles, matches, messages, etc.)
- Row Level Security policies
- Indexes for performance
- Triggers for automatic matching

### 2.3 Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click "New Bucket"
3. Name it `media`
4. Set it to **Public** (important!)
5. Click "Create Bucket"

### 2.4 Set Up Storage Policies

In the Storage section, click on your `media` bucket, then go to "Policies":

**Allow authenticated users to upload:**
```sql
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Allow public read access:**
```sql
CREATE POLICY "Anyone can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
```

**Allow users to delete their own media:**
```sql
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Get your Supabase credentials:
   - Go to **Project Settings** > **API**
   - Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
   - Copy the **anon public** key
   - Copy the **service_role** key (keep this secret!)

3. Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Enable Authentication

In Supabase dashboard:

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider (enabled by default)
3. Optional: Enable social providers (Google, Facebook, etc.)

## Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: Test the App

### Create Your First Account

1. Go to `/auth`
2. Click "Sign up"
3. Enter your details
4. Complete the onboarding flow
5. Start swiping!

### Test Matching

To test matching, you'll need two accounts:
1. Open the app in a normal browser window
2. Open the app in an incognito/private window
3. Create two different accounts
4. Complete profiles for both
5. Like each other to create a match

## Optional: Enable Realtime

The app uses Supabase Realtime for live chat. To enable:

1. Go to **Database** > **Replication**
2. Enable replication for the `messages` table
3. Enable replication for the `matches` table

## Troubleshooting

### Issue: Can't upload photos

**Solution:**
- Make sure the `media` bucket is set to **Public**
- Check that storage policies are set up correctly
- Verify your `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`

### Issue: RLS (Row Level Security) errors

**Solution:**
- Ensure you ran the complete `schema.sql` file
- Check that all RLS policies were created
- Go to **Authentication** > **Policies** to verify

### Issue: Messages not appearing in real-time

**Solution:**
- Enable Realtime replication for the `messages` table
- Check browser console for errors
- Verify your Supabase connection

### Issue: "User already registered" error

**Solution:**
- Check **Authentication** > **Users** in Supabase
- Delete test users if needed
- Or use the "Sign in" option instead

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables (same as `.env.local`)
4. Deploy!

### Update Next.js Config

Edit `next.config.js` to add your Supabase domain:

```javascript
module.exports = {
  images: {
    domains: ['your-project.supabase.co'],
  },
}
```

## Next Steps

### Enable Location Features

1. Add PostGIS extension (already done in schema)
2. Implement geolocation in the app
3. Update user location on profile save

### Add Push Notifications

1. Set up Firebase Cloud Messaging
2. Add service worker for web push
3. Subscribe users to notifications

### Implement AI Matching

1. Add OpenAI API key to `.env.local`
2. Create Supabase Edge Function for matching
3. Use embeddings for interest similarity

## Support

- 📧 Email: support@sparkdating.app
- 📖 Docs: [Full Documentation](./README.md)
- 🐛 Issues: [GitHub Issues](#)

---

Made with ❤️ by the Spark team


