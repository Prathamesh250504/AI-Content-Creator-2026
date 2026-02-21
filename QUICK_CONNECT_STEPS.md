# Quick Connection Steps (5 Minutes)

Follow these steps to connect your frontend and backend:

## 1. Get Your Backend URL (1 min)

1. Go to https://dashboard.render.com
2. Click on your backend service
3. Copy the URL at the top (looks like `https://ai-content-creator-xxxx.onrender.com`)
4. Test it: Open `https://YOUR-URL/api/health` in browser
   - Should show: `{"status": "healthy", ...}`

## 2. Set Netlify Environment Variable (2 min)

1. Go to https://app.netlify.com
2. Click your site → **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Add this:
   ```
   Key: REACT_APP_API_URL
   Value: https://YOUR-RENDER-URL/api
   ```
   (Replace YOUR-RENDER-URL with your actual Render URL from step 1)

5. Click **Save**

## 3. Update Backend CORS (1 min)

1. Go back to Render dashboard
2. Click your service → **Environment** tab
3. Find or add `CORS_ORIGINS` variable
4. Set value to:
   ```
   https://YOUR-NETLIFY-SITE.netlify.app,http://localhost:3000
   ```
   (Replace YOUR-NETLIFY-SITE with your Netlify site name)

5. Click **Save**
6. Backend will automatically redeploy

## 4. Redeploy Frontend (1 min)

1. Go to Netlify → **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait 1-2 minutes for deployment

## 5. Test Connection (30 seconds)

1. Open your Netlify site
2. Press F12 to open DevTools → Console tab
3. Look for: `API Service baseURL: https://your-render-url/api`
4. Try generating content - it should work!

---

## Example Values

If your Render URL is: `https://ai-content-creator-abc123.onrender.com`
And your Netlify site is: `my-ai-content-app.netlify.app`

Then:

**Netlify Environment Variable:**
```
REACT_APP_API_URL=https://ai-content-creator-abc123.onrender.com/api
```

**Render CORS_ORIGINS:**
```
CORS_ORIGINS=https://my-ai-content-app.netlify.app,http://localhost:3000
```

---

## Troubleshooting

**Problem**: "Network Error" when generating content

**Solution**: 
1. Check CORS_ORIGINS includes your Netlify domain (no typos!)
2. Make sure REACT_APP_API_URL ends with `/api`
3. Test backend health: `https://your-render-url/api/health`

**Problem**: Backend is very slow (30+ seconds)

**Solution**: 
- This is normal for Render free tier (cold start)
- First request after 15 minutes of inactivity takes time
- Subsequent requests are fast
- Consider upgrading to paid tier for always-on

**Problem**: "Authorization token required"

**Solution**:
- Make sure JWT_SECRET is set in Render environment variables
- Try logging out and logging back in

---

## Need Help?

Check the full guide: `CONNECT_FRONTEND_BACKEND.md`
