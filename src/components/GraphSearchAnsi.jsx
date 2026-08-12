import { useEffect, useState } from 'react';
import './GraphSearchAnsi.css';

const STEP_MS = 320;
const COMPACT_STEP_MS = 95;
const HOLD_MS = 1800;
const COMPACT_HOLD_MS = 1400;
const WRAP_MS = 420;

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

const GRID_COLS = 5;
const GRID_ROWS = 5;
const cellId = (c, r) => `${c},${r}`;
const parseCell = (id) => id.split(',').map(Number);

const BLOCKED = new Set([
    cellId(1, 0),
    cellId(4, 1),
    cellId(0, 3),
    cellId(3, 4),
]);

const isWalkable = (c, r) =>
    c >= 0 && r >= 0 && c < GRID_COLS && r < GRID_ROWS && !BLOCKED.has(cellId(c, r));

const gridNeighbors = (id) => {
    const [c, r] = parseCell(id);
    return [
        [c + 1, r],
        [c - 1, r],
        [c, r + 1],
        [c, r - 1],
    ]
        .filter(([x, y]) => isWalkable(x, y))
        .map(([x, y]) => cellId(x, y));
};

const GRID_EDGES = (() => {
    const edges = [];
    for (let r = 0; r < GRID_ROWS; r += 1) {
        for (let c = 0; c < GRID_COLS; c += 1) {
            if (!isWalkable(c, r)) continue;
            if (isWalkable(c + 1, r)) edges.push([cellId(c, r), cellId(c + 1, r)]);
            if (isWalkable(c, r + 1)) edges.push([cellId(c, r), cellId(c, r + 1)]);
        }
    }
    return edges;
})();

const GRID_NODES = (() => {
    const ids = [];
    for (let r = 0; r < GRID_ROWS; r += 1) {
        for (let c = 0; c < GRID_COLS; c += 1) {
            if (isWalkable(c, r)) ids.push(cellId(c, r));
        }
    }
    return ids;
})();

const gridHeuristic = (a, b) => {
    const [ac, ar] = parseCell(a);
    const [bc, br] = parseCell(b);
    return Math.abs(ac - bc) + Math.abs(ar - br);
};

const mulberry32 = (seed) => () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pickEpisodes = (count) => {
    const rng = mulberry32(20260312);
    const episodes = [];
    let guard = 0;
    while (episodes.length < count && guard < 400) {
        guard += 1;
        const start = GRID_NODES[Math.floor(rng() * GRID_NODES.length)];
        const goal = GRID_NODES[Math.floor(rng() * GRID_NODES.length)];
        if (start === goal || gridHeuristic(start, goal) < 5) continue;
        if (episodes.some((ep) => ep.start === start && ep.goal === goal)) continue;
        episodes.push({ start, goal });
    }
    if (episodes.length < count) {
        episodes.push(
            { start: cellId(0, 4), goal: cellId(4, 0) },
            { start: cellId(4, 4), goal: cellId(0, 0) },
            { start: cellId(0, 2), goal: cellId(4, 3) },
        );
    }
    return episodes.slice(0, count);
};

