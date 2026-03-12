# Frontend CORS Configuration Guide

## React/Axios Configuration for CORS

To ensure your React frontend works correctly with the CORS-enabled backend, follow these configurations:

---

## 1. Axios Configuration

### Create an Axios Instance

**File**: `src/api/axios.js` or `src/utils/api.js`

```javascript
import axios from 'axios';

// Base URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'https://backend-lexilearn.onrender.com';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // CRITICAL: Send cookies and auth headers
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('📤 API Request:', config.method.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.config.url, response.status);
        return response;
    },
    (error) => {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, error.response.data);
            
            // Handle 401 Unauthorized
            if (error.response.status === 401) {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            }
        } else if (error.request) {
            console.error('❌ Network Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
```

---

## 2. Environment Variables

### Create `.env` file in React root

```env
# Production
VITE_API_URL=https://backend-lexilearn.onrender.com

# Development (uncomment for local testing)
# VITE_API_URL=http://localhost:5000
```

---

## 3. API Service Examples

### Teacher Dashboard API Calls

**File**: `src/services/teacherService.js`

```javascript
import api from '../api/axios';

export const teacherService = {
    // Get all assessments
    getAssessments: async () => {
        try {
            const response = await api.get('/api/teachers/assessments');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch assessments:', error);
            throw error;
        }
    },

    // Get student conversations
    getAllConversations: async () => {
        try {
            const response = await api.get('/api/ai-chat/all-conversations');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            throw error;
        }
    },

    // Get specific student data
    getStudentData: async (studentId) => {
        try {
            const response = await api.get(`/api/teachers/students/${studentId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch student data:', error);
            throw error;
        }
    }
};
```

### Authentication API Calls

**File**: `src/services/authService.js`

```javascript
import api from '../api/axios';

export const authService = {
    // Register
    register: async (userData) => {
        try {
            const response = await api.post('/api/auth/register', userData);
            if (response.data.accessToken) {
                localStorage.setItem('accessToken', response.data.accessToken);
            }
            return response.data;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    },

    // Login
    login: async (credentials) => {
        try {
            const response = await api.post('/api/auth/login', credentials);
            if (response.data.accessToken) {
                localStorage.setItem('accessToken', response.data.accessToken);
            }
            return response.data;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },

    // Get current user
    getCurrentUser: async () => {
        try {
            const response = await api.get('/api/auth/me');
            return response.data;
        } catch (error) {
            console.error('Failed to get current user:', error);
            throw error;
        }
    },

    // Logout
    logout: async () => {
        try {
            await api.post('/api/auth/logout');
            localStorage.removeItem('accessToken');
        } catch (error) {
            console.error('Logout failed:', error);
            localStorage.removeItem('accessToken');
        }
    }
};
```

---

## 4. React Component Example

### Teacher Dashboard Component

```javascript
import React, { useState, useEffect } from 'react';
import { teacherService } from '../services/teacherService';

const TeacherDashboard = () => {
    const [assessments, setAssessments] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch assessments and conversations in parallel
            const [assessmentsData, conversationsData] = await Promise.all([
                teacherService.getAssessments(),
                teacherService.getAllConversations()
            ]);

            setAssessments(assessmentsData.data || []);
            setConversations(conversationsData.data || []);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return (
            <div className="error">
                <p>Error: {error}</p>
                <button onClick={fetchData}>Retry</button>
            </div>
        );
    }

    return (
        <div className="teacher-dashboard">
            <h1>Teacher Dashboard</h1>
            
            <section>
                <h2>Assessments ({assessments.length})</h2>
                {assessments.map(assessment => (
                    <div key={assessment._id}>
                        {/* Render assessment */}
                    </div>
                ))}
            </section>

            <section>
                <h2>Conversations ({conversations.length})</h2>
                {conversations.map(conversation => (
                    <div key={conversation._id}>
                        {/* Render conversation */}
                    </div>
                ))}
            </section>
        </div>
    );
};

export default TeacherDashboard;
```

---

## 5. Fetch API Alternative (if not using Axios)

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://backend-lexilearn.onrender.com';

const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem('accessToken');
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
        credentials: 'include', // CRITICAL for CORS
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
};

// Usage
const assessments = await fetchWithAuth('/api/teachers/assessments');
```

---

## 6. Common Issues & Solutions

### Issue 1: "No Access-Control-Allow-Origin header"

**Solution**: Ensure `withCredentials: true` in Axios config

```javascript
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true // ← MUST BE TRUE
});
```

### Issue 2: "Preflight request failed"

**Solution**: Backend must handle OPTIONS requests (already fixed in server.js)

### Issue 3: "Authorization header not sent"

**Solution**: Add token in interceptor

```javascript
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

### Issue 4: "Cookies not sent"

**Solution**: Use `withCredentials: true` and ensure backend has `credentials: true`

---

## 7. Testing CORS from Frontend

### Test Component

```javascript
import React, { useState } from 'react';
import api from '../api/axios';

const CORSTest = () => {
    const [result, setResult] = useState(null);

    const testCORS = async () => {
        try {
            const response = await api.get('/api/cors-test');
            setResult({ success: true, data: response.data });
        } catch (error) {
            setResult({ success: false, error: error.message });
        }
    };

    return (
        <div>
            <button onClick={testCORS}>Test CORS</button>
            {result && (
                <pre>{JSON.stringify(result, null, 2)}</pre>
            )}
        </div>
    );
};
```

---

## 8. Deployment Checklist

### Frontend (Render/Vercel/Netlify)

- [ ] Set `VITE_API_URL` environment variable
- [ ] Ensure `withCredentials: true` in Axios config
- [ ] Add Authorization header in requests
- [ ] Handle 401 errors (redirect to login)

### Backend (Render)

- [ ] Set `FRONTEND_URL` environment variable
- [ ] CORS middleware before routes
- [ ] `credentials: true` in CORS config
- [ ] Handle OPTIONS preflight requests

---

## 9. Environment-Specific Configuration

```javascript
// src/config/api.js
const getAPIUrl = () => {
    if (import.meta.env.MODE === 'production') {
        return 'https://backend-lexilearn.onrender.com';
    }
    return 'http://localhost:5000';
};

export const API_URL = getAPIUrl();
```

---

## 10. Debugging Tips

### Enable Axios Logging

```javascript
api.interceptors.request.use((config) => {
    console.log('🔵 Request:', {
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data
    });
    return config;
});

api.interceptors.response.use(
    (response) => {
        console.log('🟢 Response:', {
            status: response.status,
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error('🔴 Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        return Promise.reject(error);
    }
);
```

### Check Network Tab

1. Open DevTools → Network
2. Look for OPTIONS preflight (should be 200)
3. Check Response Headers:
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Credentials`
4. Check Request Headers:
   - `Origin`
   - `Authorization`

---

**Status**: ✅ Ready to implement  
**Compatibility**: React 18+, Vite, Axios  
**Last Updated**: 2024
