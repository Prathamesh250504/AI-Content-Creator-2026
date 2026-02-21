# Google Sign-In Setup Guide

This guide helps you set up and troubleshoot Google Sign-In for your AI Content Creator app.

## Prerequisites

You need:
1. Google Cloud Project with OAuth 2.0 credentials
2. Google Client ID configured for your domains
3. Backend and frontend properly connected

## Step 1: Configure Google Cloud Console

### 1.1 Create OAuth 2.0 Credentials (if not done)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create a new one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**

### 1.2 Configure Authorized Origins and Redirect URIs

Add these to your OAuth 2.0 Client:

**Authorized JavaScript origins:**
```
http://localhost:3000
http://192.168.1.5:3000
https://your-netlify-app.netlify.app
```

**Authorized redirect URIs:**
```
http://localhost:3000
http://192.168.1.5:3000
https://your-netlify-app.netlify.app
```

**Important**: Replace `your-netlify-app.netlify.app` with your actual Netlify domain!

### 1.3 Get Your Client ID

After creating credentials, copy your **Client ID**. It looks like:
```
761738188033-xxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

## Step 2: Configure Backend (Render)

### 2.1 Set Environment Variable

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add this variable:

```bash
GOOGLE_CLIENT_ID=761738188033-2qj8ulfak02gosv5esoll637eqa7ql1i.apps.googleusercontent.com
```

**Replace with your actual Client ID from Step 1.3!**

### 2.2 Verify Backend Dependencies

The backend needs these packages (already added to requirements.txt):
- `google-auth==2.37.0`
- `google-auth-oauthlib==1.2.1`
- `google-auth-httplib2==0.2.0`

After updating requirements.txt, Render will automatically redeploy.

## Step 3: Configure Frontend (Netlify)

### 3.1 Set Environment Variable

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Verify this variable exists:

```bash
REACT_APP_GOOGLE_CLIENT_ID=761738188033-2qj8ulfak02gosv5esoll637eqa7ql1i.apps.googleusercontent.com
```

**Use the SAME Client ID as in the backend!**

### 3.2 Redeploy Frontend

After setting the variable:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**

## Step 4: Test Google Sign-In

1. Open your Netlify site
2. Click "Sign in with Google"
3. Select your Google account
4. Grant permissions
5. You should be redirected back and logged in

## Troubleshooting

### Issue 1: "Invalid Client ID" or "400 Error"

**Cause**: Client ID mismatch or not configured properly

**Solution**:
1. Verify `GOOGLE_CLIENT_ID` in Render matches your Google Cloud Console
2. Verify `REACT_APP_GOOGLE_CLIENT_ID` in Netlify matches the same ID
3. Make sure there are no extra spaces or quotes
4. Redeploy both frontend and backend

### Issue 2: "Redirect URI Mismatch"

**Cause**: Your Netlify domain is not in authorized redirect URIs

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client
3. Add your Netlify domain to **Authorized JavaScript origins**:
   ```
   https://your-actual-netlify-domain.netlify.app
   ```
4. Add to **Authorized redirect URIs**:
   ```
   https://your-actual-netlify-domain.netlify.app
   ```
5. Save and wait 5 minutes for changes to propagate

### Issue 3: "Network Error" or "Failed to authenticate"

**Cause**: Backend not receiving the request or CORS issue

**Solution**:
1. Check browser console (F12) for errors
2. Verify `REACT_APP_API_URL` is set correctly in Netlify
3. Verify `CORS_ORIGINS` in Render includes your Netlify domain
4. Test backend health: `https://your-backend.onrender.com/api/health`
5. Check Render logs for errors

### Issue 4: "google.auth module not found"

**Cause**: Backend missing Google auth libraries

**Solution**:
1. Verify `requirements.txt` includes:
   ```
   google-auth==2.37.0
   google-auth-oauthlib==1.2.1
   google-auth-httplib2==0.2.0
   ```
2. Commit and push changes
3. Wait for Render to redeploy
4. Check Render logs to confirm packages installed

### Issue 5: "Token verification failed"

**Cause**: Backend can't verify the Google token

**Solution**:
1. Ensure `GOOGLE_CLIENT_ID` is set in Render
2. Check Render logs for specific error messages
3. Verify the Client ID matches exactly (no typos)
4. Make sure the token is being sent correctly from frontend

### Issue 6: Google Sign-In popup blocked

**Cause**: Browser blocking popups

**Solution**:
1. Allow popups for your site
2. Or use redirect flow instead of popup
3. Check browser console for popup blocker messages

## Testing Checklist

- [ ] Google Client ID created in Google Cloud Console
- [ ] Netlify domain added to authorized origins
- [ ] `GOOGLE_CLIENT_ID` set in Render environment
- [ ] `REACT_APP_GOOGLE_CLIENT_ID` set in Netlify environment
- [ ] Both IDs match exactly
- [ ] Backend has google-auth packages installed
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Can click "Sign in with Google" button
- [ ] Google popup/redirect appears
- [ ] Can select Google account
- [ ] Successfully redirected back to app
- [ ] User is logged in (see user info in UI)
- [ ] No errors in browser console
- [ ] No errors in Render logs

## Environment Variables Summary

### Render (Backend)
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
OPENROUTER_API_KEY=your-openrouter-key
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=https://your-netlify-app.netlify.app,http://localhost:3000
```

### Netlify (Frontend)
```bash
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
REACT_APP_ENV=production
```

## Debug Mode

To see detailed logs:

### Frontend (Browser Console)
1. Open DevTools (F12)
2. Go to Console tab
3. Look for messages starting with "AuthService" or "Google"

### Backend (Render Logs)
1. Go to Render dashboard
2. Select your service
3. Click **Logs** tab
4. Look for messages about Google authentication

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Invalid client ID" | Client ID not recognized | Check Google Cloud Console credentials |
| "Redirect URI mismatch" | Domain not authorized | Add domain to Google Cloud Console |
| "Token verification failed" | Backend can't verify token | Check GOOGLE_CLIENT_ID in Render |
| "Network error" | Can't reach backend | Check REACT_APP_API_URL and CORS |
| "Module not found: google.auth" | Missing dependencies | Add google-auth to requirements.txt |

## Need More Help?

1. Check browser console for frontend errors
2. Check Render logs for backend errors
3. Verify all environment variables are set correctly
4. Make sure domains match in all configurations
5. Wait 5 minutes after changing Google Cloud Console settings

## Security Notes

- Never commit Client ID secrets to git
- Use environment variables for all sensitive data
- Keep your JWT_SECRET secure
- Regularly rotate your secrets
- Monitor for suspicious login attempts
