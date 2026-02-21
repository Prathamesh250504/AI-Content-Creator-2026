# Backend Deployment Guide - Render.com

Complete step-by-step guide to deploy your AI Content Creator backend on Render.

---

## Prerequisites

Before you start, make sure you have:
- ✅ GitHub repository with your code pushed
- ✅ MongoDB Atlas account and connection string
- ✅ OpenAI API key
- ✅ Google OAuth credentials (optional)

---

## Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up with:
   - GitHub (recommended - easier integration)
   - GitLab
   - Email

---

## Step 2: Create New Web Service

1. After logging in, click **"New +"** button (top right)
2. Select **"Web Service"**
3. You'll see "Create a new Web Service" page

---

## Step 3: Connect Your Repository

### If you signed up with GitHub:
1. Click **"Connect account"** next to GitHub
2. Authorize Render to access your repositories
3. Select your repository: `AI-Content-Creator-2026`
4. Click **"Connect"**

### If you didn't sign up with GitHub:
1. You'll need to connect your GitHub account first
2. Go to Account Settings → Connected Accounts
3. Connect GitHub and authorize
4. Return to create Web Service and select your repo

---

## Step 4: Configure Web Service

Fill in the following settings:

### Basic Settings

**Name:**
```
ai-content-creator-backend
```
(or any name you prefer - this will be part of your URL)

**Region:**
- Choose the region closest to you or your users
- Example: `Oregon (US West)` or `Frankfurt (EU Central)`

**Branch:**
```
ai-cc
```
(or `main` if you merged your changes)

**Root Directory:**
```
backend
```
⚠️ **IMPORTANT**: This tells Render to look in the `backend` folder

**Runtime:**
- Should auto-detect as **Python**
- If not, select **Python** from dropdown

---

## Step 5: Configure Build & Start Commands

**Build Command:**
```bash
pip install -r ../requirements.txt
```

**Start Command:**
```bash
python start_server.py
```

---

## Step 6: Select Plan

**Free Plan:**
- ✅ Good for testing and development
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ Takes 30-60 seconds to wake up on first request
- ✅ 750 hours/month free

**Starter Plan ($7/month):**
- ✅ No sleep
- ✅ Always available
- ✅ Better for production

**For now, select:** `Free`

---

## Step 7: Add Environment Variables

Click **"Advanced"** to expand advanced settings, then scroll to **"Environment Variables"**

Add the following variables by clicking **"Add Environment Variable"**:

### Required Variables:

1. **OPENAI_API_KEY**
   ```
   Key: OPENAI_API_KEY
   Value: sk-proj-your-actual-openai-key-here
   ```

2. **MONGODB_URI**
   ```
   Key: MONGODB_URI
   Value: mongodb+srv://username:password@cluster.mongodb.net/ai_content_creator?retryWrites=true&w=majority
   ```
   Replace with your actual MongoDB Atlas connection string

3. **JWT_SECRET_KEY**
   ```
   Key: JWT_SECRET_KEY
   Value: your-super-secret-jwt-key-minimum-32-characters-long
   ```
   Generate a random string (at least 32 characters)

4. **PORT**
   ```
   Key: PORT
   Value: 8000
   ```

5. **FLASK_ENV**
   ```
   Key: FLASK_ENV
   Value: production
   ```

### Optional Variables (for Google OAuth):

6. **GOOGLE_CLIENT_ID**
   ```
   Key: GOOGLE_CLIENT_ID
   Value: 761738188033-2qj8ulfak02gosv5esoll637eqa7ql1i.apps.googleusercontent.com
   ```
   (or your own Google Client ID)

7. **GOOGLE_CLIENT_SECRET**
   ```
   Key: GOOGLE_CLIENT_SECRET
   Value: your-google-client-secret
   ```

---

## Step 8: Create Web Service

1. Review all settings
2. Click **"Create Web Service"** button at the bottom
3. Render will start deploying your backend

---

## Step 9: Monitor Deployment

You'll see the deployment logs in real-time:

```
==> Cloning from https://github.com/...
==> Checking out commit abc123...
==> Running build command: pip install -r ../requirements.txt
==> Installing dependencies...
==> Build successful!
==> Starting service with: python start_server.py
==> Your service is live 🎉
```

**Deployment typically takes 2-5 minutes**

---

## Step 10: Get Your Backend URL

Once deployed, you'll see:
```
Your service is live at https://ai-content-creator-backend.onrender.com
```

