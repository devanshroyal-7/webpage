import GraphSearchAnsi from './GraphSearchAnsi';
import WireframeCamshaft from './WireframeCamshaft';
import ClaThermalLoop from './ClaThermalLoop';

/**
 * Named animations / diagrams for timeline entries.
 *
 * To add a new one:
 *   1. Create a component that accepts `{ paused, reduceMotion }`.
 *   2. Register it here.
 *   3. Set `visual: 'your-key'` on an item in `src/lib/timeline.js`.
 *
 * Items can also use a static image instead of a registered key:
 *   visual: { src: '/path/to/image.svg', alt: 'Description' }
 */
export const TIMELINE_VISUALS = {
    'graph-search': (props) => <GraphSearchAnsi compact {...props} />,
    'search-graph': (props) => <GraphSearchAnsi compact {...props} />,
    'cla-thermal': ClaThermalLoop,
    camshaft: WireframeCamshaft,
};

const TimelineVisualImage = ({ src, alt }) => (
    <img className="timeline-visual-image" src={src} alt={alt || ''} />
);

export const visualKeyOf = (visual) => {
    if (typeof visual === 'string') {
        return visual;
    }
    if (visual && typeof visual === 'object' && visual.id) {
        return visual.id;
    }
    return undefined;
};

export const hasTimelineVisual = (visual) => {
    if (!visual) {
        return false;
    }
    if (typeof visual === 'function') {
        return true;
    }
    if (typeof visual === 'string') {
        return Boolean(TIMELINE_VISUALS[visual]);
    }
    if (visual.src) {
        return true;
    }
    if (visual.component || visual.id) {
        return true;
    }
    return false;
};

/**
 * Renders whatever a timeline item put in `visual`:
 * a registry key, a React component, or `{ src, alt }` image.
 */
const TimelineVisual = ({ visual, paused, reduceMotion }) => {
    if (!visual) {
        return null;
    }

    if (typeof visual === 'function') {
        const Component = visual;
        return <Component paused={paused} reduceMotion={reduceMotion} />;
    }

    if (typeof visual === 'string') {
        const Component = TIMELINE_VISUALS[visual];
        return Component ? (
            <Component paused={paused} reduceMotion={reduceMotion} />
        ) : null;
    }

    if (visual.src) {
        return <TimelineVisualImage src={visual.src} alt={visual.alt} />;
    }

    const Component =
        typeof visual.component === 'string'
            ? TIMELINE_VISUALS[visual.component]
            : visual.component || TIMELINE_VISUALS[visual.id];

    if (!Component) {
        return null;
    }

    return (
        <Component
            paused={paused}
            reduceMotion={reduceMotion}
            {...(visual.props || {})}
        />
    );
};

export default TimelineVisual;
