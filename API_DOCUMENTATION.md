# 📡 API Documentation

Base URL: `http://localhost:5000/api`

## Response Format

All API responses follow this structure:

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

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "student",
  "level": "beginner"
}
```

**For Teacher:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "password": "Password123!",
  "role": "teacher",
  "hourlyRate": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "profilePicture": "..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "admin@platform.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "fullName": "Admin User",
      "email": "admin@platform.com",
      "role": "admin",
      "profilePicture": "..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Get Current User
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "User retrieved",
  "data": {
    "id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "profilePicture": "...",
    "isEmailVerified": false,
    "lastLogin": "2024-01-15T10:30:00.000Z"
  }
}
```

### Logout
**POST** `/auth/logout`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Refresh Token
**POST** `/auth/refresh-token`

**Note:** Refresh token is stored in httpOnly cookie

---

## Student Endpoints

All student endpoints require authentication and student role.

### Get Dashboard
**GET** `/students/dashboard`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard data retrieved",
  "data": {
    "student": { ... },
    "stats": {
      "totalStudyHours": 25.5,
      "totalLessonsCompleted": 42,
      "currentStreak": 5,
      "enrolledModulesCount": 3,
      "achievements": 2
    },
    "progressData": [ ... ],
    "recentModules": [ ... ]
  }
}
```

### Get Profile
**GET** `/students/profile`

### Update Profile
**PUT** `/students/profile`

**Request Body:**
```json
{
  "fullName": "John Updated",
  "level": "intermediate"
}
```

### Enroll in Module
**POST** `/students/modules/:moduleId/enroll`

**Example:**
```bash
POST /students/modules/507f1f77bcf86cd799439011/enroll
```

### Get Enrolled Modules
**GET** `/students/my-modules`

### Get Module Progress
**GET** `/students/progress/:moduleId`

### Mark Lesson Complete
**POST** `/students/progress/lesson-complete`

**Request Body:**
```json
{
  "lessonId": "507f1f77bcf86cd799439011",
  "timeSpent": 45
}
```

### Get Statistics
**GET** `/students/statistics`

---

## Teacher Endpoints

All teacher endpoints require authentication and teacher role.

### Get Dashboard
**GET** `/teachers/dashboard`

**Response:**
```json
{
  "success": true,
  "message": "Dashboard data retrieved",
  "data": {
    "teacher": { ... },
    "stats": {
      "totalTeachingHours": 120,
      "totalEarnings": 6000,
      "pendingPayment": 500,
      "assignedModulesCount": 2,
      "studentsCount": 15
    }
  }
}
```

### Get Profile
**GET** `/teachers/profile`

### Get Assigned Students
**GET** `/teachers/students`

### Get Student Progress
**GET** `/teachers/students/:studentId/progress`

### Get Assigned Modules
**GET** `/teachers/modules`

### Get Payment History
**GET** `/teachers/payments`

---

## Admin Endpoints

All admin endpoints require authentication and admin role.

### User Management

#### Get All Users
**GET** `/admin/users?search=john&role=student&status=active&page=1&limit=20`

**Query Parameters:**
- `search` (optional): Search by name or email
- `role` (optional): Filter by role (student, teacher, admin)
- `status` (optional): Filter by status (active, inactive)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

#### Get User Details
**GET** `/admin/users/:userId`

#### Update User
**PUT** `/admin/users/:userId`

**Request Body:**
```json
{
  "fullName": "Updated Name",
  "email": "newemail@example.com",
  "isActive": true
}
```

#### Delete User
**DELETE** `/admin/users/:userId`

#### Suspend User
**PATCH** `/admin/users/:userId/suspend`

#### Activate User
**PATCH** `/admin/users/:userId/activate`

### Student Management

#### Get All Students
**GET** `/admin/students?level=beginner&status=active&page=1&limit=20`

### Teacher Management

#### Get All Teachers
**GET** `/admin/teachers?page=1&limit=20`

### Module Management

#### Create Module
**POST** `/admin/modules`

**Request Body:**
```json
{
  "title": "Advanced Python Programming",
  "description": "Master advanced Python concepts",
  "category": "Programming",
  "level": "advanced",
  "assignedTeacher": "507f1f77bcf86cd799439011",
  "thumbnail": "https://example.com/image.jpg"
}
```

#### Update Module
**PUT** `/admin/modules/:moduleId`

#### Delete Module
**DELETE** `/admin/modules/:moduleId`

### Lesson Management

#### Create Lesson
**POST** `/admin/lessons`

**Request Body:**
```json
{
  "moduleId": "507f1f77bcf86cd799439011",
  "title": "Introduction to Decorators",
  "description": "Learn about Python decorators",
  "content": "Detailed lesson content here...",
  "order": 1,
  "duration": 30,
  "videoUrl": "https://youtube.com/watch?v=...",
  "isPublished": true
}
```

#### Update Lesson
**PUT** `/admin/lessons/:lessonId`

#### Delete Lesson
**DELETE** `/admin/lessons/:lessonId`

### Resource Management

#### Create Resource
**POST** `/admin/resources`

**Request Body:**
```json
{
  "lessonId": "507f1f77bcf86cd799439011",
  "title": "Python Decorators Cheat Sheet",
  "type": "pdf",
  "url": "https://example.com/resource.pdf",
  "fileSize": 1024000
}
```

#### Delete Resource
**DELETE** `/admin/resources/:resourceId`

### Video Management

#### Create Video
**POST** `/admin/videos`

**Request Body:**
```json
{
  "title": "Python Tutorial for Beginners",
  "description": "Complete Python course",
  "youtubeUrl": "https://youtube.com/watch?v=...",
  "category": "Programming",
  "tags": ["python", "tutorial", "beginner"],
  "duration": "2:30:00"
}
```

#### Update Video
**PUT** `/admin/videos/:videoId`

#### Delete Video
**DELETE** `/admin/videos/:videoId`

### Statistics

#### Get Platform Statistics
**GET** `/admin/statistics/overview`

**Response:**
```json
{
  "success": true,
  "message": "Platform statistics retrieved",
  "data": {
    "totalStudents": 150,
    "totalTeachers": 12,
    "totalModules": 25,
    "totalLessons": 180,
    "totalRevenue": 15000,
    "activeToday": 45
  }
}
```

### Payment Management

#### Get All Payments
**GET** `/admin/payments?status=paid&type=subscription&page=1&limit=20`

---

## Module Endpoints

Accessible to all authenticated users.

### Get All Modules
**GET** `/modules?category=Programming&level=beginner&search=python&page=1&limit=20`

**Query Parameters:**
- `category` (optional): Filter by category
- `level` (optional): Filter by level (beginner, intermediate, advanced)
- `search` (optional): Search in title and description
- `page` (optional): Page number
- `limit` (optional): Items per page

### Get Module by ID
**GET** `/modules/:moduleId`

### Get Module Lessons
**GET** `/modules/:moduleId/lessons`

### Get Modules by Category
**GET** `/modules/category/:category`

### Get Modules by Level
**GET** `/modules/level/:level`

---

## Lesson Endpoints

### Get Lesson by ID
**GET** `/lessons/:lessonId`

### Get Lesson Resources
**GET** `/lessons/:lessonId/resources`

---

## Resource Endpoints

### Get Resource by ID
**GET** `/resources/:resourceId`

**Note:** This increments the download count

---

## Video Endpoints

### Get All Videos
**GET** `/videos?category=Programming&search=python&page=1&limit=20`

### Get Video by ID
**GET** `/videos/:videoId`

**Note:** This increments the view count

### Get Videos by Category
**GET** `/videos/category/:category`

---

## AI Chat Endpoints

All AI chat endpoints require authentication and student role.

### Send Message
**POST** `/ai-chat/send`

**Request Body:**
```json
{
  "message": "Can you explain what a variable is?",
  "conversationId": "507f1f77bcf86cd799439011"
}
```

**Note:** `conversationId` is optional. Omit it to start a new conversation.

**Response:**
```json
{
  "success": true,
  "message": "Message sent",
  "data": {
    "conversationId": "507f1f77bcf86cd799439011",
    "response": "A variable is a container that stores data..."
  }
}
```

### Get All Conversations
**GET** `/ai-chat/conversations`

### Get Conversation by ID
**GET** `/ai-chat/conversations/:conversationId`

### Delete Conversation
**DELETE** `/ai-chat/conversations/:conversationId`

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 5 attempts per 15 minutes
- **Password reset**: 3 attempts per hour
- **File uploads**: 20 uploads per hour

---

## Authentication

Most endpoints require authentication. Include the access token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Access tokens expire after 15 minutes. Use the refresh token endpoint to get a new access token.

---

## Testing with cURL

### Example: Complete Student Flow

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Student",
    "email": "test@example.com",
    "password": "Password123!",
    "role": "student",
    "level": "beginner"
  }'

# 2. Login
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}' \
  | jq -r '.data.accessToken')

# 3. Get Dashboard
curl -X GET http://localhost:5000/api/students/dashboard \
  -H "Authorization: Bearer $TOKEN"

# 4. Get Modules
curl -X GET http://localhost:5000/api/modules \
  -H "Authorization: Bearer $TOKEN"

# 5. Enroll in Module
curl -X POST http://localhost:5000/api/students/modules/MODULE_ID/enroll \
  -H "Authorization: Bearer $TOKEN"
```

---

## Postman Collection

You can import these endpoints into Postman:

1. Create a new collection
2. Add environment variables:
   - `BASE_URL`: `http://localhost:5000`
   - `ACCESS_TOKEN`: (set after login)
3. Add pre-request script to automatically include token:
   ```javascript
   pm.request.headers.add({
     key: 'Authorization',
     value: 'Bearer ' + pm.environment.get('ACCESS_TOKEN')
   });
   ```

---

**For more details, see the main README.md file.**
