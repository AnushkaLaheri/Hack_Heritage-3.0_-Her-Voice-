# Production Deployment Issues & Solutions

## 🚨 Current Issues Fixed

### 1. ✅ CORS Policy Error - FIXED
**Error**: `Access to XMLHttpRequest at 'https://her-voice-backend.onrender.com/api/auth/login' from origin 'https://her-voice-six.vercel.app' has been blocked by CORS policy`

**Solution**: Updated backend CORS configuration to include your Vercel domain:
```python
CORS(app, 
     origins=[
         "http://localhost:3000", 
         "http://127.0.0.1:3000",
         "https://her-voice-six.vercel.app",
         "https://her-voice-six.vercel.app/"
     ],
     methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
     supports_credentials=True,
     expose_headers=["Content-Type", "Authorization"])
```

### 2. ✅ Manifest Icon Error - FIXED
**Error**: `Error while trying to use the following icon from the Manifest: https://her-voice-six.vercel.app/logo192.png`

**Solution**: Updated `manifest.json` to remove missing favicon reference and use only existing logo files.

### 3. ⚠️ Google OAuth Error - NEEDS MANUAL FIX
**Error**: `The given origin is not allowed for the given client ID`

**Solution Required**: You need to add your Vercel domain to Google OAuth Console:

## 🔧 Manual Steps Required

### Step 1: Update Google OAuth Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID: `130602496471-kldm5et5sugnmg79mnmi0adrib53f50r.apps.googleusercontent.com`
4. Click **Edit** on your OAuth client
5. Under **Authorized JavaScript origins**, add:
   - `https://her-voice-six.vercel.app`
6. Under **Authorized redirect URIs**, add:
   - `https://her-voice-six.vercel.app`
   - `https://her-voice-six.vercel.app/login`
7. Click **Save**

### Step 2: Deploy Backend Changes
Your backend needs to be redeployed with the CORS fixes. If using Render:
1. Go to your Render dashboard
2. Find your backend service
3. Click **Manual Deploy** or push changes to trigger auto-deploy

### Step 3: Verify Environment Variables
Ensure your production environment variables are set correctly:

**Backend (Render)**:
```
GOOGLE_CLIENT_ID=130602496471-kldm5et5sugnmg79mnmi0adrib53f50r.apps.googleusercontent.com
FRONTEND_URL=https://her-voice-six.vercel.app
```

**Frontend (Vercel)**:
```
REACT_APP_API_URL=https://her-voice-backend.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=130602496471-kldm5et5sugnmg79mnmi0adrib53f50r.apps.googleusercontent.com
```

## 🧪 Testing Steps

### 1. Test CORS Fix
```bash
curl -X OPTIONS https://her-voice-backend.onrender.com/api/test \
  -H "Origin: https://her-voice-six.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

### 2. Test API Connection
```bash
curl https://her-voice-backend.onrender.com/api/test
```

### 3. Test Frontend
1. Open `https://her-voice-six.vercel.app`
2. Try to login with email/password
3. Try Google OAuth login
4. Check browser console for errors

## 🔍 Debugging Commands

### Check CORS Headers
```javascript
// In browser console on your Vercel site
fetch('https://her-voice-backend.onrender.com/api/test', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('CORS Headers:', response.headers);
  return response.json();
})
.then(data => console.log('Response:', data))
.catch(error => console.error('Error:', error));
```

### Check Environment Variables
```javascript
// In browser console on your Vercel site
console.log('API URL:', process.env.REACT_APP_API_URL);
console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
```

## 📋 Deployment Checklist

- [x] Backend CORS configuration updated
- [x] Frontend manifest.json fixed
- [x] Environment variables configured
- [ ] Google OAuth origins updated (Manual step required)
- [ ] Backend redeployed with CORS fixes
- [ ] Frontend redeployed (automatic on Vercel)
- [ ] End-to-end testing completed

## 🚀 Expected Results After Fixes

1. **Login functionality** should work without CORS errors
2. **Google OAuth** should work after updating OAuth console
3. **API calls** should succeed from production frontend
4. **Manifest warnings** should be resolved
5. **Images and assets** should load properly

## 🆘 If Issues Persist

### Backend Not Responding
1. Check Render logs for errors
2. Verify environment variables are set
3. Ensure database is connected

### Frontend Issues
1. Check Vercel deployment logs
2. Verify build completed successfully
3. Check browser network tab for failed requests

### Google OAuth Still Failing
1. Double-check authorized origins in Google Console
2. Verify client ID matches in both frontend and backend
3. Clear browser cache and cookies

## 📞 Support

If you encounter issues after following these steps:
1. Check browser console for specific error messages
2. Check network tab for failed API requests
3. Verify all environment variables are correctly set
4. Ensure both frontend and backend are deployed with latest changes

The main issue was the CORS configuration - your backend wasn't allowing requests from your Vercel domain. This has been fixed in the code, but you'll need to redeploy your backend and update Google OAuth settings manually.