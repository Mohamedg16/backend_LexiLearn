# 🔍 Render Deployment Debug Guide

## Current Issue
- ✅ Backend health check works: `https://backend-lexilearn.onrender.com/health`
- ❌ API routes return 404: `https://backend-lexilearn.onrender.com/api/auth/login`

## Root Cause Analysis

The server is running but routes are not being registered. This typically happens when:

1. **Old code is deployed** - Render is running an outdated version
2. **Module loading errors** - Routes fail to load silently
3. **Environment issues** - Missing dependencies or env vars

## Immediate Fixes

### Step 1: Check Render Logs

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your `backend-lexilearn` service
3. Click on "Logs" tab
4. Look for errors during startup, especially:
   - Module not found errors
   - Database connection errors
   - Route registration messages

### Step 2: Verify Environment Variables on Render

Go to your service → Environment tab and ensure these are set:

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

### Step 3: Force Redeploy

1. In Render Dashboard, go to your service
2. Click "Manual Deploy" → "Deploy latest commit"
3. Or push a small change to trigger auto-deploy:

```bash
cd c:\Users\surface\OneDrive\Bureau\ecole\backend
git add .
git commit -m "Force redeploy - fix 404 routes"
git push origin main
```

### Step 4: Verify Build Settings

In Render service settings, confirm:
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Root Directory:** Leave empty (or set to `backend` if your repo has both frontend/backend)

## Testing After Deploy

### Test 1: Health Check
```bash
curl https://backend-lexilearn.onrender.com/health
```

Expected:
```json
{"success":true,"message":"Server is running","timestamp":"..."}
```

### Test 2: Auth Login (Should fail with 401, not 404)
```bash
curl -X POST https://backend-lexilearn.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

Expected (401 Unauthorized or validation error):
```json
{"success":false,"message":"Invalid credentials"}
```

NOT Expected (404):
```json
{"success":false,"message":"Route not found"}
```

### Test 3: Modules Endpoint
```bash
curl https://backend-lexilearn.onrender.com/api/modules
```

Expected (401 because no auth token):
```json
{"success":false,"message":"No token provided"}
```

## Common Issues & Solutions

### Issue: "Cannot find module"
**Solution:** Ensure all imports use correct paths and all dependencies are in `dependencies` (not `devDependencies`)

### Issue: Database connection timeout
**Solution:** 
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify connection string is correct
- Check database user permissions

### Issue: Routes still 404 after redeploy
**Solution:** Add debug logging to `server.js`:

```javascript
// After route mounting (line 102)
console.log('✅ All routes mounted successfully');
console.log('📋 Registered routes:');
app._router.stack.forEach(r => {
    if (r.route) {
        console.log(`  ${Object.keys(r.route.methods)} ${r.route.path}`);
    }
});
```

## Emergency Fallback

If nothing works, create a minimal test endpoint to verify the server is processing requests:

Add to `server.js` after line 87:

```javascript
// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working!',
        routes: {
            auth: '/api/auth/*',
            modules: '/api/modules/*',
            lessons: '/api/lessons/*'
        }
    });
});
```

Then test: `curl https://backend-lexilearn.onrender.com/api/test`

## Next Steps

1. Check Render logs immediately
2. Verify all environment variables
3. Force redeploy
4. Test all three endpoints above
5. If still failing, add debug logging and redeploy again

## Contact Support

If issue persists after all steps:
- Check Render status page: https://status.render.com
- Contact Render support with your service logs
