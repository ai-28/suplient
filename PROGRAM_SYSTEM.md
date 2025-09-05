# Program Management System

## Overview
The Program Management System allows coaches to create, manage, and organize therapeutic programs with structured elements like sessions, exercises, assessments, and homework assignments.

## Database Schema

### Program Table
```sql
CREATE TABLE "Program" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 4,
  category VARCHAR(100) DEFAULT 'general',
  "isTemplate" BOOLEAN DEFAULT false,
  "targetConditions" TEXT[], -- Array of target conditions
  "coachId" UUID NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ProgramElement Table
```sql
CREATE TABLE "ProgramElement" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "programId" UUID NOT NULL REFERENCES "Program"(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('session', 'exercise', 'assessment', 'homework', 'content', 'task', 'message')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  week INTEGER NOT NULL,
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 7),
  duration INTEGER DEFAULT 60, -- in minutes
  content TEXT,
  "scheduledTime" TIME DEFAULT '09:00:00',
  "elementData" JSONB, -- For additional element-specific data
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. List Programs
**GET** `/api/programs`

**Query Parameters:**
- `isTemplate` (boolean): Filter by template status
- `category` (string): Filter by category
- `limit` (number): Number of programs to return (default: 50)
- `offset` (number): Number of programs to skip (default: 0)

**Response:**
```json
{
  "programs": [
    {
      "id": "uuid",
      "name": "Anxiety Management Program",
      "description": "A comprehensive 8-week program...",
      "duration": 8,
      "category": "anxiety",
      "isTemplate": true,
             "targetConditions": ["Generalized Anxiety Disorder"],
       "coachId": "coach-uuid",
       "coachName": "Coach Name",
       "elementCount": 5,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "stats": {
    "totalPrograms": 10,
    "templatePrograms": 3,
    "activePrograms": 7,
    "averageDuration": 8.5
  },
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 10
  }
}
```

### 2. Create Program
**POST** `/api/programs`

**Request Body:**
```json
{
  "name": "Program Name",
  "description": "Program description",
  "duration": 8,
  "category": "anxiety",
  "isTemplate": false,
  "targetConditions": ["Condition 1", "Condition 2"],
  "elements": [
    {
      "type": "session",
      "title": "Introduction Session",
      "description": "Session description",
      "week": 1,
      "day": 1,
      "duration": 60,
      "content": "Session content",
      "scheduledTime": "09:00:00",
      "data": {
        "additionalInfo": "Extra data"
      }
    }
  ]
}
```

