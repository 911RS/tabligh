/**
 * The single intermediate representation the whole pipeline agrees on.
 * Every input path (curated everyayah, or later YouTube+AI) must produce a
 * TimedAyah[] with exact millisecond boundaries relative to the final,
 * concatenated recitation audio track.
 */
export interface TimedAyah {
  /** Surah number, 1..114 */
  surah: number;
  /** Ayah number within the surah */
  ayah: number;
  /** "surah:ayah" convenience key, e.g. "2:255" */
  key: string;
  /** Uthmani Arabic text WITH full tashkeel (shakl) */
  arabic: string;
  /** Translation in the configured edition's language (may be empty) */
  translation: string;
  /** Start offset in the concatenated audio, ms (inclusive) */
  startMs: number;
  /** End offset in the concatenated audio, ms (exclusive) */
  endMs: number;
  /** Path to this ayah's individual audio file on disk */
  audioFile: string;
  /** True if a leading Basmala was stripped from this ayah's displayed text. */
  strippedBasmala?: boolean;
  /**
   * Optional word-level timing for karaoke highlight (Quran.com segments or
   * forced alignment). Absent in the v1 curated/per-ayah path.
   */
  words?: WordSegment[];
}

export interface WordSegment {
  /** 0-based word index within the ayah */
  index: number;
  startMs: number;
  endMs: number;
}

/** Everything a single render job needs, after resolving config + fetching data. */
export interface ReelJob {
  surah: number;
  ayahFrom: number;
  ayahTo: number;
  reciter: string;
  translationEdition: string;
  /** Arabic surah name, e.g. "سُورَةُ الإِخْلَاصِ" */
  surahName: string;
  /** Transliterated surah name, e.g. "Al-Ikhlaas" */
  surahEnglishName: string;
  ayahs: TimedAyah[];
  /** Concatenated recitation audio for the whole passage */
  audioFile: string;
  /** Total audio duration in ms */
  durationMs: number;
  /**
   * True when a leading Basmala was stripped from ayah 1. The renderer may show
   * it as an untimed decorative header; the audio does not recite it.
   */
  hasBasmala: boolean;
  workDir: string;
}
