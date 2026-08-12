/**
 * Renders one modular gallery card.
 * Supported item.type: image | gif | video | audio | embed | link | note
 */

const MediaCaption = ({ index, title, meta }) => (
    <figcaption>
        <span>{index}</span>
        <span>{title}</span>
        {meta ? <span className="gallery-item-meta">{meta}</span> : null}
    </figcaption>
);

const GalleryItem = ({ item, index, style }) => {
    const label = String(index + 1).padStart(2, '0');
    const title = item.title || 'Untitled';
    const className = `gallery-item gallery-item-${item.type}`;

    if (item.type === 'image' || item.type === 'gif') {
        const href = item.href || item.src;

        return (
            <figure className={className} style={style}>
                <a href={href} target="_blank" rel="noreferrer">
                    <img src={item.src} alt={item.alt || title} loading="lazy" />
                </a>
                <MediaCaption index={label} title={title} meta={item.meta} />
            </figure>
        );
    }

    if (item.type === 'video') {
        return (
            <figure className={className} style={style}>
                <div className="gallery-media-frame">
                    <video
                        src={item.src}
                        controls
                        playsInline
                        preload="metadata"
                        poster={item.poster}
                    />
                </div>
                <MediaCaption index={label} title={title} meta={item.meta} />
            </figure>
        );
    }

    if (item.type === 'audio') {
        return (
            <figure className={className} style={style}>
                <div className="gallery-audio-body">
                    <span className="gallery-audio-glyph" aria-hidden="true">♪</span>
                    <div className="gallery-audio-copy">
                        <strong>{title}</strong>
                        {item.artist ? <p>{item.artist}</p> : null}
                    </div>
                    <audio src={item.src} controls preload="metadata" />
                </div>
                <MediaCaption index={label} title={title} meta={item.meta || 'Audio'} />
            </figure>
        );
    }

    if (item.type === 'embed') {
        return (
            <figure className={className} style={style}>
                <div className="gallery-media-frame gallery-embed-frame">
                    <iframe
                        src={item.embedUrl}
                        title={title}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <MediaCaption index={label} title={title} meta={item.meta || 'Embed'} />
            </figure>
        );
    }

    if (item.type === 'link') {
        return (
            <figure className={className} style={style}>
                <a
                    className="gallery-link-body"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <span className="gallery-link-glyph" aria-hidden="true">↗</span>
                    <strong>{title}</strong>
                    {item.description ? <p>{item.description}</p> : null}
                </a>
                <MediaCaption index={label} title={title} meta={item.meta || 'Link'} />
            </figure>
        );
    }

    if (item.type === 'note') {
        return (
            <figure className={className} style={style}>
                <div className="gallery-note-body">
                    <strong>{title}</strong>
                    {item.text ? <p>{item.text}</p> : null}
                </div>
                <MediaCaption index={label} title={title} meta={item.meta || 'Note'} />
            </figure>
        );
    }

    return null;
};

export default GalleryItem;
