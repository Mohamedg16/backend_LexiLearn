# LexiLearn Backend

A comprehensive, production-ready RESTful API for LexiLearn with three distinct user roles: **Students**, **Teachers**, and **Admins**.

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based access control (Student, Teacher, Admin)
- Secure password hashing with bcrypt
- Email verification and password reset functionality

### User Roles

#### 👨‍🎓 Students
- Dashboard with learning statistics
- Module enrollment and progress tracking
- Lesson completion tracking
- Study time monitoring
- Achievement system
- AI chat assistant for learning support

#### 👨‍🏫 Teachers
- View assigned students and their progress
- Track teaching hours and earnings
- Payment history management
- Module and student analytics

#### 👨‍💼 Admins
- Complete user management (CRUD operations)
- Content management (modules, lessons, resources, videos)
- Payment tracking and processing
- Platform-wide statistics and analytics
- User suspension/activation

### Core Features
- 📚 Module and lesson management
- 📄 Resource management (PDFs, documents, links)
- 🎥 YouTube video integration
- 📊 Progress tracking and analytics
- 💳 Payment management
- 🔔 Notification system
- 💬 AI chat conversations
- 🔍 Advanced search and filtering
- 📄 Pagination on all list endpoints

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Security**: helmet, cors, express-rate-limit, bcrypt
- **File Upload**: multer
- **Email**: nodemailer
- **Logging**: morgan

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── jwt.js               # JWT configuration
│   ├── models/
│   │   ├── User.js              # Base user schema
│   │   ├── Student.js           # Student profile
│   │   ├── Teacher.js           # Teacher profile
│   │   ├── Module.js            # Educational modules
│   │   ├── Lesson.js            # Lessons
│   │   ├── Resource.js          # Learning resources
│   │   ├── Video.js             # Video tutorials
│   │   ├── Progress.js          # Student progress
│   │   ├── Enrollment.js        # Module enrollments
│   │   ├── Payment.js           # Payment records
│   │   ├── Conversation.js      # AI chat history
│   │   └── Notification.js      # System notifications
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── teacherController.js
│   │   ├── adminController.js
│   │   ├── moduleController.js
│   │   ├── lessonController.js
│   │   ├── resourceController.js
│   │   ├── videoController.js
│   │   └── aiChatController.js
│   ├── services/
│   │   ├── authService.js
│   │   └── studentService.js
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── roleGuard.js         # Role-based access
│   │   ├── validation.js        # Input validation
│   │   ├── errorHandler.js      # Error handling
│   │   ├── rateLimiter.js       # Rate limiting
│   │   └── upload.js            # File upload
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── teacherRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── moduleRoutes.js
│   │   ├── lessonRoutes.js
│   │   ├── resourceRoutes.js
│   │   ├── videoRoutes.js
│   │   └── aiChatRoutes.js
│   ├── utils/
│   │   ├── generateToken.js     # JWT utilities
│   │   ├── sendEmail.js         # Email service
│   │   ├── validators.js        # Validation schemas
│   │   └── helpers.js           # Helper functions
│   ├── seeders/
│   │   └── seed.js              # Database seeder
│   └── server.js                # Application entry
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- Node.js v18 or higher
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env and add your configuration
   # IMPORTANT: Change JWT secrets and MongoDB URI
   ```

4. **Configure MongoDB**
   
   **Option A: Local MongoDB**
   ```env
   MONGODB_URI=mongodb://localhost:27017/educational-platform
   ```

   **Option B: MongoDB Atlas (Recommended)**
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster
   - Get your connection string
   - Update `.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/educational-platform
   ```

5. **Seed the database with mock data**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## 🔐 Default Login Credentials

After running the seeder, you can log in with:

### Admin
- Email: `admin@lexilearn.com`
- Password: `Admin123!`

### Teachers
- Email: `sarah@lexilearn.com`, `michael@lexilearn.com`, `emily@lexilearn.com`
- Password: `Teacher123!`

### Students
- Email: `student1@lexilearn.com` to `student10@lexilearn.com`
- Password: `Student123!`

## 📡 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | User login | Public |
| POST | `/logout` | User logout | Private |
| POST | `/refresh-token` | Refresh access token | Private |
| GET | `/me` | Get current user | Private |

### Students (`/api/students`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get dashboard data |
| GET | `/profile` | Get student profile |
| PUT | `/profile` | Update profile |
| POST | `/modules/:id/enroll` | Enroll in module |
| GET | `/my-modules` | Get enrolled modules |
| GET | `/progress/:moduleId` | Get module progress |
| POST | `/progress/lesson-complete` | Mark lesson complete |
| GET | `/statistics` | Get study statistics |

### Teachers (`/api/teachers`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get dashboard |
| GET | `/profile` | Get profile |
| GET | `/students` | Get assigned students |
| GET | `/students/:id/progress` | Get student progress |
| GET | `/modules` | Get assigned modules |
| GET | `/payments` | Get payment history |

### Admin (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users (with filters) |
| GET | `/users/:id` | Get user details |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| PATCH | `/users/:id/suspend` | Suspend user |
| PATCH | `/users/:id/activate` | Activate user |
| GET | `/students` | Get all students |
| GET | `/teachers` | Get all teachers |
| POST | `/modules` | Create module |
| PUT | `/modules/:id` | Update module |
| DELETE | `/modules/:id` | Delete module |
| POST | `/lessons` | Create lesson |
| PUT | `/lessons/:id` | Update lesson |
| DELETE | `/lessons/:id` | Delete lesson |
| POST | `/resources` | Create resource |
| DELETE | `/resources/:id` | Delete resource |
| POST | `/videos` | Create video |
| PUT | `/videos/:id` | Update video |
| DELETE | `/videos/:id` | Delete video |
| GET | `/statistics/overview` | Get platform stats |
| GET | `/payments` | Get all payments |

### Modules (`/api/modules`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all modules (with filters) |
| GET | `/:id` | Get module details |
| GET | `/:id/lessons` | Get module lessons |
| GET | `/category/:category` | Get by category |
| GET | `/level/:level` | Get by level |

### AI Chat (`/api/ai-chat`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | Send message to AI |
| GET | `/conversations` | Get all conversations |
| GET | `/conversations/:id` | Get conversation |
| DELETE | `/conversations/:id` | Delete conversation |

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Separate access (15min) and refresh (7 days) tokens
- **Rate Limiting**: 
  - General API: 100 requests per 15 minutes
  - Auth routes: 5 attempts per 15 minutes
  - Password reset: 3 attempts per hour
- **CORS**: Configured with frontend whitelist
- **Helmet**: Security headers
- **Input Validation**: Joi schemas for all inputs
- **Role-Based Access**: Middleware for route protection
- **HttpOnly Cookies**: Refresh tokens stored securely

## 📊 Database Optimization

- **Indexes**: Strategic indexes on frequently queried fields
- **Pagination**: Default 20 items per page on all lists
- **Lean Queries**: Used for read-only operations
- **Aggregation**: For complex statistics
- **Field Selection**: Only necessary fields returned
- **MongoDB Free Tier Compatible**: Optimized for 512MB storage

## 🧪 Testing the API

### Using cURL

```bash
# Register a new student
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "role": "student",
    "level": "beginner"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@platform.com",
    "password": "Admin123!"
  }'

