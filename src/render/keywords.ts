/**
 * Background search pool. All terms are landscapes / architecture / objects that
 * do NOT imply people, so stock results stay person-free. A random one is used
 * per run. Combined with the FAIL-SAFE alt-text filter below.
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
  // extra human-context signals
  'friend', 'friends', 'human', 'adult', 'teen', 'teenager', 'female', 'male',
  'hand', 'hands', 'arm', 'arms', 'hair', 'beard', 'smile', 'smiling', 'posing', 'pose',
  'standing', 'sitting', 'wearing', 'fashion', 'clothing', 'shirt', 'dress', 'jersey',
  'hijab', 'abaya', 'thobe', 'headscarf', 'studio', 'curtain',
];

/**
 * A photo must POSITIVELY describe one of these scenes to be accepted. This is
 * an allowlist — anything we can't confirm is a safe scene gets rejected.
 */
export const SAFE_SUBJECTS: string[] = [
  'mosque', 'minaret', 'dome', 'arch', 'arches', 'architecture', 'building', 'pattern',
  'geometric', 'calligraphy', 'quran', 'koran', 'book', 'beads', 'tasbih', 'lantern', 'lamp',
  'flower', 'flowers', 'floral', 'rose', 'roses', 'tulip', 'tulips', 'lavender', 'blossom',
  'bloom', 'petal', 'petals', 'butterfly', 'meadow', 'lotus', 'garden', 'plant', 'plants',
  'ocean', 'sea', 'wave', 'waves', 'water', 'lake', 'river', 'waterfall', 'coral', 'beach',
  'coast', 'coastal', 'cliff', 'cliffs', 'sky', 'clouds', 'cloud', 'cloudy', 'sunset', 'sunrise',
  'star', 'stars', 'starry', 'galaxy', 'milky', 'aurora', 'moon', 'night', 'dusk', 'dawn',
  'forest', 'tree', 'trees', 'palm', 'pine', 'wood', 'woods', 'woodland', 'leaves', 'leaf',
  'nature', 'natural', 'mountain', 'mountains', 'hill', 'hills', 'valley', 'desert', 'dune',
  'dunes', 'sand', 'landscape', 'scenery', 'scenic', 'ship', 'sailboat', 'boat', 'lighthouse',
  'train', 'railway', 'road', 'path', 'aerial', 'drone', 'horizon', 'field', 'fields', 'snow',
  'ice', 'fog', 'mist', 'misty', 'rain', 'autumn', 'spring', 'landmark', 'temple', 'interior',
];

/**
 * FAIL-SAFE: a photo is safe only when its description exists, names a safe scene,
 * and contains no human/NSFW term. No description or an unrecognized scene → rejected
 * (we'd rather fall back to a gradient than risk showing people).
 */
export function altIsSafe(alt: string | undefined | null): boolean {
  if (!alt) return false; // can't verify → reject
  const words = alt.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (words.some((w) => PERSON_BLOCKLIST.includes(w))) return false; // any human/NSFW word → reject
  return words.some((w) => SAFE_SUBJECTS.includes(w)); // must positively be a safe scene
}
