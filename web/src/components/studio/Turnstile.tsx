import { useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile — the bot check in front of the render queue.
 *
 * There is no signup here and one request costs about a hundred seconds of CPU,
 * so the per-IP quota is the only thing between a script and the server — and a
 * proxy pool walks straight past it, because every fresh address gets a fresh
 * allowance. This changes the question from "have I seen this address before?"
 * to "is this a browser at all?", which is the one a script cannot cheaply
 * answer.
 *
 * Rendered only when the server reports a site key. With none configured the
 * script is never loaded, nothing appears, and `verifyTurnstile` on the server
 * skips verification — so the whole feature is inert until an operator turns it
 * on, and self-hosters are not forced into a Cloudflare dependency.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
    onTurnstileReady?: () => void;
  }
}

const SCRIPT_ID = 'cf-turnstile';
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Load Cloudflare's script once per page, and resolve when it is usable. */
let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('turnstile failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile failed to load'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export interface TurnstileHandle {
  /** Clear the current token and ask for a new one. */
  reset: () => void;
}

export function Turnstile({
  siteKey,
  onToken,
  handleRef,
  className,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  handleRef?: React.MutableRefObject<TurnstileHandle | null>;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  // Held in a ref so re-renders never tear the widget down and remount it —
  // Turnstile issues one token per widget, and remounting throws it away.
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    let cancelled = false;

    void loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: siteKey,
          // A token is single-use and short-lived. Letting the widget refresh
          // itself means a visitor who fills the form slowly, or renders twice,
          // is not handed an expired one.
          'refresh-expired': 'auto',
          callback: (token: string) => cb.current(token),
          'expired-callback': () => cb.current(''),
          'error-callback': () => cb.current(''),
        });
        if (handleRef) {
          handleRef.current = {
            reset: () => {
              cb.current('');
              if (widget.current) window.turnstile?.reset(widget.current);
            },
          };
        }
      })
      .catch(() => {
        // Cloudflare unreachable. Leave the token empty: the server decides
        // what an empty token means, and it is the server's job to refuse.
        cb.current('');
      });

    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
      if (handleRef) handleRef.current = null;
    };
  }, [siteKey, handleRef]);

  return <div ref={box} className={className} />;
}
