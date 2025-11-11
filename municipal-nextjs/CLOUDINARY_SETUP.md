# Next.js Frontend - Cloudinary Setup Guide

## Current Architecture

Your Next.js app currently uploads images **through your backend API**, which means:
- ✅ **No frontend changes needed** - your existing code already works!
- ✅ Images are uploaded via `apiClient.uploadFiles()` to `/api/Issues/upload-media`
- ✅ Backend handles Cloudinary authentication and storage
- ✅ Cloudinary URLs are returned and stored in the database

## How It Works

```
User selects image → Next.js sends to backend → Backend uploads to Cloudinary → Cloudinary URL returned → Stored in database
```

### Current Flow (Already Implemented)

**File: `report-issue.tsx`**
```typescript
// Upload files if any
if (files && files.length > 0) {
  mediaUrls = await apiClient.uploadFiles(files)  // ← Sends to backend
}

// Create issue with Cloudinary URLs
const issue = await apiClient.createIssue({
  ...data,
  mediaUrls,  // ← Cloudinary URLs from backend
})
```

**File: `api.ts`**
```typescript
async uploadFiles(files: FileList): Promise<string[]> {
  const formData = new FormData()
  Array.from(files).forEach(file => {
    formData.append('Files', file)
  })

  const response = await fetch(`${this.baseUrl}/Issues/upload-media`, {
    method: 'POST',
    body: formData,
  })

  return response.json()  // ← Returns Cloudinary URLs
}
```

## ✅ What You Need to Do (Backend Only)

1. **Get Cloudinary Credentials** (see `CLOUDINARY_SETUP.md` in backend folder)
   - Cloud Name
   - API Key
   - API Secret

2. **Update Backend `appsettings.json`:**
   ```json
   {
     "Cloudinary": {
       "CloudName": "your-cloud-name-here",
       "ApiKey": "your-api-key-here",
       "ApiSecret": "your-api-secret-here"
     }
   }
   ```

3. **Restart Backend:**
   ```bash
   cd d:\MunicipalApi
   dotnet run
   ```

4. **Test Image Upload:**
   - Open frontend: `http://localhost:3000`
   - Go to "Report Issue"
   - Upload an image
   - Submit issue
   - Go to "Track Status" - image should display from Cloudinary CDN

## 🎯 Verification

### Backend is Using Cloudinary When:

1. Check backend console logs - you should see:
   ```
   Cloudinary storage service initialized for cloud: your-cloud-name
   Starting file upload: image.jpg
   File uploaded successfully, URL: https://res.cloudinary.com/...
   ```

2. Check database - `MediaUrls` should contain Cloudinary URLs:
   ```
   https://res.cloudinary.com/your-cloud/image/upload/v1234567890/issues/file.jpg
   ```

3. Check Cloudinary dashboard - images appear in Media Library under `issues/` folder

## 🔄 Optional: Direct Client-Side Upload (Advanced)

If you want to upload **directly from browser to Cloudinary** (bypass backend), follow these steps:

### 1. Install Cloudinary React SDK

```bash
cd d:\MunicipalApi\municipal-nextjs
npm install cloudinary-react
```

### 2. Update `.env.local`

Uncomment and fill in these variables:
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=municipal-uploads
```

### 3. Create Upload Preset in Cloudinary

1. Go to Cloudinary Dashboard → Settings → Upload
2. Add upload preset: `municipal-uploads`
3. Set **Signing Mode**: Unsigned
4. Set **Folder**: `issues`
5. Save

### 4. Create Client-Side Upload Utility

**File: `src/lib/cloudinary.ts`**
```typescript
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET!)
  formData.append('folder', 'issues')

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error('Upload failed')
  }

  const data = await response.json()
  return data.secure_url
}
```

### 5. Update `report-issue.tsx`

Replace backend upload with direct Cloudinary:
```typescript
import { uploadToCloudinary } from '@/lib/cloudinary'

// In onSubmit:
if (files && files.length > 0) {
  const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file))
  mediaUrls = await Promise.all(uploadPromises)
}
```

## 🎨 Image Transformations (Cloudinary Features)

### Display Thumbnails

Update `status.tsx` to show optimized thumbnails:

```typescript
// Original URL from database
const originalUrl = "https://res.cloudinary.com/.../issues/image.jpg"

// Generate thumbnail URL (300x300, auto quality, auto format)
const thumbnailUrl = originalUrl.replace(
  '/upload/',
  '/upload/w_300,h_300,c_fill,q_auto,f_auto/'
)

// Use thumbnail for display, original for modal
<img src={thumbnailUrl} alt="Issue" onClick={() => setLightboxImage(originalUrl)} />
```

### Common Transformations

| Transformation | URL Parameter | Example |
|---------------|--------------|---------|
| Resize width | `w_300` | Resize to 300px wide |
| Resize height | `h_200` | Resize to 200px tall |
| Crop & fill | `c_fill` | Crop to exact dimensions |
| Auto quality | `q_auto` | Optimize quality |
| Auto format | `f_auto` | Use WebP when supported |
| Blur | `e_blur:300` | Blur effect |
| Grayscale | `e_grayscale` | Black and white |

**Example URL with transformations:**
```
https://res.cloudinary.com/your-cloud/image/upload/w_300,h_300,c_fill,q_auto,f_auto/v1234567890/issues/file.jpg
```

## 📊 Monitor Usage

1. Go to Cloudinary Dashboard
2. Check **Dashboard → Usage** for:
   - Storage used (25 GB free)
   - Bandwidth used (25 GB/month free)
   - Transformations (25k/month free)

## 🔒 Security Notes

- ✅ API Secret stays on backend (secure)
- ✅ Frontend never sees API Secret
- ⚠️ Direct upload needs **unsigned preset** (public)
- ✅ Current backend upload is more secure (recommended)

## 🐛 Troubleshooting

### Images not uploading
**Check:**
- Backend `appsettings.json` has Cloudinary credentials
- Backend is running on `http://localhost:5268`
- Check browser console for errors
- Check backend logs for upload errors

### Images not displaying
**Check:**
- Database contains full Cloudinary URLs (not relative paths)
- URLs start with `https://res.cloudinary.com/`
- Cloudinary cloud name is correct
- Images exist in Cloudinary Media Library

### Wrong cloud name error
**Fix:**
- Double-check `CloudName` in `appsettings.json`
- Restart backend after config changes

## 🎉 Summary

**For your current setup:**
1. ✅ Frontend code is already ready (no changes needed)
2. ✅ Just configure backend with Cloudinary credentials
3. ✅ Images will automatically upload to Cloudinary
4. ✅ Test by reporting an issue with an image

**Frontend changes only needed if:**
- You want direct browser → Cloudinary uploads (optional)
- You want to add image transformations for thumbnails (optional)
- You want progress bars for large uploads (optional)

The current flow works perfectly! Just configure the backend and you're good to go! 🚀
