# Backend Deployment Checklist

Quick checklist for deploying backend to Render.

## Pre-Deployment

- [ ] Code pushed to GitHub (branch: `ai-cc`)
- [ ] MongoDB Atlas cluster created
- [ ] MongoDB connection string obtained
- [ ] OpenAI API key obtained
- [ ] JWT secret generated (32+ characters)

## Render Setup

- [ ] Created Render account
- [ ] Connected GitHub repository
- [ ] Created new Web Service

## Configuration

- [ ] **Name**: `ai-content-creator-backend`
- [ ] **Region**: Selected closest region
- [ ] **Branch**: `ai-cc`
- [ ] **Root Directory**: `backend`
- [ ] **Runtime**: Python
- [ ] **Build Command**: `pip install -r ../requirements.txt`
- [ ] **Start Command**: `python start_server.py`
- [ ] **Plan**: Free (or Starter)

## Environment Variables

- [ ] `OPENAI_API_KEY` = `sk-proj-...`
- [ ] `MONGODB_URI` = `mongodb+srv://...`
- [ ] `JWT_SECRET_KEY` = `your-secret-32-chars-min`
- [ ] `PORT` = `8000`
- [ ] `FLASK_ENV` = `production`
- [ ] `GOOGLE_CLIENT_ID` = `your-client-id` (optional)
- [ ] `GOOGLE_CLIENT_SECRET` = `your-secret` (optional)

## Deployment

- [ ] Clicked "Create Web Service"
- [ ] Watched deployment logs
- [ ] Deployment successful (green checkmark)
- [ ] Copied backend URL

## Testing

- [ ] Health endpoint works: `https://your-url.onrender.com/api/health`
- [ ] Returns: `{"status": "healthy", ...}`

## Frontend Integration

- [ ] Updated Netlify environment variable:
  - `REACT_APP_API_URL` = `https://your-backend-url.onrender.com/api`
- [ ] Triggered Netlify redeploy
- [ ] Frontend connects to backend successfully

## Google OAuth (if using)

- [ ] Updated Google Cloud Console:
  - [ ] Added backend URL to Authorized JavaScript origins
  - [ ] Added callback URL to Authorized redirect URIs
- [ ] Tested Google login

## Final Testing

- [ ] User registration works
- [ ] User login works
- [ ] Content generation works (English)
- [ ] Content generation works (Marathi)
- [ ] Content generation works (Hindi)
- [ ] Content history saves
- [ ] Settings update works
- [ ] All features functional

## Post-Deployment

- [ ] Documented backend URL
- [ ] Set up monitoring (optional)
- [ ] Tested on mobile device
- [ ] Shared with team/users

---

## Quick Commands

### Test Health Endpoint
```bash
curl https://your-backend-url.onrender.com/api/health
```

### Test Registration
```bash
curl -X POST https://your-backend-url.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","firstName":"Test","lastName":"User"}'
```

### View Logs
Go to Render dashboard → Your service → Logs tab

### Restart Service
Render dashboard → Your service → Manual Deploy → Restart

---

## Troubleshooting

### Build Fails
- Check Root Directory is `backend`
- Check Build Command is `pip install -r ../requirements.txt`
- Clear build cache and redeploy

### Service Won't Start
- Check all environment variables are set
- Check MongoDB connection string is correct
- Check MongoDB IP whitelist includes `0.0.0.0/0`
- View logs for error messages

### Slow Response (Free Tier)
- Normal for first request after inactivity (30-60 sec)
- Service sleeps after 15 minutes
- Upgrade to Starter plan for always-on

---

**Backend URL**: ___________________________________

**Deployed Date**: ___________________________________

**Deployed By**: ___________________________________
