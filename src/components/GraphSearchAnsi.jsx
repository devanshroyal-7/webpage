import { useEffect, useState } from 'react';
import './GraphSearchAnsi.css';

const STEP_MS = 320;
const HOLD_MS = 1800;

const START = 'S';
const GOAL = 'H';

const EDGES = [
    ['S', 'A'],
    ['A', 'B'],
    ['S', 'C'],
    ['A', 'D'],
    ['B', 'E'],
    ['C', 'D'],
    ['D', 'E'],
    ['C', 'F'],
    ['D', 'G'],
    ['E', 'H'],
    ['F', 'G'],
    ['G', 'H'],
];

const POS = {
    S: [0, 0],
    A: [1, 0],
    B: [2, 0],
    C: [0, 1],
    D: [1, 1],
    E: [2, 1],
    F: [0, 2],
    G: [1, 2],
    H: [2, 2],
};

function neighbors(id) {
    const out = [];
    for (const [u, v] of EDGES) {
        if (u === id) out.push(v);
        if (v === id) out.push(u);
    }
    return out;
}

function heuristic(a, b) {
    const [ax, ay] = POS[a];
    const [bx, by] = POS[b];
    return Math.abs(ax - bx) + Math.abs(ay - by);
}

function reconstructPath(cameFrom, goal) {
    const path = [goal];
    let cur = goal;
    while (cameFrom.has(cur)) {
        cur = cameFrom.get(cur);
        path.unshift(cur);
    }
    return path;
}

function buildFrames() {
    const open = [{ id: START, g: 0, f: heuristic(START, GOAL) }];
    const closed = new Set();
    const gScore = new Map([[START, 0]]);
    const cameFrom = new Map();
    const frames = [];

    const snap = (current, status, path = null) => {
        frames.push({
            current,
            open: open.map((n) => n.id),
            closed: [...closed],
            status,
            path,
        });
    };

    snap(START, 'INIT');

    while (open.length > 0) {
        open.sort((a, b) => a.f - b.f || a.g - b.g);
        const node = open.shift();

        if (closed.has(node.id)) continue;

        closed.add(node.id);
        snap(node.id, node.id === GOAL ? 'GOAL' : 'EXPAND');

        if (node.id === GOAL) {
            const path = reconstructPath(cameFrom, GOAL);
            snap(GOAL, 'PATH', path);
            break;
        }

        for (const nb of neighbors(node.id)) {
            if (closed.has(nb)) continue;
            const tentative = (gScore.get(node.id) ?? Infinity) + 1;
            if (tentative < (gScore.get(nb) ?? Infinity)) {
                cameFrom.set(nb, node.id);
                gScore.set(nb, tentative);
                const f = tentative + heuristic(nb, GOAL);
                const existing = open.find((n) => n.id === nb);
                if (existing) {
                    existing.g = tentative;
                    existing.f = f;
                } else {
                    open.push({ id: nb, g: tentative, f });
                }
            }
        }

        snap(node.id, 'FRONTIER');
    }

    return frames;
}

const FRAMES = buildFrames();

function cellClass(id, frame) {
    if (frame.path?.includes(id)) return 'gs-path';
    if (frame.current === id) return 'gs-current';
    if (frame.open.includes(id) && !frame.closed.includes(id)) return 'gs-open';
    if (frame.closed.includes(id)) return 'gs-closed';
    return 'gs-idle';
}

function glyph(id, frame) {
    if (frame.path?.includes(id)) return '◆';
    if (frame.current === id) return '◉';
    if (frame.open.includes(id) && !frame.closed.includes(id)) return '◎';
    if (frame.closed.includes(id)) return '●';
    if (id === START) return 'S';
    if (id === GOAL) return 'G';
    return '○';
}

function edgeClass(u, v, frame) {
    if (frame.path) {
        for (let i = 0; i < frame.path.length - 1; i += 1) {
            const a = frame.path[i];
            const b = frame.path[i + 1];
            if ((a === u && b === v) || (a === v && b === u)) return 'gs-path';
        }
    }
    if (frame.closed.includes(u) && frame.closed.includes(v)) return 'gs-closed';
    if (
        (frame.closed.includes(u) || frame.open.includes(u) || frame.current === u) &&
        (frame.closed.includes(v) || frame.open.includes(v) || frame.current === v)
    ) {
        return 'gs-open';
    }
    return 'gs-idle';
}

