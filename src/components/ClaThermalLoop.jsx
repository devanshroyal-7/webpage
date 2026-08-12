import { useEffect, useRef } from 'react';
import './ClaThermalLoop.css';

const TAU = Math.PI * 2;
const PERIOD_MS = 14000;
const VB_W = 320;
const VB_H = 188;
const COS = 0.86;
const SIN = 0.4;

const COOL = '#7ec8ff';
const BATT = '#ff9a4a';
const MOTOR = '#ff5344';
const WARM = '#ff7a5c';

const FACE_W = { top: 0.32, front: 0.42, side: 0.24 };

const STATIC_ENV = {
    radiator: 0.82,
    battery: 0.42,
    motor: 0,
    cabinCool: 0.38,
    cabinHeat: 0,
};

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

const gate = (t, a, b, c, d) => {
    if (t < a || t > d) return 0;
    if (t < b) return smooth((t - a) / Math.max(b - a, 1e-6));
    if (t < c) return 1;
    return 1 - smooth((t - c) / Math.max(d - c, 1e-6));
};

const fadeEnds = (u) => {
    if (u < 0.14) return u / 0.14;
    if (u > 0.8) return (1 - u) / 0.2;
    return 1;
};

const isoRaw = ([x, y, z]) => ({
    x: (x - z) * COS,
    y: (x + z) * SIN - y,
});

const circlePts = (cx, cy, cz, r, axis, n) => {
    const pts = [];
    for (let i = 0; i <= n; i += 1) {
        const a = (i / n) * TAU;
        const c = Math.cos(a);
        const s = Math.sin(a);
        if (axis === 'z') pts.push([cx + r * c, cy + r * s, cz]);
        else if (axis === 'x') pts.push([cx, cy + r * s, cz + r * c]);
        else pts.push([cx + r * c, cy, cz + r * s]);
    }
    return pts;
};

const bezierPts = (p0, p1, p2, p3, n) => {
    const pts = [];
    for (let i = 0; i <= n; i += 1) {
        const t = i / n;
        const u = 1 - t;
        pts.push([
            u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
            u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
            u * u * u * p0[2] + 3 * u * u * t * p1[2] + 3 * u * t * t * p2[2] + t * t * t * p3[2],
        ]);
    }
    return pts;
};

const joinPts = (...parts) => {
    const out = [];
    parts.forEach((part) => {
        part.forEach((p) => {
            const prev = out[out.length - 1];
            if (prev && prev[0] === p[0] && prev[1] === p[1] && prev[2] === p[2]) {
                return;
            }
            out.push(p);
        });
    });
    return out;
};

const loftGeom = (stations) => {
    const first = stations[0];
    const last = stations[stations.length - 1];
    const mid = stations[Math.floor(stations.length / 2)];
    return {
        faces: {
            top: [
                ...stations.map((s) => [s.x, s.y1, s.z]),
                ...[...stations].reverse().map((s) => [s.x, s.y1, -s.z]),
            ],
            front: [
                [first.x, first.y0, first.z],
                [first.x, first.y1, first.z],
                [first.x, first.y1, -first.z],
                [first.x, first.y0, -first.z],
            ],
            side: [
                ...stations.map((s) => [s.x, s.y0, s.z]),
                ...[...stations].reverse().map((s) => [s.x, s.y1, s.z]),
            ],
        },
        edges: [
            stations.map((s) => [s.x, s.y1, s.z]),
            stations.map((s) => [s.x, s.y1, -s.z]),
            stations.map((s) => [s.x, s.y0, s.z]),
            stations.map((s) => [s.x, s.y0, -s.z]),
            [
                [first.x, first.y1, first.z],
                [first.x, first.y1, -first.z],
            ],
            [
                [mid.x, mid.y1, mid.z],
                [mid.x, mid.y1, -mid.z],
            ],
            [
                [last.x, last.y1, last.z],
                [last.x, last.y1, -last.z],
            ],
            [
                [first.x, first.y0, first.z],
                [first.x, first.y1, first.z],
                [first.x, first.y1, -first.z],
                [first.x, first.y0, -first.z],
                [first.x, first.y0, first.z],
            ],
            [
                [last.x, last.y0, last.z],
                [last.x, last.y1, last.z],
                [last.x, last.y1, -last.z],
                [last.x, last.y0, -last.z],
                [last.x, last.y0, last.z],
            ],
        ],
    };
};

