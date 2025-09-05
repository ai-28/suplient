# NextAuth Setup Guide for Mental Coach Platform

## Overview
This project implements NextAuth.js with email/password authentication and JWT strategy for the App Router. It includes coach signup functionality with email, password, and phone number validation.

## Features
- ✅ NextAuth.js with Credentials Provider
- ✅ JWT-based authentication
- ✅ Secure password hashing with PBKDF2
- ✅ Coach registration with name, email, password, and phone
- ✅ Protected routes with middleware
- ✅ Session management
- ✅ Form validation and error handling

## Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Next.js 15+ (App Router)

## Installation

1. **Install dependencies:**
```bash
npm install next-auth@beta bcryptjs
```

2. **Environment Configuration:**
Create a `.env.local` file in your project root with:
```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-change-in-production

# Database Configuration
DATABASE_URL=your-database-connection-string

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here-change-in-production
```

## Database Schema

The authentication system expects a `User` table with the following structure:

```sql
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'coach',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/
│   │       │   └── route.js          # NextAuth API route
│   │       └── register/
│   │           └── route.js          # User registration API
│   ├── components/
│   │   ├── providers/
│   │   │   └── SessionProvider.jsx   # NextAuth session provider
│   │   └── ui/                       # UI components
│   ├── hooks/
│   │   └── useAuth.js                # Custom auth hook
│   ├── lib/
│   │   ├── authoption.js             # NextAuth configuration
│   │   └── db/
│   │       └── userRepo.js           # Database operations
│   ├── (auth)/
│   │   └── login/
│   │       └── page.js               # Login page
│   ├── (main)/
│   │   └── dashboard/
│   │       └── page.js               # Protected dashboard
│   ├── pages/
│   │   └── Login.jsx                 # Login component
│   └── layout.js                     # Root layout with SessionProvider
├── middleware.js                      # Route protection
└── env.example                        # Environment variables template
```

## Usage

### 1. Authentication Flow

**Login:**
- Users can sign in with email and password
- Successful login redirects to `/dashboard`
- Failed login shows error message

**Registration:**
- Coaches can sign up with name, email, password, and phone
- Password must be at least 8 characters
- Email uniqueness is validated
- Phone number format is validated

### 2. Protected Routes

Routes starting with `/dashboard` are automatically protected. Unauthenticated users are redirected to `/login`.

### 3. Session Management

Use the `useAuth` hook to access authentication state:

```jsx
import { useAuth } from "@/app/hooks/useAuth";

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;
  
  return <div>Welcome, {user.name}!</div>;
}
```

### 4. API Endpoints

**POST /api/auth/register**
- Registers new coach accounts
- Validates input data
- Returns user information on success

**POST /api/auth/signin** (NextAuth)
- Handles user authentication
- Returns JWT token

## Security Features

- **Password Hashing:** PBKDF2 with 10,000 iterations
- **Salt Generation:** Unique salt per user
- **JWT Tokens:** Secure session management
- **Input Validation:** Server-side validation for all inputs
- **Route Protection:** Middleware-based authentication checks

## Customization

### Adding New User Roles
1. Update the `role` field validation in `userRepo.js`
2. Modify the registration form in `Login.jsx`
3. Add role-specific logic in the dashboard

### Changing Password Requirements
Update the validation in `/api/auth/register/route.js`:

```javascript
// Example: Require uppercase and numbers
if (!/(?=.*[A-Z])(?=.*\d)/.test(password)) {
  return NextResponse.json(
    { error: 'Password must contain uppercase letter and number' },
    { status: 400 }
  );
}
```

### Adding OAuth Providers
Modify `authoption.js` to include additional providers:

```javascript
import GoogleProvider from "next-auth/providers/google";

const authOptions = {
  providers: [
    CredentialsProvider({...}),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // ... rest of config
};
```

## Troubleshooting

### Common Issues

1. **"Invalid email" error:**
   - Check database connection
   - Verify User table exists with correct schema

2. **"Email already exists" error:**
   - User is trying to register with existing email
   - This is expected behavior

3. **Authentication not working:**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches your domain
   - Ensure SessionProvider wraps your app

4. **Database connection errors:**
   - Verify DATABASE_URL format
   - Check PostgreSQL is running
   - Ensure database and tables exist

### Debug Mode

Set `debug: true` in `authoption.js` to see detailed NextAuth logs:

```javascript
const authOptions = {
  // ... other config
  debug: process.env.NODE_ENV === 'development',
};
```

## Production Considerations

1. **Environment Variables:**
   - Use strong, unique secrets for NEXTAUTH_SECRET and JWT_SECRET
   - Never commit `.env.local` to version control

2. **Database:**
   - Use connection pooling for production
   - Implement proper database backups
   - Consider using managed database services

3. **Security:**
   - Enable HTTPS in production
   - Implement rate limiting
   - Add CSRF protection if needed
   - Consider adding 2FA for sensitive accounts

4. **Performance:**
   - Implement caching for user sessions
   - Use database indexes on frequently queried fields
   - Consider Redis for session storage

## Testing

Test the authentication flow:

1. Start the development server: `npm run dev`
2. Navigate to `/login`
3. Try registering a new coach account
4. Test login with the created account
5. Verify protected routes redirect unauthenticated users
6. Test logout functionality

## Support

For issues or questions:
1. Check the NextAuth.js documentation
2. Review the console logs for errors
3. Verify all environment variables are set correctly
4. Ensure database schema matches requirements
