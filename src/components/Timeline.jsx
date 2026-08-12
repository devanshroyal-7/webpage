import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
    TIMELINE_ENABLED,
    TIMELINE_ITEMS,
    TIMELINE_META,
} from '../lib/timeline';
import './Timeline.css';

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

const TimelineItem = ({ item, index, isVisible, isActive, reduceMotion }) => {
    const accentClass = item.accent === 'hot' ? 'is-hot' : 'is-accent';
    const heading = item.href ? (
        <a
            className="timeline-heading-link"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
        >
            <span>{item.title}</span>
            <ArrowUpRight size={16} aria-hidden="true" />
        </a>
    ) : (
        <span>{item.title}</span>
    );

    return (
        <li
            className={[
                'timeline-item',
                accentClass,
                isVisible || reduceMotion ? 'is-visible' : '',
                isActive ? 'is-active' : '',
            ]
                .filter(Boolean)
                .join(' ')}
            style={{ '--item-index': index }}
            data-timeline-item={item.id}
        >
            <div className="timeline-node" aria-hidden="true">
                <span className="timeline-node-core" />
                <span className="timeline-node-ring" />
            </div>

            <article className="timeline-entry">
                <div className="timeline-entry-meta">
                    <span className="timeline-index">
                        {String(index + 1).padStart(2, '0')}
                    </span>
                    <time className="timeline-period">{item.period}</time>
                </div>

                <h3 className="timeline-title">{heading}</h3>

                {(item.org || item.location) && (
                    <p className="timeline-org">
                        {item.org}
                        {item.org && item.location ? ' · ' : null}
                        {item.location}
                    </p>
                )}

                {item.summary ? (
                    <p className="timeline-summary">{item.summary}</p>
                ) : null}

                {item.tags?.length ? (
                    <ul className="timeline-tags" aria-label="Tags">
                        {item.tags.map((tag, tagIndex) => (
                            <li
                                key={`${item.id}-${tag}`}
                                style={{ '--tag-index': tagIndex }}
                            >
                                {tag}
                            </li>
                        ))}
                    </ul>
                ) : null}
            </article>
        </li>
    );
};

/**
 * Scroll-animated vertical timeline for the homepage.
 * Edit entries in src/lib/timeline.js — set TIMELINE_ENABLED to false to hide.
 */
const Timeline = () => {
    const reduceMotion = usePrefersReducedMotion();
    const sectionRef = useRef(null);
    const spineRef = useRef(null);
    const [visible, setVisible] = useState(() => new Set());
    const [activeId, setActiveId] = useState(null);
    const [progress, setProgress] = useState(reduceMotion ? 1 : 0);
    const [headerVisible, setHeaderVisible] = useState(reduceMotion);

    useEffect(() => {
        if (!TIMELINE_ENABLED || !TIMELINE_ITEMS.length) {
            return undefined;
        }

        const section = sectionRef.current;
        const spine = spineRef.current;
        if (!section || !spine) {
            return undefined;
        }

        const lastItem = section.querySelector('[data-timeline-item]:last-of-type');

        const updateProgress = () => {
            if (reduceMotion) {
                setProgress(1);
                return;
            }

            const rect = spine.getBoundingClientRect();
            const view = window.innerHeight || 1;
            const start = view * 0.75;
            const idealEnd = view * 0.25;

            // Original mapping hits 1 when the spine bottom is at 25vh.
            // The timeline sits near the page bottom (footer below), so that
            // position is often unreachable — remap the end to the spine
            // bottom's Y at max scroll so progress still reaches 1.
            const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - view);
            const remaining = Math.max(0, maxScroll - scrollY);
            const bottomAtMaxScroll = rect.bottom - remaining;
            const end = Math.max(idealEnd, bottomAtMaxScroll);

            const denom = rect.height + (start - end);
            const raw = denom <= 0 ? 1 : (start - rect.top) / denom;

            const lastRect = lastItem?.getBoundingClientRect();
            const atPageBottom = remaining <= 2;
            const endInView =
                rect.bottom <= view
                || (lastRect != null
                    && lastRect.bottom <= view
                    && lastRect.top < view);

            setProgress(
                atPageBottom || endInView ? 1 : Math.min(1, Math.max(0, raw)),
            );
        };

        const itemObserver = new IntersectionObserver(
            (entries) => {
                setVisible((prev) => {
                    const next = new Set(prev);
                    entries.forEach((entry) => {
                        const id = entry.target.getAttribute('data-timeline-item');
                        if (!id) return;
                        if (entry.isIntersecting) {
                            next.add(id);
                        }
                    });
                    return next;
                });

                const intersecting = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (a, b) =>
                            Math.abs(a.boundingClientRect.top - window.innerHeight * 0.4)
                            - Math.abs(b.boundingClientRect.top - window.innerHeight * 0.4),
                    );

                if (intersecting[0]) {
                    setActiveId(intersecting[0].target.getAttribute('data-timeline-item'));
                }
            },
            {
                threshold: [0.2, 0.45, 0.7],
                rootMargin: '-10% 0px -25% 0px',
            },
        );

        const header = section.querySelector('[data-timeline-header]');
        const headerObserver = header
            ? new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setHeaderVisible(true);
                    }
                },
                { threshold: 0.35 },
            )
            : null;

        if (header && headerObserver) {
            headerObserver.observe(header);
        }

        const nodes = section.querySelectorAll('[data-timeline-item]');
        nodes.forEach((node) => itemObserver.observe(node));

        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);

        return () => {
            itemObserver.disconnect();
            headerObserver?.disconnect();
            window.removeEventListener('scroll', updateProgress);
            window.removeEventListener('resize', updateProgress);
        };
    }, [reduceMotion]);

    if (!TIMELINE_ENABLED || TIMELINE_ITEMS.length === 0) {
        return null;
    }

    return (
        <section
            className={`home-timeline${reduceMotion ? ' reduce-motion' : ''}`}
            aria-labelledby="timeline-title"
            ref={sectionRef}
            style={{ '--timeline-progress': progress }}
        >
            <header
                className={`timeline-header${headerVisible ? ' is-visible' : ''}`}
                data-timeline-header
            >
                <div className="section-marker">
                    <span>{TIMELINE_META.index}</span>
                    <span>{TIMELINE_META.label}</span>
                </div>
                <div className="timeline-header-copy">
                    <h2 id="timeline-title">{TIMELINE_META.title}</h2>
                    {TIMELINE_META.subtitle ? (
                        <p>{TIMELINE_META.subtitle}</p>
                    ) : null}
                </div>
            </header>

            <div className="timeline-track">
                <div className="timeline-spine" aria-hidden="true" ref={spineRef}>
                    <div className="timeline-spine-fill" />
                    <div className="timeline-spine-glow" />
                </div>

                <ol className="timeline-list">
                    {TIMELINE_ITEMS.map((item, index) => (
                        <TimelineItem
                            key={item.id}
                            item={item}
                            index={index}
                            isVisible={visible.has(item.id)}
                            isActive={activeId === item.id}
                            reduceMotion={reduceMotion}
                        />
                    ))}
                </ol>
            </div>
        </section>
    );
};

export default Timeline;
