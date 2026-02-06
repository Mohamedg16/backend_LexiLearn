# ⚡ IMMEDIATE SETUP REQUIRED

## ✅ Issue Fixed!
The bcrypt import error has been fixed. The server should now start properly.

## 🔧 Required: Configure .env File

Your `.env` file needs to be configured with the following:

### Option 1: Quick Start (Local MongoDB)
If you have MongoDB installed locally, your `.env` should look like this:

```env
NODE_ENV=development
PORT=5000

# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/educational-platform

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=change_this_to_a_random_32_character_string_abc123
JWT_REFRESH_SECRET=change_this_to_another_random_32_char_string_xyz789
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Email (Optional - can skip for now)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Option 2: MongoDB Atlas (Recommended - Free)

1. **Create MongoDB Atlas Account:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free
   - Create a cluster (choose FREE tier)

2. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

3. **Update .env:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/educational-platform?retryWrites=true&w=majority
```

## 🚀 After Configuration

1. **Save the .env file**

2. **Restart the server:**
   - The server should auto-restart with nodemon
   - Or press Ctrl+C and run `npm run dev` again

3. **Seed the database:**
   ```bash
   npm run seed
   ```

4. **Test the API:**
   ```bash
   # Health check
   curl http://localhost:5000/health
   ```

## 🎯 Next Steps

Once the server is running:

1. ✅ Server starts without errors
2. ✅ Run `npm run seed` to populate database
3. ✅ Test login with: admin@platform.com / Admin123!
4. ✅ Connect your frontend

## 🆘 Still Having Issues?

**MongoDB Connection Error:**
- Make sure MongoDB is running (if using local)
- Check your connection string (if using Atlas)
- Verify IP whitelist in Atlas (set to 0.0.0.0/0 for testing)

**Port Already in Use:**
- Change PORT in .env to 5001 or another port

**JWT Errors:**
- Make sure JWT_SECRET and JWT_REFRESH_SECRET are set
- They should be at least 32 characters long

---

**The backend is ready! Just configure .env and you're good to go! 🚀**
