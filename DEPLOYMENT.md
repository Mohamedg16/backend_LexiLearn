# 🚀 Deployment Guide

This guide will help you deploy your LexiLearn backend to production.

---

## 📋 Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] Environment variables configured
- [ ] MongoDB Atlas account created
- [ ] Frontend connected and tested
- [ ] Security measures verified
- [ ] API documentation reviewed

---

## 🌐 Recommended Hosting Platforms

### Backend Hosting
1. **Render** (Recommended) - Free tier available
2. **Railway** - Easy deployment
3. **Heroku** - Popular choice
4. **Fly.io** - Modern platform
5. **DigitalOcean App Platform** - Scalable

### Database Hosting
- **MongoDB Atlas** (Recommended) - Free tier: 512MB storage

---

## 🗄 MongoDB Atlas Setup

### 1. Create Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Verify email

### 2. Create Cluster
1. Click "Build a Database"
2. Choose **FREE** tier (M0)
3. Select cloud provider and region (closest to your users)
4. Name your cluster (e.g., "educational-platform")
5. Click "Create"

### 3. Configure Security

**Database Access:**
1. Go to "Database Access"
2. Click "Add New Database User"
3. Create username and strong password
4. Set role to "Read and write to any database"
5. Click "Add User"

**Network Access:**
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note:** For production, restrict to your hosting platform's IPs
4. Click "Confirm"

### 4. Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `educational-platform`

**Example:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/educational-platform?retryWrites=true&w=majority
```

---

## 🚀 Deployment to Render

### 1. Prepare Repository
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/yourusername/educational-platform-backend.git
git push -u origin main
```

### 2. Create Render Account
1. Go to [Render](https://render.com)
2. Sign up with GitHub

### 3. Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name:** educational-platform-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### 4. Set Environment Variables
Click "Environment" and add:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/educational-platform
JWT_SECRET=your_production_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_production_refresh_secret_min_32_chars
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=https://your-frontend-url.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important:** Generate new, secure JWT secrets for production!

### 5. Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your API will be available at: `https://your-app-name.onrender.com`

### 6. Seed Production Database
```bash
# SSH into Render or use Render Shell
npm run seed
```

---

## 🚀 Deployment to Railway

### 1. Create Railway Account
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub

### 2. Create New Project
1. Click "New Project"
2. Choose "Deploy from GitHub repo"
3. Select your repository

### 3. Configure Environment
1. Click on your service
2. Go to "Variables"
3. Add all environment variables (same as Render)

### 4. Configure Start Command
1. Go to "Settings"
2. Set Start Command: `npm start`
3. Set Build Command: `npm install`

### 5. Deploy
- Railway automatically deploys
- Your API will be at: `https://your-app.railway.app`

---

## 🚀 Deployment to Heroku

### 1. Install Heroku CLI
```bash
# Windows (with Chocolatey)
choco install heroku-cli

# Or download from https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Login to Heroku
```bash
heroku login
```

### 3. Create Heroku App
```bash
cd backend
heroku create educational-platform-api
```

### 4. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your_mongodb_atlas_uri"
heroku config:set JWT_SECRET="your_jwt_secret"
heroku config:set JWT_REFRESH_SECRET="your_refresh_secret"
heroku config:set FRONTEND_URL="https://your-frontend.com"
```

### 5. Deploy
```bash
git push heroku main
```

### 6. Seed Database
```bash
heroku run npm run seed
```

---

## 🔒 Production Security Checklist

### Environment Variables
- [ ] Strong JWT secrets (32+ characters, random)
- [ ] MongoDB Atlas connection string
- [ ] NODE_ENV set to "production"
- [ ] FRONTEND_URL set to production URL
- [ ] Email credentials (if using)

### MongoDB Atlas
- [ ] Strong database user password
- [ ] IP whitelist configured
- [ ] Backup enabled
- [ ] Monitoring enabled

### Application Security
- [ ] Rate limiting enabled
- [ ] CORS configured with production frontend URL
- [ ] Helmet security headers active
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose sensitive info

### Code Security
- [ ] No sensitive data in code
- [ ] .env file in .gitignore
- [ ] Dependencies up to date
- [ ] No console.logs with sensitive data

---

## 📊 Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-api-url.com/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Test Authentication
```bash
curl -X POST https://your-api-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.com","password":"Admin123!"}'
```

### 3. Test Protected Endpoint
```bash
curl -X GET https://your-api-url.com/api/modules \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Check Database Connection
- Login to admin account
- Verify data is accessible
- Test CRUD operations

---

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
      working-directory: ./backend
    
    - name: Run tests (if you have them)
      run: npm test
      working-directory: ./backend
    
    # Add deployment steps for your platform
```

---

## 📈 Monitoring & Maintenance

### Logging
- Use platform's built-in logging (Render, Railway, Heroku)
- Monitor error rates
- Track API response times

### Database Monitoring
- MongoDB Atlas provides free monitoring
- Set up alerts for:
  - High CPU usage
  - Storage approaching limit
  - Connection errors

### Backups
- MongoDB Atlas automatic backups (free tier)
- Export important data regularly

### Updates
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 🌍 Custom Domain (Optional)

### 1. Purchase Domain
- Namecheap, GoDaddy, Google Domains, etc.

### 2. Configure DNS
**For Render:**
1. Go to your service settings
2. Add custom domain
3. Update DNS records as instructed

**For Railway:**
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS records

### 3. SSL Certificate
- Automatically provided by Render/Railway/Heroku
- No additional configuration needed

---

## 🔧 Troubleshooting

### Issue: Deployment Fails
**Solution:**
- Check build logs
- Verify package.json scripts
- Ensure all dependencies are in dependencies (not devDependencies)

### Issue: Database Connection Fails
**Solution:**
- Verify MongoDB Atlas connection string
- Check IP whitelist (0.0.0.0/0 for testing)
- Ensure database user has correct permissions

### Issue: Environment Variables Not Working
**Solution:**
- Verify all variables are set in platform dashboard
- Restart the service
- Check for typos in variable names

### Issue: CORS Errors
**Solution:**
- Update FRONTEND_URL in environment variables
- Ensure frontend URL matches exactly (no trailing slash)

---

## 💰 Cost Estimation

### Free Tier (Recommended for Testing)
- **Render Free:** 750 hours/month, sleeps after 15 min inactivity
- **Railway Free:** $5 credit/month
- **MongoDB Atlas Free:** 512MB storage, shared cluster
- **Total:** $0/month

### Production Tier
- **Render Starter:** $7/month
- **Railway Pro:** $5/month + usage
- **MongoDB Atlas M10:** $0.08/hour (~$57/month)
- **Total:** ~$12-70/month depending on usage

---

## 📝 Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelist configured
- [ ] Connection string obtained
- [ ] Code pushed to GitHub
- [ ] Hosting platform account created
- [ ] Web service created
- [ ] Environment variables set
- [ ] Application deployed
- [ ] Database seeded
- [ ] Health check passing
- [ ] Authentication tested
- [ ] Frontend connected
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Backups enabled

---

## 🎉 Success!

Your backend is now live in production! 🚀

**Next Steps:**
1. Test all endpoints
2. Connect frontend
3. Monitor performance
4. Set up analytics (optional)
5. Configure email service (optional)

---

## 📞 Support Resources

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Heroku Docs:** https://devcenter.heroku.com

---

**Good luck with your deployment! 🌟**
