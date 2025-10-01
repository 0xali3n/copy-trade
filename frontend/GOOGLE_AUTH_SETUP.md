# Google Authentication Setup

This document explains how to set up Google authentication for the Kana Copy Trader frontend.

## Prerequisites

1. **Supabase Project**: You need a Supabase project with Google OAuth configured
2. **Google OAuth App**: A Google OAuth application configured in Google Cloud Console

## Supabase Configuration

### 1. Enable Google Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

### 2. Configure Redirect URLs

In Supabase Authentication settings, add these redirect URLs:

- `http://localhost:5173` (for development)
- `https://yourdomain.com` (for production)

### 3. Database Setup

Run the SQL script to set up the database schema:

```sql
-- Run the contents of frontend/database/schema-google-auth.sql
```

This script will:

- Create a `users` table with Google auth fields
- Set up Row Level Security (RLS) policies
- Create triggers for automatic user profile creation
- Grant necessary permissions

## Environment Variables

Create a `.env` file in the frontend directory with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here

# Kana Labs API Configuration
VITE_KANA_API_KEY=your_kana_api_key_here
VITE_KANA_REST=https://perps-tradeapi.kana.trade
VITE_KANA_WS=wss://perpetuals-indexer-ws.kana.trade/ws/
VITE_APTOS_NODE=https://fullnode.mainnet.aptoslabs.com
VITE_MARKET_ID=15
```

## Google Cloud Console Setup

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
5. Configure the OAuth consent screen
6. Add authorized redirect URIs:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`

### 2. Get Credentials

Copy the **Client ID** and **Client Secret** to your Supabase project settings.

## Features

### Authentication Flow

1. **Sign In**: Users click "Sign in with Google" button
2. **OAuth Redirect**: Redirected to Google for authentication
3. **Profile Creation**: Supabase automatically creates user profile
4. **Session Management**: Session persists across browser refreshes
5. **Sign Out**: Users can sign out, clearing their session

### User Profile

Each authenticated user gets:

- **Google Profile**: Name, email, avatar from Google
- **Active Account**: Optional Aptos wallet for trading
- **Trading Settings**: JSON field for future trading preferences

### Security

- **Row Level Security**: Users can only access their own data
- **Session Persistence**: Secure session management via Supabase
- **Automatic Cleanup**: Sessions expire automatically

## Development

### Running the App

```bash
cd frontend
npm install
npm run dev
```

### Testing Authentication

1. Open `http://localhost:5173`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Verify user profile is created in Supabase
5. Test sign out functionality

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure redirect URIs match exactly in Google Console
2. **CORS Issues**: Make sure your domain is whitelisted in Supabase
3. **Session Not Persisting**: Check if cookies are enabled in browser
4. **Database Errors**: Verify RLS policies are correctly set up

### Debug Mode

Enable debug logging by opening browser console. The app logs:

- Authentication state changes
- User profile loading
- Database operations
- Error messages

## Next Steps

After Google auth is working:

1. **Create Active Account**: Users can generate Aptos wallets for trading
2. **Kana Labs Integration**: Connect to Kana Labs API for trading
3. **Trading Features**: Implement copy trading functionality
4. **Profile Management**: Add user settings and preferences

## Security Considerations

- Never expose private keys in client-side code
- Use environment variables for sensitive configuration
- Regularly rotate API keys and secrets
- Monitor authentication logs for suspicious activity
- Implement rate limiting for API calls
