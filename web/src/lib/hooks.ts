import { useCallback, useEffect, useState } from 'react';
import { getMeta, type Meta } from './api';

let metaPromise: Promise<Meta> | null = null;
let metaCache: Meta | null = null;

export type MetaState = {
  meta: Meta | null;
  /** True until the first attempt settles — the studio shows a skeleton. */
  loading: boolean;
  /** Set when the fetch failed, so the studio can offer a retry instead of
   *  rendering a form full of empty selects. */
  failed: boolean;
  retry: () => void;
};

/**
 * /api/meta drives the surah list, reciters, translations and the server's
 * limits. It is fetched once per page load and shared — several components need
 * it and it never changes while the tab is open.
 */
export function useMetaState(): MetaState {
  const [meta, setMeta] = useState<Meta | null>(metaCache);
  const [loading, setLoading] = useState(!metaCache);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (metaCache) return;
    let alive = true;
    setLoading(true);
    setFailed(false);
    metaPromise ??= getMeta();
    metaPromise
      .then((m) => {
        metaCache = m;
        if (!alive) return;
        setMeta(m);
        setLoading(false);
      })
      .catch(() => {
        // The rest of the page is static content and must still render; only
        // the studio depends on this.
        metaPromise = null;
        if (!alive) return;
        setLoading(false);
        setFailed(true);
      });
    return () => { alive = false; };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { meta, loading, failed, retry };
}

/** The data alone, for the parts of the page that simply hide when it is
 *  missing (the hero counters, the header's repo link). */
export function useMeta(): Meta | null {
  return useMetaState().meta;
}

/** Star count for the header badge. Null while loading, or if the repo is
 *  private / the API is rate-limited — callers hide the badge in that case. */
export function useGithubStars(repo: string | undefined): number | null {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    if (!repo) return;
    let alive = true;
    fetch(`https://api.github.com/repos/${repo}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { stargazers_count?: number } | null) => {
        if (alive && typeof d?.stargazers_count === 'number') setStars(d.stargazers_count);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [repo]);

  return stars;
}

/** True once the element has scrolled into view — used to defer the heavier
 *  canvas effects until they are actually on screen. */
export function useInView<T extends Element>(ref: React.RefObject<T | null>, rootMargin = '200px') {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setSeen(true),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen, rootMargin]);

  return seen;
}

/** `prefers-reduced-motion` as a boolean, so components can skip canvas work
 *  entirely rather than just shortening their transitions. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/**
 * Which section is currently in view, for the nav's sliding indicator.
 *
 * Uses a viewport band near the top rather than plain intersection: with
 * full-height sections, "is it intersecting" is true for several at once, and
 * the highlight flickers between them. Picking the section whose top is closest
 * to the reading line gives a single, stable answer.
 */
export function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const pick = () => {
      const line = window.innerHeight * 0.32;
      let best: string | null = null;
      let bestDist = Infinity;

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const { top, bottom } = el.getBoundingClientRect();
        if (bottom < 0 || top > window.innerHeight) continue;
        const dist = Math.abs(top - line);
        if (dist < bestDist) { bestDist = dist; best = id; }
      }
      setActive(best);
    };

    pick();
    window.addEventListener('scroll', pick, { passive: true });
    window.addEventListener('resize', pick);
    return () => {
      window.removeEventListener('scroll', pick);
      window.removeEventListener('resize', pick);
    };
  }, [ids]);

  return active;
}
