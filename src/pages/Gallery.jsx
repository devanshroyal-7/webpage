import BashTypewriter from '../components/BashTypewriter';
import GalleryItem from '../components/GalleryItem';
import PageHeader from '../components/PageHeader';
import { GALLERY_ITEMS, GALLERY_META } from '../lib/gallery';
import './Gallery.css';

const Gallery = () => (
    <div className="gallery-page">
        <PageHeader
            kickerIndex={GALLERY_META.kickerIndex}
            kickerLabel={GALLERY_META.kickerLabel}
            title={GALLERY_META.title}
        >
            <BashTypewriter
                phrases={GALLERY_META.subtitle}
                className="subtitle"
                onceKey="gallery-subtitle"
            />
        </PageHeader>

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