function NodeSpan({ id, frame }) {
    return <span className={cellClass(id, frame)}>{glyph(id, frame)}</span>;
}

function HEdge({ u, v, frame }) {
    return <span className={edgeClass(u, v, frame)}>───</span>;
}

function VEdge({ u, v, frame }) {
    return <span className={edgeClass(u, v, frame)}>│</span>;
}

function GraphFrame({ frame }) {
    return (
        <div className="gs-graph" aria-hidden="true">
            <div className="gs-row">
                <NodeSpan id="S" frame={frame} />
                <HEdge u="S" v="A" frame={frame} />
                <NodeSpan id="A" frame={frame} />
                <HEdge u="A" v="B" frame={frame} />
                <NodeSpan id="B" frame={frame} />
            </div>
            <div className="gs-row gs-vrow">
                <VEdge u="S" v="C" frame={frame} />
                <span className="gs-pad" />
                <VEdge u="A" v="D" frame={frame} />
                <span className="gs-pad" />
                <VEdge u="B" v="E" frame={frame} />
            </div>
            <div className="gs-row">
                <NodeSpan id="C" frame={frame} />
                <HEdge u="C" v="D" frame={frame} />
                <NodeSpan id="D" frame={frame} />
                <HEdge u="D" v="E" frame={frame} />
                <NodeSpan id="E" frame={frame} />
            </div>
            <div className="gs-row gs-vrow">
                <VEdge u="C" v="F" frame={frame} />
                <span className="gs-pad" />
                <VEdge u="D" v="G" frame={frame} />
                <span className="gs-pad" />
                <VEdge u="E" v="H" frame={frame} />
            </div>
            <div className="gs-row">
                <NodeSpan id="F" frame={frame} />
                <HEdge u="F" v="G" frame={frame} />
                <NodeSpan id="G" frame={frame} />
                <HEdge u="G" v="H" frame={frame} />
                <NodeSpan id="H" frame={frame} />
            </div>
        </div>
    );
}

const GraphSearchAnsi = () => {
    const [frameIndex, setFrameIndex] = useState(0);
    const [reduceMotion] = useState(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    useEffect(() => {
        if (reduceMotion) {
            setFrameIndex(FRAMES.length - 1);
            return undefined;
        }

        const frame = FRAMES[frameIndex];
        const delay = frame.status === 'PATH' ? HOLD_MS : STEP_MS;

        const timer = window.setTimeout(() => {
            setFrameIndex((i) => (i + 1) % FRAMES.length);
        }, delay);

        return () => window.clearTimeout(timer);
    }, [frameIndex, reduceMotion]);

    const frame = FRAMES[frameIndex];
    const openList = frame.open.filter((id) => !frame.closed.includes(id));
    const pathStr = frame.path ? frame.path.join('→') : '—';

    return (
        <div
            className="graph-search-ansi"
            role="img"
            aria-label="Animated A-star graph search from S to H"
        >
            <div className="gs-header">
                <span className="gs-prompt">$</span> a* --graph 3x3 --h manhattan
            </div>
            <GraphFrame frame={frame} />
            <div className="gs-meta">
                <div>
                    <span className="gs-key">open</span>{' '}
                    <span className="gs-open">
                        [{openList.length ? openList.join(' ') : '∅'}]
                    </span>
                </div>
                <div>
                    <span className="gs-key">closed</span>{' '}
                    <span className="gs-closed">
                        [{frame.closed.length ? frame.closed.join(' ') : '∅'}]
                    </span>
                </div>
                <div>
                    <span className="gs-key">path</span>{' '}
                    <span className={frame.path ? 'gs-path' : 'gs-idle'}>{pathStr}</span>
                </div>
                <div className="gs-status">
                    <span className="gs-key">status</span>{' '}
                    <span className="gs-current">{frame.status}</span>
                    <span className="gs-cursor">_</span>
                </div>
            </div>
            <div className="gs-legend" aria-hidden="true">
                <span className="gs-open">◎ open</span>
                <span className="gs-closed">● closed</span>
                <span className="gs-current">◉ curr</span>
                <span className="gs-path">◆ path</span>
            </div>
        </div>
    );
};

export default GraphSearchAnsi;
