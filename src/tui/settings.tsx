import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { UiLang, BackgroundSource, Template, BasmalaMode } from '../store/store.js';
import { settings, updateSettings, updateSecrets, UI_LANGS, TEMPLATES } from '../store/store.js';
import { t, LANG_LABELS } from './i18n.js';
import { TextInput } from './components.js';
import { NavList, type NavItem } from './ui.js';

interface Draft {
  lang: UiLang;
  template: Template;
  backgroundSource: BackgroundSource;
  backgroundLocalDir: string;
  basmala: BasmalaMode;
  schedulerEnabled: boolean;
  tz: string; times: string;
  translationEdition: string;
  randomMinAyahs: string; randomMaxAyahs: string; maxDurationSeconds: string;
  tiktok: string; instagram: string; facebook: string; youtube: string;
  pexelsKey: string; unsplashKey: string; bufferToken: string;
}
function draftFromStore(): Draft {
  const s = settings(); const ch = s.publish.channels;
  return {
    lang: s.ui.lang, template: s.branding.template,
    backgroundSource: s.content.backgroundSource, backgroundLocalDir: s.content.backgroundLocalDir,
    basmala: s.content.basmala,
    schedulerEnabled: s.schedule.enabled, tz: s.schedule.tz, times: s.schedule.times.join(','),
    translationEdition: s.content.translationEdition, randomMinAyahs: String(s.content.randomMinAyahs),
    randomMaxAyahs: String(s.content.randomMaxAyahs), maxDurationSeconds: String(s.content.maxDurationSeconds),
    tiktok: ch.tiktok.join(','), instagram: ch.instagram.join(','), facebook: ch.facebook.join(','), youtube: ch.youtube.join(','),
    pexelsKey: '', unsplashKey: '', bufferToken: '',
  };
}

type StrKey = 'backgroundLocalDir' | 'tz' | 'times' | 'translationEdition' | 'randomMinAyahs' | 'randomMaxAyahs'
  | 'maxDurationSeconds' | 'tiktok' | 'instagram' | 'facebook' | 'youtube' | 'pexelsKey' | 'unsplashKey' | 'bufferToken';
interface Field { key: StrKey; label: string; type: 'text' | 'number' | 'password' }
const FIELDS: Field[] = [
  { key: 'tz', label: 'Timezone', type: 'text' },
  { key: 'times', label: 'Post times', type: 'text' },
  { key: 'translationEdition', label: 'Translation', type: 'text' },
  { key: 'randomMinAyahs', label: 'Min ayahs', type: 'number' },
  { key: 'randomMaxAyahs', label: 'Max ayahs', type: 'number' },
  { key: 'maxDurationSeconds', label: 'Max duration (s)', type: 'number' },
  { key: 'tiktok', label: 'TikTok channels', type: 'text' },
  { key: 'instagram', label: 'Instagram channels', type: 'text' },
  { key: 'facebook', label: 'Facebook channels', type: 'text' },
  { key: 'youtube', label: 'YouTube channels', type: 'text' },
  { key: 'pexelsKey', label: 'Pexels key', type: 'password' },
  { key: 'unsplashKey', label: 'Unsplash key', type: 'password' },
  { key: 'bufferToken', label: 'Buffer token', type: 'password' },
];

