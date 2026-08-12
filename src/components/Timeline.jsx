import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
    TIMELINE_ENABLED,
    TIMELINE_ITEMS,
    TIMELINE_META,
} from '../lib/timeline';
import TimelineVisual, {
    hasTimelineVisual,
    visualKeyOf,
} from './timelineVisuals';
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

const TimelineItem = ({ item, index, isVisible, isActive, isReached, reduceMotion }) => {
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
                reduceMotion || isReached ? 'is-reached' : 'is-pending',
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

            <article
                className={`timeline-entry${hasTimelineVisual(item.visual) ? ' has-visual' : ''}`}
            >
                <div className="timeline-entry-copy">
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
                </div>

                {hasTimelineVisual(item.visual) ? (
                    <div
                        className="timeline-entry-visual"
                        data-visual={visualKeyOf(item.visual)}
                        aria-hidden="true"
                    >
                        <TimelineVisual
                            visual={item.visual}
                            reduceMotion={reduceMotion}
                            paused={(!isReached || !isVisible) && !reduceMotion}
                        />
                    </div>
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
    const [reached, setReached] = useState(
        () => (reduceMotion ? new Set(TIMELINE_ITEMS.map((item) => item.id)) : new Set()),
    );
    const [activeId, setActiveId] = useState(null);
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

        const targetRef = { current: reduceMotion ? 1 : 0 };
        const displayRef = { current: reduceMotion ? 1 : 0 };
        let lastScrollAt = 0;
        let lastTs = performance.now();
        let raf = 0;

        const readTarget = () => {
            if (reduceMotion) {
                return 1;
            }

            const rect = spine.getBoundingClientRect();
            const view = window.innerHeight || 1;
            const anchorY = view * (2 / 3);
            const raw = (anchorY - rect.top) / Math.max(rect.height, 1);

            const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - view);
            const remaining = Math.max(0, maxScroll - scrollY);
            const atPageBottom = remaining <= 2;

            return atPageBottom ? 1 : Math.min(1, Math.max(0, raw));
        };

        const writeProgress = (value) => {
            spine.style.setProperty('--timeline-progress', String(value));
        };

        const reachedRef = {
            current: reduceMotion
                ? new Set(TIMELINE_ITEMS.map((item) => item.id))
                : new Set(),
        };
        const activeRef = { current: null };

        const syncItemStates = (progress) => {
            const spineRect = spine.getBoundingClientRect();
            const height = Math.max(spineRect.height, 1);
            const nextReached = new Set();
            let nextActive = null;
            let bestPop = 0;

            section.querySelectorAll('[data-timeline-item]').forEach((el) => {
                const id = el.getAttribute('data-timeline-item');
                const node = el.querySelector('.timeline-node');
                if (!id || !node) {
                    return;
                }

                const nodeRect = node.getBoundingClientRect();
                const at = (nodeRect.top + nodeRect.height * 0.5 - spineRect.top) / height;
                const isLit = reduceMotion || progress >= at - 0.006;
                if (isLit) {
                    nextReached.add(id);
                }

                const dist = Math.max(0, progress - at);
                const pop = isLit ? Math.exp(-((dist / 0.08) ** 2)) : 0;
                el.querySelector('.timeline-entry')?.style.setProperty(
                    '--item-pop',
                    pop.toFixed(4),
                );

                if (pop > bestPop) {
                    bestPop = pop;
                    nextActive = id;
                }
            });

            if (bestPop < 0.2) {
                nextActive = null;
            }

            const reachedChanged =
                nextReached.size !== reachedRef.current.size
                || [...nextReached].some((id) => !reachedRef.current.has(id));
            if (reachedChanged) {
                reachedRef.current = nextReached;
                setReached(new Set(nextReached));
            }
            if (nextActive !== activeRef.current) {
                activeRef.current = nextActive;
                setActiveId(nextActive);
            }
        };

        const onScroll = () => {
            lastScrollAt = performance.now();
            targetRef.current = readTarget();
            if (!raf) {
                lastTs = lastScrollAt;
                raf = window.requestAnimationFrame(tick);
            }
        };

        const tick = (now) => {
            const dt = Math.min(0.048, (now - lastTs) / 1000);
            lastTs = now;

            if (reduceMotion) {
                displayRef.current = 1;
                writeProgress(1);
                syncItemStates(1);
                raf = 0;
                return;
            }

            const scrolling = now - lastScrollAt < 90;
            const tau = scrolling ? 0.022 : 0.11;
            const k = 1 - Math.exp(-dt / tau);
            displayRef.current += (targetRef.current - displayRef.current) * k;

            if (Math.abs(targetRef.current - displayRef.current) < 0.0003) {
                displayRef.current = targetRef.current;
            }

            writeProgress(displayRef.current);
            syncItemStates(displayRef.current);

            if (displayRef.current === targetRef.current && !scrolling) {
                raf = 0;
                return;
            }

            raf = window.requestAnimationFrame(tick);
        };

        onScroll();
        writeProgress(displayRef.current);
        syncItemStates(displayRef.current);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        raf = window.requestAnimationFrame(tick);

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

        return () => {
            itemObserver.disconnect();
            headerObserver?.disconnect();
            window.cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
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
                            isReached={reached.has(item.id)}
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
