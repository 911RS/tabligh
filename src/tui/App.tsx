import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { UiLang } from '../store/store.js';
import {
  updateSettings, updateSecrets, markSetupComplete, isSetupComplete, listQueue, listPosts,
} from '../store/store.js';
import { hashPassword } from '../auth.js';
import { t } from './i18n.js';
import { Banner, NavList, type NavItem } from './ui.js';
import { StatusBar } from './StatusBar.js';
import { TextInput } from './components.js';
import {
  GenerateSection, ControlPanelSection, QueueSection, HistorySection, DoctorSection, MaintenanceSection,
} from './screens.js';
import { SettingsSection } from './settings.js';
import type { Intent } from './types.js';

type SectionKey = 'generate' | 'publish' | 'panel' | 'queue' | 'history' | 'settings' | 'doctor' | 'maintenance';

export function App({ initialLang, onIntent }: { initialLang: UiLang; onIntent: (i: Intent) => void }) {
  const [lang, setLangState] = useState<UiLang>(initialLang);
  const [leftIndex, setLeftIndex] = useState(0);
  const [focus, setFocus] = useState<'left' | 'right'>('left');
  const [overlay, setOverlay] = useState<'resetpw' | null>(null);
  const setLang = (l: UiLang) => { updateSettings({ ui: { lang: l } }); setLangState(l); };

  const firstRun = !isSetupComplete();
  const queued = listQueue().length;
  const posts = listPosts(2000).length;
  const menu: NavItem[] = [
    ...(firstRun ? [{ key: 'wizard', label: t('wizard', lang), badge: '⚑' }] : []),
    { key: 'generate', label: t('generate', lang) },
    { key: 'publish', label: t('publishNow', lang) },
    { key: 'panel', label: t('controlPanel', lang) },
    { key: 'queue', label: t('queue', lang), badge: queued ? String(queued) : undefined },
    { key: 'history', label: t('history', lang), badge: posts ? String(posts) : undefined },
    { key: 'settings', label: t('settings', lang) },
    { key: 'doctor', label: t('doctor', lang) },
    { key: 'maintenance', label: t('maintenance', lang) },
    { key: 'quit', label: t('quit', lang) },
  ];
  const idx = Math.min(leftIndex, menu.length - 1);
  const current = menu[idx].key;

  const enter = (key: string) => {
    if (key === 'quit') return onIntent({ type: 'quit' });
    if (key === 'wizard') return onIntent({ type: 'wizard' });
    setFocus('right');
  };

  // Left-pane extras: Tab/→ to jump into the working pane, q to quit.
  useInput((input, key) => {
    if (key.tab || key.rightArrow) enter(current);
    else if (input === 'q') onIntent({ type: 'quit' });
  }, { isActive: focus === 'left' && overlay === null });

  const backToMenu = () => setFocus('left');

  if (overlay === 'resetpw') {
    return (
      <Frame lang={lang} crumb={`Home › ${t('maintenance', lang)} › ${t('maintResetPw', lang)}`} hints="enter save · esc cancel" focus={focus}
        menu={menu} idx={idx} setLeftIndex={setLeftIndex} enter={enter}
        right={<TextInput label={t('askNewPassword', lang)} mask onSubmit={(v) => { if (v.trim().length >= 4) { updateSecrets({ panelPasswordHash: hashPassword(v.trim()) }); markSetupComplete(); } setOverlay(null); }} onCancel={() => setOverlay(null)} />} />
    );
  }

  const sectionActive = focus === 'right';
  let right: React.ReactNode;
  switch (current as SectionKey) {
    case 'generate': right = <GenerateSection lang={lang} active={sectionActive} publish={false} onIntent={onIntent} onBack={backToMenu} />; break;
    case 'publish': right = <GenerateSection lang={lang} active={sectionActive} publish onIntent={onIntent} onBack={backToMenu} />; break;
    case 'panel': right = <ControlPanelSection lang={lang} active={sectionActive} onBack={backToMenu} />; break;
    case 'queue': right = <QueueSection lang={lang} active={sectionActive} onBack={backToMenu} />; break;
    case 'history': right = <HistorySection lang={lang} active={sectionActive} onBack={backToMenu} />; break;
    case 'settings': right = <SettingsSection lang={lang} active={sectionActive} setLang={setLang} onBack={backToMenu} />; break;
    case 'doctor': right = <DoctorSection lang={lang} active={sectionActive} onBack={backToMenu} />; break;
    case 'maintenance': right = <MaintenanceSection lang={lang} active={sectionActive} onBack={backToMenu} onResetPw={() => setOverlay('resetpw')} />; break;
    default: right = (
      <Box flexDirection="column">
        <Text bold color="cyan">{current === 'wizard' ? t('wizard', lang) : t('quit', lang)}</Text>
        <Box marginTop={1}><Text color="gray">{current === 'wizard' ? 'Press → or Enter to run the guided setup.' : 'Press → or Enter to leave.'}</Text></Box>
      </Box>
    );
  }

  const crumb = current === 'quit' ? 'Home' : `Home › ${menu[idx].label}`;
  const hints = focus === 'left' ? '↑↓ move · →/↵ open · q quit' : '↑↓ act · esc back';

  return (
    <Frame lang={lang} crumb={crumb} hints={hints} focus={focus} menu={menu} idx={idx} setLeftIndex={setLeftIndex} enter={enter} right={right} />
  );
}

/** The persistent chrome: banner, status, master menu (left) + working pane (right), footer. */
function Frame({
  lang, crumb, hints, focus, menu, idx, setLeftIndex, enter, right,
}: {
  lang: UiLang; crumb: string; hints: string; focus: 'left' | 'right';
  menu: NavItem[]; idx: number; setLeftIndex: (i: number) => void; enter: (key: string) => void; right: React.ReactNode;
}) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Banner />
      <StatusBar lang={lang} />
      <Box marginTop={1}>
        <Box width={30} flexDirection="column" borderStyle="round" borderColor={focus === 'left' ? 'cyan' : 'gray'} paddingX={1}>
          <Text bold color={focus === 'left' ? 'cyan' : 'gray'}>MENU</Text>
          <Box marginTop={1}>
            <NavList items={menu} index={idx} setIndex={setLeftIndex} isActive={focus === 'left'}
              onSelect={(it) => enter(it.key)} />
          </Box>
        </Box>
        <Box flexGrow={1} flexDirection="column" borderStyle="round" borderColor={focus === 'right' ? 'cyan' : 'gray'} paddingX={1} marginLeft={1}>
          {right}
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">{crumb}   ·   {hints}</Text>
      </Box>
    </Box>
  );
}
