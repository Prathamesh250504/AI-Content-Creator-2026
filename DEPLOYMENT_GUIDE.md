# AI Content Creator - Deployment Guide

Complete guide for deploying the AI Content Creator application.

## Architecture

- **Frontend**: React app on Netlify
- **Backend**: Flask API on Render
- **Database**: MongoDB Atlas

## Quick Setup (5 Minutes)

### 1. Backend Deployment (Render)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create new **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: ai-content-creator-backend
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 api_server:app`

5. Add environment variables:
   ```bash
   OPENROUTER_API_KEY=your_openrouter_api_key
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GOOGLE_CLIENT_ID=your_google_client_id
   CORS_ORIGINS=https://your-netlify-app.netlify.app,http://localhost:3000
   ```

6. Deploy and copy your backend URL

### 2. Frontend Deployment (Netlify)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Create new site from Git
3. Connect your GitHub repository
4. Configure:
   - **Base directory**: `react-frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `react-frontend/build`

5. Add environment variables:
   ```bash
   REACT_APP_API_URL=https://your-render-backend.onrender.com/api
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   REACT_APP_ENV=production
   ```

6. Deploy

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized origins:
   ```
   https://your-netlify-app.netlify.app
   http://localhost:3000
   ```
4. Copy Client ID and add to both Render and Netlify

### 4. Test Connection

1. Visit your Netlify URL
2. Open browser console (F12)
3. Try generating content
4. Try Google Sign-In

## Troubleshooting

### Backend Issues

**Problem**: Build fails with Python errors
- **Solution**: Check `runtime.txt` specifies Python 3.11.8

**Problem**: Import errors
- **Solution**: Verify all files are committed to git (check `.gitignore`)

**Problem**: Port binding errors
- **Solution**: Ensure start command uses `$PORT` environment variable

### Frontend Issues

**Problem**: "Network Error" when generating content
- **Solution**: Check `REACT_APP_API_URL` is set correctly in Netlify

**Problem**: CORS errors
- **Solution**: Verify `CORS_ORIGINS` in Render includes your Netlify domain

### Google Sign-In Issues

**Problem**: "Error 400: origin_mismatch"
- **Solution**: Add your Netlify domain to Google Cloud Console authorized origins

**Problem**: "Invalid client ID"
- **Solution**: Verify `GOOGLE_CLIENT_ID` matches in both Render and Netlify

## Environment Variables Reference

### Render (Backend)
```bash
OPENROUTER_API_KEY=sk-or-v1-...
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
CORS_ORIGINS=https://your-app.netlify.app,http://localhost:3000
FLASK_ENV=production
```

### Netlify (Frontend)
```bash
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
REACT_APP_ENV=production
```

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python start_server.py
```

### Frontend
```bash
cd react-frontend
npm install
npm start
```

## Support

For issues, check:
1. Render logs for backend errors
2. Netlify deploy logs for build errors
3. Browser console for frontend errors
4. Verify all environment variables are set