const buildGridFrames = (start, goal, episode) => {
    const open = [{ id: start, g: 0, f: gridHeuristic(start, goal) }];
    const closed = new Set();
    const gScore = new Map([[start, 0]]);
    const cameFrom = new Map();
    const frames = [];

    const snap = (current, status, path = null) => {
        frames.push({
            current,
            open: open.map((n) => n.id),
            closed: [...closed],
            status,
            path,
            start,
            goal,
            episode,
        });
    };

    snap(start, 'INIT');

    while (open.length > 0) {
        open.sort((a, b) => a.f - b.f || a.g - b.g);
        const node = open.shift();
        if (closed.has(node.id)) continue;

        closed.add(node.id);
        snap(node.id, node.id === goal ? 'GOAL' : 'EXPAND');

        if (node.id === goal) {
            snap(goal, 'PATH', reconstructPath(cameFrom, goal));
            break;
        }

        for (const nb of gridNeighbors(node.id)) {
            if (closed.has(nb)) continue;
            const tentative = (gScore.get(node.id) ?? Infinity) + 1;
            if (tentative < (gScore.get(nb) ?? Infinity)) {
                cameFrom.set(nb, node.id);
                gScore.set(nb, tentative);
                const f = tentative + gridHeuristic(nb, goal);
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
};

const EPISODES = pickEpisodes(3);
const COMPACT_FRAMES = [];
const EPISODE_STARTS = [];
EPISODES.forEach((ep, i) => {
    EPISODE_STARTS.push(COMPACT_FRAMES.length);
    COMPACT_FRAMES.push(...buildGridFrames(ep.start, ep.goal, i));
});

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

const NODE_R = 4.4;
const VB_W = 300;
const VB_H = 200;
const PAD = 22;

function gridXY(id) {
    const [c, r] = parseCell(id);
    const gw = (VB_W - PAD * 2) / (GRID_COLS - 1);
    const gh = (VB_H - PAD * 2) / (GRID_ROWS - 1);
    return [PAD + c * gw, PAD + r * gh];
}

function GraphVisual({ frame }) {
    return (
        <svg
            className="gs-visual"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
        >
            {GRID_EDGES.map(([u, v]) => {
                const [x1, y1] = gridXY(u);
                const [x2, y2] = gridXY(v);
                return (
                    <line
                        key={`${u}-${v}`}
                        className={`gs-svg-edge ${edgeClass(u, v, frame)}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                    />
                );
            })}
            {GRID_NODES.map((id) => {
                const [x, y] = gridXY(id);
                const cls = cellClass(id, frame);
                const isTerminal = id === frame.start || id === frame.goal;
                return (
                    <g key={id}>
                        <circle
                            className={`gs-svg-halo ${cls}`}
                            cx={x}
                            cy={y}
                            r={NODE_R + 5}
                        />
                        <circle
                            className={`gs-svg-node ${cls}`}
                            cx={x}
                            cy={y}
                            r={NODE_R}
                        />
                        {isTerminal ? (
                            <text className="gs-svg-label" x={x} y={y + NODE_R + 10}>
                                {id === frame.start ? 'S' : 'G'}
                            </text>
                        ) : null}
                    </g>
                );
            })}
        </svg>
    );
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

const GraphSearchAnsi = ({ compact = false, paused = false }) => {
    const frames = compact ? COMPACT_FRAMES : FRAMES;
    const [frameIndex, setFrameIndex] = useState(0);
    const [wrapping, setWrapping] = useState(false);
    const [reduceMotion] = useState(
        () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    useEffect(() => {
        if (reduceMotion) {
            setFrameIndex(
                Math.max(
                    0,
                    frames.reduce((acc, f, i) => (f.status === 'PATH' ? i : acc), 0),
                ),
            );
            setWrapping(false);
        }
    }, [frames, reduceMotion]);

    useEffect(() => {
        if (reduceMotion || paused || wrapping || !frames.length) {
            return undefined;
        }

        const frame = frames[frameIndex];
        const delay = frame.status === 'PATH'
            ? compact ? COMPACT_HOLD_MS : HOLD_MS
            : compact ? COMPACT_STEP_MS : STEP_MS;

        const timer = window.setTimeout(() => {
            if (compact && frame.status === 'PATH') {
                setWrapping(true);
            } else {
                setFrameIndex((i) => (i + 1) % frames.length);
            }
        }, delay);

        return () => window.clearTimeout(timer);
    }, [compact, frameIndex, frames, reduceMotion, paused, wrapping]);

    useEffect(() => {
        if (!wrapping) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            const frame = frames[frameIndex];
            const nextEpisode = ((frame?.episode ?? 0) + 1) % EPISODE_STARTS.length;
            setFrameIndex(compact ? EPISODE_STARTS[nextEpisode] : 0);
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => setWrapping(false));
            });
        }, WRAP_MS);

        return () => window.clearTimeout(timer);
    }, [compact, frameIndex, frames, wrapping]);

    const frame = frames[frameIndex] ?? frames[0];
    const openList = frame.open.filter((id) => !frame.closed.includes(id));
    const pathStr = frame.path ? frame.path.join('→') : '—';
    const className = [
        'graph-search-ansi',
        compact ? 'is-compact' : '',
        wrapping ? 'is-wrapping' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={className}
            role="img"
            aria-label={
                compact
                    ? 'Animated A-star search on a 4-connected grid with changing start and goal'
                    : 'Animated A-star graph search from S to H'
            }
        >
            {compact ? (
                <GraphVisual frame={frame} />
            ) : (
                <>
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
                </>
            )}
        </div>
    );
};

export default GraphSearchAnsi;
