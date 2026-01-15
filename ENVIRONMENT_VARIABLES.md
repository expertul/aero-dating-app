# 🔐 Environment Variables - Production Setup

## Required Environment Variables

Copy these to **Vercel Dashboard → Settings → Environment Variables**

### ✅ Supabase (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find:**
- **Supabase Dashboard** → Project Settings → API
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon` `public` key
- `SUPABASE_SERVICE_ROLE_KEY` = `service_role` `secret` key

### ✅ AI Services (Optional - for smart bot features)

```
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

**Where to get:**
- **Groq:** https://console.groq.com/keys
- **Hugging Face:** https://huggingface.co/settings/tokens

---

## 📝 How to Add in Vercel

1. Go to **Vercel Dashboard**
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add each variable for **Production**, **Preview**, and **Development**
6. Click **Save**
7. **Redeploy** your app

---

## 🔍 Verify Variables Are Set

After deployment, check in Vercel:
- **Deployments** → Click latest deployment → **View Logs**
- Look for environment variable loading

---

## ⚠️ Important Notes

1. **Never commit** `.env.local` to Git
2. **Service Role Key** is secret - never expose to client
3. Variables starting with `NEXT_PUBLIC_` are available in browser
4. Variables without `NEXT_PUBLIC_` are server-side only

---

## 🧪 Test After Deployment

1. Visit your Vercel URL
2. Check browser console for errors
3. Test authentication (sign up/login)
4. Test bot features (if using AI services)
