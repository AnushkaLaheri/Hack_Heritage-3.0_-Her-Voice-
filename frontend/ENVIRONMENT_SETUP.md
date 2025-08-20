# Environment Configuration Guide

This guide explains how the frontend automatically switches between local development and production environments.

## How It Works

The application automatically detects the environment and uses the appropriate API URL:

- **Development**: Uses `http://localhost:5000` (local backend)
- **Production**: Uses `https://her-voice-backend.onrender.com` (Render deployment)

## Environment Files

### `.env.development`
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=130602496471-kldm5et5sugnmg79mnmi0adrib53f50r.apps.googleusercontent.com
```

### `.env.production`
```
REACT_APP_API_URL=https://her-voice-backend.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=130602496471-kldm5et5sugnmg79mnmi0adrib53f50r.apps.googleusercontent.com
```

## Automatic Environment Detection

The application uses React's built-in environment detection:

1. **Development Mode** (`npm start`): Automatically loads `.env.development`
2. **Production Build** (`npm run build`): Automatically loads `.env.production`

## Key Components Updated

### 1. Centralized Axios Configuration (`src/api/axios.ts`)
```typescript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});
```

### 2. All Redux Slices
- `authSlice.ts`
- `postsSlice.ts`
- `equalitySlice.ts`
- `emergencySlice.ts`
- `chatbotSlice.ts`

All now use the centralized `api` instance instead of direct axios calls.

### 3. Image URLs
Updated to use environment variables:
```typescript
src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${post.image_url}`}
```

### 4. Configuration Helper (`src/config/api.ts`)
Provides utility functions for API and image URLs:
```typescript
import { API_CONFIG } from '../config/api';

// Get API URL
const apiUrl = API_CONFIG.getApiUrl('/api/posts');

// Get image URL
const imageUrl = API_CONFIG.getImageUrl(post.image_url);
```

## Usage

### For Development
```bash
npm start
```
- Automatically uses `http://localhost:5000`
- Loads `.env.development`

### For Production Build
```bash
npm run build
```
- Automatically uses `https://her-voice-backend.onrender.com`
- Loads `.env.production`

### For Production Preview
```bash
npm run build
npx serve -s build
```

## Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `REACT_APP_API_URL` | `http://localhost:5000` | `https://her-voice-backend.onrender.com` |
| `NODE_ENV` | `development` | `production` |

## Deployment

### Vercel Deployment
The production environment file (`.env.production`) is automatically used when deploying to Vercel.

### Local Testing of Production Build
To test the production build locally:
```bash
npm run build
npx serve -s build -l 3000
```

## Troubleshooting

### API Calls Failing
1. Check if the backend is running (development)
2. Verify environment variables are set correctly
3. Check browser network tab for actual URLs being called

### Images Not Loading
1. Verify `REACT_APP_API_URL` is set correctly
2. Check if image paths are properly constructed
3. Ensure backend serves static files correctly

### Environment Not Switching
1. Restart the development server after changing `.env` files
2. Clear browser cache
3. Verify `.env` files are in the correct location (frontend root)

## Best Practices

1. **Never commit sensitive data** to environment files
2. **Always use environment variables** for API URLs
3. **Test both environments** before deployment
4. **Use the centralized axios instance** for all API calls
5. **Use the config helper functions** for consistent URL handling

## File Structure
```
frontend/
├── .env.development
├── .env.production
├── src/
│   ├── api/
│   │   └── axios.ts (centralized API configuration)
│   ├── config/
│   │   └── api.ts (configuration helpers)
│   └── store/slices/ (all use centralized API)
```

This setup ensures your application seamlessly switches between local development and production environments without manual intervention.