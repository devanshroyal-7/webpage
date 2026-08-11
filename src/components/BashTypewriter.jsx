import { useEffect, useState } from 'react';
import './BashTypewriter.css';

const TYPE_DELAY = 58;
const DELETE_DELAY = 32;
const HOLD_DELAY = 3000;
const NEXT_LINE_DELAY = 180;

const BashTypewriter = ({
    phrases,
    cycle = false,
    className = '',
    startDelay = 0,
}) => {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [visibleText, setVisibleText] = useState('');
    const [phase, setPhase] = useState(
        () => (startDelay > 0 ? 'waiting' : 'typing'),
    );
    const [reduceMotion] = useState(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    const currentPhrase = phrases[phraseIndex];

    useEffect(() => {
        if (reduceMotion) {
            setVisibleText(currentPhrase);
            setPhase('done');
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
        currentPhrase,
        cycle,
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
