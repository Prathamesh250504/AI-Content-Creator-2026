# Deployment Checklist

Use this checklist to ensure your deployment is complete and successful.

## Pre-Deployment

### Code Preparation
- [x] Remove unnecessary files and test code
- [x] Create `.env.example` files for reference
- [x] Update `.gitignore` to exclude sensitive files
- [x] Create `netlify.toml` configuration
- [x] Create deployment documentation
- [ ] Run final tests locally
- [ ] Commit all changes to git
- [ ] Push to GitHub repository

### Environment Setup
- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with proper permissions
- [ ] IP whitelist configured (0.0.0.0/0 for production)
- [ ] Connection string obtained
- [ ] OpenAI API key obtained
- [ ] JWT secret key generated (min 32 characters)

### Google OAuth Setup (if using)
- [ ] Google Cloud project created
- [ ] OAuth 2.0 credentials created
- [ ] Authorized JavaScript origins configured
- [ ] Authorized redirect URIs configured
- [ ] Client ID and Secret obtained

## Backend Deployment (Render/Railway/Heroku)

### Render.com Deployment
- [ ] Account created at render.com
- [ ] New Web Service created
- [ ] GitHub repository connected
- [ ] Root directory set to `backend`
- [ ] Build command: `pip install -r ../requirements.txt`
- [ ] Start command: `python start_server.py`
- [ ] Environment variables added:
  - [ ] `OPENAI_API_KEY`
  - [ ] `MONGODB_URI`
  - [ ] `JWT_SECRET_KEY`
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `PORT=8000`
  - [ ] `FLASK_ENV=production`
- [ ] Service deployed successfully
- [ ] Backend URL noted (e.g., https://your-app.onrender.com)
- [ ] Health check endpoint tested: `/api/health`

## Frontend Deployment (Netlify)

### Netlify Deployment
- [ ] Account created at netlify.com
- [ ] GitHub repository connected
- [ ] Build settings configured:
  - [ ] Base directory: `react-frontend`
  - [ ] Build command: `npm run build`
  - [ ] Publish directory: `react-frontend/build`
- [ ] Environment variables added:
  - [ ] `REACT_APP_API_URL` (backend URL + /api)
  - [ ] `REACT_APP_GOOGLE_CLIENT_ID`
  - [ ] `BACKEND_API_URL` (for serverless functions)
- [ ] Site deployed successfully
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS enabled (automatic with Netlify)

## Post-Deployment Testing

### Backend API Tests
- [ ] Health endpoint: `GET /api/health`
- [ ] Register user: `POST /api/auth/register`
- [ ] Login user: `POST /api/auth/login`
- [ ] Generate content: `POST /api/generate`
- [ ] Get templates: `GET /api/templates`
- [ ] Get history: `GET /api/auth/history`

### Frontend Tests
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Google OAuth works (if configured)
- [ ] Content generation works
- [ ] All content types generate successfully
- [ ] Language preferences work (English/Marathi/Hindi)
- [ ] Content history displays
- [ ] Settings page works
- [ ] Theme toggle works
- [ ] Mobile responsive design works

### Integration Tests
- [ ] Frontend connects to backend API
- [ ] CORS is configured correctly
- [ ] Authentication flow works end-to-end
- [ ] Content saves to database
- [ ] User preferences persist
- [ ] Error handling works properly

## Security Checklist

- [ ] All API keys stored in environment variables (not in code)
- [ ] `.env` files added to `.gitignore`
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS configured with appropriate origins
- [ ] JWT tokens expire appropriately
- [ ] Database connection uses authentication
- [ ] No sensitive data in client-side code
- [ ] Rate limiting configured (if applicable)

## Performance Optimization

- [ ] Frontend build optimized (minified, compressed)
- [ ] Images optimized
- [ ] API responses cached where appropriate
- [ ] Database queries optimized
- [ ] CDN configured for static assets (Netlify provides this)

## Monitoring Setup

- [ ] Error tracking configured (optional: Sentry)
- [ ] Uptime monitoring configured (optional: UptimeRobot)
- [ ] Backend logs accessible
- [ ] Frontend logs accessible (Netlify Functions)
- [ ] Database monitoring enabled (MongoDB Atlas)

## Documentation

- [ ] README.md updated with deployment info
- [ ] DEPLOYMENT.md created with detailed instructions
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Known issues documented

## Final Steps

- [ ] Test all major user flows
- [ ] Verify mobile responsiveness
- [ ] Check browser compatibility
- [ ] Share deployment URLs with team
- [ ] Update Google OAuth redirect URIs with production URL
- [ ] Monitor for errors in first 24 hours
- [ ] Create backup of database
- [ ] Document any deployment issues encountered

## Rollback Plan

In case of issues:
1. Revert to previous git commit
2. Redeploy previous version on Netlify
3. Check backend logs for errors
4. Verify environment variables
5. Test database connectivity
6. Contact support if needed

## Support Resources

- Netlify Docs: https://docs.netlify.com
- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- React Docs: https://react.dev
- Flask Docs: https://flask.palletsprojects.com

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Production URLs**:
- Frontend: _________________
- Backend: _________________

**Notes**: _________________
