import { useEffect, useRef } from 'react';
import './WireframeCamshaft.css';

const TAU = Math.PI * 2;
const REST_CRANK = 28;
const CYCLE_DEG = 720;
const SCROLL_DEG_PER_PX = 0.7;
const IDLE_DEG_PER_MS = 360 / 14000;
const IDLE_DELAY_MS = 160;

const VB_W = 168;
const VB_H = 208;

const GEAR_X = 28;
const CYL_X = 108;
const CAM_Y = 34;
const CRANK_Y = 176;

const CAM_GEAR_R = 15;
const CRANK_GEAR_R = 11;
const BELT_PAD = 1.4;

const CYL_W = 46;
const CYL_WALL = 5.5;
const CYL_TOP = 68;
const CYL_BOT = 148;

const CRANK_R = 16;
const ROD_L = 56;
const PISTON_H = 26;
const PISTON_W = 34;
const PIN_INSET = 6;

const CAM_BASE = 7.2;
const CAM_NOSE = 6.4;
const CAM_STEPS = 48;
const CAM_RATIO = 0.5;
const VALVE_PHASE = 180;

const sprocketD = (teeth, rootR, tipR) => {
    const step = TAU / teeth;
    const parts = [];
    for (let i = 0; i < teeth; i += 1) {
        const a = i * step - Math.PI / 2;
        const p = (r, ang) =>
            `${(r * Math.cos(ang)).toFixed(2)} ${(r * Math.sin(ang)).toFixed(2)}`;
        parts.push(
            `${i === 0 ? 'M' : 'L'}${p(rootR, a)}`,
            `L${p(tipR, a + step * 0.18)}`,
            `L${p(tipR, a + step * 0.4)}`,
            `L${p(rootR, a + step * 0.56)}`,
        );
    }
    return `${parts.join(' ')} Z`;
};

const CAM_GEAR_D = sprocketD(18, 12.2, 15);
const CRANK_GEAR_D = sprocketD(12, 8.6, 11);

const camRadiusAt = (theta) => {
    const c = Math.cos(theta);
    const bump = c > 0 ? c ** 1.7 : 0;
    return CAM_BASE + CAM_NOSE * bump;
};

