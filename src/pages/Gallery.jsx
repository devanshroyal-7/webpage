import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import BashTypewriter from '../components/BashTypewriter';
import GalleryItem from '../components/GalleryItem';
import PageHeader from '../components/PageHeader';
import { GALLERY_META, loadGalleryItems } from '../lib/gallery';
import './Gallery.css';

const DEADZONE = 0.16;
const SPREAD = 1.1;
const FOLLOW_TAU = 0.32;
const SETTLE_PX = 0.4;
const T_CLAMP = 1.75;
const END_RANGE = 160;
const FADE_TOP = 12;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const columnCountForWidth = (width) => {
    if (width <= 600) {
        return 1;
    }
    if (width <= 900) {
        return 2;
    }
    return 3;
};

const splitIntoColumns = (items, count) => {
    const columns = Array.from({ length: count }, () => []);
    items.forEach((item, index) => {
        columns[index % count].push({ item, index });
    });
    return columns;
};

const spreadTarget = (itemCenter, viewH, viewCenter, factor) => {
    const t = clamp((itemCenter - viewCenter) / viewH, -T_CLAMP, T_CLAMP);
    const beyond = Math.max(0, Math.abs(t) - DEADZONE);
    return Math.sign(t) * SPREAD * factor * viewH * beyond * beyond;
};

const edgeFade = (y, top, bottom, band) => {
    let fade = 1;
    if (y < top + band) {
        fade = Math.max(0, (y - top) / band);
    }
    if (y > bottom - band) {
        fade = Math.min(fade, Math.max(0, (bottom - y) / band));
    }
    return fade;
};

