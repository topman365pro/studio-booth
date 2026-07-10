# Studio Booth

A production-ready, privacy-first browser photobooth built with Next.js, Fabric.js, Supabase, and browser-native media APIs.
![Screenshot](img https://github.com/topman365pro/studio-booth/blob/main/public/brand/boothss.png?raw=true)

## Features

- Camera selection, mirror, flash, ring light, timer, and 1–6 shot sessions
- 24-hour IndexedDB draft recovery; raw captures never leave the browser
- Routed layout, frame, filter, sticker, animation, and export workflow
- PNG, JPEG, GIF, and WebM downloads generated in-browser
- Supabase username/password fallback with passkey-first sign-in
- Explicit opt-in saving of final exports only
- Private gallery, custom frame builder, and private sticker library
- Admin-managed frame and image-sticker catalogs
- Print-ready edge-aligned A4 strip sheets at 300 DPI
- Responsive modern photo-lab interface

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The complete guest workflow works without Supabase. Account, gallery, private-frame, and cloud-save features display a setup message until the two public Supabase variables are configured.

## Supabase setup

1. Create a Supabase project.
2. Run the SQL files in `supabase/migrations/` in timestamp order through the SQL editor, Supabase CLI, or MCP.
3. Enable Email/password and Passkeys under Authentication.
4. Configure the Passkeys relying party ID and origins for your local and production domains.
5. Copy the project URL, anon key, and server-only secret key into `.env.local`.

The migration creates private `exports` and `private-frames` buckets, a public `curated-frames` bucket, database tables, indexes, and row-level security policies. Paths are namespaced with the authenticated user ID.

### Promote the first administrator

After the administrator has signed in once, find their UUID in Authentication → Users and run:

```sql
update public.profiles
set role = 'admin'
where id = '<USER_UUID>';
```

The protected `/admin` interface then provides frame and sticker uploads, publishing, ordering, replacement, metadata editing, and deletion. Catalog assets accept PNG and WebP files up to 10 MB. Signed-in members can upload private frames and private stickers without publishing them globally.

### A4 print sheets

Vertical strips can be exported as a portrait A4 PNG at exactly 2480 × 3508 pixels. One copy is selected by default, rotated 90 degrees, and placed near the top. The export panel offers a proof-style margin option and a no-margin full-width option; up to four copies can still be requested when you want duplicates on one page. The browser print action uses an A4 portrait, zero-margin print stylesheet so the exported PNG controls the visible margins.

## Vercel deployment

1. Import the repository into Vercel; the framework is detected as Next.js.
2. Set:
   - `NEXT_PUBLIC_SITE_URL=https://your-domain.example`
   - `NEXT_PUBLIC_SUPABASE_URL=...`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
   - `SUPABASE_SECRET_KEY=...`
3. Configure Supabase Passkey origins for your production domain.
4. Deploy. Vercel provides HTTPS, which is required for camera access.

No server-side image or video rendering is required. Camera captures and encoding happen in the browser; Vercel serves the app and Supabase stores only explicit final saves.

## Privacy model

- Raw captures are stored only in browser memory/IndexedDB.
- Local drafts expire after 24 hours.
- Nothing is uploaded for guest sessions.
- Signed-in users must press **Save to my gallery**.
- Supabase RLS and private storage policies scope saved exports to their owner.

## Verification

```bash
npm test
npm run build
```
