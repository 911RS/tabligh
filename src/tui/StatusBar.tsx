import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { UiLang } from '../store/store.js';
import { settings, listPosts } from '../store/store.js';
import { isConfigured } from '../publish/buffer.js';
import { panelStatus } from '../panel/daemon.js';
import { t } from './i18n.js';

interface Snapshot {
  panel: boolean;
  port: number;
  scheduler: boolean;
  publish: boolean;
  posts: number;
}

/** Live one-line status header, refreshed every few seconds. */
export function StatusBar({ lang }: { lang: UiLang }) {
  const [s, setS] = useState<Snapshot | null>(null);

  useEffect(() => {
    let live = true;
    const load = async () => {
      const ps = await panelStatus();
      if (!live) return;
      setS({
        panel: ps.running,
        port: ps.port,
        scheduler: settings().schedule.enabled,
        publish: isConfigured(),
        posts: listPosts(2000).length,
      });
    };
    void load();
    const id = setInterval(() => void load(), 4000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, []);

  if (!s) return <Text color="gray">…</Text>;
  const dot = (on: boolean) => (on ? '●' : '○');
  return (
    <Box marginBottom={1}>
      <Text>
        <Text color={s.panel ? 'green' : 'gray'}>{dot(s.panel)} {s.panel ? `${t('panelOn', lang)} :${s.port}` : t('panelOff', lang)}</Text>
        <Text color="gray">  ·  </Text>
        <Text color={s.scheduler ? 'green' : 'gray'}>{s.scheduler ? t('schedulerOn', lang) : t('schedulerOff', lang)}</Text>
        <Text color="gray">  ·  </Text>
        <Text color={s.publish ? 'green' : 'yellow'}>{s.publish ? t('publishOn', lang) : t('publishOff', lang)}</Text>
        <Text color="gray">  ·  </Text>
        <Text color="magenta">{s.posts} {t('posts', lang)}</Text>
      </Text>
    </Box>
  );
}
