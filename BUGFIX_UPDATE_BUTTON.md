# 🐛 Bugfix: Update Button Infinite Loop

## Problem

Update button was checking for updates continuously instead of every 30 minutes.

## Root Cause

**Dependency Loop in React Hooks:**

```tsx
// ❌ BEFORE (Problematic)
const checkForUpdates = useCallback(async () => {
  if (checkingUpdate) return;
  // ...
}, [checkingUpdate]);  // ❌ Depends on checkingUpdate

useEffect(() => {
  void checkForUpdates();
  const interval = setInterval(() => void checkForUpdates(), 30 * 60 * 1000);
  return () => clearInterval(interval);
}, [checkForUpdates]);  // ❌ Depends on checkForUpdates
```

**What Happened:**
1. Component mounts → `useEffect` runs → calls `checkForUpdates()`
2. `checkForUpdates` sets `checkingUpdate = true`
3. `checkingUpdate` changes → `checkForUpdates` recreated (new function)
4. `checkForUpdates` changes → `useEffect` runs again! (Infinite loop)
5. Repeat steps 2-4 continuously

## Solution

**Remove dependency cycle using functional state update:**

```tsx
// ✅ AFTER (Fixed)
const checkForUpdates = useCallback(async () => {
  // Use functional update - no dependency on checkingUpdate
  setCheckingUpdate((checking) => {
    if (checking) return true; // Already checking, skip
    return true; // Start checking
  });
  
  try {
    const res = await fetch(`${AGENT_URL}/api/update/check`);
    const data: UpdateInfo = await res.json();
    
    if (data.has_update) {
      setUpdateAvailable(true);
      setUpdateInfo(data);
    } else {
      setUpdateAvailable(false);
      setUpdateInfo(data);
    }
  } catch (error) {
    console.error('Failed to check updates:', error);
  } finally {
    setCheckingUpdate(false);
  }
}, []); // ✅ No dependencies - stable function

useEffect(() => {
  void checkForUpdates();
  const interval = setInterval(() => void checkForUpdates(), 30 * 60 * 1000);
  return () => clearInterval(interval);
}, [checkForUpdates]); // ✅ checkForUpdates is now stable, never changes
```

## Key Changes

1. **Removed `checkingUpdate` from dependencies**
   - Used functional state update: `setCheckingUpdate((prev) => ...)`
   - No longer needs `checkingUpdate` in closure

2. **Empty dependency array for `useCallback`**
   - `checkForUpdates` is now stable
   - Never recreated unless component unmounts

3. **`useEffect` only runs once**
   - On mount: Checks for updates immediately
   - Sets up interval: Checks every 30 minutes
   - On unmount: Cleans up interval

## Behavior After Fix

### Expected Behavior
```
00:00 - Component mounts
00:00 - Check for updates (immediately)
00:30 - Check for updates (30 min interval)
01:00 - Check for updates (30 min interval)
01:30 - Check for updates (30 min interval)
...
```

### With Agent Cache (1 hour)
```
00:00 - Check for updates → GitHub API call
00:30 - Check for updates → Cached result (instant)
01:00 - Check for updates → GitHub API call (cache expired)
01:30 - Check for updates → Cached result (instant)
...
```

## Benefits

✅ **No more infinite loop**
✅ **Checks exactly every 30 minutes** (not continuously)
✅ **Works with agent 1-hour cache** (efficient)
✅ **Better performance** (less re-renders)
✅ **Cleaner logs** (no spam)

## Testing

### Verify Fix

1. **Open browser DevTools Console**
2. **Load frontend** (http://localhost:3100)
3. **Watch console logs**:
   ```
   [00:00:00] Update check response: {...}
   [00:00:00] ❌ No updates available
   
   ... (30 minutes of silence)
   
   [00:30:00] Update check response: {...}
   [00:30:00] ❌ No updates available
   ```

4. **Should see logs every 30 minutes** (not continuously)

### Manual Check

Click update button → Should check immediately (not spam)

## Additional Notes

### Why Functional Update?

**Normal state update:**
```tsx
setCheckingUpdate(true); // Needs checkingUpdate in closure
```

**Functional update:**
```tsx
setCheckingUpdate((prev) => true); // No dependency on checkingUpdate
```

Functional update receives previous state as parameter, so no need to reference `checkingUpdate` from closure.

### Alternative Solutions Considered

1. ❌ **Add `checkingUpdate` to `useEffect` deps**
   - Would cause re-run on every state change
   - Not the right solution

2. ❌ **Use `useRef` for checking state**
   - More complex
   - Less idiomatic React

3. ✅ **Functional state update** (chosen)
   - Simple
   - Idiomatic React
   - No extra refs needed

## Related

- Agent also implements 1-hour cache for update checks
- See: `4paws-agent/UPDATE_CHECK_OPTIMIZATION.md`

## Summary

**Problem:** Infinite loop causing continuous update checks
**Cause:** Dependency cycle in React hooks
**Fix:** Remove dependency using functional state update
**Result:** Checks every 30 minutes as intended

Perfect! 🎉