const usePrefersReducedMotion = () => {
    const [reduced, setReduced] = useState(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = () => setReduced(media.matches);
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    return reduced;
};

const Gallery = () => {
    const reduceMotion = usePrefersReducedMotion();
    const gridRef = useRef(null);
    const colRefs = useRef([]);
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState('loading');
    const [colCount, setColCount] = useState(() =>
        columnCountForWidth(window.innerWidth),
    );

    useEffect(() => {
        let cancelled = false;

        loadGalleryItems()
            .then((nextItems) => {
                if (!cancelled) {
                    setItems(nextItems);
                    setStatus('ready');
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setItems([]);
                    setStatus('ready');
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const columns = useMemo(
        () => splitIntoColumns(items, colCount),
        [colCount, items],
    );

    const isReels = colCount === 1 && items.length > 0;

    useEffect(() => {
        const onResize = () => setColCount(columnCountForWidth(window.innerWidth));
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        const nav = document.querySelector('.navbar');

        if (!isReels) {
            root.classList.remove('gallery-reels');
            root.style.removeProperty('--reels-nav');
            return undefined;
        }

        const syncNavPad = () => {
            if (!nav) {
                return;
            }

            const stickyTop = Number.parseFloat(getComputedStyle(nav).top) || 0;
            root.style.setProperty(
                '--reels-nav',
                `${Math.ceil(nav.getBoundingClientRect().height + stickyTop + 8)}px`,
            );
        };

        syncNavPad();
        root.classList.toggle('gallery-reels', !reduceMotion);

        const observer = new ResizeObserver(syncNavPad);
        if (nav) {
            observer.observe(nav);
        }

        window.addEventListener('resize', syncNavPad);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', syncNavPad);
            root.classList.remove('gallery-reels');
            root.style.removeProperty('--reels-nav');
        };
    }, [isReels, reduceMotion]);

    useLayoutEffect(() => {
        if (!isReels || reduceMotion) {
            return undefined;
        }

        const grid = gridRef.current;
        if (!grid) {
            return undefined;
        }

        const slots = [...grid.querySelectorAll('.photo-slot')];
        const ratios = new Map();
        let raf = 0;

        const paint = () => {
            raf = 0;
            let best = null;
            let bestRatio = 0;

            ratios.forEach((ratio, slot) => {
                if (ratio > bestRatio) {
                    bestRatio = ratio;
                    best = slot;
                }
            });

            slots.forEach((slot) => {
                slot.classList.toggle('is-active', slot === best);
            });
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    ratios.set(entry.target, entry.intersectionRatio);
                });

                if (!raf) {
                    raf = window.requestAnimationFrame(paint);
                }
            },
            { threshold: [0, 0.2, 0.4, 0.55, 0.7, 0.85, 1] },
        );

        slots.forEach((slot) => observer.observe(slot));

        return () => {
            window.cancelAnimationFrame(raf);
            observer.disconnect();
            slots.forEach((slot) => slot.classList.remove('is-active'));
        };
    }, [isReels, items, reduceMotion]);

    useEffect(() => {
        const grid = gridRef.current;
        colRefs.current.length = colCount;
        const cols = colRefs.current.filter(Boolean);

        const reset = () => {
            cols.forEach((col) => {
                col.querySelectorAll('.photo-slot').forEach((slot) => {
                    slot.style.removeProperty('--item-spread');
                    slot.style.removeProperty('--item-fade');
                });
            });
        };

        if (!grid || reduceMotion || !items.length || colCount === 1) {
            reset();
            return undefined;
        }

        const tracks = cols.map((col, colIndex) => {
            const slots = [...col.querySelectorAll('.photo-slot')];
            return {
                col,
                slots,
                factor: 0.55 + slots.length * 0.22 + colIndex * 0.14,
                tau: FOLLOW_TAU + colIndex * 0.08,
            };
        });

        const displayed = new WeakMap();
        const footer = document.querySelector('.footer');
        let raf = 0;
        let lastTs = performance.now();
        let lastScrollAt = lastTs;

        const tick = (now) => {
            const dt = Math.min(0.048, (now - lastTs) / 1000);
            lastTs = now;

            const viewH = window.innerHeight || 1;
            const viewCenter = viewH * 0.48;
            const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
            const maxY = Math.max(0, document.documentElement.scrollHeight - viewH);
            const remaining = Math.max(0, maxY - scrollY);
            const endSnap = 1 - Math.min(1, remaining / END_RANGE);
            const fadeBottom = footer
                ? footer.getBoundingClientRect().top + 6
                : viewH;
            const fadeBand = Math.max(96, viewH * 0.16);
            let chasing = false;

            tracks.forEach((track) => {
                const tau = Math.max(0.04, track.tau * (1 - 0.82 * endSnap * endSnap));
                const k = 1 - Math.exp(-dt / tau);
                const colTop = track.col.getBoundingClientRect().top;

                track.slots.forEach((slot) => {
                    const itemCenter = colTop + slot.offsetTop + slot.offsetHeight / 2;
                    const target = spreadTarget(
                        itemCenter,
                        viewH,
                        viewCenter,
                        track.factor,
                    );
                    let current = displayed.get(slot);
                    current = current === undefined
                        ? target
                        : current + (target - current) * k;

                    if (Math.abs(target - current) > SETTLE_PX) {
                        chasing = true;
                    } else {
                        current = target;
                    }

                    displayed.set(slot, current);
                    slot.style.setProperty('--item-spread', `${current.toFixed(2)}px`);
                    slot.style.setProperty(
                        '--item-fade',
                        edgeFade(
                            itemCenter + current,
                            FADE_TOP,
                            fadeBottom,
                            fadeBand,
                        ).toFixed(3),
                    );
                });
            });

            if (chasing || now - lastScrollAt < 120) {
                raf = window.requestAnimationFrame(tick);
                return;
            }

            raf = 0;
        };

        const onScroll = () => {
            lastScrollAt = performance.now();
            if (!raf) {
                lastTs = lastScrollAt;
                raf = window.requestAnimationFrame(tick);
            }
        };

        const observer = new ResizeObserver(onScroll);
        observer.observe(grid);
        cols.forEach((col) => observer.observe(col));

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        raf = window.requestAnimationFrame(tick);

        return () => {
            window.cancelAnimationFrame(raf);
            observer.disconnect();
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            reset();
        };
    }, [colCount, items, reduceMotion]);

    return (
        <div className={isReels ? 'gallery-page gallery-page--reels' : 'gallery-page'}>
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

            {status === 'loading' ? (
                <div className="gallery-empty glass-panel">
                    <span aria-hidden="true">◌</span>
                    <p>Loading gallery</p>
                </div>
            ) : items.length > 0 ? (
                <section
                    className={isReels ? 'photo-grid photo-grid--reels' : 'photo-grid'}
                    aria-label="Gallery"
                    ref={gridRef}
                    style={{ '--gallery-cols': colCount }}
                >
                    {columns.map((column, colIndex) => (
                        <div
                            className="photo-col"
                            key={`col-${colIndex}`}
                            ref={(node) => {
                                colRefs.current[colIndex] = node;
                            }}
                        >
                            {column.map(({ item, index }) => (
                                <div
                                    className={
                                        isReels && index === 0
                                            ? 'photo-slot is-active'
                                            : 'photo-slot'
                                    }
                                    key={item.id || `${item.type}-${item.title}-${index}`}
                                >
                                    <GalleryItem
                                        item={item}
                                        index={index}
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    />
                                </div>
                            ))}
                        </div>
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
};

export default Gallery;
