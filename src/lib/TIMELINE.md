# Homepage timeline

Scroll-animated career / milestone timeline at the bottom of Home.

## Edit content

All copy lives in **`src/lib/timeline.js`**.

```js
export const TIMELINE_ENABLED = true; // false hides the whole section

export const TIMELINE_META = {
  index: '03',
  label: 'TRAJECTORY.LOG',
  title: 'Path so far',
  subtitle: '…',
};

export const TIMELINE_ITEMS = [
  {
    id: 'unique-id',
    period: '2025 — Present',
    title: 'Role or milestone',
    org: 'Organization',
    location: 'City',
    summary: 'One or two sentences.',
    tags: ['Tag', 'Another'],
    href: 'https://optional-link.example', // makes the title a link
    accent: 'accent', // or 'hot' for the coral node color
  },
];
```

Add, remove, or reorder objects in `TIMELINE_ITEMS` — display order follows the array (newest first is typical).

## Files

| File | Role |
| --- | --- |
| `src/lib/timeline.js` | Content + enable flag |
| `src/components/Timeline.jsx` | Scroll observers + markup |
| `src/components/Timeline.css` | Motion + layout |

## Motion

- Header fades/slides in on scroll
- Spine fill + glow track scroll progress
- Entries blur/rise into place when they enter the viewport
- Active node pulses; tags stagger in
- Honors `prefers-reduced-motion`
