import BashTypewriter from '../components/BashTypewriter';
import GalleryItem from '../components/GalleryItem';
import { GALLERY_ITEMS, GALLERY_META } from '../lib/gallery';
import './Gallery.css';

const Gallery = () => (
    <div className="gallery-page">
        <header className="page-header">
            <div className="page-kicker">
                <span>{GALLERY_META.kickerIndex}</span>
                <span>{GALLERY_META.kickerLabel}</span>
            </div>
            <h1>
                {GALLERY_META.title}
                <span className="logo-accent">.</span>
            </h1>
            <BashTypewriter
                phrases={GALLERY_META.subtitle}
                className="subtitle"
                onceKey="gallery-subtitle"
            />
        </header>

        {GALLERY_ITEMS.length > 0 ? (
            <section className="photo-grid" aria-label="Gallery">
                {GALLERY_ITEMS.map((item, index) => (
                    <GalleryItem
                        key={item.id || `${item.type}-${item.title}-${index}`}
                        item={item}
                        index={index}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    />
                ))}
            </section>
        ) : (
            <div className="gallery-empty glass-panel">
                <span aria-hidden="true">▧</span>
                <p>{GALLERY_META.emptyMessage}</p>
            </div>
        )}
    </div>
);

export default Gallery;
