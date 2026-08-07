/**
 * Client for the public render API (src/web/app.ts).
 *
 * The server owns every limit, so this file deliberately does no validation of
 * its own beyond shaping the request — the UI shows what the server allows via
 * /api/meta rather than hard-coding a second copy of the rules.
 */

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Reciter {
  id: string;
  name: string;
  style?: string;
}

export interface Edition {
  id: string;
  name: string;
}

export interface LanguageGroup {
  code: string;
  language: string;
  editions: Edition[];
}

export interface Meta {
  surahs: Surah[];
  reciters: Reciter[];
  translations: LanguageGroup[];
  templates: string[];
  limits: {
    maxAyahs: number;
    maxDurationSeconds: number;
    ratePerHour: number;
    jobTtlMinutes: number;
  };
  queue: { queued: number; running: number; concurrency: number; queueMax: number };
  github: string;
  turnstileSiteKey: string;
}

export interface JobRequest {
  surah: number;
  ayahFrom: number;
  ayahTo: number;
  reciter: string;
  translationEdition: string;
  template: string;
  karaokeEnabled: boolean;
  particlesEnabled: boolean;
  bgAnimationEnabled: boolean;
  projectCreditEnabled: boolean;
  watermarkEnabled: boolean;
  watermarkHandle: string;
  textFillColor: string;
  basmala: string;
  backgroundSource: string;
  backgroundKeywords: string;
  turnstileToken?: string;
}

export interface JobResult {
  surahName: string;
  surahEnglishName: string;
  reciterName: string;
  ayahFrom: number;
  ayahTo: number;
  durationMs: number;
  sizeBytes: number;
  credit?: { source: string; author: string; url: string };
}

export interface JobView {
  id: string;
  state: 'queued' | 'running' | 'done' | 'failed';
  progress: number;
  stage: string;
  logs: string[];
  queuePosition: number;
  etaSeconds: number | null;
  result?: JobResult;
  error?: string;
  downloadUrl?: string;
  thumbUrl?: string;
  expiresInMinutes?: number;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (body as { error?: string }).error ?? `Request failed (${res.status})`,
      res.status,
      (body as { code?: string }).code,
    );
  }
  return body as T;
}

export const getMeta = (): Promise<Meta> => req<Meta>('/api/meta');

export const createJob = (input: JobRequest): Promise<{ id: string }> =>
  req<{ id: string }>('/api/jobs', { method: 'POST', body: JSON.stringify(input) });

export const getJob = (id: string): Promise<JobView> => req<JobView>(`/api/jobs/${id}`);

/**
 * Poll a job to completion. Backs off while queued (nothing is changing) and
 * polls tightly while rendering so the progress bar stays honest.
 */
export function pollJob(
  id: string,
  onUpdate: (j: JobView) => void,
  signal?: AbortSignal,
): Promise<JobView> {
  return new Promise((resolve, reject) => {
    let stopped = false;
    signal?.addEventListener('abort', () => { stopped = true; reject(new DOMException('aborted', 'AbortError')); });

    const tick = async () => {
      if (stopped) return;
      try {
        const job = await getJob(id);
        if (stopped) return;
        onUpdate(job);
        if (job.state === 'done' || job.state === 'failed') return resolve(job);
        setTimeout(tick, job.state === 'running' ? 900 : 2200);
      } catch (e) {
        if (!stopped) reject(e);
      }
    };
    void tick();
  });
}

export const formatBytes = (n: number): string =>
  n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

export const formatDuration = (ms: number): string => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
};
