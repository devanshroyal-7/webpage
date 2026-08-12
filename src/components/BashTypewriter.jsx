import { useEffect, useState } from 'react';
import './BashTypewriter.css';

const TYPE_DELAY = 58;
const DELETE_DELAY = 32;
const HOLD_DELAY = 3000;
const NEXT_LINE_DELAY = 180;

/** Keys that have already typed once this page session (survives SPA remounts). */
const typedOnceKeys = new Set();
/** Pending marks deferred so React Strict Mode remounts don't skip the first animation. */
const pendingOnceMarks = new Map();

const BashTypewriter = ({
    phrases,
    cycle = false,
    className = '',
    startDelay = 0,
    onceKey = null,
}) => {
    const alreadyTyped = Boolean(onceKey && typedOnceKeys.has(onceKey));
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [visibleText, setVisibleText] = useState(
        () => (alreadyTyped ? phrases[0] : ''),
    );
    const [phase, setPhase] = useState(() => {
        if (alreadyTyped) return 'done';
        return startDelay > 0 ? 'waiting' : 'typing';
    });
    const [reduceMotion] = useState(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    const currentPhrase = phrases[phraseIndex];

    // Mark as typed when leaving the page, even mid-animation, so revisits show full text.
    useEffect(() => {
        if (!onceKey) {
            return undefined;
        }

        const pending = pendingOnceMarks.get(onceKey);
        if (pending !== undefined) {
            window.clearTimeout(pending);
            pendingOnceMarks.delete(onceKey);
        }

        return () => {
            const timer = window.setTimeout(() => {
                typedOnceKeys.add(onceKey);
                pendingOnceMarks.delete(onceKey);
            }, 0);
            pendingOnceMarks.set(onceKey, timer);
        };
    }, [onceKey]);

    useEffect(() => {
        if (reduceMotion || alreadyTyped) {
            setVisibleText(currentPhrase);
            setPhase('done');
            if (onceKey) typedOnceKeys.add(onceKey);
            return undefined;
        }

        let timer;

        if (phase === 'waiting') {
            timer = window.setTimeout(() => setPhase('typing'), startDelay);
        } else if (phase === 'typing') {
            if (visibleText.length < currentPhrase.length) {
                timer = window.setTimeout(() => {
                    setVisibleText(currentPhrase.slice(0, visibleText.length + 1));
                }, TYPE_DELAY);
            } else {
                if (onceKey) typedOnceKeys.add(onceKey);
                setPhase(cycle ? 'holding' : 'done');
            }
        } else if (phase === 'holding') {
            timer = window.setTimeout(() => setPhase('deleting'), HOLD_DELAY);
        } else if (phase === 'deleting') {
            if (visibleText.length > 0) {
                timer = window.setTimeout(() => {
                    setVisibleText((text) => text.slice(0, -1));
                }, DELETE_DELAY);
            } else {
                timer = window.setTimeout(() => {
                    setPhraseIndex((index) => (index + 1) % phrases.length);
                    setPhase('typing');
                }, NEXT_LINE_DELAY);
            }
        }

        return () => window.clearTimeout(timer);
    }, [
        alreadyTyped,
        currentPhrase,
        cycle,
        onceKey,
        phase,
        phrases.length,
        reduceMotion,
        startDelay,
        visibleText,
    ]);

    return (
        <p
            className={`bash-typewriter ${className}`.trim()}
            aria-label={cycle ? phrases.join(', ') : currentPhrase}
        >
            <span className="bash-typewriter-visual" aria-hidden="true">
                <span className="bash-prompt">&gt;</span>
                <span>{visibleText}</span>
                <span className="bash-cursor" />
            </span>
        </p>
    );
};

export default BashTypewriter;
