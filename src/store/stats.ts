import { listPosts } from './store.js';

export interface Stats {
  total: number;
  published: number;
  failed: number;
  week: number;
  byPlatform: Record<string, number>;
}

/** Aggregate stats from post history for the analytics view (panel + TUI). */
export function computeStats(): Stats {
  const posts = listPosts(2000);
  const weekAgo = Date.now() - 7 * 86400_000;
  const byPlatform: Record<string, number> = {};
  let published = 0, failed = 0, week = 0;
  for (const p of posts) {
    if (p.status === 'published') {
      published++;
      for (const pf of p.platforms ?? []) byPlatform[pf] = (byPlatform[pf] ?? 0) + 1;
    }
    if (p.status === 'failed') failed++;
    if (Date.parse(p.ts) >= weekAgo) week++;
  }
  return { total: posts.length, published, failed, week, byPlatform };
}