**Copy this URL** - you'll need it for the frontend!

---

## Step 11: Test Your Backend

### Test Health Endpoint:

Open in browser or use curl:
```bash
https://your-backend-url.onrender.com/api/health
```

You should see:
```json
{
  "status": "healthy",
  "message": "AI Content Creator API is running"
}
```

### Test with curl:
```bash
curl https://your-backend-url.onrender.com/api/health
```

---

## Step 12: Update Frontend Environment Variables

Now that your backend is deployed, update your Netlify frontend:

1. Go to [app.netlify.com](https://app.netlify.com)
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add/Update:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

Replace `your-backend-url` with your actual Render URL

5. Click **"Save"**
6. Go to **Deploys** → **Trigger deploy** → **Deploy site**

---

## Step 13: Update Google OAuth (if using)

If you're using Google OAuth, update your Google Cloud Console:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Add to **Authorized JavaScript origins**:
   ```
   https://your-backend-url.onrender.com
   ```
6. Add to **Authorized redirect URIs**:
   ```
   https://your-backend-url.onrender.com/api/auth/google/callback
   ```
7. Click **Save**

---

## Troubleshooting

### Build Fails

**Error: "Could not find requirements.txt"**
- ✅ Make sure Root Directory is set to `backend`
- ✅ Build command should be: `pip install -r ../requirements.txt`

**Error: "Module not found"**
- ✅ Check that all dependencies are in `requirements.txt`
- ✅ Try rebuilding: Click **"Manual Deploy"** → **"Clear build cache & deploy"**

### Service Won't Start

**Error: "Port already in use"**
- ✅ Make sure `PORT` environment variable is set to `8000`
- ✅ Check that `start_server.py` uses `os.getenv('PORT', 8000)`

**Error: "MongoDB connection failed"**
- ✅ Verify `MONGODB_URI` is correct
- ✅ Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- ✅ Verify database user has read/write permissions

### Service is Slow

**First request takes 30-60 seconds:**
- This is normal for Free tier (service sleeps after inactivity)
- Upgrade to Starter plan ($7/month) for always-on service

---

## Monitoring Your Service

### View Logs:
1. Go to your service dashboard on Render
2. Click **"Logs"** tab
3. See real-time logs of your application

### View Metrics:
1. Click **"Metrics"** tab
2. See CPU, Memory, and Request metrics

### Restart Service:
1. Click **"Manual Deploy"** → **"Clear build cache & deploy"**
2. Or click **"Restart"** for quick restart

---

## Updating Your Backend

When you push changes to GitHub:

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin ai-cc
   ```

2. Render will **automatically deploy** the new version
3. Watch the deployment in the Logs tab
4. Service will be updated with zero downtime

### Manual Deploy:
If auto-deploy doesn't trigger:
1. Go to your service on Render
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## Cost Breakdown

### Free Tier:
- ✅ 750 hours/month free
- ✅ Good for 1 service running 24/7
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ 30-60 sec wake-up time

### Starter ($7/month):
- ✅ Always on (no sleep)
- ✅ Instant response
- ✅ 512 MB RAM
- ✅ Good for production

### Pro ($25/month):
- ✅ 2 GB RAM
- ✅ Better performance
- ✅ Priority support

---

## Security Best Practices

1. ✅ Never commit `.env` files to git
2. ✅ Use strong JWT secret (32+ characters)
3. ✅ Keep API keys in Render environment variables
4. ✅ Enable HTTPS (automatic on Render)
5. ✅ Regularly update dependencies
6. ✅ Monitor logs for suspicious activity

---

## Next Steps

After backend is deployed:

1. ✅ Test all API endpoints
2. ✅ Update frontend with backend URL
3. ✅ Test frontend → backend connection
4. ✅ Test user registration/login
5. ✅ Test content generation
6. ✅ Test all major features
7. ✅ Set up monitoring/alerts (optional)

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Status Page**: https://status.render.com

---

## Quick Reference

### Your Backend URLs:
```
Production: https://your-backend-url.onrender.com
Health Check: https://your-backend-url.onrender.com/api/health
API Base: https://your-backend-url.onrender.com/api
```

### Important Commands:
```bash
# View logs
render logs -s your-service-name

# Restart service
render restart -s your-service-name

# Deploy manually
render deploy -s your-service-name
```

---

**🎉 Congratulations!** Your backend is now deployed and running on Render!
