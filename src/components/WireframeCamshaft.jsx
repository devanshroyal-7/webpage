import { useEffect, useRef } from 'react';
import './WireframeCamshaft.css';

const TAU = Math.PI * 2;
const REST_DEG = 28;
const SCROLL_DEG_PER_PX = 0.7;

const VB_W = 300;
const VB_H = 168;
const PAD = 12;
const COS = 0.86;
const SIN = 0.4;

const SHAFT_X0 = -1.92;
const SHAFT_X1 = 1.92;
const SHAFT_R = 0.1;
const R_BASE = 0.205;
const R_NOSE = 0.17;
const N_CAM = 42;
const N_CYL = 28;

const JOURNALS = [
    { x: -1.62, w: 0.3, r: 0.148 },
    { x: 1.62, w: 0.3, r: 0.148 },
];

const LOBES = [
    { x: -0.78, w: 0.3, phase: (2 * TAU) / 3 },
    { x: 0.12, w: 0.3, phase: TAU / 3 },
    { x: 1.02, w: 0.3, phase: 0 },
];

const FOLLOWER = LOBES[2];

const isoRaw = ([x, y, z]) => ({
    x: (x - z) * COS,
    y: (x + z) * SIN - y,
});

const camRadius = (theta) => {
    const c = Math.cos(theta);
    const bump = c > 0 ? c ** 1.7 : 0;
    return R_BASE + R_NOSE * bump;
};

const ringYZ = (x, radiusAt, n) => {
    const pts = [];
    for (let i = 0; i < n; i += 1) {
        const a = (i / n) * TAU;
        const r = radiusAt(a);
        pts.push([x, r * Math.cos(a), r * Math.sin(a)]);
    }
    return pts;
};

const cylRing = (x, r, n = N_CYL) => ringYZ(x, () => r, n);

const camRing = (x, phase, phi, n = N_CAM) =>
    ringYZ(x, (a) => camRadius(a - phase - phi), n);

const wrapDeg = (deg) => ((deg % 360) + 360) % 360;

const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

