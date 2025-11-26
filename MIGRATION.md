# Migration from Supabase to Hono Auth API

This document outlines the migration from Supabase authentication to the new Hono-based auth API.

## Summary of Changes

### What Changed
- **Removed**: Supabase authentication
- **Added**: Direct integration with Hono auth API at `shuffler-auth.mshahrani.website`
- **Authentication**: JWT-based tokens stored in localStorage
- **Session Management**: Custom auth client with token verification

### Files Modified
1. ✅ **src/lib/auth.ts** - New auth client (replaces Supabase client)
2. ✅ **src/pages/Auth.tsx** - Updated to use new auth client
3. ✅ **src/pages/Index.tsx** - Updated for JWT-based route protection
4. ✅ **src/components/layout/Header.tsx** - Updated to use new User type

### Files to Delete (Optional Cleanup)
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `supabase/` directory (entire folder)

## Migration Steps

### Step 1: Install Dependencies (Already Done)
No new dependencies needed! The migration uses native fetch API.

### Step 2: Remove Supabase Dependencies

```bash
npm uninstall @supabase/supabase-js
```

### Step 3: Clean Up Old Files (Optional)

```bash
# Remove Supabase integration files
rm -rf src/integrations/supabase
rm -rf supabase

# Remove from .gitignore if present
# Remove any Supabase-related environment variables from .env
```

### Step 4: Test the Application

```bash
# Start development server
npm run dev

# Test flow:
# 1. Go to /auth
# 2. Enter a valid access code
# 3. Verify redirect to /app
# 4. Check that user info shows in header
# 5. Test sign out
# 6. Verify redirect to /auth after sign out
```

## API Endpoints Used

### Verify Code (Login)
```
POST https://shuffler-auth.mshahrani.website/api/auth/verify
Body: { "code": "YOUR_CODE" }
Response: { "success": true, "token": "JWT_TOKEN", "user": { "email": "...", "name": "..." } }
```

### Verify Token (Get Current User)
```
GET https://shuffler-auth.mshahrani.website/api/auth/me
Headers: { "Authorization": "Bearer JWT_TOKEN" }
Response: { "success": true, "user": { "email": "...", "name": "..." } }
```

## Authentication Flow

### Before (Supabase)
1. User enters code
2. Call Supabase Edge Function
3. Edge Function validates code with external API
4. Edge Function creates/updates Supabase user
5. Edge Function returns temp password
6. Client signs in with email/password
7. Supabase manages session

### After (Hono API)
1. User enters code
2. Direct call to Hono API
3. Hono API validates code with external API
4. Hono API generates JWT token
5. Client stores JWT token
6. Client uses JWT for authentication

## Data Storage

### localStorage Keys
- `auth_token` - JWT token
- `user_data` - User information (name, email)

### Old Keys (Safe to Remove)
- `userFullName` - Old Supabase data
- `userEmail` - Old Supabase data
- Supabase session data (automatically removed)

## Security Notes

1. **JWT Tokens**: Expire after 30 days
2. **Token Storage**: Stored in localStorage (same as before with Supabase)
3. **Route Protection**: Token verified on page load
4. **API Calls**: All API calls use HTTPS
5. **CORS**: Configured on Hono API side

## Troubleshooting

### Issue: "Failed to verify code"
- Check that the access code is correct
- Verify API is accessible: `curl https://shuffler-auth.mshahrani.website/`
- Check browser console for detailed error messages

### Issue: Redirect loop between /auth and /app
- Clear localStorage: `localStorage.clear()`
- Check that token is being stored correctly
- Verify `/api/auth/me` endpoint is working

### Issue: User shows as signed out after refresh
- Token may be expired (30 days)
- Token may be invalid
- Check browser console for API errors

## Rollback Plan (If Needed)

If you need to rollback to Supabase:

1. Reinstall Supabase:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Restore old files from git:
   ```bash
   git checkout HEAD~1 src/pages/Auth.tsx
   git checkout HEAD~1 src/pages/Index.tsx
   git checkout HEAD~1 src/components/layout/Header.tsx
   git checkout HEAD~1 src/integrations/supabase/
   ```

3. Remove new auth client:
   ```bash
   rm src/lib/auth.ts
   ```

## Testing Checklist

- [ ] User can sign in with valid code
- [ ] Invalid code shows error message
- [ ] User info displays in header
- [ ] Protected routes redirect to /auth when not authenticated
- [ ] Sign out works correctly
- [ ] Page refresh maintains authentication
- [ ] Token expiration redirects to /auth

## Support

For issues with the auth API, contact: mshahrani@kfupm.edu.sa

## Next Steps (Optional Enhancements)

1. **Token Refresh**: Implement automatic token refresh before expiration
2. **Remember Me**: Add option to remember user across browser sessions
3. **Session Timeout**: Add automatic logout after inactivity
4. **Auth Context**: Create React Context for auth state management
5. **Protected Route Component**: Create reusable ProtectedRoute wrapper component
