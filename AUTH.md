# Authentication System Documentation

This document describes the current authentication implementation in Smatter and what needs to be done to complete it.

## Current Implementation (Node.js Backend)

### Authentication Flow

1. **User Registration (`POST /auth/signup`)**
   - Validates email, password (min 6 chars), username (max 20 chars), displayName (max 20 chars)
   - Hashes password using bcrypt with salt rounds of 10
   - Creates user in MongoDB
   - Generates session token by base64-encoding the user ID
   - Sets httpOnly, secure, sameSite=strict cookie with 7-day expiration
   - Returns user object (id, username, email)

2. **User Login (`POST /auth/login`)**
   - Validates email and password (min 6 chars)
   - Looks up user by email
   - Compares provided password with stored bcrypt hash
   - On success: generates session token, sets cookie, returns user object
   - On failure: returns 401 Unauthorized

3. **Session Management**
   - Session token is simply base64-encoded user ID (NOT secure)
   - Cookie settings: `httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 days`
   - No server-side session storage - stateless but insecure

4. **Authentication Middleware**
   - `requestHandler()` wrapper handles auth for protected routes
   - Public routes marked with `{ isPublic: true }`
   - Extracts session cookie, decodes user ID, looks up user in database
   - Sets user in request context using `express-http-context`
   - Returns 401 if no cookie, invalid cookie, or user not found

5. **Current User (`GET /auth/me`)**
   - Protected route that returns current user from context
   - Relies on authentication middleware

6. **Logout (`GET /auth/logout`)**
   - Clears the session cookie
   - No server-side session invalidation (because there are no server-side sessions)

### Context System

The app uses `express-http-context` to store the authenticated user:
```typescript
type Context = {
  user: IUser;
};
```

All protected route handlers can access the current user via `getContext().user`.

## Security Issues & TODOs

### 🚨 Critical Security Problems

1. **Insecure Session Tokens**
   - Session tokens are just base64-encoded user IDs
   - Anyone can decode a session token and impersonate users
   - **Fix**: Implement proper JWT tokens or server-side sessions with random tokens

2. **No Session Invalidation**
   - Logout only clears client-side cookie
   - Server has no way to invalidate compromised sessions
   - **Fix**: Implement session blacklist or server-side session storage

3. **Hardcoded Test Passwords**
   - Seed data uses `password: "123456"` for all users (`init.ts:68`)
   - **Fix**: Use proper random passwords or remove seed passwords

4. **No Rate Limiting**
   - No protection against brute force attacks on login
   - **Fix**: Implement rate limiting middleware

### ⚠️ Missing Features

1. **Password Reset**
   - No "forgot password" functionality
   - **Implement**: Password reset via email tokens

2. **Email Verification**
   - Users can sign up with any email without verification
   - **Implement**: Email verification flow

3. **Account Lockout**
   - No protection against repeated failed login attempts
   - **Implement**: Temporary account lockout after failed attempts

4. **Session Management UI**
   - Users can't view or revoke active sessions
   - **Implement**: Session management in user settings

5. **Password Strength Requirements**
   - Only minimum length validation (6 chars)
   - **Implement**: Stronger password policies

6. **Two-Factor Authentication**
   - No 2FA support
   - **Implement**: TOTP or SMS-based 2FA

### 🔧 Code Quality Issues

1. **Error Handling**
   - Generic error messages don't help with debugging
   - **Improve**: More specific error codes and messages

2. **Input Validation**
   - Basic Zod validation but could be more comprehensive
   - **Improve**: Add more validation rules and better error messages

3. **Logging**
   - Minimal auth-related logging
   - **Improve**: Add security event logging (login attempts, failures, etc.)

## Go Backend Status

The Go backend currently has **NO authentication implementation**:
- No auth routes defined
- No authentication middleware
- No session handling
- No user management

### Required Go Implementation

To match the Node.js backend, the Go backend needs:

1. **Route Handlers**
   - `POST /auth/login`
   - `POST /auth/signup`  
   - `GET /auth/logout`
   - `GET /auth/me`

2. **Authentication Middleware**
   - Cookie parsing and validation
   - User lookup from session token
   - Context injection for current user

3. **Password Handling**
   - bcrypt hashing (use `golang.org/x/crypto/bcrypt`)
   - Password validation

4. **Session Management**
   - Cookie setting/clearing
   - Base64 encoding/decoding (to match current Node.js behavior)

## Recommended Implementation Order

### Phase 1: Complete Go Backend Parity
1. Implement basic auth routes in Go backend
2. Add authentication middleware
3. Ensure API compatibility with Node.js version

### Phase 2: Security Improvements (Both Backends)
1. Replace insecure session tokens with JWT or proper sessions
2. Add rate limiting to login endpoints
3. Implement proper session invalidation
4. Add security event logging

### Phase 3: Enhanced Features
1. Password reset functionality
2. Email verification
3. Account lockout protection
4. Session management UI

### Phase 4: Advanced Security
1. Two-factor authentication
2. OAuth integration (Google, GitHub, etc.)
3. Advanced password policies
4. Security audit trail

## Testing Considerations

For applicant code challenges, consider having them:
- Fix the session token security issue
- Implement missing auth routes in Go backend
- Add rate limiting middleware
- Implement password reset functionality
- Write comprehensive auth tests

The current insecure implementation provides a good opportunity for candidates to demonstrate security awareness and proper authentication patterns.