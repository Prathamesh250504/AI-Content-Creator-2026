# Connecting Frontend and Backend

This guide explains how to connect your React frontend (deployed on Netlify) with your Flask backend (deployed on Render).

## Overview

- **Frontend**: React app deployed on Netlify
- **Backend**: Flask API deployed on Render
- **Connection**: Frontend makes HTTP requests to backend API

## Step-by-Step Connection Guide

### Step 1: Get Your Render Backend URL

1. Go to your Render dashboard: https://dashboard.render.com
2. Find your backend service (the one you just deployed)
3. Copy the URL - it should look like:
   ```
   https://your-app-name.onrender.com
   ```
4. Test the backend health endpoint by visiting:
   ```
   https://your-app-name.onrender.com/api/health
   ```
   You should see: `{"status": "healthy", "timestamp": "..."}`

### Step 2: Configure Environment Variables in Render

Before connecting, make sure your Render backend has these environment variables set:

1. Go to your Render service → **Environment** tab
2. Add/verify these variables:

```bash
# Required
OPENROUTER_API_KEY=your_openrouter_api_key_here
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key_here

# Optional but recommended
FLASK_ENV=production
CORS_ORIGINS=https://your-netlify-app.netlify.app,http://localhost:3000
```

**Important**: Replace `your-netlify-app.netlify.app` with your actual Netlify domain!

### Step 3: Configure Environment Variables in Netlify

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your frontend site
3. Go to **Site settings** → **Environment variables**
4. Add these variables:

```bash
# Backend API URL (CRITICAL - use your Render URL)
REACT_APP_API_URL=https://your-app-name.onrender.com/api

# Google OAuth (already set)
REACT_APP_GOOGLE_CLIENT_ID=761738188033-2qj8ulfak02gosv5esoll637eqa7ql1i.apps.googleusercontent.com

# App Configuration
REACT_APP_ENV=production
REACT_APP_NAME=AI Content Creator
```

**Replace `your-app-name.onrender.com` with your actual Render backend URL!**

### Step 4: Update CORS in Backend

Your backend needs to allow requests from your Netlify domain. Update the `CORS_ORIGINS` environment variable in Render:

```bash
CORS_ORIGINS=https://your-netlify-app.netlify.app,http://localhost:3000
```

This tells the backend to accept requests from:
- Your Netlify production site
- Localhost (for local development)

### Step 5: Redeploy Frontend

After setting environment variables in Netlify:

1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for deployment to complete

### Step 6: Test the Connection

1. Visit your Netlify site: `https://your-netlify-app.netlify.app`
2. Open browser DevTools (F12) → Console tab
3. Look for this log message:
   ```
   API Service baseURL: https://your-app-name.onrender.com/api
   ```
4. Try generating content - it should work!

## Troubleshooting

### Issue: "Network Error" or "Failed to fetch"

**Solution**: Check CORS configuration
1. Verify `CORS_ORIGINS` in Render includes your Netlify domain
2. Make sure there are no typos in the domain name
3. Redeploy backend after changing CORS settings

### Issue: "404 Not Found" on API calls

**Solution**: Check API URL
1. Verify `REACT_APP_API_URL` in Netlify is correct
2. Make sure it ends with `/api` (not just the domain)
3. Test the health endpoint: `https://your-backend.onrender.com/api/health`

### Issue: Backend is slow or times out

**Solution**: Render free tier has cold starts
1. First request after inactivity takes 30-60 seconds (cold start)
2. Consider upgrading to paid tier for always-on instances
3. Or implement a keep-alive ping service

### Issue: "Authorization token required"

**Solution**: Authentication issue
1. Make sure you're logged in on the frontend
2. Check that JWT_SECRET is set in Render
3. Verify token is being sent in request headers

## Local Development Setup

For local development, you can test with local backend:

### Option 1: Use Local Backend

1. Start backend locally:
   ```bash
   cd backend
   python start_server.py
   ```

2. Start frontend with proxy (package.json already configured):
   ```bash
   cd react-frontend
   npm start
   ```

3. Frontend will proxy `/api` requests to `http://localhost:8000`

### Option 2: Use Production Backend

1. Create `react-frontend/.env.local`:
   ```bash
   REACT_APP_API_URL=https://your-app-name.onrender.com/api
   ```

2. Start frontend:
   ```bash
   cd react-frontend
   npm start
   ```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Netlify (Frontend)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React App (Static Files)                             │ │
│  │  - HTML, CSS, JavaScript                              │ │
│  │  - Environment: REACT_APP_API_URL                     │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS API Calls
                         │ (axios requests)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Render (Backend)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Flask API Server (Python)                            │ │
│  │  - REST API endpoints                                 │ │
│  │  - CORS enabled for Netlify domain                    │ │
│  │  - Environment: OPENROUTER_API_KEY, MONGODB_URI       │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ MongoDB Driver
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Atlas (Database)                   │
│  - User profiles, content history, analytics                │
└─────────────────────────────────────────────────────────────┘
```

## Quick Reference

### Frontend (Netlify)
- **URL**: `https://your-netlify-app.netlify.app`
- **Environment Variable**: `REACT_APP_API_URL`
- **Value**: `https://your-render-backend.onrender.com/api`

### Backend (Render)
- **URL**: `https://your-render-backend.onrender.com`
- **Health Check**: `https://your-render-backend.onrender.com/api/health`
- **Environment Variable**: `CORS_ORIGINS`
- **Value**: `https://your-netlify-app.netlify.app,http://localhost:3000`

### Testing Checklist

- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend console shows correct API baseURL
- [ ] CORS_ORIGINS includes Netlify domain
- [ ] REACT_APP_API_URL is set in Netlify
- [ ] Can generate content successfully
- [ ] Can view content history
- [ ] Authentication works (login/signup)
- [ ] No CORS errors in browser console

## Next Steps

1. Monitor your Render logs for any errors
2. Set up monitoring/alerting for backend uptime
3. Consider upgrading Render plan for better performance
4. Implement error tracking (e.g., Sentry)
5. Set up analytics to track API usage

## Support

If you encounter issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Netlify deploy logs: Dashboard → Deploys → Latest deploy
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
