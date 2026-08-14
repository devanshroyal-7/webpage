import { useEffect, useMemo, useState } from 'react';
import BashTypewriter from './BashTypewriter';
import './IntroOverlay.css';

const WELCOME_START_DELAY = 280;
const WELCOME_TYPE_MS = 58;
const WELCOME_HOLD_MS = 500;
const WELCOME_MESSAGE = ['Welcome!'];
const WELCOME_DURATION =
    WELCOME_START_DELAY
    + WELCOME_MESSAGE[0].length * WELCOME_TYPE_MS
    + WELCOME_HOLD_MS;
const BLADE_COUNT = 7;
const SHUTTER_MS = 1840;
const SHUTTER_K = 1.75;
const TERMINAL_SHADES = ['#050805', '#0a0f0b', '#030403', '#0c110d'];
const SPLIT_COLORS = ['#00ff9f', '#00b8ff', '#001eff', '#bd00ff', '#d600ff'];

const readGridSize = () => {
    const value = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--grid-size'),
    );

    return Number.isFinite(value) && value > 0 ? value : 48;
};

const wrapAngle = (angle) => {
    const turn = Math.PI * 2;
    return ((angle % turn) + turn) % turn;
};

const shutterEase = (progress) => {
    const eased = (Math.exp(SHUTTER_K * progress) - 1) / (Math.exp(SHUTTER_K) - 1);
    return 0.18 * progress + 0.82 * eased;
};

const prefersReducedMotion = () => (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

const IntroOverlay = () => {
    const [isVisible, setIsVisible] = useState(
        () => !prefersReducedMotion(),
    );
    const [isReady, setIsReady] = useState(false);

    const grid = useMemo(() => {
        const tileSize = readGridSize();
        const columns = Math.ceil(window.innerWidth / tileSize);
        const rows = Math.ceil(window.innerHeight / tileSize);
        const tileCount = columns * rows;
        const centerColumn = (columns - 1) / 2;
        const centerRow = (rows - 1) / 2;
        const maxDistance = Math.hypot(
            centerColumn * tileSize,
            centerRow * tileSize,
        );
        const sector = (Math.PI * 2) / BLADE_COUNT;
        const apothem = Math.cos(Math.PI / BLADE_COUNT);

        return {
            columns,
            rows,
            tiles: Array.from({ length: tileCount }, (_, index) => {
                const column = index % columns;
                const row = Math.floor(index / columns);
                const dx = (column - centerColumn) * tileSize;
                const dy = (row - centerRow) * tileSize;
                const radius = Math.hypot(dx, dy);
                const angle = Math.atan2(dy, dx);
                const openT = radius / Math.max(maxDistance, 1);
                const theta = angle - openT * (Math.PI / BLADE_COUNT);
                const delta = wrapAngle(theta + Math.PI) % sector - sector / 2;
                const heptagonScale = apothem / Math.max(Math.cos(delta), 0.22);
                const irisProgress = Math.min(
                    1,
                    radius / Math.max(maxDistance * heptagonScale, 1),
                );
                const jitter = (index * 13) % 7;
                const delay = 24 + SHUTTER_MS * shutterEase(irisProgress) + jitter;
                const isOuterHitch = irisProgress > 0.78 && index % 9 === 0;
                const fadeMs = 90 + Math.round(irisProgress * 70);
                const sweep = 3 + irisProgress * 4;

                return {
                    id: index,
                    delay: `${Math.round(delay)}ms`,
                    fadeDuration: `${fadeMs}ms`,
                    lingerDelay: isOuterHitch ? `${48 + (index % 4) * 16}ms` : '0ms',
                    shade: TERMINAL_SHADES[index % TERMINAL_SHADES.length],
                    glitchX: `${(-Math.sin(angle) * sweep).toFixed(1)}px`,
                    glitchY: `${(Math.cos(angle) * sweep).toFixed(1)}px`,
                    splitA: SPLIT_COLORS[index % SPLIT_COLORS.length],
                    splitB: SPLIT_COLORS[(index + 2) % SPLIT_COLORS.length],
                };
            }),
        };
    }, []);

    useEffect(() => {
        if (!isVisible) return undefined;

        // Lock scroll without changing html overflow — toggling it collapses
        // scrollbar-gutter and shifts the centered layout when the intro ends.
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const blockKeys = new Set([
            ' ',
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
            'PageUp',
            'PageDown',
            'Home',
            'End',
        ]);

        const preventScroll = (event) => {
            event.preventDefault();
        };
        const preventScrollKeys = (event) => {
            if (blockKeys.has(event.key)) {
                event.preventDefault();
            }
        };
        const keepScrollPosition = () => {
            if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
                window.scrollTo(scrollX, scrollY);
            }
        };

        window.addEventListener('wheel', preventScroll, { passive: false });
        window.addEventListener('touchmove', preventScroll, { passive: false });
        window.addEventListener('keydown', preventScrollKeys, { capture: true });
        window.addEventListener('scroll', keepScrollPosition);

        let firstFrame;
        let secondFrame;
        let preloadTimer;
        const homeAnimationReadyAt = performance.now() + WELCOME_DURATION;

        const revealPreloadedPage = () => {
            firstFrame = requestAnimationFrame(() => {
                secondFrame = requestAnimationFrame(() => {
                    const remainingTime = Math.max(
                        0,
                        homeAnimationReadyAt - performance.now(),
                    );
                    preloadTimer = window.setTimeout(
                        () => setIsReady(true),
                        remainingTime,
                    );
                });
            });
        };

        if (document.readyState === 'complete') {
            revealPreloadedPage();
        } else {
            window.addEventListener('load', revealPreloadedPage, { once: true });
        }

        return () => {
            window.removeEventListener('load', revealPreloadedPage);
            window.removeEventListener('wheel', preventScroll);
            window.removeEventListener('touchmove', preventScroll);
            window.removeEventListener('keydown', preventScrollKeys, { capture: true });
            window.removeEventListener('scroll', keepScrollPosition);
            cancelAnimationFrame(firstFrame);
            cancelAnimationFrame(secondFrame);
            clearTimeout(preloadTimer);
        };
    }, [isVisible]);

    const finishIntro = (event) => {
        if (event.target !== event.currentTarget) return;

        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div
            className={`intro-overlay${isReady ? ' intro-overlay--ready' : ''}`}
            style={{
                '--intro-columns': grid.columns,
                '--intro-rows': grid.rows,
            }}
            onAnimationEnd={finishIntro}
            aria-hidden="true"
        >
            <BashTypewriter
                phrases={WELCOME_MESSAGE}
                className="intro-welcome"
                startDelay={WELCOME_START_DELAY}
            />
            {grid.tiles.map((tile) => (
                <span
                    className="intro-tile"
                    key={tile.id}
                    style={{
                        '--tile-delay': tile.delay,
                        '--fade-duration': tile.fadeDuration,
                        '--linger-delay': tile.lingerDelay,
                        '--tile-shade': tile.shade,
                        '--glitch-x': tile.glitchX,
                        '--glitch-y': tile.glitchY,
                        '--split-a': tile.splitA,
                        '--split-b': tile.splitB,
                    }}
                />
            ))}
        </div>
    );
};

export default IntroOverlay;
