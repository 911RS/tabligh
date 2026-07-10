import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import type { UiLang } from '../store/store.js';
import { isRtl } from './i18n.js';

// ── Banner ──────────────────────────────────────────────────────────────────
export function Banner({ tagline }: { tagline: string }) {
  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Gradient name="morning">
        <BigText text="TABLIGH" font="tiny" />
      </Gradient>
      <Text color="gray">🕌 {tagline}</Text>
    </Box>
  );
}

// ── Spinner ─────────────────────────────────────────────────────────────────
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
export function Spinner({ label }: { label: string }) {
  const [f, setF] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setF((x) => (x + 1) % FRAMES.length), 80);
    return () => clearInterval(id);
  }, []);
  return (
    <Text>
      <Text color="cyan">{FRAMES[f]}</Text> {label}
    </Text>
  );
}

// ── Framed panel ────────────────────────────────────────────────────────────
export function Frame({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
      {title ? <Text bold color="cyan">{title}</Text> : null}
      {children}
    </Box>
  );
}

// ── Select list ─────────────────────────────────────────────────────────────
export interface SelectItem {
  label: string;
  value: string;
  hint?: string;
}
export function Select({
  items,
  onSelect,
  onCancel,
  rtl = false,
}: {
  items: SelectItem[];
  onSelect: (item: SelectItem) => void;
  onCancel?: () => void;
  rtl?: boolean;
}) {
  const [i, setI] = useState(0);
  useInput((input, key) => {
    if (key.upArrow || input === 'k') setI((p) => (p - 1 + items.length) % items.length);
    else if (key.downArrow || input === 'j') setI((p) => (p + 1) % items.length);
    else if (key.return) onSelect(items[i]);
    else if (key.escape && onCancel) onCancel();
  });
  return (
    <Box flexDirection="column">
      {items.map((it, idx) => {
        const active = idx === i;
        const pointer = active ? (rtl ? '◀ ' : '❯ ') : '  ';
        return (
          <Text key={it.value} color={active ? 'cyan' : undefined} bold={active}>
            {pointer}
            {it.label}
            {it.hint ? <Text color="gray">{'  ' + it.hint}</Text> : null}
          </Text>
        );
      })}
    </Box>
  );
}

// ── Text input ──────────────────────────────────────────────────────────────
export function TextInput({
  label,
  initial = '',
  mask = false,
  onSubmit,
  onCancel,
}: {
  label: string;
  initial?: string;
  mask?: boolean;
  onSubmit: (value: string) => void;
  onCancel?: () => void;
}) {
  const [val, setVal] = useState(initial);
  useInput((input, key) => {
    if (key.return) onSubmit(val);
    else if (key.escape && onCancel) onCancel();
    else if (key.backspace || key.delete) setVal((v) => v.slice(0, -1));
    else if (input && !key.ctrl && !key.meta && !key.tab) setVal((v) => v + input);
  });
  const shown = mask ? '*'.repeat(val.length) : val;
  return (
    <Text>
      <Text color="cyan">? </Text>
      {label}: {shown}
      <Text inverse> </Text>
      <Text color="gray">  (Enter ✓ · Esc ✗)</Text>
    </Text>
  );
}

// ── Status badge helpers ────────────────────────────────────────────────────
export function statusColor(status: 'pass' | 'warn' | 'fail'): string {
  return status === 'pass' ? 'green' : status === 'warn' ? 'yellow' : 'red';
}
export function statusIcon(status: 'pass' | 'warn' | 'fail'): string {
  return status === 'pass' ? '✓' : status === 'warn' ? '!' : '✗';
}

// ── A transient result/message view with "press Enter" ──────────────────────
export function MessageView({
  lines,
  onDone,
  color = 'green',
}: {
  lines: string[];
  onDone: () => void;
  color?: string;
}) {
  useInput((_i, key) => {
    if (key.return || key.escape) onDone();
  });
  return (
    <Box flexDirection="column">
      {lines.map((l, idx) => (
        <Text key={idx} color={idx === 0 ? color : undefined}>{l}</Text>
      ))}
      <Text color="gray">— Press Enter to continue —</Text>
    </Box>
  );
}

export const dirFor = (lang: UiLang) => (isRtl(lang) ? 'row-reverse' : 'row');
