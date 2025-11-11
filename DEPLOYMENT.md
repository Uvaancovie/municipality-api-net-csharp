# Deployment Guide

This guide will help you deploy the Municipal Services application to production.

## Frontend Deployment (Vercel)

### Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)

### Steps

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository: `municipality-api-net-csharp`
   - Configure project:
     - **Root Directory**: `municipal-nextjs`
     - **Framework Preset**: Next.js (auto-detected)
     - **Build Command**: `npm run build` (default)
     - **Output Directory**: `.next` (default)
   
3. **Add Environment Variables** in Vercel:
   - Go to Project Settings → Environment Variables
   - Add the following:
     ```
     NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.onrender.com/api
     ```
     (You'll update this after deploying the backend)

4. **Deploy**: Click "Deploy"

---

## Backend Deployment (Render)

### Prerequisites
- Render account (sign up at https://render.com)
- Docker (already configured)

### Option 1: Deploy from GitHub (Recommended)

1. **Go to Render Dashboard**:
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connect Repository**:
   - Select "Build and deploy from a Git repository"
   - Connect your GitHub: `municipality-api-net-csharp`
   - Click "Connect"

3. **Configure Service**:
   - **Name**: `municipal-api` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (uses root)
   - **Runtime**: `Docker`
   - **Instance Type**: `Free` (or upgrade for production)

4. **Add Environment Variables**:
   Click "Advanced" → Add Environment Variables:
   
   ```
   ASPNETCORE_ENVIRONMENT=Production
   DatabaseProvider=PostgreSQL
   ConnectionStrings__DefaultConnection=<Render will provide PostgreSQL URL>
   
   Jwt__Key=<generate-a-secure-32-character-key>
   Jwt__Issuer=MunicipalApi
   Jwt__Audience=MunicipalApp
   Jwt__ExpiryInMinutes=120
   
   Cloudinary__CloudName=<your-cloudinary-cloud-name>
   Cloudinary__ApiKey=<your-cloudinary-api-key>
   Cloudinary__ApiSecret=<your-cloudinary-api-secret>
   ```

5. **Create PostgreSQL Database**:
   - In Render Dashboard: "New +" → "PostgreSQL"
   - Name: `municipal-db`
   - Plan: Free (or paid)
   - After creation, copy the **Internal Database URL**
   - Add it to your Web Service as `ConnectionStrings__DefaultConnection`

6. **Deploy**: Click "Create Web Service"

### Option 2: Deploy with Docker CLI

```bash
# Build the image
docker build -t municipal-api .

# Run locally to test
docker run -p 5268:5268 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e DatabaseProvider=SQLite \
  municipal-api

# Push to Docker Hub (if needed)
docker tag municipal-api yourusername/municipal-api
docker push yourusername/municipal-api
```

---

## Post-Deployment Configuration

### 1. Update CORS in Backend

After getting your Vercel URL (e.g., `https://municipal-app.vercel.app`), update `Program.cs`:

```csharp
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("allow_frontend", p => p
        .WithOrigins(
            "http://localhost:5173", 
            "http://localhost:3000",
            "https://municipal-app.vercel.app",  // Add your Vercel URL
            "https://*.vercel.app"  // Allow preview deployments
        )
        .AllowAnyHeader()
        .AllowAnyMethod());
});
```

### 2. Update Frontend API URL

In Vercel:
- Go to Project Settings → Environment Variables
- Update `NEXT_PUBLIC_API_BASE_URL` to your Render URL:
  ```
  https://municipal-api.onrender.com/api
  ```
- Redeploy: Settings → Deployments → [Latest] → "Redeploy"

### 3. Run Database Migrations

After first deployment to Render:

```bash
# If you have migrations pending, Render will run them automatically
# Or connect to Render Shell and run:
dotnet ef database update
```

### 4. Verify Admin Account

The default admin account will be created automatically:
- **Email**: way2flyagency@gmail.com
- **Password**: way2flymillionaire

Check Render logs to confirm:
```
info: Default admin account ensured
```

---

## Environment Variables Summary

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api
```

### Backend (Render Environment Variables)
```env
ASPNETCORE_ENVIRONMENT=Production
DatabaseProvider=PostgreSQL
ConnectionStrings__DefaultConnection=postgresql://user:pass@host/db

Jwt__Key=your-secure-32-character-jwt-signing-key-here
Jwt__Issuer=MunicipalApi
Jwt__Audience=MunicipalApp
Jwt__ExpiryInMinutes=120

Cloudinary__CloudName=your-cloudinary-cloud-name
Cloudinary__ApiKey=your-cloudinary-api-key
Cloudinary__ApiSecret=your-cloudinary-api-secret
```

---

## Testing Deployment

### 1. Test Backend
Visit: `https://your-backend.onrender.com/`
- You should see the beautiful API landing page
- Test: `https://your-backend.onrender.com/health` (should return "Healthy")
- Test: `https://your-backend.onrender.com/swagger` (API docs)

### 2. Test Frontend
Visit: `https://your-app.vercel.app`
- Submit a test issue
- Check admin dashboard: `https://your-app.vercel.app/admin/login`

### 3. Test Real-Time Updates
- Login to admin dashboard
- Update an issue status
- Check user status page - should update within 10 seconds

---

## Troubleshooting

### Render Issues

**Cold starts**: Free tier spins down after inactivity
- Solution: Upgrade to paid tier or use a cron job to ping `/health`

**Database connection errors**:
- Verify `ConnectionStrings__DefaultConnection` is correct
- Check PostgreSQL service is running
- View logs: Render Dashboard → Logs

**Port binding errors**:
- Render sets `PORT` environment variable automatically
- Our Dockerfile uses: `ASPNETCORE_URLS=http://+:${PORT:-5268}`

### Vercel Issues

**API calls failing**:
- Check `NEXT_PUBLIC_API_BASE_URL` environment variable
- Ensure CORS is configured correctly in backend
- Check browser console for errors

**Build failures**:
- Verify `package.json` scripts are correct
- Check Node version compatibility
- View build logs in Vercel dashboard

### CORS Errors

If you see CORS errors in browser:
1. Add your Vercel URL to backend CORS policy
2. Redeploy backend
3. Hard refresh browser (Ctrl+Shift+R)

---

## Security Checklist

- [ ] Change default admin password after first login
- [ ] Generate secure JWT key (32+ characters random)
- [ ] Use PostgreSQL in production (not SQLite)
- [ ] Enable HTTPS only (Vercel/Render do this automatically)
- [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Review CORS allowed origins
- [ ] Keep Cloudinary keys secure (never commit to Git)
- [ ] Enable rate limiting (optional, for production)

---

## Monitoring

### Render Monitoring
- Dashboard → Metrics: CPU, Memory, Network
- Dashboard → Logs: Application logs
- Enable email alerts for downtime

### Vercel Monitoring
- Analytics → Overview: Page views, performance
- Deployments → Status: Build success/failures
- Set up deployment notifications in Slack/Discord

---

## Costs

### Free Tier Limits

**Vercel Free**:
- 100 GB bandwidth
- Unlimited deployments
- Custom domains

**Render Free**:
- 750 hours/month (enough for 1 service)
- Sleeps after 15min inactivity
- 100 GB bandwidth

**PostgreSQL Free** (Render):
- 1 GB storage
- Expires after 90 days
- Upgrade to paid for persistence

---

## Quick Deploy Commands

```bash
# Frontend (Vercel)
cd municipal-nextjs
vercel --prod

# Backend (Local Docker Test)
cd ..
docker build -t municipal-api .
docker run -p 5268:5268 municipal-api

# Full Stack Test
docker-compose up -d
```

---

## Support

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **ASP.NET Core on Docker**: https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/docker/
