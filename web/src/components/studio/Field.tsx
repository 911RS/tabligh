import { useState } from 'react';
import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Studio control primitives.
 *
 * Two rules, both learned from the version this replaces:
 *
 *  1. A control must look like a control before you touch it. The old chrome
 *     was a white border on a white fill over a near-white panel, which meant
 *     every select and input read as a hole in the layout — the studio looked
 *     broken even when it was working perfectly.
 *  2. Groups are separated by a rule and a small caps label, not by an icon in
 *     a tinted plate. Six icon plates down one column is decoration competing
 *     with the only decoration that matters here, which is the preview.
 */

const CONTROL =
  'h-11 w-full rounded-xl border border-border-strong bg-white px-3.5 text-[0.9rem] font-medium text-ink ' +
  'shadow-[inset_0_1px_2px_rgba(28,25,23,0.05)] outline-none transition-all ' +
  'placeholder:font-normal placeholder:text-ink-3 hover:border-ink-3/45 ' +
  'focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15 ' +
  'disabled:cursor-not-allowed disabled:border-border disabled:bg-base-2/60 disabled:text-ink-3';

/** A ruled group of related controls. */
export function Fieldset({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border-b border-border px-5 py-5 last:border-b-0 sm:px-7', className)}>
      <h3 className="mb-3.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-3"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-[0.7rem] leading-snug text-ink-3">{hint}</p>}
    </div>
  );
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...rest} className={cn(CONTROL, 'cursor-pointer appearance-none pe-10', className)}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
    </div>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn(CONTROL, className)} />;
}

/**
 * A number field you can actually clear.
 *
 * Bound straight to `Number(e.target.value)` this is unusable: clearing the box
 * yields `''`, `Number('')` is `0`, so the field snaps to "0" and the next
 * keystroke appends to it — you try to type 6 and get "06". The fix is to let
 * the input hold a *string* draft while it has focus, so an empty box is
 * allowed to stay empty, and to commit a clamped number on blur.
 */
export function NumberInput({
  value,
  onValueChange,
  min = 1,
  max,
  className,
  ...rest
}: {
  value: number;
  onValueChange: (n: number) => void;
  min?: number;
  max?: number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'min' | 'max'>) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    const n = Number(draft);
    // An empty or nonsense box falls back to the last good value rather than
    // to zero — there is no ayah 0.
    const next = draft === null || draft === '' || !Number.isFinite(n) ? value : n;
    const clamped = Math.min(Math.max(Math.round(next), min), max ?? Number.MAX_SAFE_INTEGER);
    setDraft(null);
    if (clamped !== value) onValueChange(clamped);
  };

  return (
    <input
      {...rest}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={draft ?? String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        // Report as you type so the preview keeps up, but never report the
        // empty box — that is what used to write a 0 into the form.
        const n = Number(raw);
        if (raw !== '' && Number.isFinite(n) && n >= min) onValueChange(Math.round(n));
      }}
      onBlur={(e) => {
        commit();
        rest.onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        rest.onKeyDown?.(e);
      }}
      className={cn(CONTROL, 'tabular-nums', className)}
    />
  );
}

/**
 * Karaoke colour.
 *
 * A native colour well next to a hex box is a developer's control: it asks you
 * to know what you want and gives no idea what any of it looks like over a
 * reel. These six are the fills that actually read on a photographic
 * background — white and warm golds first, because that is what almost
 * everyone picks — with the native picker still there behind "custom" for
 * anyone matching a brand colour exactly.
 */
const SWATCHES: { value: string; name: string }[] = [
  { value: '#ffffff', name: 'White' },
  { value: '#f7d488', name: 'Gold' },
  { value: '#f9a825', name: 'Amber' },
  { value: '#a7f3d0', name: 'Mint' },
  { value: '#93c5fd', name: 'Sky' },
  { value: '#fda4af', name: 'Rose' },
];

export function ColorField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const current = value.toLowerCase();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {SWATCHES.map((s) => {
        const on = current === s.value;
        return (
          <button
            key={s.value}
            type="button"
            aria-label={s.name}
            aria-pressed={on}
            title={s.name}
            onClick={() => onChange(s.value)}
            className={cn(
              'h-8 w-8 rounded-full transition-transform',
              // The ring sits outside the swatch so it never alters the colour
              // being judged — an inset selection state on a white swatch is
              // invisible, which is the whole problem with picking white.
              on
                ? 'scale-110 ring-2 ring-accent ring-offset-2 ring-offset-white'
                : 'ring-1 ring-black/15 hover:scale-105',
            )}
            style={{ background: s.value }}
          />
        );
      })}

      <label
        className="relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border-strong bg-white ps-1.5 pe-1 transition-colors hover:border-ink-3/45 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15"
        title={label}
      >
        <span
          aria-hidden="true"
          className="h-6 w-6 shrink-0 rounded-full ring-1 ring-black/15"
          style={{ background: value }}
        />
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        {/* Still typable, so an exact brand hex can be pasted in. */}
        <input
          type="text"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pattern="#[0-9a-fA-F]{6}"
          maxLength={7}
          spellCheck={false}
          className="relative w-[5.5rem] bg-transparent pe-2 font-ui text-[0.78rem] font-semibold uppercase tabular-nums text-ink outline-none"
        />
      </label>
    </div>
  );
}

/**
 * An on/off option, as a chip you click rather than a switch you flick.
 *
 * The switch version of this was 9rem wide before its label even started, so
 * four of them could never share a row and the fine-tuning group turned into a
 * stack of chunky rockers. A chip is the width of its own text, and a filled
 * state plus a check is unambiguous enough without a knob. It stays
 * `role="switch"` for assistive tech — the semantics did not change, only the
 * amount of furniture.
 */
export function ToggleChip({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[0.76rem] font-semibold transition-all',
        disabled && 'cursor-not-allowed opacity-50',
        checked
          ? 'border-accent bg-accent text-white shadow-accent'
          : 'border-border-strong bg-white text-ink-3 hover:border-ink-3/45 hover:text-ink-2',
      )}
    >
      <Check
        aria-hidden="true"
        className={cn('h-3.5 w-3.5 shrink-0 transition-opacity', checked ? 'opacity-100' : 'opacity-30')}
      />
      {label}
    </button>
  );
}
