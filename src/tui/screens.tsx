import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { randomBytes } from 'node:crypto';
import type { UiLang } from '../store/store.js';
import { settings, listQueue, addQueueItem, removeQueueItem, listPosts } from '../store/store.js';
import { computeStats } from '../store/stats.js';
import { prune } from '../publish/index.js';
import { runDoctor, type Check } from '../doctor.js';
import {
  panelStatus, startPanel, stopPanel, restartPanel, tailPanelLog, panelUrl, type PanelStatus,
} from '../panel/daemon.js';
import { openBrowser } from '../util/openBrowser.js';
import { t } from './i18n.js';
import { TextInput, Spinner, statusColor, statusIcon } from './components.js';
import { NavList, type NavItem } from './ui.js';
import type { Intent } from './types.js';

interface SectionProps {
  lang: UiLang;
  active: boolean;
  onBack: () => void;
}

const H = ({ children }: { children: React.ReactNode }) => <Text bold color="cyan">{children}</Text>;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

// ══ Generate / Publish ═══════════════════════════════════════════════════════
export function GenerateSection({
  lang, active, publish, onIntent, onBack,
}: SectionProps & { publish: boolean; onIntent: (i: Intent) => void }) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<'menu' | 'surah' | 'from' | 'to'>('menu');
  const [surah, setSurah] = useState(1);
  const [from, setFrom] = useState(1);
  useEffect(() => { if (!active) setStep('menu'); }, [active]);

  const c = settings().content;
  if (active && step === 'surah') return <TextInput label={t('askSurah', lang)} initial="1" onSubmit={(v) => { setSurah(clamp(+v, 1, 114)); setStep('from'); }} onCancel={() => setStep('menu')} />;
  if (active && step === 'from') return <TextInput label={t('askFrom', lang)} initial="1" onSubmit={(v) => { setFrom(Math.max(1, +v || 1)); setStep('to'); }} onCancel={() => setStep('menu')} />;
  if (active && step === 'to') return <TextInput label={t('askTo', lang)} initial={String(from)} onSubmit={(v) => onIntent({ type: 'generate', publish, jobOverride: { surah, ayahFrom: from, ayahTo: Math.max(from, +v || from) } })} onCancel={() => setStep('menu')} />;

  const items: NavItem[] = [
    { key: 'random', label: t('genRandom', lang) },
    { key: 'pick', label: t('genPick', lang) },
    { key: 'back', label: t('back', lang) },
  ];
  return (
    <Box flexDirection="column">
      <H>{publish ? t('publishNow', lang) : t('generate', lang)}</H>
      <Box marginTop={1} flexDirection="column">
        <Text color="gray">Reciter    <Text color="white">{c.reciter}</Text></Text>
        <Text color="gray">Translation<Text color="white"> {c.translationEdition || '—'}</Text></Text>
        <Text color="gray">Background <Text color="white"> {c.backgroundSource}</Text></Text>
        <Text color="gray">Length     <Text color="white">{c.randomMinAyahs}-{c.randomMaxAyahs} ayahs</Text></Text>
      </Box>
      <Box marginTop={1}>
        <NavList items={items} index={index} setIndex={setIndex} isActive={active} onBack={onBack} onSelect={(it) => {
          if (it.key === 'random') onIntent({ type: 'generate', publish });
          else if (it.key === 'pick') setStep('surah');
          else onBack();
        }} />
      </Box>
    </Box>
  );
}

