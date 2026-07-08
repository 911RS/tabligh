import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const LEDGER = join(process.cwd(), 'data', 'ledger.jsonl');

export interface LedgerEntry {
  ts: string; // ISO
  surah: number;
  ayahFrom: number;
  ayahTo: number;
  reciter: string;
  postIds: string[];
  videoObject: string;
  thumbObject: string;
}

/** Append one published-reel record (append-only, one JSON per line). */
export async function appendEntry(entry: LedgerEntry): Promise<void> {
  await mkdir(dirname(LEDGER), { recursive: true });
  await appendFile(LEDGER, JSON.stringify(entry) + '\n');
}

/** Read all ledger entries (empty if none yet). Used for de-dup / audit. */
export async function readEntries(): Promise<LedgerEntry[]> {
  try {
    const raw = await readFile(LEDGER, 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l) as LedgerEntry);
  } catch {
    return [];
  }
}

/** Passage key "surah:from-to" for de-dup checks. */
export const passageKey = (s: number, f: number, t: number) => `${s}:${f}-${t}`;
