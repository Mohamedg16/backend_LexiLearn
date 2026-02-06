# 🚀 Quick Start Guide

## Prerequisites Checklist
- [ ] Node.js v18+ installed
- [ ] MongoDB installed locally OR MongoDB Atlas account created
- [ ] Git installed (optional)

## Step-by-Step Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
# The .env file has been created for you
# Edit it with your preferred text editor
```

**Required changes in `.env`:**

1. **MongoDB Connection** (Choose one):
   
   **Option A: Local MongoDB**
   ```env
   MONGODB_URI=mongodb://localhost:27017/educational-platform
   ```
   
   **Option B: MongoDB Atlas (Recommended)**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create free account
   - Create a cluster
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Update `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/educational-platform
   ```

2. **JWT Secrets** (IMPORTANT for security):
   ```env
   JWT_SECRET=your_random_secret_here_min_32_chars
   JWT_REFRESH_SECRET=another_random_secret_min_32_chars
   ```
   
   Generate random secrets:
   ```bash
   # On Windows PowerShell:
   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
   
   # Or use any random string generator
   ```

3. **Frontend URL** (if different):
   ```env
   FRONTEND_URL=http://localhost:5173
   ```

### 3. Seed the Database
```bash
npm run seed
```

This will create:
- 1 Admin account
- 3 Teacher accounts
- 10 Student accounts
- 6 Modules with lessons
- Resources, videos, and sample data

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start at: `http://localhost:5000`

### 5. Test the API

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Login as Admin:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@platform.com\",\"password\":\"Admin123!\"}"
```

## 🔐 Default Accounts

### Admin
- **Email:** admin@platform.com
- **Password:** Admin123!

### Teachers
- **Email:** sarah@platform.com, michael@platform.com, emily@platform.com
- **Password:** Teacher123!

### Students
- **Email:** student1@platform.com to student10@platform.com
- **Password:** Student123!

## 📡 API Testing

### Using cURL

**Register new student:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"John Doe\",
    \"email\": \"john@example.com\",
    \"password\": \"Password123!\",
    \"role\": \"student\",
    \"level\": \"beginner\"
  }"
```

**Get all modules (requires auth):**
```bash
# First login to get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"student1@platform.com\",\"password\":\"Student123!\"}" \
  | jq -r '.data.accessToken')

# Then use token
curl -X GET http://localhost:5000/api/modules \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Import endpoints
2. Create environment variable `BASE_URL` = `http://localhost:5000`
3. Login to get `ACCESS_TOKEN`
4. Add `Authorization: Bearer {{ACCESS_TOKEN}}` to headers

## 🐛 Common Issues

### Issue: MongoDB Connection Failed
**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
- If using local MongoDB: Ensure MongoDB service is running
  ```bash
  # Windows: Check Services or run
  mongod
  ```
- If using Atlas: Check connection string and IP whitelist

### Issue: Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Change PORT in .env file
PORT=5001
```

### Issue: JWT Errors
**Error:** `jwt must be provided`

**Solution:** Ensure you're sending the token in headers:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 📚 Next Steps

1. **Connect Frontend:**
   - Update frontend API base URL to `http://localhost:5000`
   - Test login flow
   - Test student/teacher/admin dashboards

2. **Customize:**
   - Add more modules and lessons
   - Configure email service (optional)
   - Integrate AI service for chat (optional)

3. **Deploy:**
   - See main README.md for deployment instructions
   - Use MongoDB Atlas for production database
   - Deploy to Render, Railway, or Heroku

## 🎯 API Endpoints Overview

- **Auth:** `/api/auth/*` - Registration, login, logout
- **Students:** `/api/students/*` - Dashboard, profile, enrollment
- **Teachers:** `/api/teachers/*` - Dashboard, students, payments
- **Admin:** `/api/admin/*` - User management, content management
- **Modules:** `/api/modules/*` - Browse modules and lessons
- **Videos:** `/api/videos/*` - Video tutorials
- **AI Chat:** `/api/ai-chat/*` - AI assistant

See full API documentation in main README.md

## ✅ Verification Checklist

- [ ] Dependencies installed successfully
- [ ] `.env` file configured
- [ ] MongoDB connection working
- [ ] Database seeded with mock data
- [ ] Server starts without errors
- [ ] Health check endpoint responds
- [ ] Login works with default credentials
- [ ] Can access protected routes with token

## 🆘 Need Help?

- Check the main README.md for detailed documentation
- Review error logs in the console
- Ensure all environment variables are set correctly
- Verify MongoDB is accessible

---

**Happy coding! 🎉**