// ══ Control panel ════════════════════════════════════════════════════════════
export function ControlPanelSection({ lang, active, onBack }: SectionProps) {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<PanelStatus | null>(null);
  const [busy, setBusy] = useState('');
  const [logs, setLogs] = useState(false);
  const refresh = async () => setStatus(await panelStatus());
  useEffect(() => { void refresh(); }, []);
  useEffect(() => { if (!active) setLogs(false); }, [active]);

  if (busy) return <Spinner label={busy} />;
  if (logs) {
    const lines = tailPanelLog(14);
    return (
      <Box flexDirection="column">
        <H>{t('viewLogs', lang)}</H>
        <Box marginTop={1} flexDirection="column">{lines.length ? lines.map((l, i) => <Text key={i} color="gray">{l}</Text>) : <Text color="gray">—</Text>}</Box>
        <Box marginTop={1}><NavList items={[{ key: 'back', label: t('back', lang) }]} index={0} setIndex={() => {}} isActive={active} onBack={() => setLogs(false)} onSelect={() => setLogs(false)} /></Box>
      </Box>
    );
  }
  const running = status?.running ?? false;
  const items: NavItem[] = running
    ? [{ key: 'stop', label: t('stop', lang) }, { key: 'restart', label: t('restart', lang) }, { key: 'open', label: t('openBrowser', lang) }, { key: 'logs', label: t('viewLogs', lang) }, { key: 'back', label: t('back', lang) }]
    : [{ key: 'start', label: t('start', lang) }, { key: 'logs', label: t('viewLogs', lang) }, { key: 'back', label: t('back', lang) }];

  const handle = async (it: NavItem) => {
    if (it.key === 'back') return onBack();
    if (it.key === 'open') return openBrowser(panelUrl());
    if (it.key === 'logs') return setLogs(true);
    if (it.key === 'start') { setBusy(t('starting', lang)); await startPanel(); await refresh(); setBusy(''); setIndex(0); return; }
    if (it.key === 'stop') { setBusy(t('stopping', lang)); stopPanel(); await new Promise((r) => setTimeout(r, 400)); await refresh(); setBusy(''); setIndex(0); return; }
    if (it.key === 'restart') { setBusy(t('starting', lang)); await restartPanel(); await refresh(); setBusy(''); setIndex(0); return; }
  };
  return (
    <Box flexDirection="column">
      <H>{t('panelTitle', lang)}</H>
      <Box marginTop={1} flexDirection="column">
        {status == null ? <Text color="gray">…</Text> : running
          ? <Text color="green">● {t('panelRunning', lang)}</Text>
          : <Text color="gray">○ {t('panelStopped', lang)}</Text>}
        <Text color="gray">URL   <Text color="white">{status?.url ?? panelUrl()}</Text></Text>
        {status?.pid ? <Text color="gray">PID   <Text color="white">{status.pid}</Text></Text> : null}
      </Box>
      <Box marginTop={1}><NavList items={items} index={Math.min(index, items.length - 1)} setIndex={setIndex} isActive={active} onBack={onBack} onSelect={handle} /></Box>
    </Box>
  );
}

// ══ Queue ════════════════════════════════════════════════════════════════════
export function QueueSection({ lang, active, onBack }: SectionProps) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<'menu' | 'surah' | 'from' | 'to'>('menu');
  const [surah, setSurah] = useState(1);
  const [from, setFrom] = useState(1);
  const [tick, setTick] = useState(0);
  const [flash, setFlash] = useState('');
  useEffect(() => { if (!active) setStep('menu'); }, [active]);
  const items = listQueue();

  if (active && step === 'surah') return <TextInput label={t('askSurah', lang)} initial="1" onSubmit={(v) => { setSurah(clamp(+v, 1, 114)); setStep('from'); }} onCancel={() => setStep('menu')} />;
  if (active && step === 'from') return <TextInput label={t('askFrom', lang)} initial="1" onSubmit={(v) => { setFrom(Math.max(1, +v || 1)); setStep('to'); }} onCancel={() => setStep('menu')} />;
  if (active && step === 'to') return <TextInput label={t('askTo', lang)} initial={String(from)} onSubmit={(v) => {
    const to = Math.max(from, +v || from);
    addQueueItem({ id: randomBytes(5).toString('hex'), surah, ayahFrom: from, ayahTo: to });
    setFlash(`${t('queueAdded', lang)}: ${surah}:${from}-${to}`); setTick((x) => x + 1); setStep('menu');
  }} onCancel={() => setStep('menu')} />;

  const nav: NavItem[] = [
    ...items.map((q, i) => ({ key: q.id, label: `${i + 1}. ${q.surah}:${q.ayahFrom}-${q.ayahTo}`, badge: q.reciter })),
    { key: '@add', label: `＋ ${t('queueAdd', lang)}` },
    { key: '@back', label: t('back', lang) },
  ];
  const curIdx = Math.min(index, nav.length - 1);
  const isItem = !nav[curIdx].key.startsWith('@');
  return (
    <Box flexDirection="column" key={tick}>
      <RemoveKey enabled={active && isItem} onRemove={() => { removeQueueItem(nav[curIdx].key); setFlash(t('queueRemoved', lang)); setTick((x) => x + 1); setIndex(0); }} />
      <H>{t('queue', lang)}</H>
      {items.length ? null : <Text color="gray">{t('queueEmpty', lang)}</Text>}
      <Box marginTop={1}>
        <NavList items={nav} index={curIdx} setIndex={setIndex} isActive={active} onBack={onBack} onSelect={(it) => {
          if (it.key === '@add') setStep('surah');
          else if (it.key === '@back') onBack();
        }} />
      </Box>
      {active && isItem ? <Text color="gray">d = remove highlighted</Text> : null}
      {flash ? <Text color="green">✓ {flash}</Text> : null}
    </Box>
  );
}
function RemoveKey({ enabled, onRemove }: { enabled: boolean; onRemove: () => void }) {
  useInput((input) => { if (input === 'd' || input === 'x') onRemove(); }, { isActive: enabled });
  return null;
}

