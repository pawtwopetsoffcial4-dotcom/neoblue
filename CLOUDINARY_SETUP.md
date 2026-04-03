# Cloudinary Setup Instructions

## Steps to Configure Cloudinary for Image Uploads

1. **Create a Cloudinary Account**
   - Go to https://cloudinary.com/users/register/free
   - Sign up for a free account

2. **Get Your Cloud Name**
   - After login, go to https://cloudinary.com/console/settings/api-keys
   - Copy your "Cloud name"

3. **Create an Upload Preset**
   - Go to https://cloudinary.com/console/settings/upload
   - Click "Add upload preset"
   - Set the following:
     - **Preset name**: `neoblue_products`
     - **Type**: Unsigned
     - **Folder**: `neoblue/products` (optional but recommended)
     - Click "Save"

4. **Configure Environment Variables**
   - Create a `.env.local` file in the root directory (copy from `.env.local.example`)
   - Add your Cloud name:
     ```
     NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
     ```
   - Replace `your_cloud_name_here` with your actual cloud name from step 2

5. **Verify Setup**
   - Restart your development server (`npm run dev`)
   - Go to the "Add Product" page in the vendor dashboard
   - Click "Upload Image" button and test the upload

## Features
- Images are automatically uploaded to Cloudinary
- Preview thumbnail appears after upload
- Remove button (X) clears the selection
- Uses secure HTTPS URLs from Cloudinary
