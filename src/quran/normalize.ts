/**
 * alquran.cloud's `quran-uthmani` edition prepends the Basmala to the FIRST
 * ayah of every surah (except surah 1, where the Basmala IS ayah 1, and surah 9,
 * which has none). But everyayah's per-ayah audio for those first ayahs does NOT
 * include the Basmala recitation — so if we display the prepended text it desyncs
 * from the audio. We strip it and surface it separately as an untimed header.
 *
 * Matching by an exact literal is fragile (alef-wasla vs alef, superscript alef,
 * harakat ordering, NFC/NFD). So we compare on a diacritic-stripped, alef-folded
 * form of the first four whitespace tokens.
 */

/** Strip Arabic combining marks + tatweel, and fold alef variants → bare alef. */
function skeleton(token: string): string {
  return token
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿـ]/g, '') // harakat, superscript alef, Quranic annotation marks, tatweel
    .replace(/[آأإٱ]/g, 'ا'); // آ أ إ ٱ → ا
}

// Basmala skeleton, token by token: بسم الله الرحمن الرحيم
const BASMALA_SKELETON = ['بسم', 'الله', 'الرحمن', 'الرحيم'];

export interface StripResult {
  arabic: string;
  /** True if a leading Basmala was removed from this ayah. */
  strippedBasmala: boolean;
}

/**
 * Remove a leading Basmala from ayah-1 text when appropriate.
 * surah 1  → keep (Basmala is a real ayah)
 * surah 9  → no Basmala anyway
 * others   → strip the first four tokens from ayah 1 if they are the Basmala
 */
export function stripLeadingBasmala(surah: number, ayah: number, arabic: string): StripResult {
  if (ayah !== 1 || surah === 1 || surah === 9) {
    return { arabic, strippedBasmala: false };
  }
  const tokens = arabic.trim().split(/\s+/);
  if (tokens.length <= BASMALA_SKELETON.length) {
    return { arabic, strippedBasmala: false };
  }
  const leadMatches = BASMALA_SKELETON.every((w, i) => skeleton(tokens[i]) === w);
  if (!leadMatches) {
    return { arabic, strippedBasmala: false };
  }
  return { arabic: tokens.slice(BASMALA_SKELETON.length).join(' '), strippedBasmala: true };
}
