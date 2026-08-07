import { env } from '../config.js';
import { stripLeadingBasmala } from './normalize.js';

/** One ayah's textual content before timing is attached. */
export interface AyahText {
  surah: number;
  ayah: number;
  key: string;
  arabic: string;
  translation: string;
  /** True if a leading Basmala was stripped from this ayah's text. */
  strippedBasmala?: boolean;
}

interface AqcEdition {
  text: string;
  numberInSurah: number;
  edition: { identifier: string; type: string; language: string };
}

/**
 * Fetch Uthmani Arabic (with full shakl) + a translation for one ayah.
 * Uses alquran.cloud's multi-edition endpoint (one HTTP call, both editions).
 * If translationEdition is '', only Arabic is fetched.
 */
async function fetchAyah(
  surah: number,
  ayah: number,
  translationEdition: string,
): Promise<AyahText> {
  const editions = translationEdition
    ? `quran-uthmani,${translationEdition}`
    : 'quran-uthmani';
  const url = `${env.quranApiBase}/ayah/${surah}:${ayah}/editions/${editions}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Quran API ${res.status} for ${surah}:${ayah} (${url})`);
  }
  const body = (await res.json()) as { code: number; data: AqcEdition[] };
  if (body.code !== 200 || !Array.isArray(body.data)) {
    throw new Error(`Quran API bad payload for ${surah}:${ayah}`);
  }

  // Strip BOM / zero-width chars that occasionally lead the edition text.
  const rawArabic = (body.data.find((d) => d.edition.identifier === 'quran-uthmani')?.text ?? '')
    .replace(/[﻿​-‏]/g, '');
  const translation = translationEdition
    ? body.data.find((d) => d.edition.identifier === translationEdition)?.text ?? ''
    : '';

  if (!rawArabic) throw new Error(`No Uthmani text returned for ${surah}:${ayah}`);

  const { arabic, strippedBasmala } = stripLeadingBasmala(surah, ayah, rawArabic);
  return { surah, ayah, key: `${surah}:${ayah}`, arabic, translation, strippedBasmala };
}

export interface SurahMeta {
  number: number;
  /** Arabic surah name, e.g. "سُورَةُ الإِخْلَاصِ" */
  name: string;
  /** Transliterated name, e.g. "Al-Ikhlaas" */
  englishName: string;
  /** e.g. "Sincerity" */
  englishNameTranslation: string;
  numberOfAyahs: number;
}

/** Fetch surah-level metadata (name, ayah count) for the header. */
export async function fetchSurahMeta(surah: number): Promise<SurahMeta> {
  const url = `${env.quranApiBase}/surah/${surah}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Quran API ${res.status} for surah ${surah}`);
  const body = (await res.json()) as { code: number; data: SurahMeta };
  if (body.code !== 200 || !body.data) throw new Error(`Bad surah payload for ${surah}`);
  const d = body.data;
  return {
    number: d.number,
    name: d.name,
    englishName: d.englishName,
    englishNameTranslation: d.englishNameTranslation,
    numberOfAyahs: d.numberOfAyahs,
  };
}

let allSurahs: SurahMeta[] | null = null;

/**
 * The full 114-surah index, for pickers. This is immutable reference data, so
 * it is fetched once per process and cached forever; callers that need it at
 * request time (the web app's /api/meta) get it for free after the first hit.
 */
export async function fetchAllSurahs(): Promise<SurahMeta[]> {
  if (allSurahs) return allSurahs;
  const res = await fetch(`${env.quranApiBase}/surah`);
  if (!res.ok) throw new Error(`Quran API ${res.status} for surah index`);
  const body = (await res.json()) as { code: number; data: (SurahMeta & { revelationType: string })[] };
  if (body.code !== 200 || !Array.isArray(body.data)) throw new Error('Bad surah index payload');
  allSurahs = body.data.map((d) => ({
    number: d.number,
    name: d.name,
    englishName: d.englishName,
    englishNameTranslation: d.englishNameTranslation,
    numberOfAyahs: d.numberOfAyahs,
  }));
  return allSurahs;
}

/** Fetch the full passage [ayahFrom..ayahTo], in order. */
export async function fetchPassageText(
  surah: number,
  ayahFrom: number,
  ayahTo: number,
  translationEdition: string,
): Promise<AyahText[]> {
  const out: AyahText[] = [];
  for (let ayah = ayahFrom; ayah <= ayahTo; ayah++) {
    out.push(await fetchAyah(surah, ayah, translationEdition));
  }
  return out;
}
