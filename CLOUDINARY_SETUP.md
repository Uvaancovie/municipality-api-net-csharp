# Cloudinary Setup Guide

## 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Click **"Sign Up for Free"**
3. Fill in your details or sign up with GitHub/Google
4. Verify your email address

## 2. Get Your Cloudinary Credentials

1. Log in to your Cloudinary dashboard: [https://console.cloudinary.com/](https://console.cloudinary.com/)
2. On the dashboard homepage, you'll see your **Account Details** section with:
   - **Cloud Name** (e.g., `dxxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (click the eye icon to reveal)

## 3. Configure Backend (ASP.NET Core)

### Update `appsettings.json`

Open `d:\MunicipalApi\appsettings.json` and fill in your credentials:

```json
{
  "Cloudinary": {
    "CloudName": "your-cloud-name-here",
    "ApiKey": "your-api-key-here",
    "ApiSecret": "your-api-secret-here"
  }
}
```

### Update `appsettings.Development.json` (if it exists)

Repeat the same configuration for development environment.

## 4. Configure Frontend (Next.js)

### Update `.env.local` file

Create or update `municipal-nextjs/.env.local`:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name-here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=municipal-uploads

# API Configuration (existing)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### Create Upload Preset in Cloudinary Dashboard

1. Go to **Settings** → **Upload** → **Upload presets**
2. Click **"Add upload preset"**
3. Set **Preset name**: `municipal-uploads`
4. Set **Signing Mode**: **Unsigned** (for client-side uploads)
5. Set **Folder**: `issues` (to organize uploads)
6. Configure allowed formats: `jpg, jpeg, png, gif, webp`
7. Set max file size: `10MB`
8. Enable **Use filename**: Yes
9. Enable **Unique filename**: Yes
10. Click **Save**

## 5. Test Your Configuration

### Backend Test

1. Start your API:
   ```bash
   cd d:\MunicipalApi
   dotnet run
   ```

2. Upload a test image using Swagger UI or Postman:
   - Endpoint: `POST /api/issues/upload-media`
   - Body: Form-data with `files` field containing an image
   - Expected: Returns array of Cloudinary URLs

### Frontend Test

1. Start Next.js:
   ```bash
   cd municipal-nextjs
   npm run dev
   ```

2. Navigate to **Report Issue** page
3. Fill in the form and upload an image
4. Submit the issue
5. Go to **Track Status** page
6. Verify the image displays correctly

## 6. Cloudinary Features You Can Use

### Image Transformations

Cloudinary URLs support on-the-fly transformations. Example:

```
# Original
https://res.cloudinary.com/your-cloud/image/upload/v1234567890/issues/file.jpg

# Resized to 300px width
https://res.cloudinary.com/your-cloud/image/upload/w_300/v1234567890/issues/file.jpg

# Thumbnail 200x200 with face detection
https://res.cloudinary.com/your-cloud/image/upload/w_200,h_200,c_thumb,g_face/v1234567890/issues/file.jpg
```

### Common Transformations

- `w_300` - resize width to 300px
- `h_300` - resize height to 300px
- `c_fill` - fill mode (crops to exact dimensions)
- `c_scale` - scale mode (no cropping)
- `q_auto` - automatic quality optimization
- `f_auto` - automatic format selection (WebP for supported browsers)

### Update Frontend to Use Transformations

In `status.tsx`, modify image display:

```typescript
// Original URL from API
const originalUrl = "https://res.cloudinary.com/.../image.jpg"

// Create thumbnail URL
const thumbnailUrl = originalUrl.replace(
  '/upload/',
  '/upload/w_300,h_300,c_fill,q_auto,f_auto/'
)
```

## 7. Security Best Practices

### Protect API Credentials

1. **Never commit `appsettings.json` with real credentials** to Git
2. Use environment variables in production:
   ```bash
   export Cloudinary__CloudName="your-cloud-name"
   export Cloudinary__ApiKey="your-api-key"
   export Cloudinary__ApiSecret="your-api-secret"
   ```

3. Add to `.gitignore`:
   ```
   appsettings.json
   appsettings.Development.json
   .env.local
   ```

### Cloudinary Dashboard Security Settings

1. Go to **Settings** → **Security**
2. Enable **Allowed fetch domains** (optional)
3. Enable **Restricted media types** (recommended)
4. Set **Usage limits** to prevent abuse

## 8. Monitor Usage

1. Go to your Cloudinary dashboard
2. Check **Media Library** to see all uploaded images
3. Monitor **Dashboard** → **Usage** for:
   - Storage (GB)
   - Transformations (per month)
   - Bandwidth (GB)

Free tier includes:
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month

## 9. Troubleshooting

### Error: "Invalid cloud name"
- Double-check your `CloudName` in configuration
- Ensure no extra spaces or quotes

### Error: "Invalid signature"
- Verify `ApiKey` and `ApiSecret` match your dashboard
- Check if API secret is fully copied (no truncation)

### Images not uploading
- Check file size (< 10MB)
- Verify file format is allowed (jpg, png, gif, webp)
- Check backend logs for detailed error messages

### Frontend can't reach Cloudinary
- Verify `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set
- Ensure upload preset exists and is **unsigned**
- Check browser console for CORS errors

## 10. Migration from Supabase (Optional)

If you want to migrate existing images from Supabase to Cloudinary:

1. Create a migration script in `MunicipalApi/Scripts/MigrateImagesToCloudinary.cs`
2. Fetch all issues with `MediaUrls` from database
3. For each Supabase URL:
   - Download image from Supabase
   - Upload to Cloudinary
   - Update database with new Cloudinary URL
4. Run migration once, then remove Supabase configuration

## Need Help?

- Cloudinary Documentation: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- Cloudinary Support: [https://support.cloudinary.com/](https://support.cloudinary.com/)
- Community Forum: [https://community.cloudinary.com/](https://community.cloudinary.com/)
