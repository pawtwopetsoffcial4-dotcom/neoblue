# ImageKit.io Setup Instructions for NeoBlue

## 1. Get Your ImageKit API Keys
1. Log in to your ImageKit dashboard at [https://imagekit.io/dashboard](https://imagekit.io/dashboard)
2. Go to **Developer Options** > **API Keys** ([https://imagekit.io/dashboard/developer/api-keys](https://imagekit.io/dashboard/developer/api-keys))
3. Copy the following credentials:
   - **URL-endpoint** (e.g. `https://ik.imagekit.io/dsh4kn2d6`)
   - **Public Key** (e.g. `public_xxxxxxxxxxxxxxxx`)
   - **Private Key** (e.g. `private_xxxxxxxxxxxxxxxx`)

---

## 2. Configure Local Environment (`.env.local`)
Add the keys to your `.env.local` file:
```env
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/dsh4kn2d6
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
```

---

## 3. Configure Production Environment in Vercel
1. Go to your **Vercel Project Dashboard** > **Settings** > **Environment Variables**.
2. Add the three variables:
   - `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`: `https://ik.imagekit.io/dsh4kn2d6`
   - `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`: `your_public_key`
   - `IMAGEKIT_PRIVATE_KEY`: `your_private_key`
3. Redeploy the application.

---

## How It Works
- Media uploads (both images and videos up to 25MB+) are uploaded directly from the browser to ImageKit CDN via signed auth tokens generated securely by `/api/imagekit/auth`.
- Image and video assets are instantly optimized, formatted (WebP/AVIF auto), and delivered at ultra-fast speeds through ImageKit's global CDN.
