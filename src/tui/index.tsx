import { render } from 'ink';
import { createInterface } from 'node:readline/promises';
import { App } from './App.js';
import type { Intent } from './types.js';
import { settings } from '../store/store.js';
import { runJob, findLatestVideo } from '../server/runner.js';
import { runWizard } from '../wizard.js';
import { openBrowser } from '../util/openBrowser.js';
import { t } from './i18n.js';
import { log } from '../util/log.js';

/** Render the Ink app once; resolve with the intent it exits on (null = ctrl-c/quit). */
function showApp(): Promise<Intent | null> {
  return new Promise((resolve) => {
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

async function pressEnter(): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await rl.question('\n— Press Enter to return to the menu —');
  rl.close();
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
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const ans = (await rl.question(`${t('openFile', lang)}? (y/N) `)).trim().toLowerCase();
      rl.close();
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
    if (intent.type === 'wizard') { await runWizard(); await pressEnter(); continue; }
    if (intent.type === 'generate') { await runGenerate(intent); continue; }
  }
}
