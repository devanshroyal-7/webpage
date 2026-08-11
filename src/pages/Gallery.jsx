import './Gallery.css';

const imageModules = import.meta.glob(
    '../assets/gallery/*.{avif,jpeg,jpg,png,webp}',
    {
        eager: true,
        import: 'default',
        query: '?url',
    },
);

const formatTitle = (path) => {
    const filename = path.split('/').pop().replace(/\.[^.]+$/, '');

    return filename
        .replace(/^\d+[-_\s]*/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const photographs = Object.entries(imageModules)
    .sort(([firstPath], [secondPath]) => firstPath.localeCompare(secondPath))
    .map(([path, src], index) => ({
        id: path,
        index: String(index + 1).padStart(2, '0'),
        src,
        title: formatTitle(path),
    }));

const Gallery = () => (
    <div className="gallery-page">
        <header className="page-header">
            <div className="page-kicker">
                <span>04 / PERSONAL</span>
                <span>OFF.CLOCK</span>
            </div>
            <h1>Elsewhere<span className="logo-accent">.</span></h1>
            <p className="subtitle">
                Things I notice when I step away from robots—places, light, people, and
                whatever else feels worth keeping.
            </p>
        </header>

        {photographs.length > 0 ? (
            <section className="photo-grid" aria-label="Photography">
                {photographs.map((photo) => (
                    <figure className="photo-card" key={photo.id}>
                        <a href={photo.src} target="_blank" rel="noreferrer">
                            <img src={photo.src} alt={photo.title} loading="lazy" />
                        </a>
                        <figcaption>
                            <span>{photo.index}</span>
                            <span>{photo.title}</span>
                        </figcaption>
                    </figure>
                ))}
            </section>
        ) : (
            <div className="gallery-empty glass-panel">
                <span aria-hidden="true">▧</span>
                <p>Photographs coming soon.</p>
            </div>
        )}
    </div>
);

export default Gallery;
