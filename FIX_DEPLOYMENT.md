# 🚀 Fix 404 Errors - Deployment Instructions

## Problem Summary
- Frontend: `https://lexilearn-lige.onrender.com`
- Backend: `https://backend-lexilearn.onrender.com`
- Issue: All API routes return 404 (routes not registered)

## What I Fixed
1. ✅ Added `/api/test` endpoint to verify routing
2. ✅ Added debug logging to track route registration
3. ✅ Enhanced 404 handler with better error messages
4. ✅ Created test script to verify endpoints

## Deploy to Render - STEP BY STEP

### Option 1: Push to Git (Recommended)

```powershell
# Navigate to backend folder
cd c:\Users\surface\OneDrive\Bureau\ecole\backend

# Check git status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Fix: Add debug endpoints and logging for 404 route issues"

# Push to trigger Render auto-deploy
git push origin main
```

### Option 2: Manual Deploy on Render

1. Go to https://dashboard.render.com
2. Find your `backend-lexilearn` service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait 3-5 minutes for deployment

## After Deployment - Verify Fix

### Test 1: Check new test endpoint
Open in browser or run:
```powershell
curl https://backend-lexilearn.onrender.com/api/test
```

**Expected:** Should return JSON with all available routes

### Test 2: Check auth endpoint
```powershell
curl -X POST https://backend-lexilearn.onrender.com/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test\",\"password\":\"test\"}'
```

**Expected:** Should return 400 or 401 (NOT 404!)

### Test 3: Run full test suite
```powershell
cd c:\Users\surface\OneDrive\Bureau\ecole\backend
$env:TEST_URL='https://backend-lexilearn.onrender.com'
node test-api.js
```

**Expected:** All tests should pass

## Check Render Logs

1. Go to Render Dashboard → Your Service → Logs
2. Look for these messages after deployment:
   ```
   ✅ All API routes mounted successfully
   📋 Available endpoints:
      - GET  /health
      - GET  /api/test
      - POST /api/auth/login
      ...
   ```

3. If you see errors, look for:
   - "Cannot find module" → Missing dependency
   - "ECONNREFUSED" → Database connection issue
   - "SyntaxError" → Code error

## If Still Not Working

### Check Environment Variables on Render

Go to Service → Environment tab and verify ALL these are set:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://rahmouniimad301_db_user:Imad.2000@ac-dpslzqc-shard-00-00.72vuldr.mongodb.net:27017,ac-dpslzqc-shard-00-01.72vuldr.mongodb.net:27017,ac-dpslzqc-shard-00-02.72vuldr.mongodb.net:27017/ecole?ssl=true&authSource=admin
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production_min_32_characters_long
JWT_REFRESH_SECRET=your_refresh_token_secret_here_change_in_production_min_32_chars_long
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=https://lexilearn-lige.onrender.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=coderise.team@gmail.com
EMAIL_PASS=qgcrrhgkgptjvlxc
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BYTEZ_API_KEY=67609a34774684262846114e90b93f9c
ASSEMBLYAI_API_KEY=bab74404f4c349909532f5763de74834
```

### Check Build Settings

- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Node Version:** 18 or higher

## Frontend Will Work Automatically

Once backend routes are fixed, the frontend will automatically work because:
- ✅ Frontend API config is correct: `https://backend-lexilearn.onrender.com/api`
- ✅ CORS is configured correctly
- ✅ All endpoints match

## Timeline

1. **Now:** Push code to Git
2. **3-5 min:** Render auto-deploys
3. **Immediately after:** Test endpoints
4. **If working:** Frontend will connect automatically

## Success Criteria

✅ `/api/test` returns route list
✅ `/api/auth/login` returns 400/401 (not 404)
✅ `/api/modules` returns 401 (not 404)
✅ Frontend can login and fetch data

## Need Help?

If deployment fails:
1. Check Render logs for specific error
2. Share the error message
3. Verify all environment variables are set
