# Trips & Parties Unlimited

A public, cinematic photo and video gallery powered by Google Drive, React, Vite, Tailwind CSS, and Netlify Functions.

## Local development

```bash
npm install
npm run dev
```

The site uses a polished demo collection until Google Drive is configured.

## Google Drive setup

1. Make the root gallery folder and its media subfolders publicly readable.
2. Enable the Google Drive API in a Google Cloud project and create an API key restricted to that API.
3. Add `GOOGLE_DRIVE_API_KEY` and `GOOGLE_DRIVE_FOLDER_ID` as Netlify environment variables.
4. Name folders with an optional date, such as `Banff Winter Weekend - 2026-02-14`.

Each immediate subfolder becomes an album. Supported files are images and videos; the first media file becomes the cover.
