# Gallery

Modular media space for photographs, gifs, music, video, embeds, links, and short notes.

Personal binaries are **not** committed to git. Keep the same dated filenames
(`26_May_2026.jpeg`) and host the files on a public folder or Google Drive.

## Toggle the Gallery tab

In `src/lib/gallery.js`:

```js
export const GALLERY_ENABLED = true;  // set false to hide the nav tab + /gallery route
```

When disabled, the Gallery link disappears from the navbar (indices renumber) and `/gallery` redirects home.

## Host the files (pick one)

Copy `.env.example` to `.env` in the project root. Vite only exposes variables that start with `VITE_`.

### A. Public folder URL (recommended)

Use Cloudinary, Cloudflare R2, ImageKit, or any host that serves a direct file URL:

`https://your-host.example/gallery/26_May_2026.jpeg`

1. Upload the files **with the original names and extensions**.
2. Set the folder prefix in `.env`:

```bash
VITE_GALLERY_BASE_URL=https://res.cloudinary.com/YOUR_CLOUD/image/upload/gallery
```

The page will request `VITE_GALLERY_BASE_URL/<filename>`.

Filenames are listed in `GALLERY_REMOTE_FILES` inside `src/lib/gallery.js`. Add or
remove a name there after you upload. To skip editing that list, also upload a
`manifest.json` next to the files:

```json
[
  "23_July_2026.JPG",
  "20_June_2026.jpg",
  "26_May_2026.jpeg"
]
```

Cloudinary: in the upload dialog, enable **Use filename** and turn off **Unique filename**.

### B. Google Drive folder

Drive is convenient, but it is not a CDN. Links can throttle or break. Prefer option A for a public site.

1. Put the files in a Drive folder, keeping the original names.
2. Share the folder as **Anyone with the link → Viewer**.
3. In [Google Cloud Console](https://console.cloud.google.com/), enable **Google Drive API**, create an API key, and restrict it to Drive API plus your site’s HTTP referrers (`http://localhost:5173/*` and your production domain).
4. The folder ID is the tail of the folder URL: `https://drive.google.com/drive/folders/<FOLDER_ID>`.

```bash
VITE_GALLERY_DRIVE_FOLDER_ID=your_folder_id
VITE_GALLERY_DRIVE_API_KEY=your_browser_api_key
```

Restart `npm run dev` after changing `.env`. Adding a photo later is: drop it in the Drive folder with a dated filename. No git commit.

## Local preview only

Files in this folder still work for `npm run dev` when no remote env vars are set.
They are gitignored. Do not commit them.

## Hand-curate / mix media types

Remote photos load first. Extra cards (notes, embeds, links) go in
`GALLERY_EXTRA_ITEMS` in `src/lib/gallery.js`.

```js
export const GALLERY_EXTRA_ITEMS = [
  {
    type: 'embed',
    id: 'talk',
    embedUrl: 'https://www.youtube.com/embed/VIDEO_ID',
    title: 'Talk recording',
  },
  {
    type: 'link',
    id: 'playlist',
    href: 'https://open.spotify.com/...',
    title: 'Listening lately',
    description: 'Spotify playlist',
  },
  {
    type: 'note',
    id: 'field-note',
    title: 'Field note',
    text: 'Short blurb shown as a card — no media required.',
  },
];
```

## Item fields

Shared:

- `type` — required
- `id` — unique key (optional but recommended)
- `title` — caption label
- `meta` — optional right-side caption tag

By type:

| type | required | optional |
| --- | --- | --- |
| `image` / `gif` | `src` | `href`, `alt`, `meta` |
| `video` | `src` | `poster`, `meta` |
| `audio` | `src` | `artist`, `meta` |
| `embed` | `embedUrl` | `meta` |
| `link` | `href` | `description`, `meta` |
| `note` | `title` | `text`, `meta` |

## Page chrome

Edit `GALLERY_META` in `src/lib/gallery.js` for the page kicker, title, typewriter subtitle, and empty state copy.
