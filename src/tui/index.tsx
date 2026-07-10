import { render } from 'ink';
import { createInterface } from 'node:readline/promises';
import { App } from './App.js';
import type { Intent } from './types.js';
import { settings } from '../store/store.js';
import { runJob, findLatestVideo } from '../server/runner.js';
import { runWizard } from '../wizard.js';
import { openBrowser } from '../util/openBrowser.js';
import { openPromptInput } from '../util/promptStream.js';
import { t } from './i18n.js';
import { log } from '../util/log.js';

/** Clear the screen and scrollback so the menu opens in clean space (TTY only). */
function clearScreen(): void {
  if (process.stdout.isTTY) process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
}

/** Render the Ink app once; resolve with the intent it exits on (null = ctrl-c/quit). */
function showApp(): Promise<Intent | null> {
  return new Promise((resolve) => {
    clearScreen();
    let captured: Intent | null = null;
    const instance = render(
      <App
        initialLang={settings().ui.lang}
        onIntent={(i) => { captured = i; instance.unmount(); }}
      />,
    );
    instance.waitUntilExit().then(() => resolve(captured));
  });
}

/**
 * Let Ink finish tearing down before we show a plain readline prompt.
 * Ink 5's `unmount()` resolves `waitUntilExit()` synchronously, but React
 * flushes the effect cleanups that restore the terminal (raw mode → cooked) on
 * a later task. Prompts opened before that runs would sit in raw mode with no
 * echo, so yield a tick to let the terminal settle. (The prompt streams
 * themselves reopen `/dev/tty`; see `openPromptInput`.)
 */
async function settleTerminal(): Promise<void> {
  await new Promise((r) => setTimeout(r, 80));
}

async function pressEnter(): Promise<void> {
  const { input, cleanup } = openPromptInput();
  const rl = createInterface({ input, output: process.stdout, terminal: false });
  await rl.question('\n— Press Enter to return to the menu —');
  rl.close();
  cleanup();
}

/** Run a render outside Ink so the pipeline's progress logs render cleanly. */
async function runGenerate(intent: Extract<Intent, { type: 'generate' }>): Promise<void> {
  const lang = settings().ui.lang;
  try {
    const summary = await runJob({ jobOverride: intent.jobOverride, publish: intent.publish });
    log.ok(summary);
    const file = findLatestVideo();
    if (file) {
      log.ok(`${t('renderedTo', lang)}: ${file}`);
      const { input, cleanup } = openPromptInput();
      const rl = createInterface({ input, output: process.stdout, terminal: false });
      const ans = (await rl.question(`${t('openFile', lang)}? (y/N) `)).trim().toLowerCase();
      rl.close();
      cleanup();
      if (ans === 'y' || ans === 'yes') openBrowser(file);
    }
  } catch (e) {
    log.error(e instanceof Error ? e.message : String(e));
  }
  await pressEnter();
}

/** Interactive command center: loop over the menu, running heavy actions between renders. */
export async function launchTui(): Promise<void> {
  for (;;) {
    const intent = await showApp();
    if (!intent || intent.type === 'quit') break;
    await settleTerminal(); // let Ink restore the terminal before any prompt
    if (intent.type === 'wizard') { await runWizard(); await pressEnter(); continue; }
    if (intent.type === 'generate') { await runGenerate(intent); continue; }
  }
}
