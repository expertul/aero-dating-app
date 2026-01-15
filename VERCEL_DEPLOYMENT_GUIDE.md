# 🚀 Vercel Deployment Guide - AERO Dating App

## ✅ Step-by-Step Deployment

### 1. **Prepare Your Code**

Make sure your code is ready:
- ✅ Build passes: `npm run build`
- ✅ No TypeScript errors
- ✅ Environment variables documented

### 2. **Deploy to Vercel**

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Option B: Using GitHub Integration

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js configuration

### 3. **Configure Environment Variables**

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

#### Required Variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Optional (for AI bots):
```
GROQ_API_KEY=your_groq_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

**Important:** 
- Add these for **Production**, **Preview**, and **Development** environments
- After adding, **redeploy** for changes to take effect

### 4. **Update Capacitor Config for Production**

After deployment, update `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aero.dating',
  appName: 'AERO',
  webDir: 'public',
  server: {
    url: 'https://your-app.vercel.app', // Replace with your Vercel URL
    cleartext: false // Use HTTPS
  }
};

export default config;
```

### 5. **Build Commands**

Vercel will automatically:
- ✅ Detect Next.js framework
- ✅ Run `npm install`
- ✅ Run `npm run build`
- ✅ Deploy your app

### 6. **Custom Domain (Optional)**

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 7. **Update Android App After Deployment**

Once deployed:

```bash
# Update capacitor config with production URL
# (Already done above)

# Sync to Android
npx cap sync android

# Rebuild in Android Studio
```

---

## 🔧 Production Checklist

### ✅ Before Deployment

- [ ] All environment variables set in Vercel
- [ ] `next.config.js` configured correctly
- [ ] `vercel.json` created (optional, for custom config)
- [ ] Build passes locally (`npm run build`)
- [ ] Supabase project is live and accessible
- [ ] CORS configured in Supabase (if needed)

### ✅ After Deployment

- [ ] Test production URL in browser
- [ ] Test all API routes (`/api/bot-process`, etc.)
- [ ] Verify Supabase connection works
- [ ] Update `capacitor.config.ts` with production URL
- [ ] Sync Android app: `npx cap sync android`
- [ ] Test Android app with production URL

---

## 🌐 Vercel Configuration Files

### `vercel.json` (Already Created)
- ✅ Framework detection
- ✅ API route headers
- ✅ CORS configuration

### Environment Variables Needed:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# AI Services (Optional - for bot features)
GROQ_API_KEY=xxxxx
HUGGINGFACE_API_KEY=xxxxx
```

---

## 🚨 Common Issues & Fixes

### Issue 1: Build Fails
**Fix:** Check build logs in Vercel dashboard for specific errors

### Issue 2: API Routes Return 404
**Fix:** Ensure `vercel.json` is configured correctly for API routes

### Issue 3: Environment Variables Not Working
**Fix:** 
- Add variables in Vercel dashboard
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

### Issue 4: CORS Errors
**Fix:**
- Update Supabase CORS settings
- Check `vercel.json` headers configuration
- Ensure API routes return proper headers

### Issue 5: Images Not Loading
**Fix:**
- Verify `next.config.js` image configuration
- Check Supabase storage bucket permissions
- Ensure image URLs are accessible

---

## 📱 Android App Updates

After deploying to Vercel:

1. **Update Capacitor Config:**
   ```ts
   server: {
     url: 'https://your-app.vercel.app',
     cleartext: false
   }
   ```

2. **Sync Android:**
   ```bash
   npx cap sync android
   ```

3. **Build APK/AAB:**
   - Open in Android Studio
   - Build → Generate Signed Bundle / APK
   - Test on device

---

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✅ Quick Deploy Command

Once everything is set up:

```bash
vercel --prod
```

Or just push to GitHub if you have auto-deploy enabled!

---

**Your app will be live at:** `https://your-app.vercel.app`

After deployment, update `capacitor.config.ts` with your Vercel URL and sync Android! 🚀
