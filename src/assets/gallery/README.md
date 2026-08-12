# Gallery

Modular media space for photographs, gifs, music, video, embeds, links, and short notes.

## Toggle the Gallery tab

In `src/lib/gallery.js`:

```js
export const GALLERY_ENABLED = true;  // set false to hide the nav tab + /gallery route
```

When disabled, the Gallery link disappears from the navbar (indices renumber) and `/gallery` redirects home.

## Where to edit content

All featured items live in **`src/lib/gallery.js`** → `GALLERY_ITEMS`.

By default the list auto-discovers files you drop into this folder:

| Drop these in `src/assets/gallery/` | Card type |
| --- | --- |
| `.jpg` `.jpeg` `.png` `.webp` `.avif` `.gif` | `image` / `gif` |
| `.mp4` `.webm` | `video` |
| `.mp3` `.ogg` `.wav` `.m4a` | `audio` |

Dated filenames like `26_May_2026.jpeg` sort newest-first and become the caption (`26 May 2026`).

## Hand-curate / mix media types

Replace or extend `GALLERY_ITEMS` with explicit objects. Order in the array is display order.

```js
import cover from '../assets/gallery/26_May_2026.jpeg';
import theme from '../assets/gallery/late-night.mp3';

export const GALLERY_ITEMS = [
  // Keep auto photos, then add custom cards:
  ...discoverGalleryImages(),

  {
    type: 'audio',
    id: 'late-night',
    src: theme,
    title: 'Late night loop',
    artist: 'Devansh',
  },

  {
    type: 'gif',
    id: 'desk-gif',
    src: '/path-or-import.gif',
    title: 'Bench setup',
  },

  {
    type: 'video',
    id: 'demo',
    src: '/path-or-import.mp4',
    title: 'Lab clip',
    poster: cover, // optional
  },

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

To fully hand-curate (no auto folder scan), delete the `...discoverGallery*()` spreads and list only the objects you want.

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
