# ✅ Deployment Checklist - AERO Dating App

## 🚀 Pre-Deployment Checklist

### Code Preparation
- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes (if configured)
- [ ] All TypeScript errors fixed
- [ ] No console errors in browser
- [ ] `.env.local` is NOT committed to Git (check `.gitignore`)

### Configuration Files
- [ ] `vercel.json` created ✅
- [ ] `next.config.js` configured correctly ✅
- [ ] `capacitor.config.ts` ready for production URL ✅
- [ ] `package.json` has correct build scripts ✅

---

## 🌐 Vercel Deployment Steps

### 1. Install Vercel CLI (One-time setup)
```bash
npm i -g vercel
vercel login
```

### 2. Deploy
```bash
# Deploy to production
vercel --prod

# Or deploy preview first
vercel
```

### 3. Configure Environment Variables in Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these (see `ENVIRONMENT_VARIABLES.md` for values):

#### Required:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

#### Optional (for AI bots):
- [ ] `GROQ_API_KEY`
- [ ] `HUGGINGFACE_API_KEY`

**Important:** Add for all environments (Production, Preview, Development)

### 4. Redeploy After Adding Variables
```bash
vercel --prod
```

---

## ✅ Post-Deployment Checklist

### Test Your Live App
- [ ] Visit your Vercel URL: `https://your-app.vercel.app`
- [ ] App loads without errors
- [ ] Sign up works
- [ ] Login works
- [ ] Feed loads profiles
- [ ] Chat works
- [ ] Bot messages work (if using AI)

### Check API Routes
- [ ] `/api/bot-process` works (check Vercel logs)
- [ ] `/api/bot-respond` works
- [ ] No CORS errors

### Android App Update
- [ ] Update `capacitor.config.ts` with Vercel URL:
  ```ts
  server: {
    url: 'https://your-app.vercel.app',
    cleartext: false
  }
  ```
- [ ] Run: `npx cap sync android`
- [ ] Rebuild in Android Studio
- [ ] Test Android app with production URL

---

## 🔧 Supabase Configuration

### CORS Settings (if needed)
In Supabase Dashboard → Settings → API:
- Add your Vercel domain to allowed origins

### Storage Bucket Permissions
- [ ] Verify `profile_media` bucket is accessible
- [ ] Check RLS policies for public read

---

## 📱 Android Build After Deployment

1. **Update Capacitor Config:**
   ```ts
   server: {
     url: 'https://your-app.vercel.app',
     cleartext: false
   }
   ```

2. **Sync:**
   ```bash
   npx cap sync android
   ```

3. **Build in Android Studio:**
   - Open `android/` folder
   - Build → Generate Signed Bundle / APK
   - Install on device

---

## 🐛 Troubleshooting

### Issue: Environment variables not working
- ✅ Check variable names match exactly (case-sensitive)
- ✅ Redeploy after adding variables
- ✅ Check Vercel logs for errors

### Issue: API routes return 404
- ✅ Verify `vercel.json` configuration
- ✅ Check API route files exist in `app/api/`

### Issue: Build fails on Vercel
- ✅ Check build logs in Vercel dashboard
- ✅ Ensure all dependencies in `package.json`
- ✅ Verify Node.js version compatibility

### Issue: Images not loading
- ✅ Check Supabase storage bucket permissions
- ✅ Verify image URLs are accessible
- ✅ Check `next.config.js` image config

---

## 📊 Quick Commands Reference

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel

# View deployment logs
vercel logs

# List deployments
vercel ls

# Sync Android after deployment
npx cap sync android
```

---

## ✅ Final Steps

1. **Deploy to Vercel** ✅
2. **Add environment variables** ✅
3. **Test production URL** ✅
4. **Update Android app** ✅
5. **Build and test Android APK** ✅

**Your app is now live!** 🎉
