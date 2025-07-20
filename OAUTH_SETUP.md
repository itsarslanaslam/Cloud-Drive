# OAuth Setup Guide

This guide will help you set up Google and GitHub OAuth authentication for your CloudDrive application.

## Prerequisites

1. A Supabase project with authentication enabled
2. Google OAuth credentials
3. GitHub OAuth credentials

## Step 1: Supabase Configuration

1. Go to your Supabase dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Google** and **GitHub** providers

## Step 2: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
5. Configure the OAuth consent screen
6. Set the authorized redirect URIs:
   - For development: `http://localhost:3000/user/auth/callback`
   - For production: `https://yourdomain.com/user/auth/callback`
7. Copy the **Client ID** and **Client Secret**
8. In Supabase, paste these credentials in the Google provider settings

## Step 3: GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the application details:
   - **Application name**: CloudDrive
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:3000/user/auth/callback`
4. Click **Register application**
5. Copy the **Client ID** and **Client Secret**
6. In Supabase, paste these credentials in the GitHub provider settings

## Step 4: Environment Variables

1. Copy `config.env.example` to `.env`
2. Fill in your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

## Step 5: Test the Setup

1. Start your application: `npm start`
2. Go to the login or register page
3. Click "Continue with Google" or "Continue with GitHub"
4. You should be redirected to the OAuth provider for authentication
5. After successful authentication, you'll be redirected back to your dashboard

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**:
   - Make sure the redirect URI in your OAuth app matches exactly: `http://localhost:3000/user/auth/callback`

2. **"OAuth provider not configured" error**:
   - Check that you've enabled the provider in Supabase
   - Verify that the Client ID and Client Secret are correct

3. **"Authentication failed" error**:
   - Check the browser console for detailed error messages
   - Verify your Supabase configuration

### Production Deployment:

When deploying to production:
1. Update the redirect URIs in your OAuth apps to use your production domain
2. Set `NODE_ENV=production` in your environment variables
3. Ensure your domain uses HTTPS (required for OAuth)

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your OAuth client secrets
- Monitor your OAuth usage and set appropriate rate limits 