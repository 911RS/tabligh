/**
 * Background search pool. All terms are landscapes / architecture / objects that
 * do NOT imply people, so stock results stay person-free. A random one is used
 * per run. Combined with the alt-text PERSON_BLOCKLIST filter in background.ts.
 */
export const BACKGROUND_KEYWORDS: string[] = [
  // Mosques / Islamic (no people)
  'empty mosque interior', 'mosque architecture', 'mosque dome', 'mosque minaret',
  'islamic geometric pattern', 'quran book', 'prayer beads tasbih', 'islamic calligraphy art',
  'mosque at sunset', 'mosque courtyard',
  // Flowers / butterflies
  'blooming flowers', 'flower field', 'rose close up', 'tulip field', 'lavender field',
  'cherry blossom', 'butterfly on flower', 'monarch butterfly', 'wildflowers meadow', 'lotus flower',
  // Sea / water
  'calm ocean', 'sea waves', 'turquoise sea', 'ocean horizon', 'underwater coral',
  'waterfall nature', 'mountain lake', 'river forest', 'misty lake', 'seaside cliffs',
  // Sky / skyview
  'blue sky clouds', 'sunset sky', 'starry night sky', 'milky way stars', 'aurora borealis',
  'golden hour sky', 'aerial view mountains', 'drone view forest', 'clouds from above', 'moon night sky',
  // Trees / terrain
  'green forest', 'autumn forest', 'palm trees', 'pine forest path', 'desert dunes',
  // Ships / train / transport (no people)
  'sailing ship sea', 'lighthouse coast', 'train through mountains', 'railway forest', 'boat on lake',
];

/**
 * If a photo's alt/description contains any of these, we skip it — keeps people
 * and anything suggestive out of the backgrounds.
 */
export const PERSON_BLOCKLIST: string[] = [
  'person', 'people', 'man', 'men', 'woman', 'women', 'girl', 'boy', 'kid', 'kids',
  'child', 'children', 'baby', 'lady', 'guy', 'model', 'portrait', 'face', 'faces',
  'wedding', 'bride', 'groom', 'crowd', 'worshipper', 'worshippers', 'pilgrim', 'pilgrims',
  'selfie', 'couple', 'family', 'silhouette', 'nude', 'naked', 'bikini', 'lingerie',
  'swimsuit', 'sexy', 'body', 'skin', 'dancer', 'dancing',
];

/** True if an alt/description string is safe (no person/NSFW terms). */
export function altIsSafe(alt: string | undefined | null): boolean {
  if (!alt) return true; // no description → allow (keyword pool is already safe)
  const words = alt.toLowerCase().split(/[^a-z]+/);
  return !words.some((w) => PERSON_BLOCKLIST.includes(w));
}
