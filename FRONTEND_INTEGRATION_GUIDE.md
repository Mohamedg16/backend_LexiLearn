# Frontend Integration Guide - Student Deletion

## Quick Start

### API Endpoint
```
DELETE /api/admin/students/:id
```

### Required Headers
```javascript
{
  'Authorization': `Bearer ${adminAccessToken}`,
  'Content-Type': 'application/json'
}
```

---

## React/JavaScript Implementation

### Example 1: Using Fetch API

```javascript
const deleteStudent = async (studentId) => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/admin/students/${studentId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Important for cookies
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete student');
    }

    console.log('✅ Student deleted:', data);
    return data;
  } catch (error) {
    console.error('❌ Delete failed:', error.message);
    throw error;
  }
};
```

### Example 2: Using Axios

```javascript
import axios from 'axios';

const deleteStudent = async (studentId) => {
  try {
    const response = await axios.delete(
      `/api/admin/students/${studentId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        withCredentials: true
      }
    );

    console.log('✅ Student deleted:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Delete failed:', error.response?.data?.message || error.message);
    throw error;
  }
};
```

---

## React Component Example

```jsx
import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

const StudentDeleteButton = ({ student, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/students/${student._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete student');
      }

      // Success - update UI
      console.log('✅ Student deleted successfully');
      setShowConfirm(false);
      
      // Callback to parent component to refresh list
      if (onDeleteSuccess) {
        onDeleteSuccess(student._id);
      }

      // Optional: Show success toast
      alert(`Student ${student.userId?.fullName || 'Unknown'} deleted successfully`);

    } catch (err) {
      console.error('❌ Delete error:', err);
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Delete Button */}
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
        title="Delete Student"
      >
        <Trash2 size={18} />
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-600" size={24} />
              <h3 className="text-xl font-bold text-gray-900">
                Delete Student?
              </h3>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{' '}
              <strong>{student.userId?.fullName || 'this student'}</strong>?
            </p>

            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This will permanently delete:
              </p>
              <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                <li>Student account</li>
                <li>All AI chat conversations</li>
                <li>Course progress and enrollments</li>
                <li>Practice sessions and assessments</li>
                <li>Payment records</li>
              </ul>
              <p className="text-sm text-red-800 mt-2 font-semibold">
                This action cannot be undone!
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentDeleteButton;
```

---

## Usage in Student List Component

```jsx
import React, { useState, useEffect } from 'react';
import StudentDeleteButton from './StudentDeleteButton';

const StudentList = () => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    // Fetch students from API
    const response = await fetch('/api/admin/students');
    const data = await response.json();
    setStudents(data.data);
  };

  const handleDeleteSuccess = (deletedStudentId) => {
    // Remove deleted student from UI immediately
    setStudents(prev => prev.filter(s => s._id !== deletedStudentId));
    
    // Optional: Refresh the entire list
    // fetchStudents();
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Level</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student._id}>
              <td>{student.userId?.fullName}</td>
              <td>{student.userId?.email}</td>
              <td>{student.level}</td>
              <td>
                <StudentDeleteButton
                  student={student}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentList;
```

---

## Important Notes

### 1. **Use Student ID, Not User ID**
```javascript
// ✅ CORRECT - Use student._id
DELETE /api/admin/students/507f1f77bcf86cd799439011

// ❌ WRONG - Don't use student.userId
DELETE /api/admin/students/507f1f77bcf86cd799439012
```

### 2. **Wait for Response Before Updating UI**
```javascript
// ✅ CORRECT
const response = await deleteStudent(studentId);
if (response.success) {
  updateUI(); // Update after confirmation
}

// ❌ WRONG
updateUI(); // Don't update before API call
await deleteStudent(studentId);
```

### 3. **Handle Errors Properly**
```javascript
try {
  await deleteStudent(studentId);
} catch (error) {
  // Show error to user
  alert(error.message);
  // Don't remove from UI if deletion failed
}
```

### 4. **Include Credentials**
```javascript
// Required for cookie-based authentication
fetch(url, {
  credentials: 'include',
  // ...
});
```

---

## Response Format

### Success (200)
```json
{
  "success": true,
  "message": "Student and all related data deleted successfully",
  "data": {
    "deletedStudent": "student@example.com",
    "deletedCollections": 9
  }
}
```

### Error (404)
```json
{
  "success": false,
  "message": "Student not found"
}
```

### Error (401)
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## Testing Checklist

- [ ] Delete button appears only for admin users
- [ ] Confirmation modal shows before deletion
- [ ] Loading state displays during deletion
- [ ] Success message shows after deletion
- [ ] Student removed from UI after successful deletion
- [ ] Error message displays if deletion fails
- [ ] Deleted student cannot login
- [ ] Related data (conversations, progress) is deleted

---

## Environment Variables

```env
# .env file
REACT_APP_API_URL=https://your-backend.onrender.com
```

---

## Common Issues

### Issue: CORS Error
**Solution**: Ensure backend CORS is configured to allow your frontend domain.

### Issue: 401 Unauthorized
**Solution**: Check if admin token is valid and not expired.

### Issue: Student still appears in list
**Solution**: Ensure you're calling `onDeleteSuccess` callback to update UI.

### Issue: "Student not found"
**Solution**: Verify you're using `student._id` not `student.userId`.

---

**Need Help?** Check the backend documentation: `STUDENT_DELETION_IMPLEMENTATION.md`
