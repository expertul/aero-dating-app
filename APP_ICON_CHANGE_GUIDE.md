# 📱 How to Change the AERO App Icon

## Step-by-Step Guide

### 1. **Prepare Your Icon**

You need icons in multiple sizes. Use a tool like [App Icon Generator](https://appicon.co/) or create them manually:

**Required Sizes for Android:**
- 48x48 px (mdpi)
- 72x72 px (hdpi)
- 96x96 px (xhdpi)
- 144x144 px (xxhdpi)
- 192x192 px (xxxhdpi)

**Recommended:**
- Start with a 1024x1024 px square image
- Use a transparent or solid background
- Keep the design simple and recognizable
- Use your brand colors (Red #FF2D55 for AERO)

---

### 2. **Generate Icon Set**

**Option A: Online Tool (Easiest)**
1. Go to https://icon.kitchen/ or https://appicon.co/
2. Upload your 1024x1024 px icon
3. Select "Android" platform
4. Download the generated icon pack

**Option B: Manual Creation**
1. Use Photoshop, Figma, or Canva
2. Create icons in all required sizes
3. Export as PNG format
4. Name them appropriately

---

### 3. **Replace Android Icons**

Navigate to your project's Android resources folder:
```
C:\Users\WwW\Desktop\Antigravity\dating\android\app\src\main\res\
```

Replace icons in these folders:
```
mipmap-mdpi/ic_launcher.png (48x48)
mipmap-hdpi/ic_launcher.png (72x72)
mipmap-xhdpi/ic_launcher.png (96x96)
mipmap-xxhdpi/ic_launcher.png (144x144)
mipmap-xxxhdpi/ic_launcher.png (192x192)
```

**Round Icons** (optional, for Android 7.1+):
```
mipmap-mdpi/ic_launcher_round.png
mipmap-hdpi/ic_launcher_round.png
mipmap-xhdpi/ic_launcher_round.png
mipmap-xxhdpi/ic_launcher_round.png
mipmap-xxxhdpi/ic_launcher_round.png
```

---

### 4. **Update Adaptive Icon (Android 8.0+)**

Navigate to:
```
android\app\src\main\res\mipmap-anydpi-v26\
```

Edit `ic_launcher.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

**Add background color** in `android\app\src\main\res\values\colors.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FF2D55</color>
</resources>
```

---

### 5. **Update PWA Icons (for Web)**

Replace icons in `public/` folder:
```
icon-192.png (192x192)
icon-512.png (512x512)
apple-icon.png (180x180 for iOS)
```

Update `public/manifest.json`:
```json
{
  "name": "AERO Dating",
  "short_name": "AERO",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#FF2D55",
  "background_color": "#070A0F",
  "display": "standalone"
}
```

---

### 6. **Sync and Build**

Run these commands:
```bash
cd C:\Users\WwW\Desktop\Antigravity\dating

# Sync with Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Clean Project: **Build** → **Clean Project**
2. Rebuild: **Build** → **Rebuild Project**
3. Run on device/emulator

---

### 7. **Verify the Icon**

- Check if the new icon appears on device
- Test on different Android versions if possible
- Verify round icon on supported devices
- Check adaptive icon behavior (long-press, animations)

---

## 🎨 Icon Design Tips

### Good Icon Characteristics:
✅ Simple and recognizable at small sizes
✅ High contrast for visibility
✅ Consistent with brand colors
✅ Works well on light and dark backgrounds
✅ No text (unless it's a logo)

### Bad Icon Characteristics:
❌ Too much detail
❌ Low contrast
❌ Thin lines that disappear at small sizes
❌ Complex gradients
❌ Too many colors

---

## 🖼️ AERO Icon Suggestions

Since your app is called AERO, here are some icon ideas:

**Option 1: Letter-based**
- Large "A" letter
- Modern sans-serif font
- Red gradient (#FF2D55)
- White letter on red background

**Option 2: Symbol-based**
- Heart icon (dating theme)
- Airplane/wing (aero theme)
- Spark/flame icon
- Combined heart + wing

**Option 3: Abstract**
- Swoosh/curve representing flight
- Geometric shape with gradient
- Minimalist heart outline

---

## 🛠️ Recommended Tools

**Free Icon Generators:**
- https://icon.kitchen/ - Best for app icons
- https://appicon.co/ - Simple and fast
- https://makeappicon.com/ - All platforms

**Design Tools:**
- Figma (free) - Professional design
- Canva (free) - Easy templates
- Photoshop - Advanced editing
- GIMP (free) - Photoshop alternative

---

## 📝 Quick Command Reference

```bash
# Sync icons to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Clean and rebuild
# (In Android Studio)
Build → Clean Project
Build → Rebuild Project
```

---

## ⚠️ Common Issues

**Issue 1: Icon not changing**
- Solution: Clean and rebuild project in Android Studio
- Uninstall old app from device first

**Issue 2: Icon looks pixelated**
- Solution: Use higher resolution source image
- Make sure all icon sizes are properly exported

**Issue 3: Adaptive icon not working**
- Solution: Check Android version (requires 8.0+)
- Verify `ic_launcher.xml` is properly configured

---

## ✅ Checklist

- [ ] Created 1024x1024 px icon design
- [ ] Generated all required sizes
- [ ] Replaced icons in `mipmap-*` folders
- [ ] Updated adaptive icon XML
- [ ] Updated PWA icons in `public/`
- [ ] Updated `manifest.json`
- [ ] Synced with Capacitor
- [ ] Clean + rebuild in Android Studio
- [ ] Tested on device
- [ ] Verified icon on home screen

---

**Your new icon is ready!** 🎉