const wheelArch = (axleX, z, r = 0.46) => {
    const pts = [];
    const a0 = (198 * Math.PI) / 180;
    const a1 = (-18 * Math.PI) / 180;
    for (let i = 0; i <= 8; i += 1) {
        const a = lerp(a0, a1, i / 8);
        pts.push([axleX + r * Math.cos(a), 0.32 + r * Math.sin(a), z]);
    }
    return pts;
};

const boxGeom = (x0, y0, z0, x1, y1, z1) => ({
    faces: {
        top: [
            [x0, y1, z0],
            [x1, y1, z0],
            [x1, y1, z1],
            [x0, y1, z1],
        ],
        front: [
            [x1, y0, z0],
            [x1, y1, z0],
            [x1, y1, z1],
            [x1, y0, z1],
        ],
        side: [
            [x0, y0, z1],
            [x1, y0, z1],
            [x1, y1, z1],
            [x0, y1, z1],
        ],
    },
    edges: [
        [
            [x0, y1, z0],
            [x1, y1, z0],
        ],
        [
            [x1, y1, z0],
            [x1, y1, z1],
        ],
        [
            [x1, y1, z1],
            [x0, y1, z1],
        ],
        [
            [x0, y1, z1],
            [x0, y1, z0],
        ],
        [
            [x1, y0, z1],
            [x1, y1, z1],
        ],
        [
            [x1, y0, z0],
            [x1, y1, z0],
        ],
        [
            [x0, y0, z1],
            [x0, y1, z1],
        ],
        [
            [x1, y0, z0],
            [x1, y0, z1],
        ],
        [
            [x0, y0, z1],
            [x1, y0, z1],
        ],
    ],
});

const FX = 1.36;
const RX = -1.28;
const WR = 0.38;
const TRACK = 0.82;
const HALF = 0.9;

const sideBow = (sign) => {
    const z = HALF * sign;
    const zr = 0.5 * sign;
    return joinPts(
        bezierPts(
            [2.16, 0.1, 0.7 * sign],
            [2.4, 0.16, 0.38 * sign],
            [2.44, 0.44, 0.2 * sign],
            [2.26, 0.64, 0.58 * sign],
            7,
        ),
        bezierPts(
            [2.26, 0.64, 0.58 * sign],
            [1.78, 0.7, z],
            [1.12, 0.72, z],
            [0.7, 0.78, 0.8 * sign],
            6,
        ),
        bezierPts(
            [0.7, 0.78, 0.8 * sign],
            [0.34, 1.1, 0.62 * sign],
            [0.02, 1.32, zr],
            [-0.38, 1.38, zr],
            7,
        ),
        bezierPts(
            [-0.38, 1.38, zr],
            [-0.98, 1.36, zr],
            [-1.42, 1.2, zr],
            [-1.74, 0.96, 0.56 * sign],
            7,
        ),
        bezierPts(
            [-1.74, 0.96, 0.56 * sign],
            [-2.0, 0.74, 0.74 * sign],
            [-2.16, 0.48, 0.8 * sign],
            [-2.2, 0.22, 0.68 * sign],
            6,
        ),
    );
};

const sideLower = (sign) => {
    const z = HALF * sign;
    const frontArch = [...wheelArch(FX, z)].reverse();
    const rearArch = [...wheelArch(RX, z)].reverse();
    return [
        [2.16, 0.1, 0.7 * sign],
        [1.92, 0.1, 0.82 * sign],
        ...frontArch,
        [FX - 0.5, 0.1, z],
        [RX + 0.5, 0.1, z],
        ...rearArch,
        [-1.92, 0.1, 0.82 * sign],
        [-2.2, 0.12, 0.68 * sign],
    ];
};

const dlo = (sign) =>
    joinPts(
        bezierPts(
            [0.66, 0.8, 0.78 * sign],
            [0.32, 1.12, 0.56 * sign],
            [-0.02, 1.3, 0.5 * sign],
            [-0.42, 1.32, 0.48 * sign],
            6,
        ),
        bezierPts(
            [-0.42, 1.32, 0.48 * sign],
            [-0.98, 1.26, 0.48 * sign],
            [-1.34, 1.04, 0.54 * sign],
            [-1.6, 0.78, 0.7 * sign],
            6,
        ),
        [
            [-1.6, 0.78, 0.7 * sign],
            [0.66, 0.8, 0.78 * sign],
        ],
    );

const lamp = (sign) => [
    [2.28, 0.54, 0.18 * sign],
    [2.2, 0.58, 0.5 * sign],
    [2.04, 0.56, 0.78 * sign],
    [2.02, 0.5, 0.76 * sign],
    [2.18, 0.48, 0.46 * sign],
    [2.28, 0.5, 0.16 * sign],
];

