/**
 * Homepage timeline content.
 *
 * Toggle with TIMELINE_ENABLED.
 * Add / remove / reorder entries in TIMELINE_ITEMS — Timeline renders
 * this list as-is. Each object is one event; copy is independent of the
 * optional visual overlay.
 *
 * Shape of each item:
 * {
 *   id: string,                 // unique key
 *   period: string,             // e.g. '2025 — Present'
 *   title: string,              // role or milestone
 *   org?: string,               // organization / school
 *   location?: string,
 *   summary?: string,           // short supporting sentence
 *   tags?: string[],            // optional mono chips
 *   href?: string,              // optional external link on the title
 *   accent?: 'accent' | 'hot',  // node color (default accent)
 *
 *   // Optional overlay. Default fit is contain: the visual scales to sit
 *   // fully inside the entry bounding box (no overflow/clip). Any of:
 *   visual?: string,            // key in TIMELINE_VISUALS
 *                               //   ('graph-search' | 'cla-thermal' | 'camshaft')
 *   visual?: { src, alt },      // static image
 *   visual?: Component,         // any React component ({ paused, reduceMotion })
 * }
 *
 * Register new animations in src/components/timelineVisuals.jsx.
 */

export const TIMELINE_ENABLED = true;

export const TIMELINE_META = {
    index: '03',
    label: 'TRAJECTORY.LOG',
    title: 'Path so far',
    subtitle: 'Milestones from campus labs to industrial R&D to robotics research.',
};

export const TIMELINE_ITEMS = [
    {
        id: 'cmu-ms',
        period: '2025 — Present',
        title: 'MS, Mechanical Engineering — Research',
        org: 'Carnegie Mellon University',
        location: 'Pittsburgh, PA',
        summary:
            'In the Search-Based Planning Lab with Prof. Maxim Likhachev, researching planners, grasping, and learning that stay reliable under real-world constraints.',
        tags: ['Planning', 'Manipulation', 'Learning'],
        href: 'https://www.ri.cmu.edu/robotics-groups/search-based-planning-laboratory/',
        accent: 'accent',
        visual: 'graph-search',
    },
    {
        id: 'mercedes',
        period: '2023 — 2025',
        title: 'CAE Analyst',
        org: 'Mercedes-Benz R&D',
        location: 'India',
        summary:
            'Built simulation workflows for mechanical systems — translating physical constraints into models that informed product decisions.',
        tags: ['Simulation', 'Automotive', 'CAE'],
        accent: 'hot',
        visual: 'cla-thermal',
    },
    {
        id: 'iitm',
        period: '2018 — 2023',
        title: 'Dual Degree, Engineering',
        org: 'IIT Madras',
        location: 'Chennai, India',
        summary:
            'Grounded in mechanical systems and computation; patented a camshaft mechanism along the way.',
        tags: ['Mechanics', 'Patent', 'Research'],
        accent: 'accent',
        visual: 'camshaft',
    },
];
