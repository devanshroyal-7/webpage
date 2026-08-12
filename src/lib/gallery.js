/**
 * Gallery configuration and items.
 *
 * Toggle the tab with GALLERY_ENABLED.
 * Add / remove / reorder media in GALLERY_ITEMS.
 * See src/assets/gallery/README.md for full usage notes.
 */

const imageModules = import.meta.glob(
    '../assets/gallery/*.{avif,AVIF,gif,GIF,jpeg,JPEG,jpg,JPG,png,PNG,webp,WEBP}',
    {
        eager: true,
        import: 'default',
        query: '?url',
    },
);

const audioModules = import.meta.glob(
    '../assets/gallery/*.{mp3,MP3,ogg,OGG,wav,WAV,m4a,M4A}',
    {
        eager: true,
        import: 'default',
        query: '?url',
    },
);

const videoModules = import.meta.glob(
    '../assets/gallery/*.{mp4,MP4,webm,WEBM}',
    {
        eager: true,
        import: 'default',
        query: '?url',
    },
);

const MONTHS = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
};

const getFilename = (path) => path.split('/').pop().replace(/\.[^.]+$/, '');

const parseTakenAt = (path) => {
    const filename = getFilename(path);
    const match = filename.match(/^(\d{1,2})[-_\s]+([A-Za-z]+)[-_\s]+(\d{4})$/);

    if (!match) {
        return null;
    }

    const [, day, monthName, year] = match;
    const month = MONTHS[monthName.toLowerCase()];

    if (month === undefined) {
        return null;
    }

    return new Date(Number(year), month, Number(day)).getTime();
};

const formatTitle = (path) => getFilename(path)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const sortByDateThenName = ([firstPath], [secondPath]) => {
    const firstDate = parseTakenAt(firstPath);
    const secondDate = parseTakenAt(secondPath);

    if (firstDate !== null && secondDate !== null) {
        return secondDate - firstDate;
    }

    if (firstDate !== null) {
        return -1;
    }

    if (secondDate !== null) {
        return 1;
    }

    return firstPath.localeCompare(secondPath);
};

/** Auto-build image/gif cards from files dropped in src/assets/gallery. */
export const discoverGalleryImages = () => Object.entries(imageModules)
    .sort(sortByDateThenName)
    .map(([path, src]) => ({
        id: path,
        type: /\.gif$/i.test(path) ? 'gif' : 'image',
        src,
        title: formatTitle(path),
        href: src,
    }));

/** Auto-build audio cards from audio files in src/assets/gallery. */
export const discoverGalleryAudio = () => Object.entries(audioModules)
    .sort(sortByDateThenName)
    .map(([path, src]) => ({
        id: path,
        type: 'audio',
        src,
        title: formatTitle(path),
    }));

/** Auto-build video cards from video files in src/assets/gallery. */
export const discoverGalleryVideos = () => Object.entries(videoModules)
    .sort(sortByDateThenName)
    .map(([path, src]) => ({
        id: path,
        type: 'video',
        src,
        title: formatTitle(path),
    }));

/**
 * Set to false to hide the Gallery nav tab and disable the /gallery route.
 */
export const GALLERY_ENABLED = true;

export const GALLERY_META = {
    kickerIndex: '04 / 04',
    kickerLabel: 'OFF.CLOCK',
    title: 'Elsewhere',
    subtitle: [
        "Things that I notice. Light, people, and whatever's worth keeping",
    ],
    emptyMessage: 'Nothing here yet.',
};

/**
 * Featured gallery items. Order here is display order.
 *
 * Supported types: image | gif | video | audio | embed | link | note
 *
 * Examples (commented — uncomment / copy to add):
 *
 * { type: 'audio', src: '/path-or-import', title: 'Late night loop', artist: 'Me' }
 * { type: 'embed', embedUrl: 'https://www.youtube.com/embed/...', title: 'Talk' }
 * { type: 'link', href: 'https://...', title: 'Playlist', description: 'Spotify' }
 * { type: 'note', title: 'Field note', text: 'Short blurb shown as a card.' }
 *
 * By default, media files in src/assets/gallery are discovered automatically.
 * To fully hand-curate, replace the spreads below with an explicit array.
 */
export const GALLERY_ITEMS = [
    ...discoverGalleryImages(),
    ...discoverGalleryVideos(),
    ...discoverGalleryAudio(),
];