const RAD = boxGeom(1.92, 0.22, -0.38, 2.16, 0.64, 0.38);
const BATT_BOX = boxGeom(-0.98, 0.12, -0.68, 1.08, 0.3, 0.68);
const MOTOR_BOX = boxGeom(-1.56, 0.18, -0.3, -1.14, 0.52, 0.3);
const CABIN = loftGeom([
    { x: 0.72, y0: 0.5, y1: 0.84, z: 0.7 },
    { x: 0.32, y0: 0.5, y1: 1.2, z: 0.52 },
    { x: -0.16, y0: 0.5, y1: 1.34, z: 0.46 },
    { x: -0.78, y0: 0.5, y1: 1.28, z: 0.46 },
    { x: -1.32, y0: 0.5, y1: 1.04, z: 0.52 },
    { x: -1.62, y0: 0.5, y1: 0.76, z: 0.62 },
]);

const RAD_GRILL = [0.28, 0.5, 0.72].map((t) => {
    const y = lerp(0.24, 0.62, t);
    return [
        [2.16, y, -0.32],
        [2.16, y, 0.32],
    ];
});

const BATT_DIV = [1 / 3, 2 / 3].map((t) => {
    const x = lerp(-0.98, 1.08, t);
    return [
        [x, 0.3, -0.68],
        [x, 0.3, 0.68],
    ];
});

const AXLE = {
    near: circlePts(-1.35, 0.36, 0.52, 0.09, 'x', 14),
    far: circlePts(-1.35, 0.36, -0.52, 0.09, 'x', 14),
    longs: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((a) => [
        [-1.35 + 0.09 * Math.cos(a), 0.36 + 0.09 * Math.sin(a), -0.52],
        [-1.35 + 0.09 * Math.cos(a), 0.36 + 0.09 * Math.sin(a), 0.52],
    ]),
};

const FLOW = [
    [
        [2.78, 0.18, 0.28],
        [2.18, 0.22, 0.2],
    ],
    [
        [2.82, 0.28, 0],
        [2.18, 0.3, 0],
    ],
    [
        [2.78, 0.18, -0.28],
        [2.18, 0.22, -0.2],
    ],
];

const AIR = [];
[-0.32, -0.12, 0.12, 0.32].forEach((z, zi) => {
    [0.18, 0.28, 0.4].forEach((y, yi) => {
        const i = zi * 3 + yi;
        AIR.push({
            a: [2.82, y, z],
            b: [2.06, y + 0.08, z * 0.65],
            off: (i * 0.19) % 1,
            r: 1.15 + (i % 3) * 0.18,
        });
    });
});

const makeWisp = (origin, seed, len) => {
    const pts = [];
    for (let i = 0; i < 5; i += 1) {
        const s = i / 4;
        const sway = Math.sin(s * 5.1 + seed) * 0.05;
        pts.push([
            origin[0] + sway,
            origin[1] + s * len,
            origin[2] + sway * 0.42,
        ]);
    }
    return { origin, pts, seed, len };
};

const BATT_WISPS = [
    [-0.62, 0.3, 0.32],
    [-0.22, 0.3, -0.28],
    [0.28, 0.3, 0.38],
    [0.68, 0.3, -0.22],
    [-0.42, 0.3, -0.42],
    [0.08, 0.3, 0.12],
    [0.48, 0.3, 0.42],
    [-0.72, 0.3, 0.06],
    [0.88, 0.3, -0.08],
    [-0.08, 0.3, -0.5],
].map((p, i) => makeWisp(p, i * 1.3, 0.2));

const MOTOR_WISPS = [
    [-1.34, 0.52, 0.12],
    [-1.26, 0.5, -0.16],
    [-1.44, 0.48, 0.04],
    [-1.2, 0.52, 0.22],
    [-1.4, 0.46, -0.22],
    [-1.32, 0.52, -0.04],
    [-1.5, 0.44, 0.16],
    [-1.16, 0.48, -0.1],
].map((p, i) => makeWisp(p, i * 0.9 + 2, 0.22));

const CABIN_COOL = [
    [0.48, 1.12, 0.2],
    [0.12, 1.28, -0.14],
    [-0.18, 1.32, 0.16],
    [-0.7, 1.24, -0.18],
    [-1.18, 1.06, 0.14],
    [0.28, 1.04, -0.28],
    [-0.42, 1.3, 0.06],
    [-0.92, 1.16, 0.24],
].map((p, i) => ({
    a: p,
    b: [p[0] * 0.72, 0.56, p[2] * 0.82],
    off: (i * 0.21) % 1,
}));