const convexHull = (pts) => {
    const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
    if (p.length < 3) {
        return p;
    }
    const lower = [];
    p.forEach((pt) => {
        while (
            lower.length >= 2
            && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0
        ) {
            lower.pop();
        }
        lower.push(pt);
    });
    const upper = [];
    for (let i = p.length - 1; i >= 0; i -= 1) {
        const pt = p[i];
        while (
            upper.length >= 2
            && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0
        ) {
            upper.pop();
        }
        upper.push(pt);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
};

const worldPts = [];
const pushRing = (ring) => {
    ring.forEach((p) => worldPts.push(p));
};

pushRing(cylRing(SHAFT_X0, SHAFT_R));
pushRing(cylRing(SHAFT_X1, SHAFT_R));
JOURNALS.forEach((j) => {
    pushRing(cylRing(j.x - j.w / 2, j.r));
    pushRing(cylRing(j.x + j.w / 2, j.r));
});
LOBES.forEach((lobe) => {
    pushRing(camRing(lobe.x - lobe.w / 2, lobe.phase, 0));
    pushRing(camRing(lobe.x + lobe.w / 2, lobe.phase, 0));
});
worldPts.push(
    [FOLLOWER.x, R_BASE + R_NOSE + 0.58, 0],
    [JOURNALS[0].x, -0.54, 0.22],
    [JOURNALS[1].x, -0.54, -0.22],
);

const raw = worldPts.map(isoRaw);
const minX = Math.min(...raw.map((p) => p.x));
const maxX = Math.max(...raw.map((p) => p.x));
const minY = Math.min(...raw.map((p) => p.y));
const maxY = Math.max(...raw.map((p) => p.y));
const SCALE = Math.min(
    (VB_W - PAD * 2) / Math.max(maxX - minX, 1e-6),
    (VB_H - PAD * 2) / Math.max(maxY - minY, 1e-6),
);
const OX = PAD - minX * SCALE;
const OY = PAD - minY * SCALE;

const project = (p) => {
    const r = isoRaw(p);
    return { x: OX + r.x * SCALE, y: OY + r.y * SCALE };
};

const dScreen = (pts, close = false) => {
    const s = pts
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
        .join(' ');
    return close ? `${s} Z` : s;
};

const dWorld = (pts, close = false) => dScreen(pts.map(project), close);

const cylBody = (x0, x1, r) =>
    dScreen(
        convexHull([...cylRing(x0, r).map(project), ...cylRing(x1, r).map(project)]),
        true,
    );

const cylCap = (x, r) => dWorld(cylRing(x, r), true);

const boxFaces = (x0, y0, z0, x1, y1, z1) => ({
    top: dWorld(
        [
            [x0, y1, z0],
            [x1, y1, z0],
            [x1, y1, z1],
            [x0, y1, z1],
        ],
        true,
    ),
    front: dWorld(
        [
            [x1, y0, z0],
            [x1, y1, z0],
            [x1, y1, z1],
            [x1, y0, z1],
        ],
        true,
    ),
    side: dWorld(
        [
            [x0, y0, z1],
            [x1, y0, z1],
            [x1, y1, z1],
            [x0, y1, z1],
        ],
        true,
    ),
});

const PEDESTAL_Y0 = -0.52;
const PEDESTAL_Y1 = -0.17;
const PEDESTALS = JOURNALS.map((j) =>
    boxFaces(j.x - 0.17, PEDESTAL_Y0, -0.2, j.x + 0.17, PEDESTAL_Y1, 0.2),
);

const SHAFT_BODY = cylBody(SHAFT_X0, SHAFT_X1, SHAFT_R);
const SHAFT_CAP = cylCap(SHAFT_X1, SHAFT_R);
const JOURNAL_PATHS = JOURNALS.map((j) => ({
    body: cylBody(j.x - j.w / 2, j.x + j.w / 2, j.r),
    cap: cylCap(j.x + j.w / 2, j.r),
}));
const BORE = cylCap(SHAFT_X1, SHAFT_R * 0.42);

const lobePaths = (phi) =>
    LOBES.map((lobe) => {
        const far = camRing(lobe.x - lobe.w / 2, lobe.phase, phi);
        const near = camRing(lobe.x + lobe.w / 2, lobe.phase, phi);
        return {
            body: dScreen(
                convexHull([...far.map(project), ...near.map(project)]),
                true,
            ),
            face: dWorld(near, true),
        };
    });

const followerPaths = (phi) => {
    const lift = camRadius(-phi - FOLLOWER.phase);
    const y0 = lift;
    const y1 = lift + 0.09;
    const pad = boxFaces(
        FOLLOWER.x - 0.15,
        y0,
        -0.13,
        FOLLOWER.x + 0.15,
        y1,
        0.13,
    );
    const stem = boxFaces(
        FOLLOWER.x - 0.045,
        y1,
        -0.045,
        FOLLOWER.x + 0.045,
        y1 + 0.42,
        0.045,
    );
    return { pad, stem };
};

const REST_PHI = (REST_DEG * Math.PI) / 180;
const REST_LOBES = lobePaths(REST_PHI);
const REST_FOLLOWER = followerPaths(REST_PHI);

const readScrollY = () => window.scrollY || document.documentElement.scrollTop || 0;

const degFromPage = () => REST_DEG + readScrollY() * SCROLL_DEG_PER_PX;

const WireframeCamshaft = ({ reduceMotion = false }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        const root = svgRef.current;
        if (!root) {
            return undefined;
        }

        const lobeBodies = LOBES.map((_, i) =>
            root.querySelector(`[data-lobe-body="${i}"]`),
        );
        const lobeFaces = LOBES.map((_, i) =>
            root.querySelector(`[data-lobe-face="${i}"]`),
        );
        const faceEls = {
            pad: {
                top: root.querySelector('[data-pad-top]'),
                front: root.querySelector('[data-pad-front]'),
                side: root.querySelector('[data-pad-side]'),
            },
            stem: {
                top: root.querySelector('[data-stem-top]'),
                front: root.querySelector('[data-stem-front]'),
                side: root.querySelector('[data-stem-side]'),
            },
        };

        const apply = (rawDeg) => {
            const phi = (wrapDeg(rawDeg) * Math.PI) / 180;
            const lobes = lobePaths(phi);
            const fol = followerPaths(phi);

            lobes.forEach((lobe, i) => {
                lobeBodies[i]?.setAttribute('d', lobe.body);
                lobeFaces[i]?.setAttribute('d', lobe.face);
            });

            const writeFaces = (els, faces) => {
                els.top?.setAttribute('d', faces.top);
                els.front?.setAttribute('d', faces.front);
                els.side?.setAttribute('d', faces.side);
            };

            writeFaces(faceEls.pad, fol.pad);
            writeFaces(faceEls.stem, fol.stem);
        };

        apply(reduceMotion ? REST_DEG : degFromPage());

        if (reduceMotion) {
            return undefined;
        }

        let raf = 0;
        let lastY = readScrollY();

        const tick = () => {
            const y = readScrollY();
            if (y !== lastY) {
                lastY = y;
                apply(degFromPage());
                raf = window.requestAnimationFrame(tick);
                return;
            }
            raf = 0;
        };

        const onScroll = () => {
            if (!raf) {
                raf = window.requestAnimationFrame(tick);
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        raf = window.requestAnimationFrame(tick);

        return () => {
            window.cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
        };
    }, [reduceMotion]);

    return (
        <div
            className="wireframe-camshaft"
            role="img"
            aria-label="Isometric camshaft with three lobes and a valve follower"
        >
            <svg
                ref={svgRef}
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
            >
                <title>Isometric camshaft</title>

                {PEDESTALS.map((p, i) => (
                    <g key={`pedestal-${i}`}>
                        <path className="wf-cam-side" d={p.side} />
                        <path className="wf-cam-front" d={p.front} />
                        <path className="wf-cam-top" d={p.top} />
                    </g>
                ))}

                <path className="wf-cam-shaft" d={SHAFT_BODY} />

                <g>
                    <path className="wf-cam-journal" d={JOURNAL_PATHS[0].body} />
                    <path className="wf-cam-core" d={JOURNAL_PATHS[0].cap} />
                </g>

                {REST_LOBES.map((lobe, i) => (
                    <g key={`lobe-${i}`}>
                        <path
                            className="wf-cam-solid"
                            data-lobe-body={i}
                            d={lobe.body}
                        />
                        <path
                            className="wf-cam-lobe"
                            data-lobe-face={i}
                            d={lobe.face}
                        />
                    </g>
                ))}

                <path
                    className="wf-cam-side"
                    data-pad-side=""
                    d={REST_FOLLOWER.pad.side}
                />
                <path
                    className="wf-cam-front"
                    data-pad-front=""
                    d={REST_FOLLOWER.pad.front}
                />
                <path
                    className="wf-cam-top"
                    data-pad-top=""
                    d={REST_FOLLOWER.pad.top}
                />
                <path
                    className="wf-cam-side"
                    data-stem-side=""
                    d={REST_FOLLOWER.stem.side}
                />
                <path
                    className="wf-cam-front"
                    data-stem-front=""
                    d={REST_FOLLOWER.stem.front}
                />
                <path
                    className="wf-cam-top"
                    data-stem-top=""
                    d={REST_FOLLOWER.stem.top}
                />

                <g>
                    <path className="wf-cam-journal" d={JOURNAL_PATHS[1].body} />
                    <path className="wf-cam-core" d={JOURNAL_PATHS[1].cap} />
                </g>
                <path className="wf-cam-core" d={SHAFT_CAP} />
                <path className="wf-cam-pin" d={BORE} />
            </svg>
        </div>
    );
};

export default WireframeCamshaft;