// ══ History & analytics ══════════════════════════════════════════════════════
export function HistorySection({ lang, active, onBack }: SectionProps) {
  const [index, setIndex] = useState(0);
  const stats = computeStats();
  const recent = listPosts(10);
  const byPlatform = Object.entries(stats.byPlatform);
  const nav: NavItem[] = [...recent.map((p) => ({ key: p.id, label: `${p.surah}:${p.ayahFrom}-${p.ayahTo}`, badge: p.status })), { key: '@back', label: t('back', lang) }];
  const post = recent.find((p) => p.id === nav[Math.min(index, nav.length - 1)]?.key);
  return (
    <Box flexDirection="column">
      <H>{t('history', lang)}</H>
      <Text>
        <Text color="magenta">{stats.total}</Text> {t('histTotal', lang)} · <Text color="green">{stats.published}</Text> {t('histPublished', lang)} · <Text color="red">{stats.failed}</Text> {t('histFailed', lang)} · <Text color="cyan">{stats.week}</Text> {t('histWeek', lang)}
      </Text>
      {byPlatform.length ? <Text color="gray">{t('histByPlatform', lang)}: {byPlatform.map(([k, v]) => `${k} ${v}`).join(' · ')}</Text> : null}
      {recent.length === 0 ? <Text color="gray">{t('histNone', lang)}</Text> : null}
      {/* Always render the list (it always has a Back item) so Esc/Back works even with 0 posts. */}
      <Box marginTop={1}><NavList items={nav} index={Math.min(index, nav.length - 1)} setIndex={setIndex} isActive={active} onBack={onBack} onSelect={(it) => { if (it.key === '@back') onBack(); }} /></Box>
      {post ? <Text color="gray">{post.reciterName} · {post.ts.slice(0, 16).replace('T', ' ')}{post.platforms?.length ? ` · ${post.platforms.join(', ')}` : ''}</Text> : null}
    </Box>
  );
}

// ══ Doctor ═══════════════════════════════════════════════════════════════════
export function DoctorSection({ lang, active, onBack }: SectionProps) {
  const [index, setIndex] = useState(0);
  const [checks, setChecks] = useState<Check[] | null>(null);
  const load = () => { setChecks(null); runDoctor().then(setChecks); };
  useEffect(() => { load(); }, []);
  return (
    <Box flexDirection="column">
      <H>{t('doctorTitle', lang)}</H>
      <Box marginTop={1} flexDirection="column">
        {!checks ? <Spinner label={t('doctorRunning', lang)} /> : checks.map((c, i) => (
          <Text key={i}><Text color={statusColor(c.status)}>{statusIcon(c.status)} </Text>{c.name.padEnd(22)}<Text color="gray">{c.detail}</Text></Text>
        ))}
      </Box>
      <Box marginTop={1}><NavList items={[{ key: 'rerun', label: '↻ Re-run checks' }, { key: 'back', label: t('back', lang) }]} index={index} setIndex={setIndex} isActive={active} onBack={onBack} onSelect={(it) => { if (it.key === 'rerun') load(); else onBack(); }} /></Box>
    </Box>
  );
}

// ══ Maintenance ══════════════════════════════════════════════════════════════
export function MaintenanceSection({ lang, active, onBack, onResetPw }: SectionProps & { onResetPw: () => void }) {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState('');
  const [flash, setFlash] = useState<string[]>([]);
  if (busy) return <Spinner label={busy} />;
  const nav: NavItem[] = [
    { key: 'prune', label: t('maintPrune', lang) },
    { key: 'pw', label: t('maintResetPw', lang) },
    { key: 'paths', label: t('maintPaths', lang) },
    { key: 'back', label: t('back', lang) },
  ];
  const handle = async (it: NavItem) => {
    if (it.key === 'prune') { setBusy(t('working', lang)); await prune().catch(() => {}); setFlash([`✓ ${t('maintPruned', lang)}`]); setBusy(''); }
    else if (it.key === 'pw') onResetPw();
    else if (it.key === 'paths') setFlash([`store: ${process.env.STORE_PATH || process.cwd() + '/data/store.json'}`, `work:  ${process.cwd()}/work`]);
    else onBack();
  };
  return (
    <Box flexDirection="column">
      <H>{t('maintenance', lang)}</H>
      <Box marginTop={1}><NavList items={nav} index={index} setIndex={setIndex} isActive={active} onBack={onBack} onSelect={handle} /></Box>
      {flash.length ? <Box marginTop={1} flexDirection="column">{flash.map((l, i) => <Text key={i} color="green">{l}</Text>)}</Box> : null}
    </Box>
  );
}
