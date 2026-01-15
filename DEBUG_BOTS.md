# 🔍 Debug Bots Not Showing

## Quick Checks

### 1. Verify Bots Exist
Visit: `http://localhost:3000/api/test-bots`

Should show:
```json
{
  "success": true,
  "botCount": 5,
  "bots": [...]
}
```

### 2. Check Feed Query
The feed now:
- ✅ Excludes bots from main query (to avoid duplicates)
- ✅ Adds bots separately at the start
- ✅ Bots bypass all filters (gender, distance, age)
- ✅ Bots always appear first in feed

### 3. Common Issues

**Bots not in database?**
- Go to `/admin/bots`
- Click "Initialize Bots"
- Check results

**Bots filtered out?**
- Bots now bypass ALL filters
- They appear at the start of feed
- Check browser console for errors

**Gender filter issue?**
- Bots are added separately, not affected by gender filter
- They should appear regardless

**Distance filter issue?**
- Bots bypass distance filter
- They always appear

### 4. Force Show Bots

Bots are now:
- ✅ Always visible (shouldShowBots returns true)
- ✅ Added at start of feed
- ✅ Not affected by any filters
- ✅ Limited to 5 bots max

### 5. Test

1. Refresh feed page
2. Bots should appear FIRST
3. If still not showing, check:
   - Browser console for errors
   - Network tab for API calls
   - `/api/test-bots` endpoint

---

**If still not working**, check:
- Are bots actually created? (check `/api/test-bots`)
- Are there any JavaScript errors?
- Is the feed loading at all?

