/**
 * Load and parse markdown posts from src/posts/*.md
 *
 * Each file should start with YAML-like frontmatter:
 *
 * ---
 * title: My Post
 * date: 2026-08-10
 * snippet: Short preview for the blog list.
 * ---
 *
 * Markdown body goes here.
 */

const markdownFiles = import.meta.glob('../posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: raw.trim() };
  }

  const data = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  return { data, content: match[2].trim() };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function estimateReadTime(content) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function slugFromPath(path) {
  return path.split('/').pop().replace(/\.md$/, '');
}

const posts = Object.entries(markdownFiles)
  .map(([path, raw]) => {
    const { data, content } = parseFrontmatter(raw);
    const slug = data.slug || slugFromPath(path);

    return {
      slug,
      title: data.title || slug,
      date: data.date || '',
      displayDate: formatDate(data.date),
      snippet: data.snippet || '',
      readTime: data.readTime || estimateReadTime(content),
      content,
    };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));

export function getAllPosts() {
  return posts;
}

export function getPostBySlug(slug) {
  return posts.find((post) => post.slug === slug) || null;
}
