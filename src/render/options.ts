/**
 * Per-job render options.
 *
 * The renderer used to read `settings()` directly, which made every knob global:
 * one visitor picking a template would change it for the scheduler and for every
 * other visitor. These types make the knobs an explicit argument instead, with
 * the persisted store acting only as the *default* source, resolved at the call
 * site. Single-admin paths (CLI, TUI, panel, scheduler) pass nothing and behave
 * exactly as before; the public web app passes a validated per-request set.
 */
import { settings, type BasmalaMode, type Template, TEMPLATES, BASMALA_MODES } from '../store/store.js';

/** Knobs that affect which ayahs end up in the passage (stage 1, `buildReelJob`). */
export interface ContentOptions {
  /** Render the whole surah when it has this many ayahs or fewer. 0 = off. */
  fullSurahMaxAyahs: number;
  /** Cap recitation length in seconds (excluding outro). 0 = no limit. */
  maxDurationSeconds: number;
  /** Prepend the reciter's own Bismillah. */
  basmala: BasmalaMode;
}

/** Knobs that affect how the passage looks (stage 2, `renderReel`/`renderFrames`). */
export interface BrandingOptions {
  template: Template;
  watermarkEnabled: boolean;
  textFillColor: string;
  karaokeEnabled: boolean;
  particlesEnabled: boolean;
  bgAnimationEnabled: boolean;
  projectCreditEnabled: boolean;
}

export interface RenderOptions {
  content: ContentOptions;
  branding: BrandingOptions;
}

/**
 * `textFillColor` is interpolated RAW into the scene's <style> block (see
 * scene.ts), so an unvalidated value can close the tag and inject markup into a
 * page we then run in Chrome. Only a literal 6-digit hex is ever allowed
 * through; anything else falls back to white.
 */
export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function safeFillColor(v: unknown, fallback = '#ffffff'): string {
  return typeof v === 'string' && HEX_COLOR.test(v.trim()) ? v.trim().toLowerCase() : fallback;
}

/** Coerce arbitrary input to a known template (never a raw string). */
export function safeTemplate(v: unknown, fallback: Template = 'classic'): Template {
  return TEMPLATES.includes(v as Template) ? (v as Template) : fallback;
}

/** Coerce arbitrary input to a known basmala mode. */
export function safeBasmala(v: unknown, fallback: BasmalaMode = 'off'): BasmalaMode {
  return BASMALA_MODES.includes(v as BasmalaMode) ? (v as BasmalaMode) : fallback;
}

export function defaultContentOptions(): ContentOptions {
  const c = settings().content;
  return {
    fullSurahMaxAyahs: c.fullSurahMaxAyahs,
    maxDurationSeconds: c.maxDurationSeconds,
    basmala: safeBasmala(c.basmala),
  };
}

export function defaultBrandingOptions(): BrandingOptions {
  const b = settings().branding;
  return {
    template: safeTemplate(b.template),
    watermarkEnabled: b.watermarkEnabled,
    // Sanitized even on the admin path — the store is JSON on disk and a bad
    // hand-edit shouldn't be able to inject markup into the render page.
    textFillColor: safeFillColor(b.textFillColor),
    karaokeEnabled: b.karaokeEnabled,
    particlesEnabled: b.particlesEnabled,
    bgAnimationEnabled: b.bgAnimationEnabled,
    projectCreditEnabled: b.projectCreditEnabled,
  };
}

export function defaultRenderOptions(): RenderOptions {
  return { content: defaultContentOptions(), branding: defaultBrandingOptions() };
}
