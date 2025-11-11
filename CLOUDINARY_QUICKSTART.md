# 🚀 Cloudinary Integration - Complete Setup Checklist

## ✅ Already Completed (Backend)

- [x] Installed `CloudinaryDotNet` package
- [x] Created `Config/CloudinaryConfig.cs`
- [x] Created `Services/CloudinaryStorageService.cs`
- [x] Updated `Program.cs` with Cloudinary DI registration
- [x] Updated `IssuesController.cs` to use CloudinaryStorageService
- [x] Added Cloudinary section to `appsettings.json` (needs your credentials)

## 📝 What You Need to Do

### Step 1: Get Cloudinary Credentials (5 minutes)

1. Go to: https://cloudinary.com/users/register_free
2. Sign up for free account
3. Go to Dashboard: https://console.cloudinary.com/
4. Copy these values:
   - **Cloud Name**: `dxxxxxx` (example)
   - **API Key**: `123456789012345` (example)
   - **API Secret**: Click eye icon to reveal

### Step 2: Configure Backend (2 minutes)

Open `d:\MunicipalApi\appsettings.json` and fill in:

```json
{
  "Cloudinary": {
    "CloudName": "paste-your-cloud-name-here",
    "ApiKey": "paste-your-api-key-here",
    "ApiSecret": "paste-your-api-secret-here"
  }
}
```

### Step 3: Restart Backend (1 minute)

```powershell
cd d:\MunicipalApi
dotnet run
```

Look for this in console:
```
Cloudinary storage service initialized for cloud: your-cloud-name
```

### Step 4: Test Image Upload (2 minutes)

1. Start frontend:
   ```powershell
   cd d:\MunicipalApi\municipal-nextjs
   npm run dev
   ```

2. Open: http://localhost:3000
3. Click "Report Issue"
4. Fill form and upload an image
5. Submit issue
6. Go to "Track Status" - image should display from Cloudinary

### Step 5: Verify (1 minute)

Check Cloudinary Dashboard:
- Go to: https://console.cloudinary.com/console/media_library
- Look for folder: `issues/`
- Your uploaded images should be there

## 🎉 That's It!

Your frontend **requires NO changes** - it already sends files to the backend, and the backend now uploads to Cloudinary!

## 🔍 Architecture Flow

```
┌──────────────────┐
│   Next.js UI     │
│  (localhost:3000)│
└────────┬─────────┘
         │ FormData with image file
         ▼
┌──────────────────┐
│  ASP.NET API     │
│  (localhost:5268)│
│                  │
│  IssuesController│
│       ↓          │
│  CloudinaryService│
└────────┬─────────┘
         │ Upload to Cloudinary
         ▼
┌──────────────────┐
│   Cloudinary CDN │
│  (Cloud Storage) │
└────────┬─────────┘
         │ Returns URL
         │ https://res.cloudinary.com/.../image.jpg
         ▼
┌──────────────────┐
│   SQLite DB      │
│  (MediaUrls)     │
└──────────────────┘
         │ Retrieve URLs
         ▼
┌──────────────────┐
│  Status Page     │
│  (Displays images)│
└──────────────────┘
```

## 📚 Documentation

- **Backend Setup**: `d:\MunicipalApi\CLOUDINARY_SETUP.md`
- **Frontend Setup**: `d:\MunicipalApi\municipal-nextjs\CLOUDINARY_SETUP.md`
- **Cloudinary Docs**: https://cloudinary.com/documentation

## 🆘 Need Help?

### Error: "Invalid cloud name"
➡️ Double-check CloudName in appsettings.json

### Error: "Invalid signature"
➡️ Verify ApiKey and ApiSecret are correct

### Images not uploading
➡️ Check backend console for detailed errors

### Images not displaying
➡️ Verify URLs in database start with `https://res.cloudinary.com/`

---

**Total Setup Time: ~10 minutes** ⏱️

**Free Tier Includes:**
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month

Perfect for your municipal portal! 🏛️
