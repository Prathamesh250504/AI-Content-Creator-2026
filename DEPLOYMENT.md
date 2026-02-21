# Deployment Guide - AI Content Creator

This guide covers deploying the AI Content Creator application to production.

## Architecture Overview

- **Frontend**: React app deployed on Netlify
- **Backend**: Python Flask API (deploy separately on Render/Railway/Heroku)
- **Database**: MongoDB Atlas (cloud-hosted)

## Option 1: Netlify (Frontend) + Render (Backend)

### Step 1: Deploy Backend to Render

1. Create account at [render.com](https://render.com)

2. Create new Web Service:
   - Connect your GitHub repository
   - Select the `backend` directory
   - Build Command: `pip install -r ../requirements.txt`
   - Start Command: `python start_server.py`

3. Add Environment Variables in Render dashboard:
   ```
   OPENAI_API_KEY=your_openai_key
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET_KEY=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   PORT=8000
   ```

4. Deploy and note your backend URL (e.g., `https://your-app.onrender.com`)

### Step 2: Deploy Frontend to Netlify

1. Create account at [netlify.com](https://netlify.com)

2. Connect your GitHub repository

3. Configure build settings:
   - Base directory: `react-frontend`
   - Build command: `npm run build`
   - Publish directory: `react-frontend/build`

4. Add Environment Variables in Netlify dashboard:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   BACKEND_API_URL=https://your-backend.onrender.com/api
   ```

5. Deploy!

## Option 2: Full Netlify Deployment (with Serverless Functions)

### Prerequisites
- Backend must be deployed separately (Render/Railway/Heroku)
- Update `BACKEND_API_URL` in Netlify environment variables

### Steps

1. Push code to GitHub

2. Connect repository to Netlify

3. Netlify will auto-detect `netlify.toml` configuration

4. Add Environment Variables:
   ```
   REACT_APP_API_URL=/api
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   BACKEND_API_URL=https://your-backend-url.com/api
   ```

5. Deploy

## Environment Variables Reference

### Frontend (.env)
```env
REACT_APP_API_URL=/api
REACT_APP_GOOGLE_CLIENT_ID=761738188033-2qj8ulfak02gosv5esoll637eqa7ql1i.apps.googleusercontent.com
REACT_APP_BACKEND_HOST=localhost
REACT_APP_BACKEND_PORT=8000
```

### Backend (.env)
```env
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET_KEY=your_jwt_secret_key_min_32_chars
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
PORT=8000
FLASK_ENV=production
```

## MongoDB Atlas Setup

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. Create a new cluster (free tier available)

3. Create database user with password

4. Whitelist IP addresses:
   - For development: Your IP
   - For production: `0.0.0.0/0` (allow from anywhere)

5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/ai_content_creator?retryWrites=true&w=majority
   ```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)

2. Create new project or select existing

3. Enable Google+ API

4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://your-netlify-app.netlify.app` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000`
     - `https://your-netlify-app.netlify.app`

5. Copy Client ID and Client Secret

## Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend can connect to backend API
- [ ] MongoDB Atlas is configured and accessible
- [ ] Google OAuth is working
- [ ] Environment variables are set correctly
- [ ] CORS is configured properly
- [ ] SSL/HTTPS is enabled
- [ ] Test all major features:
  - [ ] User registration/login
  - [ ] Content generation
  - [ ] Content history
  - [ ] Settings/preferences
  - [ ] A/B testing
  - [ ] Batch processing

## Troubleshooting

### CORS Issues
- Ensure backend has proper CORS configuration
- Check `Access-Control-Allow-Origin` headers
- Verify API URL in frontend environment variables

### API Connection Issues
- Check backend URL is correct
- Verify backend is running
- Check network tab in browser DevTools
- Ensure environment variables are set

### Google OAuth Issues
- Verify authorized origins in Google Console
- Check Client ID matches in both frontend and backend
- Ensure redirect URIs are correct

### Database Connection Issues
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has proper permissions

## Monitoring and Maintenance

- Monitor backend logs in Render/Railway dashboard
- Check Netlify function logs for errors
- Set up uptime monitoring (e.g., UptimeRobot)
- Regular database backups
- Monitor API usage and costs

## Scaling Considerations

- Use CDN for static assets (Netlify provides this)
- Implement caching for API responses
- Consider Redis for session management
- Monitor and optimize database queries
- Implement rate limiting for API endpoints
