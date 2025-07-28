# User Management API Documentation

## Overview
This document outlines the user management endpoints available only to managers in the PlantPro system. All endpoints require authentication and manager role permissions.

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Base URL
```
http://localhost:3001/api/users
```

## Endpoints

### 1. Get All Users
**GET** `/users`
- **Access**: Manager only
- **Description**: Retrieve all users with statistics
- **Response**: Array of user objects with plant lot and health log counts

```json
[
  {
    "id": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "field_staff",
    "phoneNumber": "+1234567890",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "assignedPlantLotsCount": 5,
    "healthLogsCount": 23
  }
]
```

### 2. Get User Statistics
**GET** `/users/stats`
- **Access**: Manager only
- **Description**: Get overall user statistics

```json
{
  "total": 10,
  "byRole": {
    "manager": 2,
    "field_staff": 6,
    "analytics": 2
  },
  "active": 9,
  "inactive": 1
}
```

### 3. Get Users by Role
**GET** `/users/by-role?role=field_staff`
- **Access**: Manager only
- **Description**: Filter users by role
- **Parameters**: 
  - `role`: `manager` | `field_staff` | `analytics`

### 4. Get Field Staff
**GET** `/users/field-staff`
- **Access**: Manager, Field Staff
- **Description**: Get all active field staff users (used for assignments)

### 5. Get User by ID
**GET** `/users/:id`
- **Access**: Manager only
- **Description**: Get detailed information about a specific user

### 6. Create New User
**POST** `/users`
- **Access**: Manager only
- **Description**: Create a new user account

**Request Body:**
```json
{
  "email": "jane.smith@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "field_staff",
  "phoneNumber": "+0987654321",
  "isActive": true
}
```

**Response:** User object (without password)

### 7. Update User
**PATCH** `/users/:id`
- **Access**: Manager only
- **Description**: Update user information (excluding password)

**Request Body:**
```json
{
  "firstName": "Jane Updated",
  "role": "analytics",
  "isActive": false
}
```

### 8. Toggle User Status
**PATCH** `/users/:id/toggle-status`
- **Access**: Manager only
- **Description**: Toggle user active/inactive status

### 9. Change User Password
**PATCH** `/users/:id/change-password`
- **Access**: Manager only
- **Description**: Change a user's password (requires current password)

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

### 10. Reset User Password (Manager Privilege)
**PATCH** `/users/:id/reset-password`
- **Access**: Manager only
- **Description**: Reset a user's password without requiring current password
- **Note**: Manager privilege - no current password verification needed

**Request Body:**
```json
{
  "newPassword": "newSecurePassword789"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

### 11. Delete User
**DELETE** `/users/:id`
- **Access**: Manager only
- **Description**: Delete a user account
- **Note**: Cannot delete users with assigned plant lots

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Manager role required."
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User with ID 999 not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email already exists"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Cannot delete user with assigned plant lots. Please reassign or remove plant lots first."
}
```

## Example Usage

### Creating a New User
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "firstName": "New",
    "lastName": "User",
    "role": "field_staff",
    "phoneNumber": "+1234567890"
  }'
```

### Getting All Users
```bash
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer your-jwt-token"
```

### Updating a User
```bash
curl -X PATCH http://localhost:3001/api/users/1 \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "analytics",
    "firstName": "Updated Name"
  }'
```

### Toggling User Status
```bash
curl -X PATCH http://localhost:3001/api/users/1/toggle-status \
  -H "Authorization: Bearer your-jwt-token"
```

## Security Features

1. **Role-based Access Control**: Only managers can perform user management operations
2. **Password Hashing**: All passwords are bcrypt hashed with salt rounds
3. **Email Uniqueness**: Prevents duplicate email registrations
4. **Safe Deletion**: Prevents deletion of users with assigned resources
5. **Input Validation**: All inputs are validated using class-validator
6. **JWT Authentication**: Secure token-based authentication

## Validation Rules

- **Email**: Must be a valid email format
- **Password**: Minimum 6 characters
- **Role**: Must be one of: `manager`, `field_staff`, `analytics`
- **Phone Number**: Optional, string format
- **Names**: Required strings
- **Active Status**: Boolean, defaults to true
