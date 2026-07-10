import { Box, Text, useInput } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

// Vivid "chroma" gradient — teal → cyan → violet → gold → amber (dusk palette).
const CHROMA = ['#00e0a4', '#12d8fa', '#7b6cff', '#ffd166', '#ff8c42'];

// A little mosque — dome, arch, two minarets. Each row is centred on its own,
// so the exact widths don't have to match.
const MOSQUE = [
  '✦',
  '╭─●─╮',
  '╱     ╲',
  '╷  ┃ ▟█▙ ┃  ╷',
  '┃  ┃ █▉█ ┃  ┃',
  '━┻━━┻━━━━━┻━━┻━',
];

/** Big chroma-gradient TABLIGH wordmark with a mosque above it. */
export function Banner() {
  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      {MOSQUE.map((l, i) => <Gradient key={i} colors={CHROMA}><Text>{l}</Text></Gradient>)}
      <Gradient colors={CHROMA}><BigText text="TABLIGH" font="block" /></Gradient>
      <Text color="gray">بلّغوا عني ولو آية  ·  Convey from me, even one verse</Text>
    </Box>
  );
}

export interface NavItem {
  key: string;
  label: string;
  badge?: string;
  danger?: boolean;
}

/** Arrow-key list; input is captured only while `isActive`. The highlighted
 * index is owned by the parent so a detail pane can react to it live. */
export function NavList({
  items, index, setIndex, onSelect, onBack, isActive = true, rtl = false,
}: {
  items: NavItem[];
  index: number;
  setIndex: (i: number) => void;
  onSelect: (item: NavItem, index: number) => void;
  onBack?: () => void;
  isActive?: boolean;
  rtl?: boolean;
}) {
  useInput((input, key) => {
    if (key.upArrow || input === 'k') setIndex((index - 1 + items.length) % items.length);
    else if (key.downArrow || input === 'j') setIndex((index + 1) % items.length);
    else if (key.return) onSelect(items[index], index);
    else if (key.escape && onBack) onBack();
  }, { isActive });

  return (
    <Box flexDirection="column">
      {items.map((it, i) => {
        const active = i === index;
        const color = active ? (isActive ? (it.danger ? 'red' : 'cyan') : 'white') : it.danger ? 'red' : 'gray';
        return (
          <Text key={it.key} color={color} bold={active && isActive} wrap="truncate-end">
            {active ? (rtl ? '◀ ' : '❯ ') : '  '}
            {it.label}
            {it.badge ? <Text color="gray">{'  ' + it.badge}</Text> : null}
          </Text>
        );
      })}
    </Box>
  );
}

/** Right-pane heading + body lines. */
export function Detail({ title, lines }: { title: string; lines: (string | React.ReactNode)[] }) {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">{title}</Text>
      <Box marginTop={1} flexDirection="column">
        {lines.filter((l) => l !== '').map((l, i) => (typeof l === 'string' ? <Text key={i}>{l}</Text> : <Box key={i}>{l}</Box>))}
      </Box>
    </Box>
  );
}
