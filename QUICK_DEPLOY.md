# Quick Deployment Guide

Fast-track deployment instructions for AI Content Creator.

## 🚀 5-Minute Deployment

### Step 1: Prepare Code (2 minutes)

```bash
# Clean up and build
python cleanup.py
cd react-frontend && npm run build && cd ..

# Commit and push
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy Backend to Render (2 minutes)

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Name**: ai-content-creator-backend
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r ../requirements.txt`
   - **Start Command**: `python start_server.py`
4. Add environment variables (click "Advanced"):
   ```
   OPENAI_API_KEY=sk-...
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET_KEY=your-secret-min-32-chars
   PORT=8000
   FLASK_ENV=production
   ```
5. Click "Create Web Service"
6. Copy your backend URL: `https://your-app.onrender.com`

### Step 3: Deploy Frontend to Netlify (1 minute)

1. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
2. Connect your GitHub repo
3. Configure:
   - **Base directory**: `react-frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `react-frontend/build`
4. Add environment variables:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   REACT_APP_GOOGLE_CLIENT_ID=761738188033-2qj8ulfak02gosv5esoll637eqa7ql1i.apps.googleusercontent.com
   ```
5. Click "Deploy site"

### Done! 🎉

Your app is now live at: `https://your-app.netlify.app`

---

## 📋 Environment Variables Quick Reference

### Backend (.env)
```env
OPENAI_API_KEY=sk-proj-...
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET_KEY=minimum-32-character-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
PORT=8000
FLASK_ENV=production
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_GOOGLE_CLIENT_ID=761738188033-2qj8ulfak02gosv5esoll637eqa7ql1i.apps.googleusercontent.com
```

---

## 🔧 MongoDB Atlas Quick Setup

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Database Access → Add user (username + password)
4. Network Access → Add IP: `0.0.0.0/0` (allow all)
5. Connect → Get connection string
6. Replace `<password>` and `<dbname>` in connection string

---

## 🔑 Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up / Log in
3. API Keys → Create new secret key
4. Copy and save (you won't see it again!)

---

## ✅ Post-Deployment Checklist

- [ ] Backend health check: `https://your-backend.onrender.com/api/health`
- [ ] Frontend loads: `https://your-app.netlify.app`
- [ ] Can register new user
- [ ] Can login
- [ ] Can generate content
- [ ] Content saves to history

---

## 🆘 Troubleshooting

### Backend not responding
- Check Render logs for errors
- Verify environment variables are set
- Test MongoDB connection

### Frontend can't connect to backend
- Check `REACT_APP_API_URL` is correct
- Verify CORS is enabled in backend
- Check browser console for errors

### Content generation fails
- Verify `OPENAI_API_KEY` is valid
- Check API key has credits
- Review backend logs

### Database errors
- Verify `MONGODB_URI` is correct
- Check IP whitelist includes `0.0.0.0/0`
- Ensure database user has read/write permissions

---

## 📞 Need Help?

- Full guide: [DEPLOYMENT.md](DEPLOYMENT.md)
- Checklist: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- README: [README.md](README.md)

---

**Pro Tip**: Render free tier may sleep after inactivity. First request might take 30-60 seconds to wake up. Consider upgrading for production use.
