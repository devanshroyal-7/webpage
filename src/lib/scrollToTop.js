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

function easeSilkyRamp(t) {
    const t2 = t * t;
    return t2 * (10 + t * (-20 + t * (15 - 4 * t)));
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

    const duration = Math.min(980, Math.max(480, Math.sqrt(start) * 24));
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
        window.scrollTo(0, start * (1 - easeSilkyRamp(t)));

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