**Response:**
```json
{
  "message": "Program created successfully",
  "program": {
    "id": "uuid",
    "name": "Program Name",
    "description": "Program description",
    "duration": 8,
    "category": "anxiety",
    "isTemplate": false,
           "targetConditions": ["Condition 1", "Condition 2"],
       "coachId": "coach-uuid",
       "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Get Program by ID
**GET** `/api/programs/[id]`

**Response:**
```json
{
  "program": {
    "id": "uuid",
    "name": "Program Name",
    "description": "Program description",
    "duration": 8,
    "category": "anxiety",
    "isTemplate": false,
           "targetConditions": ["Condition 1"],
       "coachId": "coach-uuid",
       "coachName": "Coach Name",
    "createdAt": "2024-01-01T00:00:00Z",
    "elements": [
      {
        "id": "element-uuid",
        "programId": "program-uuid",
        "type": "session",
        "title": "Introduction Session",
        "description": "Session description",
        "week": 1,
        "day": 1,
        "duration": 60,
        "content": "Session content",
        "scheduledTime": "09:00:00",
        "elementData": {
          "additionalInfo": "Extra data"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 4. Update Program
**PUT** `/api/programs/[id]`

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Program Name",
  "description": "Updated description",
  "duration": 12,
  "category": "depression",
  "isTemplate": true,
  "targetConditions": ["Updated Condition"],
  "elements": [
    {
      "type": "exercise",
      "title": "Updated Exercise",
      "description": "Updated description",
      "week": 1,
      "day": 2,
      "duration": 30,
      "content": "Updated content",
      "scheduledTime": "10:00:00",
      "data": {}
    }
  ]
}
```

### 5. Delete Program
**DELETE** `/api/programs/[id]`

**Response:**
```json
{
  "message": "Program deleted successfully"
}
```

### 6. Duplicate Program
**POST** `/api/programs/[id]/duplicate`

**Request Body:**
```json
{
  "newName": "Copied Program Name"
}
```

**Response:**
```json
{
  "message": "Program duplicated successfully",
  "program": {
    "id": "new-uuid",
    "name": "Copied Program Name",
    "description": "Original description",
    "duration": 8,
    "category": "anxiety",
    "isTemplate": false,
           "targetConditions": ["Condition 1"],
       "coachId": "coach-uuid",
       "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## Element Types

### 1. Session
- **Purpose**: Therapeutic sessions with clients
- **Duration**: Typically 60 minutes
- **Data**: Session content, objectives, materials

### 2. Exercise
- **Purpose**: Practical activities and exercises
- **Duration**: 15-45 minutes
- **Data**: Exercise instructions, materials needed

### 3. Assessment
- **Purpose**: Standardized questionnaires and assessments
- **Duration**: 10-30 minutes
- **Data**: Assessment type, scoring instructions

### 4. Homework
- **Purpose**: Daily practice assignments
- **Duration**: 10-60 minutes
- **Data**: Assignment details, tracking methods

### 5. Content
- **Purpose**: Share files from library
- **Duration**: Variable
- **Data**: File ID, file name, file type

### 6. Task
- **Purpose**: Create tasks for clients or coaches
- **Duration**: Variable
- **Data**: Task details, assignment, due date

### 7. Message
- **Purpose**: Send automated messages
- **Duration**: N/A
- **Data**: Message content, automation settings

## Usage Examples

### Creating a Program with Elements
```javascript
const programData = {
  name: "Anxiety Management Program",
  description: "A comprehensive 8-week program for anxiety management",
  duration: 8,
  category: "anxiety",
  isTemplate: true,
  targetConditions: ["Generalized Anxiety Disorder", "Social Anxiety"],
  elements: [
    {
      type: "session",
      title: "Introduction to Anxiety",
      description: "Understanding anxiety and its effects",
      week: 1,
      day: 1,
      duration: 60,
      content: "This session introduces the concept of anxiety...",
      scheduledTime: "09:00:00"
    },
    {
      type: "exercise",
      title: "Deep Breathing Exercise",
      description: "Learn the 4-7-8 breathing technique",
      week: 1,
      day: 2,
      duration: 15,
      content: "Practice the 4-7-8 breathing technique...",
      scheduledTime: "10:00:00"
    }
  ]
};

const response = await fetch('/api/programs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(programData)
});
```

### Fetching Programs with Filters
```javascript
const response = await fetch('/api/programs?isTemplate=true&category=anxiety&limit=10');
const data = await response.json();
console.log(data.programs); // Array of template anxiety programs
console.log(data.stats); // Program statistics
```

### Updating Program Elements
```javascript
const updateData = {
  elements: [
    {
      type: "session",
      title: "Updated Session Title",
      description: "Updated session description",
      week: 1,
      day: 1,
      duration: 60,
      content: "Updated session content",
      scheduledTime: "09:00:00"
    }
  ]
};

const response = await fetch(`/api/programs/${programId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
});
```

## Security Features

1. **Authentication**: All endpoints require valid session
2. **Authorization**: Only coaches and admins can access program endpoints
3. **Ownership**: Users can only access programs they created (unless admin)
4. **Input Validation**: All inputs are validated and sanitized
5. **SQL Injection Protection**: Using parameterized queries

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (no session)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

Error responses include descriptive messages:
```json
{
  "error": "Program name is required"
}
```

## Database Indexes

For optimal performance, the following indexes are created:
- `idx_programs_coachId`: Programs by coach
- `idx_programs_category`: Programs by category
- `idx_programs_isTemplate`: Programs by template status
- `idx_program_elements_programId`: Elements by program
- `idx_program_elements_type`: Elements by type
