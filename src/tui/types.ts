/** What the Ink app resolves with when it needs the outer loop to take over.
 * `generate` and `wizard` run outside Ink so their console logs render cleanly. */
export type Intent =
  | { type: 'quit' }
  | { type: 'wizard' }
  | {
      type: 'generate';
      publish: boolean;
      jobOverride?: { surah: number; ayahFrom: number; ayahTo: number };
    };