const CAM_D = (() => {
    const parts = [];
    for (let i = 0; i <= CAM_STEPS; i += 1) {
        const t = (i / CAM_STEPS) * TAU;
        const r = camRadiusAt(t);
        const x = r * Math.sin(t);
        const y = -r * Math.cos(t);
        parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return `${parts.join(' ')} Z`;
})();

const BELT_D = (() => {
    const r1 = CAM_GEAR_R + BELT_PAD;
    const r2 = CRANK_GEAR_R + BELT_PAD;
    const x = GEAR_X;
    return [
        `M ${x - r1} ${CAM_Y}`,
        `A ${r1} ${r1} 0 0 0 ${x + r1} ${CAM_Y}`,
        `L ${x + r2} ${CRANK_Y}`,
        `A ${r2} ${r2} 0 0 0 ${x - r2} ${CRANK_Y}`,
        'Z',
    ].join(' ');
})();

const CYL_D = (() => {
    const l = CYL_X - CYL_W / 2;
    const r = CYL_X + CYL_W / 2;
    const il = l + CYL_WALL;
    const ir = r - CYL_WALL;
    const t = CYL_TOP;
    const b = CYL_BOT;
    return [
        `M ${l} ${b}`,
        `V ${t + 6}`,
        `Q ${l} ${t} ${l + 6} ${t}`,
        `H ${r - 6}`,
        `Q ${r} ${t} ${r} ${t + 6}`,
        `V ${b}`,
        `H ${ir}`,
        `V ${t + CYL_WALL + 5}`,
        `Q ${ir} ${t + CYL_WALL} ${ir - 4} ${t + CYL_WALL}`,
        `H ${il + 4}`,
        `Q ${il} ${t + CYL_WALL} ${il} ${t + CYL_WALL + 5}`,
        `V ${b}`,
        'Z',
    ].join(' ');
})();

const COUNTERWEIGHT_D = [
    'M -11.5 2.5',
    `Q -14 ${CRANK_R * 0.5} 0 ${CRANK_R + 9}`,
    `Q 14 ${CRANK_R * 0.5} 11.5 2.5`,
    `Q 0 ${CRANK_R * 0.22} -11.5 2.5`,
    'Z',
].join(' ');

const valveLift = (camDeg) => {
    const alpha = ((camDeg + VALVE_PHASE) * Math.PI) / 180;
    const r = camRadiusAt(Math.PI - alpha);
    return Math.max(0, r - CAM_BASE);
};

const kinematics = (crankRad) => {
    const dx = CRANK_R * Math.sin(crankRad);
    const pinY = CRANK_Y - CRANK_R * Math.cos(crankRad);
    const drop = Math.sqrt(Math.max(1e-4, ROD_L * ROD_L - dx * dx));
    const pPinY = pinY - drop;
    return {
        pPinY,
        pTop: pPinY + PIN_INSET - PISTON_H,
        rodDeg: (Math.atan2(dx, drop) * 180) / Math.PI,
    };
};

const REST_CAM = REST_CRANK * CAM_RATIO;
const REST_STATE = kinematics((REST_CRANK * Math.PI) / 180);
const REST_LIFT = valveLift(REST_CAM);

const TAPPET_CLEAR = CAM_Y + CAM_BASE + 1;
const STEM = CYL_TOP + 2 - TAPPET_CLEAR;

const wrapCycle = (deg) => ((deg % CYCLE_DEG) + CYCLE_DEG) % CYCLE_DEG;

const WireframeCamshaft = ({ reduceMotion = false, paused = false }) => {
    const svgRef = useRef(null);
    const angleRef = useRef(REST_CRANK);

    useEffect(() => {
        const root = svgRef.current;
        if (!root) {
            return undefined;
        }

        const apply = (rawDeg) => {
            const crankDeg = wrapCycle(rawDeg);
            const crankRad = (crankDeg * Math.PI) / 180;
            const camDeg = crankDeg * CAM_RATIO;
            const k = kinematics(crankRad);

            root.querySelectorAll('[data-cam-spin]').forEach((el) => {
                const phase = Number(el.getAttribute('data-phase') || 0);
                el.setAttribute('transform', `rotate(${camDeg + phase})`);
            });

            root.querySelectorAll('[data-crank-spin]').forEach((el) => {
                el.setAttribute('transform', `rotate(${crankDeg})`);
            });

            root
                .querySelector('[data-piston]')
                ?.setAttribute('transform', `translate(${CYL_X} ${k.pTop})`);
            root.querySelector('[data-rod]')?.setAttribute(
                'transform',
                `translate(${CYL_X} ${k.pPinY}) rotate(${k.rodDeg})`,
            );
            root
                .querySelector('[data-valve]')
                ?.setAttribute('transform', `translate(0 ${valveLift(camDeg)})`);
        };

        apply(reduceMotion ? REST_CRANK : angleRef.current);

        if (reduceMotion) {
            return undefined;
        }

        let raf = 0;
        let lastTs = performance.now();
        let lastY = window.scrollY || document.documentElement.scrollTop || 0;
        let lastScrollAt = 0;

        const onScroll = () => {
            const y = window.scrollY || document.documentElement.scrollTop || 0;
            const dy = y - lastY;
            lastY = y;
            if (dy === 0) {
                return;
            }
            lastScrollAt = performance.now();
            angleRef.current += Math.abs(dy) * SCROLL_DEG_PER_PX;
            apply(angleRef.current);
        };

        const tick = (now) => {
            const dt = Math.min(48, now - lastTs);
            lastTs = now;

            if (!paused && !document.hidden && now - lastScrollAt > IDLE_DELAY_MS) {
                angleRef.current += dt * IDLE_DEG_PER_MS;
                apply(angleRef.current);
            }

            raf = window.requestAnimationFrame(tick);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        raf = window.requestAnimationFrame(tick);

        return () => {
            window.cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
        };
    }, [paused, reduceMotion]);

    return (
        <div
            className="wireframe-camshaft"
            role="img"
            aria-label="Semi-solid single-piston engine with its camshaft, valve, and crank"
        >
            <svg
                ref={svgRef}
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
            >
                <title>Single-piston camshaft</title>

                <path className="wf-cam-belt" d={BELT_D} />

                <g transform={`translate(${GEAR_X} ${CAM_Y})`}>
                    <g data-cam-spin="" data-phase="0" transform={`rotate(${REST_CAM})`}>
                        <path className="wf-cam-solid" d={CAM_GEAR_D} />
                        <circle className="wf-cam-core" r="8.4" />
                        <circle className="wf-cam-pin" r="3.4" />
                    </g>
                </g>

                <g transform={`translate(${GEAR_X} ${CRANK_Y})`}>
                    <g data-crank-spin="" transform={`rotate(${REST_CRANK})`}>
                        <path className="wf-cam-solid" d={CRANK_GEAR_D} />
                        <circle className="wf-cam-core" r="6.2" />
                        <circle className="wf-cam-pin" r="2.6" />
                    </g>
                </g>

                <path className="wf-cam-shaft" d={`M${GEAR_X + 10} ${CAM_Y - 3.1} H${CYL_X + 18} a3.1 3.1 0 0 1 0 6.2 H${GEAR_X + 10} Z`} />
                <path className="wf-cam-shaft" d={`M${GEAR_X + 10} ${CRANK_Y - 3.4} H${CYL_X + 18} a3.4 3.4 0 0 1 0 6.8 H${GEAR_X + 10} Z`} />

                <path className="wf-cam-shell" d={CYL_D} />

                <g
                    data-piston=""
                    transform={`translate(${CYL_X} ${REST_STATE.pTop})`}
                >
                    <rect
                        className="wf-cam-solid"
                        x={-PISTON_W / 2}
                        y="0"
                        width={PISTON_W}
                        height={PISTON_H}
                        rx="2.2"
                    />
                    <rect
                        className="wf-cam-core"
                        x={-PISTON_W / 2 + 1.6}
                        y="3.2"
                        width={PISTON_W - 3.2}
                        height="3.1"
                        rx="0.6"
                    />
                    <rect
                        className="wf-cam-core"
                        x={-PISTON_W / 2 + 1.6}
                        y="7.4"
                        width={PISTON_W - 3.2}
                        height="2.2"
                        rx="0.5"
                    />
                    <circle className="wf-cam-pin" cy={PISTON_H - PIN_INSET} r="3.1" />
                </g>

                <g
                    data-rod=""
                    transform={`translate(${CYL_X} ${REST_STATE.pPinY}) rotate(${REST_STATE.rodDeg})`}
                >
                    <rect
                        className="wf-cam-solid"
                        x="-3.4"
                        y="3"
                        width="6.8"
                        height={ROD_L - 6}
                        rx="2.2"
                    />
                    <circle className="wf-cam-solid" r="5.2" />
                    <circle className="wf-cam-pin" r="2.4" />
                    <circle className="wf-cam-solid" cy={ROD_L} r="5.6" />
                    <circle className="wf-cam-pin" cy={ROD_L} r="2.6" />
                </g>

                <g transform={`translate(${CYL_X} ${CRANK_Y})`}>
                    <g
                        data-crank-spin=""
                        transform={`rotate(${REST_CRANK})`}
                    >
                        <path className="wf-cam-solid" d={COUNTERWEIGHT_D} />
                        <rect
                            className="wf-cam-core"
                            x="-3.6"
                            y={-CRANK_R + 2}
                            width="7.2"
                            height={CRANK_R - 1}
                            rx="1.8"
                        />
                        <circle className="wf-cam-solid" cy={-CRANK_R} r="5.2" />
                        <circle className="wf-cam-pin" cy={-CRANK_R} r="2.5" />
                        <circle className="wf-cam-core" r="4.2" />
                        <circle className="wf-cam-pin" r="2.2" />
                    </g>
                </g>

                <g transform={`translate(${CYL_X} ${TAPPET_CLEAR})`}>
                    <g data-valve="" transform={`translate(0 ${REST_LIFT})`}>
                        <rect
                            className="wf-cam-solid"
                            x="-6.2"
                            y="-3"
                            width="12.4"
                            height="6"
                            rx="1.4"
                        />
                        <rect
                            className="wf-cam-core"
                            x="-1.7"
                            y="2.8"
                            width="3.4"
                            height={STEM - 2.4}
                            rx="1.2"
                        />
                        <path
                            className="wf-cam-solid"
                            d={`M-1.6 ${STEM} L-7.4 ${STEM + 4.2} H7.4 L1.6 ${STEM} Z`}
                        />
                    </g>
                </g>

                <g transform={`translate(${CYL_X} ${CAM_Y})`}>
                    <g
                        data-cam-spin=""
                        data-phase={VALVE_PHASE}
                        transform={`rotate(${REST_CAM + VALVE_PHASE})`}
                    >
                        <path className="wf-cam-lobe" d={CAM_D} />
                        <circle className="wf-cam-pin" r="2.4" />
                    </g>
                </g>
            </svg>
        </div>
    );
};

export default WireframeCamshaft;