# Get modules (with auth token)
curl -X GET http://localhost:5000/api/modules \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables for `BASE_URL` and `ACCESS_TOKEN`
3. Test each endpoint with appropriate authentication

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## 🔧 Environment Variables

See `.env.example` for all available configuration options.

**Required:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `FRONTEND_URL` - Frontend URL for CORS

**Optional:**
- Email configuration (for notifications)
- Rate limiting settings
- Port configuration

## 🚀 Deployment

### Recommended Platforms

- **Backend**: Render, Railway, Heroku, Fly.io
- **Database**: MongoDB Atlas (Free tier)

### Deployment Steps

1. **Prepare for production**
   ```bash
   # Ensure NODE_ENV is set to production
   NODE_ENV=production
   ```

2. **Set environment variables** on your hosting platform

3. **Deploy**
   - Push code to GitHub
   - Connect repository to hosting platform
   - Set build command: `npm install`
   - Set start command: `npm start`

4. **Seed production database**
   ```bash
   npm run seed
   ```

## 📚 Additional Features

### Email Notifications
- Welcome emails for new users
- Password reset emails
- Payment reminders

### File Uploads
- Profile pictures
- PDF resources
- Documents
- 5MB file size limit

### AI Chat Integration
- Placeholder for AI service integration
- Ready for OpenAI GPT, Google Gemini, etc.
- Conversation history tracking

## 🐛 Troubleshooting

### MongoDB Connection Issues
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running locally or check your Atlas connection string

### JWT Errors
```
Error: jwt malformed
```
**Solution**: Verify JWT_SECRET is set in .env and tokens are properly formatted

### CORS Errors
```
Access to fetch blocked by CORS policy
```
**Solution**: Update FRONTEND_URL in .env to match your frontend URL

## 📄 License

ISC

## 👨‍💻 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for education**
#   b a c k e n d _ L e x i L e a r n  
 