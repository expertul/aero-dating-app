# 🔧 Fix GitHub Account - Change from tibihow-afk to expertul

## The Problem

Git is using the wrong GitHub account (`tibihow-afk`) instead of `expertul`.

## Solution: Clear Old Credentials

### Method 1: Using Windows Credential Manager (Easiest)

1. **Open Credential Manager:**
   - Press `Windows Key` + `R`
   - Type: `control /name Microsoft.CredentialManager`
   - Press Enter
   - Or search for "Credential Manager" in Windows Start Menu

2. **Find and Delete GitHub Credentials:**
   - Click **"Windows Credentials"** tab
   - Look for entries like:
     - `git:https://github.com`
     - `github.com`
   - Click on them → Click **"Remove"**
   - Remove ALL GitHub-related entries

3. **Try Pushing Again:**
   ```bash
   git push -u origin main
   ```
   - It will ask for username/password
   - Username: `expertul`
   - Password: Use a Personal Access Token (not your password)

### Method 2: Using Command Line (Faster)

Run these commands:

```bash
# Clear stored credentials
git config --global --unset credential.helper
git config --global credential.helper manager-core

# Clear Windows credentials for GitHub
cmdkey /list | findstr github
# If you see any, delete them:
cmdkey /delete:git:https://github.com
```

### Method 3: Use Personal Access Token (Recommended)

1. **Create Token:**
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Name: `Vercel Deployment`
   - Select scope: ✅ `repo` (all checkboxes)
   - Generate and **COPY THE TOKEN**

2. **Push with Token:**
   ```bash
   git push -u origin main
   ```
   - Username: `expertul`
   - Password: **Paste your Personal Access Token**

---

## Quick Steps Summary:

1. ✅ Clear old credentials (Method 1 or 2)
2. ✅ Create Personal Access Token
3. ✅ Push with new credentials

---

Let me know which method you want to use!
