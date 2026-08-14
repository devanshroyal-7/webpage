/**
 * Gallery configuration and items.
 *
 * Toggle the tab with GALLERY_ENABLED.
 * Personal media is loaded from a remote host so binaries stay out of git.
 * See src/assets/gallery/README.md for setup.
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

const sortByDateThenName = (firstPath, secondPath) => {
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

const typeFromName = (name) => {
    if (/\.gif$/i.test(name)) {
        return 'gif';
    }

    if (/\.(avif|jpe?g|png|webp)$/i.test(name)) {
        return 'image';
    }

    if (/\.(mp4|webm)$/i.test(name)) {
        return 'video';
    }

    if (/\.(mp3|ogg|wav|m4a)$/i.test(name)) {
        return 'audio';
    }

    return null;
};

const typeFromMime = (mime, name) => {
    if (mime === 'image/gif' || /\.gif$/i.test(name)) {
        return 'gif';
    }

    if (mime?.startsWith('image/')) {
        return 'image';
    }

    if (mime?.startsWith('video/')) {
        return 'video';
    }

    if (mime?.startsWith('audio/')) {
        return 'audio';
    }

    return typeFromName(name);
};

const mediaItem = (name, src, extras = {}) => {
    const { type: typeOverride, id, title, href, ...rest } = extras;
    const type = typeOverride || typeFromName(name);

    if (!type) {
        return null;
    }

    return {
        id: id || name,
        type,
        src,
        title: title || formatTitle(name),
        href: href || src,
        ...rest,
    };
};

const joinUrl = (base, file) => `${base.replace(/\/+$/, '')}/${encodeURIComponent(file)}`;

const parseManifest = (data) => {
    const toName = (entry) => {
        if (typeof entry === 'string') {
            return entry;
        }

        return entry?.file || entry?.name || '';
    };

    if (Array.isArray(data)) {
        return data.map(toName).filter(Boolean);
    }

    if (Array.isArray(data?.files)) {
        return data.files.map(toName).filter(Boolean);
    }

    if (Array.isArray(data?.items)) {
        return data.items.map(toName).filter(Boolean);
    }

    return [];
};

/**
 * Used when VITE_GALLERY_BASE_URL is set and the host has no manifest.json.
 * Keep the original dated filenames. Add / remove names here after uploading.
 */
export const GALLERY_REMOTE_FILES = [
    '23_July_2026.JPG',
    '20_June_2026.jpg',
    '26_May_2026.jpeg',
    '11_May_2026.JPG',
    '08_December_2025.JPG',
    '27_September_2025.JPG',
    '18_May_2024.jpeg',
    '27_April_2023.jpeg',
];

/** Auto-build image/gif cards from files dropped in src/assets/gallery. */
export const discoverGalleryImages = () => Object.entries(imageModules)
    .sort(([firstPath], [secondPath]) => sortByDateThenName(firstPath, secondPath))
    .map(([path, src]) => mediaItem(path.split('/').pop(), src, { id: path }));

/** Auto-build audio cards from audio files in src/assets/gallery. */
export const discoverGalleryAudio = () => Object.entries(audioModules)
    .sort(([firstPath], [secondPath]) => sortByDateThenName(firstPath, secondPath))
    .map(([path, src]) => mediaItem(path.split('/').pop(), src, { id: path }));

/** Auto-build video cards from video files in src/assets/gallery. */
export const discoverGalleryVideos = () => Object.entries(videoModules)
    .sort(([firstPath], [secondPath]) => sortByDateThenName(firstPath, secondPath))
    .map(([path, src]) => mediaItem(path.split('/').pop(), src, { id: path }));

const discoverLocalMedia = () => [
    ...discoverGalleryImages(),
    ...discoverGalleryVideos(),
    ...discoverGalleryAudio(),
].filter(Boolean);

const loadFromDrive = async (folderId, apiKey) => {
    const files = [];
    let pageToken = '';
    const safeFolderId = String(folderId).replace(/'/g, '');

    do {
        const params = new URLSearchParams({
            q: `'${safeFolderId}' in parents and trashed = false`,
            fields: 'files(id,name,mimeType),nextPageToken',
            pageSize: '1000',
            key: apiKey,
            supportsAllDrives: 'true',
            includeItemsFromAllDrives: 'true',
        });

        if (pageToken) {
            params.set('pageToken', pageToken);
        }

        const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);

        if (!response.ok) {
            throw new Error(`Google Drive request failed (${response.status})`);
        }

        const payload = await response.json();
        files.push(...(payload.files || []));
        pageToken = payload.nextPageToken || '';
    } while (pageToken);

    return files
        .slice()
        .sort((first, second) => sortByDateThenName(first.name, second.name))
        .map((file) => {
            const type = typeFromMime(file.mimeType, file.name);

            if (!type) {
                return null;
            }

            if (type === 'video') {
                return {
                    id: file.id,
                    type: 'embed',
                    embedUrl: `https://drive.google.com/file/d/${file.id}/preview`,
                    title: formatTitle(file.name),
                    meta: 'Video',
                };
            }

            if (type === 'audio') {
                return {
                    id: file.id,
                    type: 'audio',
                    src: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${apiKey}`,
                    title: formatTitle(file.name),
                };
            }

            const src = `https://lh3.googleusercontent.com/d/${file.id}`;

            return {
                id: file.id,
                type,
                src,
                href: src,
                title: formatTitle(file.name),
            };
        })
        .filter(Boolean);
};

const loadFromBaseUrl = async (baseUrl) => {
    let names = [];

    try {
        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/manifest.json`);

        if (response.ok) {
            names = parseManifest(await response.json());
        }
    } catch {
        // A hosted manifest is optional.
    }

    if (!names.length) {
        names = GALLERY_REMOTE_FILES;
    }

    return names
        .slice()
        .sort(sortByDateThenName)
        .map((name) => mediaItem(name, joinUrl(baseUrl, name)))
        .filter(Boolean);
};

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
 * Extra cards mixed in after remote / local media.
 *
 * Supported types: image | gif | video | audio | embed | link | note
 *
 * { type: 'audio', src: 'https://...', title: 'Late night loop', artist: 'Me' }
 * { type: 'embed', embedUrl: 'https://www.youtube.com/embed/...', title: 'Talk' }
 * { type: 'link', href: 'https://...', title: 'Playlist', description: 'Spotify' }
 * { type: 'note', title: 'Field note', text: 'Short blurb shown as a card.' }
 */
export const GALLERY_EXTRA_ITEMS = [];

/**
 * Load gallery media from Google Drive, a public folder URL, or local files.
 *
 * Priority:
 * 1. VITE_GALLERY_DRIVE_FOLDER_ID + VITE_GALLERY_DRIVE_API_KEY
 * 2. VITE_GALLERY_BASE_URL (optional hosted manifest.json)
 * 3. Files still sitting in src/assets/gallery (local preview only)
 */
export const loadGalleryItems = async () => {
    const folderId = import.meta.env.VITE_GALLERY_DRIVE_FOLDER_ID;
    const apiKey = import.meta.env.VITE_GALLERY_DRIVE_API_KEY;
    const baseUrl = import.meta.env.VITE_GALLERY_BASE_URL;

    let media = [];

    try {
        if (folderId && apiKey) {
            media = await loadFromDrive(folderId, apiKey);
        } else if (baseUrl) {
            media = await loadFromBaseUrl(baseUrl);
        } else {
            media = discoverLocalMedia();
        }
    } catch (error) {
        console.error('Failed to load remote gallery media', error);
        media = discoverLocalMedia();
    }

    return [...media, ...GALLERY_EXTRA_ITEMS];
};
