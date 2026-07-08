/**
 * Registry of everyayah.com reciter folders (verified to resolve).
 *
 * The `folder` is the exact path segment(s) used in
 *   https://everyayah.com/data/<folder>/<SSSAAA>.mp3
 * Any valid everyayah folder string also works directly via config.
 * All entries are the Hafs reading (matches our quran-uthmani text source).
 */
export interface Reciter {
  id: string;
  name: string;
  folder: string;
  style?: 'murattal' | 'mujawwad' | 'muallim';
}

export const RECITERS: Reciter[] = [
  { id: 'menshawi-16', name: 'Mohamed Siddiq El-Minshawi (16k)', folder: 'Menshawi_16kbps', style: 'murattal' },
  { id: 'husary', name: 'Mahmoud Khalil Al-Husary', folder: 'Husary_128kbps', style: 'murattal' },
  { id: 'husary-muallim', name: 'Al-Husary (Muallim)', folder: 'Husary_Muallim_128kbps', style: 'muallim' },
  { id: 'hudhaify', name: 'Ali Al-Hudhaify', folder: 'Hudhaify_128kbps', style: 'murattal' },
  { id: 'abdulbasit', name: 'Abdul Basit (Murattal)', folder: 'Abdul_Basit_Murattal_192kbps', style: 'murattal' },
  { id: 'ayyoub', name: 'Muhammad Ayyoub', folder: 'Muhammad_Ayyoub_128kbps', style: 'murattal' },
  { id: 'shuraym', name: 'Saud Ash-Shuraim', folder: 'Saood_ash-Shuraym_128kbps', style: 'murattal' },
];

/** Resolve a reciter by id, name, or raw everyayah folder string. */
export function resolveReciter(input: string): string {
  return findReciter(input)?.folder ?? input; // fall through: treat as a raw everyayah folder
}

/** Look up the full reciter record (undefined for raw/unknown folders). */
export function findReciter(input: string): Reciter | undefined {
  return RECITERS.find(
    (r) => r.id === input || r.folder === input || r.name.toLowerCase() === input.toLowerCase(),
  );
}
