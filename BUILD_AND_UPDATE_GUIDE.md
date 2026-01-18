# 📱 Build APK & Update Guide - AERO App

## 🚀 Building Your APK

### Step 1: Sync Capacitor (Already Done ✅)
```bash
npx cap sync android
```

### Step 2: Open in Android Studio

1. **Open Android Studio**
2. **File** → **Open**
3. Navigate to: `C:\Users\WwW\Desktop\Antigravity\dating\android`
4. Click **OK**
5. Wait for Gradle sync to complete (bottom right)

### Step 3: Build APK

**Option A: Build Debug APK (For Testing)**

1. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build to complete
3. Click **"locate"** when notification appears
4. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

**Option B: Build Release APK (For Distribution)**

1. **Build** → **Generate Signed Bundle / APK**
2. Select **APK** → **Next**
3. **Create new keystore** (first time only):
   - Keystore path: Choose location (e.g., `C:\Users\WwW\Desktop\aero-keystore.jks`)
   - Password: Create strong password (save it!)
   - Key alias: `aero-key`
   - Key password: Same or different (save it!)
   - Validity: 25 years
   - Certificate info: Fill your details
   - Click **OK**
4. Select your keystore → Enter passwords
5. **Build variant**: `release`
6. Click **Finish**
7. APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔄 How to Update Your App

### ✅ **Good News: Most Updates Are Automatic!**

Since your app loads from Vercel (`https://aero-dating-app.vercel.app`), **most updates happen automatically** without rebuilding the APK!

### Update Types:

#### 1. **Web Updates (Automatic - No APK Rebuild Needed)**

**What this covers:**
- ✅ UI changes
- ✅ New features
- ✅ Bug fixes
- ✅ Design updates
- ✅ App logic changes
- ✅ Database changes

**How to update:**
1. Make changes to your code
2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Update: your changes"
   git push origin main
   ```
3. Vercel **automatically deploys** (if auto-deploy is enabled)
4. Users get the update **instantly** when they open the app!

**No APK rebuild needed!** 🎉

#### 2. **Native Updates (Requires APK Rebuild)**

**What this covers:**
- ❌ New Capacitor plugins
- ❌ Android permissions changes
- ❌ App icon/name changes
- ❌ Native code changes
- ❌ App version number changes

**How to update:**
1. Make changes to your code
2. Sync Capacitor:
   ```bash
   npx cap sync android
   ```
3. Open Android Studio
4. **Build** → **Generate Signed Bundle / APK**
5. Build new APK
6. **Distribute** the new APK to users

---

## 📋 Update Checklist

### For Web Updates (Automatic):
- [ ] Make code changes
- [ ] Test locally: `npm run dev`
- [ ] Commit and push to GitHub
- [ ] Vercel auto-deploys
- [ ] Test on live URL
- [ ] Done! Users get update automatically

### For Native Updates (APK Rebuild):
- [ ] Make code changes
- [ ] Run: `npx cap sync android`
- [ ] Open Android Studio
- [ ] Build new APK
- [ ] Test APK on device
- [ ] Distribute to users (Google Play, direct download, etc.)

---

## 🔧 Common Update Scenarios

### Scenario 1: "I changed the app design"
→ **Automatic update** - Just push to GitHub, Vercel deploys, users see it immediately!

### Scenario 2: "I added a new feature"
→ **Automatic update** - Push to GitHub, done!

### Scenario 3: "I need to add camera permission"
→ **APK rebuild needed** - Sync, rebuild APK, redistribute

### Scenario 4: "I want to change the app icon"
→ **APK rebuild needed** - Update icon, sync, rebuild APK

### Scenario 5: "I updated Supabase database"
→ **Automatic update** - Just push code changes, no APK needed

---

## 📱 Distributing Your APK

### Option 1: Direct Download
- Upload APK to your website
- Users download and install
- Enable "Install from unknown sources" on their device

### Option 2: Google Play Store
1. Create developer account ($25 one-time fee)
2. Create app listing
3. Upload APK/AAB
4. Submit for review
5. Publish!

### Option 3: Internal Testing
- Use Google Play Console internal testing
- Share link with testers
- No review needed

---

## ⚙️ Version Management

### Update App Version (When Rebuilding APK)

1. **Update in `package.json`:**
   ```json
   "version": "1.0.1"
   ```

2. **Update in `android/app/build.gradle`:**
   ```gradle
   versionCode 2
   versionName "1.0.1"
   ```

3. **Sync and rebuild:**
   ```bash
   npx cap sync android
   ```

---

## 🎯 Best Practices

1. **Test on Vercel first** - Make sure web version works before rebuilding APK
2. **Version your releases** - Keep track of APK versions
3. **Save your keystore** - You'll need it for all future updates!
4. **Backup keystore** - Store it safely (can't recover if lost)
5. **Test updates** - Always test on a real device before distributing

---

## 🚨 Important Notes

- **Keystore Password**: Save it! You'll need it for every release APK
- **Debug vs Release**: Use debug for testing, release for distribution
- **Auto-updates**: Web changes = instant updates, no APK rebuild needed
- **Native changes**: Require APK rebuild and redistribution

---

## ✅ Quick Reference

**Web update (automatic):**
```bash
git push origin main
# Vercel auto-deploys → Users get update instantly
```

**Native update (APK rebuild):**
```bash
npx cap sync android
# Open Android Studio → Build APK → Distribute
```

---

**Your app is now ready to build!** 🚀
