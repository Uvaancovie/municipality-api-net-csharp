# Quick Deployment Guide

## 🚀 Deploy Frontend to Vercel (5 minutes)

### Step 1: Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### Step 2: Deploy from GitHub (Recommended)

1. **Go to Vercel**: https://vercel.com/new
2. **Import Repository**: Select `municipality-api-net-csharp`
3. **Configure**:
   - Root Directory: `municipal-nextjs`
   - Framework: Next.js (auto-detected)
4. **Environment Variables**:
   - Add: `NEXT_PUBLIC_API_BASE_URL` = `http://localhost:5268/api` (temporary)
5. **Click Deploy**

### Step 3: CLI Deploy (Alternative)
```bash
cd municipal-nextjs
vercel --prod
```

---

## 🐳 Deploy Backend to Render (10 minutes)

### Step 1: Create Render Account
- Sign up: https://dashboard.render.com/register

### Step 2: Deploy Blueprint (Easiest)

1. **Go to**: https://dashboard.render.com
2. **Click**: "New" → "Blueprint"
3. **Connect**: Your GitHub repository
4. **File**: `render.yaml` (auto-detected)
5. **Add Secrets** (Required):
   - `Cloudinary__CloudName`: [Your Cloudinary cloud name]
   - `Cloudinary__ApiKey`: [Your Cloudinary API key]
   - `Cloudinary__ApiSecret`: [Your Cloudinary API secret]
   - `Jwt__Key`: [Generate 32+ character random string]
6. **Click**: "Apply"

Render will:
- ✅ Create PostgreSQL database
- ✅ Build Docker image
- ✅ Deploy web service
- ✅ Run migrations automatically

### Step 3: Manual Deploy (Alternative)

1. **Create PostgreSQL Database**:
   - New → PostgreSQL
   - Name: `municipal-db`
   - Plan: Free
   - Region: Frankfurt
   - Copy **Internal Database URL**

2. **Create Web Service**:
   - New → Web Service
   - Connect Repository: `municipality-api-net-csharp`
   - Runtime: Docker
   - Branch: main
   - Instance: Free

3. **Environment Variables**:
   ```
   ASPNETCORE_ENVIRONMENT=Production
   DatabaseProvider=PostgreSQL
   ConnectionStrings__DefaultConnection=[Paste Internal Database URL]
   Jwt__Key=[Generate secure key: https://randomkeygen.com/]
   Jwt__Issuer=MunicipalApi
   Jwt__Audience=MunicipalApp
   Jwt__ExpiryInMinutes=120
   Cloudinary__CloudName=[Your value]
   Cloudinary__ApiKey=[Your value]
   Cloudinary__ApiSecret=[Your value]
   ```

4. **Deploy**: Click "Create Web Service"

---

## 🔗 Connect Frontend to Backend

### After Backend Deploys:

1. **Copy Render URL**: 
   - Example: `https://municipal-api.onrender.com`

2. **Update Vercel Environment Variable**:
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Edit `NEXT_PUBLIC_API_BASE_URL`
   - New value: `https://municipal-api.onrender.com/api`
   - Save

3. **Redeploy Frontend**:
   - Vercel Dashboard → Deployments → [Latest] → Three dots → "Redeploy"

---

## ✅ Verification Checklist

### Backend Health Check
- [ ] Visit: `https://your-app.onrender.com/`
- [ ] Should see: Beautiful API landing page
- [ ] Test: `https://your-app.onrender.com/health` → Returns "Healthy"
- [ ] Test: `https://your-app.onrender.com/swagger` → API documentation loads

### Frontend Check
- [ ] Visit: `https://your-app.vercel.app/`
- [ ] Can navigate to "Report Issue"
- [ ] Can submit test issue (with image)
- [ ] Check status page shows issue
- [ ] Admin login works: `/admin/login`
  - Email: `way2flyagency@gmail.com`
  - Password: `way2flymillionaire`

### Real-Time Features
- [ ] Login to admin dashboard
- [ ] Update issue status → Stats update within 10 seconds
- [ ] User status page shows changes
- [ ] Messages appear in blue boxes

---

## 🛠️ Troubleshooting

### "Application Error" on Render
**Check Logs**: Dashboard → Logs
- Database connection issues? → Verify `ConnectionStrings__DefaultConnection`
- Port errors? → Dockerfile already configured
- Missing env vars? → Add them in Render settings

### CORS Errors in Browser
**Update Backend**:
1. Add your Vercel URL to `Program.cs` CORS policy
2. Commit and push to GitHub
3. Render will auto-deploy

```csharp
.WithOrigins(
    "http://localhost:3000",
    "https://your-app.vercel.app",  // Add this
    "https://*.vercel.app"
)
```

### Vercel Build Fails
- Check build logs: Vercel Dashboard → Deployment → View logs
- Ensure `package.json` has valid scripts
- Try: Clear cache and redeploy

---

## 📝 Post-Deployment Tasks

1. **Change Admin Password**:
   - Login to admin dashboard
   - (Add password change feature if needed)

2. **Monitor Application**:
   - Render: Dashboard → Metrics
   - Vercel: Analytics → Overview

3. **Custom Domain** (Optional):
   - Vercel: Settings → Domains → Add
   - Render: Settings → Custom Domain

4. **Upgrade Plans** (For Production):
   - Render: $7/month (no cold starts)
   - PostgreSQL: $7/month (persistent, no 90-day limit)
   - Vercel: Free tier sufficient for most cases

---

## 🎉 You're Done!

Your Municipal Services Platform is now live:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://municipal-api.onrender.com
- **Admin**: https://your-app.vercel.app/admin/login

**Share with users and start receiving service requests!** 🚀