const CABIN_HEAT = [
    [-0.2, 0.52, 0.16],
    [0.22, 0.52, -0.14],
    [0.48, 0.54, 0.08],
    [-0.72, 0.52, -0.18],
].map((p, i) => makeWisp(p, i * 1.7 + 4, 0.18));

const STAR_C = [2.36, 0.46, 0];
const STAR_R = 0.12;
const STAR_ARMS = [0, 120, 240].map((deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [
        STAR_C,
        [
            STAR_C[0],
            STAR_C[1] + STAR_R * Math.cos(a),
            STAR_C[2] + STAR_R * Math.sin(a),
        ],
    ];
});

const SAMPLE_PTS = [
    ...sideBow(1),
    ...sideBow(-1),
    [2.86, 0.3, 0],
    [-2.24, 0.12, 0],
    [-0.38, 1.5, 0],
    [FX, 0, TRACK],
    [RX, 0, -TRACK],
];

const RAW = SAMPLE_PTS.map(isoRaw);
const minX = Math.min(...RAW.map((p) => p.x));
const maxX = Math.max(...RAW.map((p) => p.x));
const minY = Math.min(...RAW.map((p) => p.y));
const maxY = Math.max(...RAW.map((p) => p.y));
const PAD_L = 30;
const PAD_R = 14;
const PAD_T = 18;
const PAD_B = 12;
const SCALE = Math.min(
    (VB_W - PAD_L - PAD_R) / (maxX - minX),
    (VB_H - PAD_T - PAD_B) / (maxY - minY),
);
const OX = PAD_L - minX * SCALE;
const OY = PAD_T - minY * SCALE;

const project = (p) => {
    const r = isoRaw(p);
    return { x: OX + r.x * SCALE, y: OY + r.y * SCALE };
};

