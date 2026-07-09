/**
 * Internationalization: a curated list of Quran translation editions grouped by
 * language (for the panel), and localized caption text so posts read naturally
 * in the audience's language.
 */

export interface Edition { id: string; name: string }
export interface LanguageGroup { code: string; language: string; editions: Edition[] }

/** Curated alquran.cloud translation editions, grouped by language. */
export const TRANSLATION_EDITIONS: LanguageGroup[] = [
  { code: 'ar', language: 'Arabic only', editions: [{ id: '', name: 'None (Arabic only)' }] },
  { code: 'en', language: 'English', editions: [
    { id: 'en.sahih', name: 'Saheeh International' }, { id: 'en.pickthall', name: 'Pickthall' },
    { id: 'en.yusufali', name: 'Yusuf Ali' }, { id: 'en.asad', name: 'Muhammad Asad' },
  ] },
  { code: 'fr', language: 'French', editions: [{ id: 'fr.hamidullah', name: 'Hamidullah' }] },
  { code: 'ur', language: 'Urdu', editions: [{ id: 'ur.jalandhry', name: 'Jalandhry' }, { id: 'ur.ahmedali', name: 'Ahmed Ali' }] },
  { code: 'id', language: 'Indonesian', editions: [{ id: 'id.indonesian', name: 'Bahasa Indonesia' }] },
  { code: 'tr', language: 'Turkish', editions: [{ id: 'tr.diyanet', name: 'Diyanet İşleri' }, { id: 'tr.ates', name: 'Süleyman Ateş' }] },
  { code: 'es', language: 'Spanish', editions: [{ id: 'es.cortes', name: 'Cortes' }] },
  { code: 'de', language: 'German', editions: [{ id: 'de.aburida', name: 'Abu Rida' }] },
  { code: 'ru', language: 'Russian', editions: [{ id: 'ru.kuliev', name: 'Kuliev' }] },
  { code: 'bn', language: 'Bengali', editions: [{ id: 'bn.bengali', name: 'Zohurul Hoque' }] },
  { code: 'ms', language: 'Malay', editions: [{ id: 'ms.basmeih', name: 'Basmeih' }] },
  { code: 'nl', language: 'Dutch', editions: [{ id: 'nl.keyzer', name: 'Keyzer' }] },
  { code: 'it', language: 'Italian', editions: [{ id: 'it.piccardo', name: 'Piccardo' }] },
];

/** Language code from an edition id (prefix before the dot), e.g. "fr.hamidullah" → "fr". */
export const editionLang = (id: string): string => (id || '').split('.')[0] || 'ar';

interface CaptionStrings { surah: string; recitedBy: string; background: string; on: string; tags: string[] }

const CAPTIONS: Record<string, CaptionStrings> = {
  en: { surah: 'Surah', recitedBy: 'Recited by', background: 'Background: photo by', on: 'on', tags: ['Quran', 'Islam', 'Recitation', 'Muslim', 'Deen', 'fyp'] },
  ar: { surah: 'سورة', recitedBy: 'بصوت', background: 'الخلفية: صورة لـ', on: 'من', tags: ['قرآن', 'إسلام', 'تلاوة', 'قران_كريم', 'اكسبلور'] },
  fr: { surah: 'Sourate', recitedBy: 'Récité par', background: 'Fond : photo de', on: 'sur', tags: ['Coran', 'Islam', 'Récitation', 'Musulman', 'pourtoi'] },
  tr: { surah: 'Sure', recitedBy: 'Okuyan', background: 'Arka plan: fotoğraf', on: '·', tags: ['Kuran', 'İslam', 'kesfet'] },
  id: { surah: 'Surah', recitedBy: 'Dibacakan oleh', background: 'Latar: foto oleh', on: 'di', tags: ['Quran', 'Islam', 'Murottal', 'fyp'] },
  ur: { surah: 'سورہ', recitedBy: 'قاری', background: 'پس منظر: تصویر بذریعہ', on: '·', tags: ['قرآن', 'اسلام', 'تلاوت'] },
};

/** Localized caption strings for a translation edition's language (English fallback). */
export function captionStrings(editionId: string): CaptionStrings {
  return CAPTIONS[editionLang(editionId)] ?? CAPTIONS.en;
}
