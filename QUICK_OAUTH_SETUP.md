# Quick OAuth Setup (5 minutes)

## Why OAuth isn't working:
The OAuth buttons aren't working because Google and GitHub providers aren't configured in your Supabase project yet.

## Quick Fix:

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Click on **Authentication** in the left sidebar
3. Click on **Providers**

### Step 2: Enable Google OAuth
1. Find **Google** in the list
2. Click the toggle to **Enable** it
3. You'll see fields for **Client ID** and **Client Secret**
4. For now, just enable it (you can add credentials later)

### Step 3: Enable GitHub OAuth
1. Find **GitHub** in the list
2. Click the toggle to **Enable** it
3. Same as Google - just enable for now

### Step 4: Test
1. Go back to your app: http://localhost:3000/user/login
2. Click the **"Check OAuth Status"** button
3. You should see both providers as "Configured"

## To make OAuth fully functional:

### For Google:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/user/auth/callback`
6. Copy Client ID and Secret to Supabase

### For GitHub:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `http://localhost:3000/user/auth/callback`
4. Copy Client ID and Secret to Supabase

## Current Status:
- ✅ Remember Me functionality works
- ✅ OAuth routes are implemented
- ✅ Error handling is in place
- ❌ OAuth providers need to be configured in Supabase

## Test the Remember Me:
1. Go to login page
2. Check "Remember me" checkbox
3. Login with email/password
4. Close browser and reopen
5. You should still be logged in (30-day cookie)

The OAuth will work once you configure the providers in Supabase! 