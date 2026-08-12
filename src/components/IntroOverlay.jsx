import { useEffect, useMemo, useState } from 'react';
import BashTypewriter from './BashTypewriter';
import './IntroOverlay.css';

const TILE_WIDTH = 76;
const TILE_HEIGHT = 48;
const WELCOME_DURATION = 1600;
const WELCOME_START_DELAY = 900;
const DARK_GREEN_SHADES = ['#a2ce3c', '#769b2b', '#526f1d', '#30450f'];
const WELCOME_MESSAGE = ['Welcome!'];

const createFixedRandomOrder = (length) => {
    const order = Array.from({ length }, (_, index) => index);
    let seed = 0x6d2b79f5;

    for (let index = length - 1; index > 0; index -= 1) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const swapIndex = seed % (index + 1);
        [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }

    return order;
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
        const columns = Math.ceil(window.innerWidth / TILE_WIDTH);
        const rows = Math.ceil(window.innerHeight / TILE_HEIGHT);
        const tileCount = columns * rows;
        const fixedOrder = createFixedRandomOrder(tileCount);
        const orderByTile = new Map(
            fixedOrder.map((tileId, orderIndex) => [tileId, orderIndex]),
        );
        const centerColumn = (columns - 1) / 2;
        const centerRow = (rows - 1) / 2;
        const maxDistance = Math.hypot(
            centerColumn * TILE_WIDTH,
            centerRow * TILE_HEIGHT,
        );
        const getRadialProgress = (index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const distanceFromCenter = Math.hypot(
                (column - centerColumn) * TILE_WIDTH,
                (row - centerRow) * TILE_HEIGHT,
            );

            return distanceFromCenter / Math.max(maxDistance, 1);
        };
        const lingeringTiles = fixedOrder
            .filter((tileId) => getRadialProgress(tileId) >= 0.72)
            .slice(0, 5);
        const lingerOrderByTile = new Map(
            lingeringTiles.map((tileId, lingerIndex) => [tileId, lingerIndex]),
        );

        return {
            columns,
            rows,
            tiles: Array.from({ length: tileCount }, (_, index) => {
                const orderIndex = orderByTile.get(index);
                const lingerIndex = lingerOrderByTile.get(index);
                const radialProgress = getRadialProgress(index);
                const randomProgress = orderIndex / Math.max(tileCount - 1, 1);
                const delay = 10 + randomProgress * 160 + radialProgress * 55;
                const isLingering = lingerIndex !== undefined;

                return {
                    id: index,
                    delay: `${Math.round(delay)}ms`,
                    fadeDuration: isLingering ? '180ms' : '80ms',
                    lingerDelay: isLingering ? `${160 + lingerIndex * 65}ms` : '0ms',
                    shade: DARK_GREEN_SHADES[orderIndex % DARK_GREEN_SHADES.length],
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
                    }}
                />
            ))}
        </div>
    );
};

export default IntroOverlay;
