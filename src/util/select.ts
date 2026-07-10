import { openSync } from 'node:fs';
import { ReadStream } from 'node:tty';
import { stdout } from 'node:process';

export interface Choice<T extends string> { value: T; label: string; hint?: string }

const CY = (s: string) => `\x1b[36m${s}\x1b[0m`;
const DIM = (s: string) => `\x1b[2m${s}\x1b[0m`;
const BOLD = (s: string) => `\x1b[1m${s}\x1b[0m`;

/**
 * Open a raw-mode-capable TTY input. We reopen the controlling terminal
 * (`/dev/tty`) rather than reuse `process.stdin`, because after the Ink TUI runs
 * `process.stdin` is left unusable (see util/promptStream.ts). Returns null when
 * there is no interactive terminal (pipes, CI, Windows).
 */
function openRawTty(): { input: ReadStream; close: () => void } | null {
  if (process.platform === 'win32' || !stdout.isTTY) return null;
  try {
    const fd = openSync('/dev/tty', 'r');
    const input = new ReadStream(fd);
    return { input, close: () => { try { input.destroy(); } catch { /* ignore */ } } };
  } catch {
    return null;
  }
}

/**
 * Interactive single-choice picker for terminal flows: ↑/↓ (or j/k) to move, a
 * number key to jump, Enter to confirm. Returns the chosen value. The list is
 * redrawn in place and left on screen with the pick highlighted. In a
 * non-interactive terminal it returns `current` (or the first choice) without
 * prompting.
 */
export async function select<T extends string>(
  question: string,
  choices: Choice<T>[],
  current?: T,
): Promise<T> {
  const tty = openRawTty();
  if (!tty) return current ?? choices[0].value;
  const { input, close } = tty;

  let idx = choices.findIndex((c) => c.value === current);
  if (idx < 0) idx = 0;

  const draw = (first: boolean) => {
    if (!first) stdout.write(`\x1b[${choices.length + 1}A`); // back up to the question line
    stdout.write('\r\x1b[J'); // clear from here down
    stdout.write(`  ${question} ${DIM('(↑/↓ + Enter)')}\n`);
    choices.forEach((c, i) => {
      const on = i === idx;
      const label = on ? CY(BOLD(c.label)) : c.label;
      const hint = c.hint ? ' ' + DIM(c.hint) : '';
      stdout.write(`    ${on ? CY('❯') : ' '} ${label}${hint}\n`);
    });
  };

  return await new Promise<T>((resolve) => {
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');
    stdout.write('\x1b[?25l'); // hide cursor
    draw(true);

    const finish = (val: T) => {
      input.setRawMode(false);
      input.removeListener('data', onData);
      close();
      stdout.write('\x1b[?25h'); // show cursor
      resolve(val);
    };

    const onData = (s: string) => {
      if (s === '\x1b[A' || s === 'k') { idx = (idx - 1 + choices.length) % choices.length; draw(false); }
      else if (s === '\x1b[B' || s === 'j') { idx = (idx + 1) % choices.length; draw(false); }
      else if (s >= '1' && s <= '9') { const n = Number(s) - 1; if (n < choices.length) { idx = n; draw(false); } }
      else if (s === '\r' || s === '\n') { finish(choices[idx].value); }
      else if (s === '\x03') { stdout.write('\x1b[?25h'); close(); process.exit(130); } // Ctrl-C
    };
    input.on('data', onData);
  });
}
