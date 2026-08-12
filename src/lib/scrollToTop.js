let rafId = 0;
let onInterrupt = null;

const INTERRUPT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
const SCROLL_KEYS = new Set([
    ' ',
    'PageUp',
    'PageDown',
    'Home',
    'End',
    'ArrowUp',
    'ArrowDown',
]);

function detachInterrupts() {
    if (!onInterrupt) {
        return;
    }

    INTERRUPT_EVENTS.forEach((type) => {
        window.removeEventListener(type, onInterrupt);
    });
    onInterrupt = null;
}

export function cancelAnimatedScroll() {
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
    }
    detachInterrupts();
}

export function jumpToTop() {
    cancelAnimatedScroll();
    window.scrollTo(0, 0);
}

function easeSnappyRamp(t) {
    if (t < 0.2) {
        const u = t / 0.2;
        return 0.14 * u * u;
    }

    const u = (t - 0.2) / 0.8;
    return 0.14 + 0.86 * (1 - (1 - u) ** 4);
}

export function smoothScrollToTop() {
    cancelAnimatedScroll();

    const start = window.scrollY || document.documentElement.scrollTop || 0;
    if (start <= 1) {
        window.scrollTo(0, 0);
        return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo(0, 0);
        return;
    }

    const duration = Math.min(480, Math.max(220, Math.sqrt(start) * 16));
    const t0 = performance.now();

    onInterrupt = (event) => {
        if (event.type === 'keydown' && !SCROLL_KEYS.has(event.key)) {
            return;
        }
        cancelAnimatedScroll();
    };

    INTERRUPT_EVENTS.forEach((type) => {
        window.addEventListener(type, onInterrupt, { passive: true });
    });

    const tick = (now) => {
        const t = Math.min(1, (now - t0) / duration);
        window.scrollTo(0, start * (1 - easeSnappyRamp(t)));

        if (t < 1) {
            rafId = requestAnimationFrame(tick);
            return;
        }

        rafId = 0;
        window.scrollTo(0, 0);
        detachInterrupts();
    };

    rafId = requestAnimationFrame(tick);
}
