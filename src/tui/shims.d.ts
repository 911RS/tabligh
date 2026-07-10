// Minimal type declarations for the ink add-ons that don't ship their own.
declare module 'ink-gradient' {
  import type { ReactNode } from 'react';
  const Gradient: (props: { name?: string; colors?: string[]; children?: ReactNode }) => JSX.Element;
  export default Gradient;
}
declare module 'ink-big-text' {
  const BigText: (props: { text: string; font?: string; colors?: string[]; align?: string }) => JSX.Element;
  export default BigText;
}