export function SettingsSection({
  lang, active, setLang, onBack,
}: { lang: UiLang; active: boolean; setLang: (l: UiLang) => void; onBack: () => void }) {
  const [draft, setDraft] = useState<Draft>(draftFromStore);
  const [baseline, setBaseline] = useState<Draft>(draft);
  const [index, setIndex] = useState(0);
  const [edit, setEdit] = useState<Field | null>(null);
  const [enumOpen, setEnumOpen] = useState<'lang' | 'bg' | 'tpl' | null>(null);
  const [flash, setFlash] = useState('');
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  useEffect(() => { if (!active) { setEdit(null); setEnumOpen(null); } }, [active]);

  if (active && edit) {
    return <TextInput label={edit.label} initial={edit.type === 'password' ? '' : String(draft[edit.key])} mask={edit.type === 'password'}
      onSubmit={(v) => { setDraft({ ...draft, [edit.key]: v }); setEdit(null); }} onCancel={() => setEdit(null)} />;
  }
  if (active && enumOpen === 'lang') {
    return <Box flexDirection="column"><Text bold color="cyan">{t('chooseLanguage', lang)}</Text>
      <NavList items={UI_LANGS.map((l) => ({ key: l, label: LANG_LABELS[l] }))} index={Math.max(0, UI_LANGS.indexOf(draft.lang))} setIndex={() => {}} isActive
        onBack={() => setEnumOpen(null)} onSelect={(it) => { setDraft({ ...draft, lang: it.key as UiLang }); setEnumOpen(null); }} /></Box>;
  }
  if (active && enumOpen === 'tpl') {
    const labels: Record<Template, string> = { classic: 'Classic (photo + scrim)', glass: 'Glassmorphism', noor: 'Noor · Divine Light (gold)' };
    return <Box flexDirection="column"><Text bold color="cyan">Template</Text>
      <NavList items={TEMPLATES.map((tp) => ({ key: tp, label: labels[tp] }))} index={Math.max(0, TEMPLATES.indexOf(draft.template))} setIndex={() => {}} isActive
        onBack={() => setEnumOpen(null)} onSelect={(it) => { setDraft({ ...draft, template: it.key as Template }); setEnumOpen(null); }} /></Box>;
  }
  if (active && enumOpen === 'bg') {
    const opts: { key: BackgroundSource; label: string }[] = [
      { key: 'auto', label: t('bgAuto', lang) }, { key: 'pexels', label: t('bgPexels', lang) },
      { key: 'unsplash', label: t('bgUnsplash', lang) }, { key: 'local', label: t('bgLocal', lang) },
    ];
    return <Box flexDirection="column"><Text bold color="cyan">{t('setBackground', lang)}</Text>
      <NavList items={opts} index={Math.max(0, opts.findIndex((o) => o.key === draft.backgroundSource))} setIndex={() => {}} isActive
        onBack={() => setEnumOpen(null)} onSelect={(it) => { setDraft({ ...draft, backgroundSource: it.key as BackgroundSource }); setEnumOpen(null); }} /></Box>;
  }

  const nav: NavItem[] = [
    { key: '@lang', label: t('language', lang), badge: LANG_LABELS[draft.lang] },
    { key: '@tpl', label: 'Template', badge: draft.template },
    { key: '@bg', label: t('setBackground', lang), badge: draft.backgroundSource },
    ...(draft.backgroundSource === 'local' ? [{ key: 'backgroundLocalDir', label: 'Local folder', badge: draft.backgroundLocalDir || '(unset)' }] : []),
    { key: '@sched', label: t('setSchedule', lang), badge: draft.schedulerEnabled ? 'on' : 'off' },
    { key: '@basmala', label: 'Basmala intro', badge: draft.basmala === 'always' ? 'always' : 'ayah 1 only' },
    ...FIELDS.map((f) => ({ key: f.key, label: f.label, badge: f.type === 'password' ? (draft[f.key] ? '(edited)' : '••••') : (String(draft[f.key]) || '(empty)') })),
    { key: '@save', label: dirty ? '● Save changes' : 'Save changes' },
    { key: '@discard', label: dirty ? 'Discard changes' : t('back', lang), danger: dirty },
  ];
  const idx = Math.min(index, nav.length - 1);

  const save = () => {
    updateSettings({
      ui: { lang: draft.lang },
      branding: { template: draft.template },
      schedule: { tz: draft.tz.trim() || settings().schedule.tz, times: splitCsv(draft.times), enabled: draft.schedulerEnabled },
      content: {
        translationEdition: draft.translationEdition.trim(),
        randomMinAyahs: Math.max(1, +draft.randomMinAyahs || 1), randomMaxAyahs: Math.max(1, +draft.randomMaxAyahs || 1),
        maxDurationSeconds: Math.max(0, +draft.maxDurationSeconds || 0),
        backgroundSource: draft.backgroundSource, backgroundLocalDir: draft.backgroundLocalDir.trim(),
        basmala: draft.basmala,
      },
      publish: { channels: { tiktok: splitCsv(draft.tiktok), instagram: splitCsv(draft.instagram), facebook: splitCsv(draft.facebook), youtube: splitCsv(draft.youtube) } },
    });
    const sp: Record<string, string> = {};
    if (draft.pexelsKey.trim()) sp.pexelsKey = draft.pexelsKey.trim();
    if (draft.unsplashKey.trim()) sp.unsplashKey = draft.unsplashKey.trim();
    if (draft.bufferToken.trim()) sp.bufferToken = draft.bufferToken.trim();
    if (Object.keys(sp).length) updateSecrets(sp);
    setLang(draft.lang);
    const cleared = { ...draft, pexelsKey: '', unsplashKey: '', bufferToken: '' };
    setDraft(cleared); setBaseline(cleared); setFlash(t('saved', lang));
  };

  const onSelect = (it: NavItem) => {
    setFlash('');
    if (it.key === '@lang') return setEnumOpen('lang');
    if (it.key === '@tpl') return setEnumOpen('tpl');
    if (it.key === '@bg') return setEnumOpen('bg');
    if (it.key === '@sched') return setDraft({ ...draft, schedulerEnabled: !draft.schedulerEnabled });
    if (it.key === '@basmala') return setDraft({ ...draft, basmala: draft.basmala === 'always' ? 'off' : 'always' });
    if (it.key === '@save') return save();
    if (it.key === '@discard') { if (dirty) setDraft(baseline); else onBack(); return; }
    if (it.key === 'backgroundLocalDir') return setEdit({ key: 'backgroundLocalDir', label: t('askLocalDir', lang), type: 'text' });
    const f = FIELDS.find((x) => x.key === it.key);
    if (f) setEdit(f);
  };

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">{t('settings', lang)}{dirty ? <Text color="yellow">  ● unsaved</Text> : null}</Text>
      <Box marginTop={1}><NavList items={nav} index={idx} setIndex={setIndex} isActive={active} onBack={onBack} onSelect={onSelect} /></Box>
      {flash ? <Text color="green">✓ {flash}</Text> : null}
    </Box>
  );
}

function splitCsv(v: string): string[] { return v.split(',').map((s) => s.trim()).filter(Boolean); }