const dOf = (pts, close = false) => {
    const s = pts
        .map((p, i) => {
            const q = project(p);
            return `${i === 0 ? 'M' : 'L'}${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
        })
        .join(' ');
    return close ? `${s} Z` : s;
};

const shiftWisp = (wisp, u) => {
    const rise = 0.42 * u;
    const drift = 0.05 * u;
    return wisp.pts.map((p) =>
        project([p[0] + drift, p[1] + rise, p[2] + drift * 0.3]),
    );
};

const dPts = (screenPts) =>
    screenPts
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
        .join(' ');

const MOTOR_PULSE = project([-1.35, 0.38, 0]);

const SHELL = {
    nearBow: dOf(sideBow(1)),
    farBow: dOf(sideBow(-1)),
    nearLower: dOf(sideLower(1)),
    farLower: dOf(sideLower(-1)),
    nearDlo: dOf(dlo(1), true),
    farDlo: dOf(dlo(-1), true),
    nearLamp: dOf(lamp(1), true),
    farLamp: dOf(lamp(-1), true),
    shield: dOf(
        [
            [2.3, 0.28, 0.36],
            [2.36, 0.34, 0.44],
            [2.36, 0.56, 0.44],
            [2.3, 0.64, 0.32],
            [2.3, 0.64, -0.32],
            [2.36, 0.56, -0.44],
            [2.36, 0.34, -0.44],
            [2.3, 0.28, -0.36],
        ],
        true,
    ),
    starRing: dOf(circlePts(STAR_C[0], STAR_C[1], STAR_C[2], STAR_R, 'x', 18), true),
    starArms: STAR_ARMS.map((pts) => dOf(pts)),
    intake: dOf(
        [
            [2.28, 0.1, 0.5],
            [2.36, 0.16, 0.26],
            [2.36, 0.16, -0.26],
            [2.28, 0.1, -0.5],
        ],
        true,
    ),
    windshield: dOf([
        [0.7, 0.78, HALF],
        [0.02, 1.32, 0.5],
        [0.02, 1.32, -0.5],
        [0.7, 0.78, -HALF],
    ]),
    roofRear: dOf([
        [-1.42, 1.2, 0.5],
        [-1.42, 1.2, -0.5],
    ]),
    tailBar: dOf([
        [-2.16, 0.48, 0.8],
        [-2.22, 0.42, 0],
        [-2.16, 0.48, -0.8],
    ]),
    rearBumper: dOf([
        [-2.2, 0.12, 0.68],
        [-2.24, 0.1, 0],
        [-2.2, 0.12, -0.68],
    ]),
    noseUpper: dOf([
        [2.26, 0.64, 0.58],
        [2.34, 0.6, 0],
        [2.26, 0.64, -0.58],
    ]),
    noseLower: dOf([
        [2.16, 0.1, 0.7],
        [2.38, 0.12, 0],
        [2.16, 0.1, -0.7],
    ]),
    hood: dOf([
        [2.34, 0.6, 0],
        [0.78, 0.76, 0],
    ]),
    roof: dOf([
        [0.02, 1.34, 0],
        [-0.38, 1.4, 0],
        [-0.98, 1.36, 0],
        [-1.42, 1.22, 0],
    ]),
    beltNear: dOf([
        [2.04, 0.54, 0.84],
        [0.2, 0.5, 0.9],
        [-1.7, 0.52, 0.82],
    ]),
    beltFar: dOf([
        [2.04, 0.54, -0.84],
        [0.2, 0.5, -0.9],
        [-1.7, 0.52, -0.82],
    ]),
};

const WHEELS = [1, -1].flatMap((sign) =>
    [FX, RX].map((axle) => ({
        outer: dOf(circlePts(axle, WR, TRACK * sign, WR, 'z', 18), true),
        hub: dOf(circlePts(axle, WR, TRACK * sign, WR * 0.34, 'z', 10), true),
        spokes: Array.from({ length: 5 }, (_, i) => {
            const a = -Math.PI / 2 + (i / 5) * TAU;
            return dOf([
                [
                    axle + WR * 0.12 * Math.cos(a),
                    WR + WR * 0.12 * Math.sin(a),
                    TRACK * sign,
                ],
                [
                    axle + WR * 0.72 * Math.cos(a),
                    WR + WR * 0.72 * Math.sin(a),
                    TRACK * sign,
                ],
            ]);
        }),
        far: sign < 0,
    })),
);

const COMPS = {
    radiator: {
        geom: RAD,
        extras: RAD_GRILL,
        fill: 'cla-fill cla-fill-cool',
    },
    battery: {
        geom: BATT_BOX,
        extras: BATT_DIV,
        fill: 'cla-fill cla-fill-batt',
    },
    motor: {
        geom: MOTOR_BOX,
        extras: [],
        fill: 'cla-fill cla-fill-motor',
        closedExtras: [AXLE.near, AXLE.far],
        openExtras: AXLE.longs,
    },
    cabin: {
        geom: CABIN,
        extras: [],
        fill: 'cla-fill',
    },
};

const envAt = (t) => ({
    radiator: gate(t, 0.05, 0.11, 0.24, 0.34),
    battery: gate(t, 0.22, 0.3, 0.44, 0.54),
    motor: gate(t, 0.42, 0.5, 0.64, 0.74),
    cabinCool: gate(t, 0.6, 0.66, 0.74, 0.86),
    cabinHeat: gate(t, 0.74, 0.78, 0.82, 0.92),
});

const setFills = (nodes, amount) => {
    nodes.forEach((el) => {
        const face = el.getAttribute('data-face') || 'top';
        el.style.fillOpacity = String((FACE_W[face] || 0.2) * amount);
    });
};

const setWires = (nodes, amount, color) => {
    nodes.forEach((el) => {
        if (amount > 0.04) {
            el.style.stroke = color;
            el.style.strokeOpacity = String(0.36 + 0.64 * amount);
        } else {
            el.style.stroke = '#d5dbd4';
            el.style.strokeOpacity = '0.22';
        }
    });
};

const ClaThermalLoop = ({ paused = false, reduceMotion = false }) => {
    const svgRef = useRef(null);
    const timeRef = useRef(0);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) {
            return undefined;
        }

        const fills = {
            radiator: [...svg.querySelectorAll('[data-fill="radiator"]')],
            battery: [...svg.querySelectorAll('[data-fill="battery"]')],
            motor: [...svg.querySelectorAll('[data-fill="motor"]')],
            cabinCool: [...svg.querySelectorAll('[data-fill="cabin-cool"]')],
            cabinHeat: [...svg.querySelectorAll('[data-fill="cabin-heat"]')],
        };
        const wires = {
            radiator: [...svg.querySelectorAll('[data-wire="radiator"]')],
            battery: [...svg.querySelectorAll('[data-wire="battery"]')],
            motor: [...svg.querySelectorAll('[data-wire="motor"]')],
            cabin: [...svg.querySelectorAll('[data-wire="cabin"]')],
        };
        const airEls = [...svg.querySelectorAll('[data-air]')];
        const battEls = [...svg.querySelectorAll('[data-heat="battery"]')];
        const motorEls = [...svg.querySelectorAll('[data-heat="motor"]')];
        const coolEls = [...svg.querySelectorAll('[data-cool]')];
        const cabinHeatEls = [...svg.querySelectorAll('[data-heat="cabin"]')];
        const flowEls = [...svg.querySelectorAll('[data-flow]')];
        const pulseEls = [...svg.querySelectorAll('[data-pulse]')];

        const apply = (t) => {
            const env = t == null ? STATIC_ENV : envAt(t);
            const phase = t == null ? 0.22 : t;

            setFills(fills.radiator, env.radiator);
            setFills(fills.battery, env.battery);
            setFills(fills.motor, env.motor);
            setFills(fills.cabinCool, env.cabinCool);
            setFills(fills.cabinHeat, env.cabinHeat);

            setWires(wires.radiator, env.radiator, COOL);
            setWires(wires.battery, env.battery, BATT);
            setWires(wires.motor, env.motor, MOTOR);
            const cabinAmt = Math.max(env.cabinCool, env.cabinHeat);
            const cabinColor =
                env.cabinHeat > env.cabinCool * 0.65 ? WARM : COOL;
            setWires(wires.cabin, cabinAmt, cabinColor);

            airEls.forEach((el, i) => {
                const spec = AIR[i];
                if (!spec) return;
                const u = (phase * 2.15 + spec.off) % 1;
                const p = project([
                    lerp(spec.a[0], spec.b[0], u),
                    lerp(spec.a[1], spec.b[1], u),
                    lerp(spec.a[2], spec.b[2], u),
                ]);
                el.setAttribute('cx', p.x.toFixed(2));
                el.setAttribute('cy', p.y.toFixed(2));
                el.style.fillOpacity = String(0.85 * fadeEnds(u) * env.radiator);
            });

            battEls.forEach((el, i) => {
                const spec = BATT_WISPS[i];
                if (!spec) return;
                const u = (phase * 1.55 + spec.seed * 0.11) % 1;
                el.setAttribute('d', dPts(shiftWisp(spec, u)));
                el.style.strokeOpacity = String(0.8 * fadeEnds(u) * env.battery);
            });

            motorEls.forEach((el, i) => {
                const spec = MOTOR_WISPS[i];
                if (!spec) return;
                const u = (phase * 1.7 + spec.seed * 0.09) % 1;
                el.setAttribute('d', dPts(shiftWisp(spec, u)));
                el.style.strokeOpacity = String(0.85 * fadeEnds(u) * env.motor);
            });

            coolEls.forEach((el, i) => {
                const spec = CABIN_COOL[i];
                if (!spec) return;
                const u = (phase * 1.35 + spec.off) % 1;
                const p = project([
                    lerp(spec.a[0], spec.b[0], u),
                    lerp(spec.a[1], spec.b[1], u),
                    lerp(spec.a[2], spec.b[2], u),
                ]);
                el.setAttribute('cx', p.x.toFixed(2));
                el.setAttribute('cy', p.y.toFixed(2));
                el.style.fillOpacity = String(0.7 * fadeEnds(u) * env.cabinCool);
            });

            cabinHeatEls.forEach((el, i) => {
                const spec = CABIN_HEAT[i];
                if (!spec) return;
                const u = (phase * 1.8 + spec.seed * 0.08) % 1;
                el.setAttribute('d', dPts(shiftWisp(spec, u)));
                el.style.strokeOpacity = String(0.75 * fadeEnds(u) * env.cabinHeat);
            });

            flowEls.forEach((el) => {
                el.style.strokeOpacity = String(0.55 * env.radiator);
                el.setAttribute(
                    'stroke-dashoffset',
                    String((-(phase * 42) % 40).toFixed(2)),
                );
            });

            pulseEls.forEach((el, i) => {
                const u = (phase * 2.2 + i * 0.5) % 1;
                const k = 1 + u * 0.55;
                el.setAttribute(
                    'transform',
                    `translate(${MOTOR_PULSE.x} ${MOTOR_PULSE.y}) scale(${k.toFixed(3)}) translate(${-MOTOR_PULSE.x} ${-MOTOR_PULSE.y})`,
                );
                el.style.strokeOpacity = String((1 - u) * 0.45 * env.motor);
            });
        };

        apply(reduceMotion ? null : timeRef.current / PERIOD_MS);

        if (reduceMotion || paused) {
            return undefined;
        }

        let raf = 0;
        let last = performance.now();
        const tick = (now) => {
            const dt = now - last;
            last = now;
            if (!document.hidden) {
                timeRef.current = (timeRef.current + dt) % PERIOD_MS;
                apply(timeRef.current / PERIOD_MS);
            }
            raf = window.requestAnimationFrame(tick);
        };
        raf = window.requestAnimationFrame(tick);
        return () => window.cancelAnimationFrame(raf);
    }, [paused, reduceMotion]);

    const boot = reduceMotion ? STATIC_ENV : envAt(0);

    const renderBox = (name, spec) => {
        const { geom } = spec;
        const extraOpen = spec.openExtras || spec.extras || [];
        const extraClosed = spec.closedExtras || [];
        const fillClass =
            name === 'cabin' ? undefined : spec.fill;
        return (
            <g key={name}>
                {name === 'cabin' ? (
                    <>
                        {Object.entries(geom.faces).map(([face, pts]) => (
                            <path
                                key={`cc-${face}`}
                                className="cla-fill cla-fill-cool"
                                data-fill="cabin-cool"
                                data-face={face}
                                d={dOf(pts, true)}
                                fillOpacity={
                                    (FACE_W[face] || 0.2) * boot.cabinCool
                                }
                            />
                        ))}
                        {Object.entries(geom.faces).map(([face, pts]) => (
                            <path
                                key={`ch-${face}`}
                                className="cla-fill cla-fill-warm"
                                data-fill="cabin-heat"
                                data-face={face}
                                d={dOf(pts, true)}
                                fillOpacity={
                                    (FACE_W[face] || 0.2) * boot.cabinHeat
                                }
                            />
                        ))}
                    </>
                ) : (
                    Object.entries(geom.faces).map(([face, pts]) => (
                        <path
                            key={`${name}-${face}`}
                            className={fillClass}
                            data-fill={name}
                            data-face={face}
                            d={dOf(pts, true)}
                            fillOpacity={(FACE_W[face] || 0.2) * boot[name]}
                        />
                    ))
                )}
                {geom.edges.map((edge, i) => (
                    <path
                        key={`${name}-e-${i}`}
                        className="cla-wire"
                        data-wire={name}
                        d={dOf(edge)}
                        strokeWidth="0.85"
                        strokeOpacity="0.22"
                    />
                ))}
                {extraOpen.map((pts, i) => (
                    <path
                        key={`${name}-x-${i}`}
                        className="cla-wire"
                        data-wire={name}
                        d={dOf(pts)}
                        strokeWidth="0.8"
                        strokeOpacity="0.22"
                    />
                ))}
                {extraClosed.map((pts, i) => (
                    <path
                        key={`${name}-c-${i}`}
                        className="cla-wire"
                        data-wire={name}
                        d={dOf(pts, true)}
                        strokeWidth="0.8"
                        strokeOpacity="0.22"
                    />
                ))}
            </g>
        );
    };

    return (
        <div
            className="cla-thermal"
            role="img"
            aria-label="Electric CLA thermal energy management: cooling pack, battery, drive motor, and cabin HVAC"
        >
            <svg
                ref={svgRef}
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                preserveAspectRatio="xMidYMid meet"
                fill="none"
                aria-hidden="true"
            >
                {renderBox('battery', COMPS.battery)}
                {renderBox('motor', COMPS.motor)}
                {renderBox('cabin', COMPS.cabin)}
                {renderBox('radiator', COMPS.radiator)}

                {WHEELS.filter((w) => w.far).map((w, i) => (
                    <g key={`wf-${i}`}>
                        <path className="cla-shell cla-far" d={w.outer} strokeWidth="0.8" />
                        <path className="cla-shell cla-far" d={w.hub} strokeWidth="0.55" />
                        {w.spokes.map((d, si) => (
                            <path
                                key={`wfs-${si}`}
                                className="cla-shell cla-far"
                                d={d}
                                strokeWidth="0.5"
                            />
                        ))}
                    </g>
                ))}

                <path className="cla-shell cla-far" d={SHELL.farBow} strokeWidth="0.8" />
                <path className="cla-shell cla-far" d={SHELL.farLower} strokeWidth="0.75" />
                <path className="cla-shell cla-far" d={SHELL.farDlo} strokeWidth="0.55" />
                <path className="cla-shell cla-far" d={SHELL.farLamp} strokeWidth="0.55" />
                <path className="cla-shell cla-far" d={SHELL.beltFar} strokeWidth="0.5" />

                <path className="cla-shell cla-cross" d={SHELL.shield} strokeWidth="0.7" />
                <path className="cla-shell cla-cross" d={SHELL.starRing} strokeWidth="0.65" />
                {SHELL.starArms.map((d, i) => (
                    <path
                        key={`star-${i}`}
                        className="cla-shell cla-cross"
                        d={d}
                        strokeWidth="0.65"
                    />
                ))}
                <path className="cla-shell cla-cross" d={SHELL.intake} strokeWidth="0.65" />
                <path className="cla-shell cla-cross" d={SHELL.noseUpper} strokeWidth="0.7" />
                <path className="cla-shell cla-cross" d={SHELL.noseLower} strokeWidth="0.65" />
                <path className="cla-shell cla-cross" d={SHELL.windshield} strokeWidth="0.65" />
                <path className="cla-shell cla-cross" d={SHELL.roofRear} strokeWidth="0.6" />
                <path className="cla-shell cla-cross" d={SHELL.tailBar} strokeWidth="0.7" />
                <path className="cla-shell cla-cross" d={SHELL.rearBumper} strokeWidth="0.65" />
                <path className="cla-shell cla-guide" d={SHELL.hood} strokeWidth="0.5" />
                <path className="cla-shell cla-guide" d={SHELL.roof} strokeWidth="0.5" />

                <path className="cla-shell cla-near" d={SHELL.nearBow} strokeWidth="0.85" />
                <path className="cla-shell cla-near" d={SHELL.nearLower} strokeWidth="0.8" />
                <path className="cla-shell cla-near" d={SHELL.nearDlo} strokeWidth="0.6" />
                <path className="cla-shell cla-near" d={SHELL.nearLamp} strokeWidth="0.6" />
                <path className="cla-shell cla-near" d={SHELL.beltNear} strokeWidth="0.55" />

                {WHEELS.filter((w) => !w.far).map((w, i) => (
                    <g key={`wn-${i}`}>
                        <path className="cla-shell cla-near" d={w.outer} strokeWidth="0.85" />
                        <path className="cla-shell cla-near" d={w.hub} strokeWidth="0.55" />
                        {w.spokes.map((d, si) => (
                            <path
                                key={`wns-${si}`}
                                className="cla-shell cla-near"
                                d={d}
                                strokeWidth="0.5"
                            />
                        ))}
                    </g>
                ))}

                {FLOW.map((pts, i) => (
                    <path
                        key={`flow-${i}`}
                        className="cla-flow"
                        data-flow=""
                        d={dOf(pts)}
                        strokeWidth="0.9"
                        strokeOpacity="0"
                    />
                ))}

                {AIR.map((spec, i) => {
                    const p = project(spec.a);
                    return (
                        <circle
                            key={`air-${i}`}
                            className="cla-air"
                            data-air={i}
                            cx={p.x}
                            cy={p.y}
                            r={spec.r}
                            fillOpacity="0"
                        />
                    );
                })}

                {BATT_WISPS.map((spec, i) => (
                    <path
                        key={`bh-${i}`}
                        className="cla-heat-batt"
                        data-heat="battery"
                        d={dPts(shiftWisp(spec, 0.2))}
                        strokeWidth="1.15"
                        strokeOpacity="0"
                    />
                ))}

                {MOTOR_WISPS.map((spec, i) => (
                    <path
                        key={`mh-${i}`}
                        className="cla-heat-motor"
                        data-heat="motor"
                        d={dPts(shiftWisp(spec, 0.2))}
                        strokeWidth="1.2"
                        strokeOpacity="0"
                    />
                ))}

                {CABIN_COOL.map((spec, i) => {
                    const p = project(spec.a);
                    return (
                        <circle
                            key={`cc-${i}`}
                            className="cla-air"
                            data-cool={i}
                            cx={p.x}
                            cy={p.y}
                            r="1.2"
                            fillOpacity="0"
                        />
                    );
                })}

                {CABIN_HEAT.map((spec, i) => (
                    <path
                        key={`chp-${i}`}
                        className="cla-heat-cabin"
                        data-heat="cabin"
                        d={dPts(shiftWisp(spec, 0.15))}
                        strokeWidth="1.1"
                        strokeOpacity="0"
                    />
                ))}

                <ellipse
                    className="cla-pulse"
                    data-pulse="0"
                    cx={MOTOR_PULSE.x}
                    cy={MOTOR_PULSE.y}
                    rx="11"
                    ry="7"
                    strokeWidth="0.9"
                    strokeOpacity="0"
                />
                <ellipse
                    className="cla-pulse"
                    data-pulse="1"
                    cx={MOTOR_PULSE.x}
                    cy={MOTOR_PULSE.y}
                    rx="11"
                    ry="7"
                    strokeWidth="0.9"
                    strokeOpacity="0"
                />
            </svg>
        </div>
    );
};

export default ClaThermalLoop;
