import { useState } from 'react';
import { AudioLines, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { useMeta } from '@/lib/hooks';
import { Section, SectionHeading } from './Section';
import { BlurFade } from '@/components/ui/blur-fade';
import { Panel } from './Panel';
import { BorderBeam } from '@/components/ui/border-beam';
import { Marquee } from '@/components/ui/marquee';

/** A deterministic hue per reciter, so each monogram is distinct but the set
 *  still sits inside the page's mesh palette. */
const HUES = ['#ea580c', '#f97316', '#c2410c', '#d97706', '#b45309', '#e35d26', '#fb923c', '#9a3412'];

/**
 * Reciter cards. Photos are optional: drop `<reciter-id>.jpg` into
 * web/public/reciters/ and it appears automatically. Until then each card falls
 * back to a monogram, so the section never looks broken and we never ship a
 * likeness we do not have the rights to.
 */
function ReciterCard({
  id,
  name,
  style,
  index,
}: {
  id: string;
  name: string;
  style?: string;
  index: number;
}) {
  const [hasPhoto, setHasPhoto] = useState(true);
  const [hover, setHover] = useState(false);
  const initial = name.replace(/^(Al-|El-|Abdul\s)/i, '').trim().charAt(0).toUpperCase();
  const hue = HUES[index % HUES.length];

  return (
    <Panel className="h-full">
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="relative flex h-full flex-col items-center gap-4 rounded-[inherit] p-6 text-center"
      >
        {hover && <BorderBeam size={90} duration={5} colorFrom={hue} colorTo="#fb923c" />}

        <div className="relative">
          {hasPhoto ? (
            <img
              src={`/reciters/${id}.jpg`}
              alt={name}
              loading="lazy"
              onError={() => setHasPhoto(false)}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-white/70"
            />
          ) : (
            <div
              className="grid h-20 w-20 place-items-center rounded-full ring-4 ring-white/70"
              style={{ background: `linear-gradient(150deg, ${hue}22, ${hue}44)` }}
            >
              <span className="font-display text-2xl font-extrabold" style={{ color: hue }}>
                {initial}
              </span>
            </div>
          )}

          {/* Playing indicator — animates only while the card is hovered. */}
          <span
            className={cn(
              'absolute -bottom-1 -end-1 grid h-7 w-7 place-items-center rounded-full text-white shadow-md transition-transform duration-300',
              hover ? 'scale-100' : 'scale-0',
            )}
            style={{ background: hue }}
          >
            <Play className="h-3 w-3 fill-current" />
          </span>
        </div>

        <div>
          <p className="font-display text-[0.95rem] font-bold leading-snug text-ink">{name}</p>
          {style && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-ink-3">
              <AudioLines className="h-3 w-3" />
              {style}
            </span>
          )}
        </div>
      </div>
    </Panel>
  );
}

export function Reciters() {
  const { t } = useI18n();
  const meta = useMeta();
  const reciters = meta?.reciters ?? [];

  return (
    <Section id="reciters">
      <SectionHeading
        kicker={t('recitersKicker')}
        title={t('recitersTitle')}
        subtitle={t('recitersSubtitle')}
      />

      {reciters.length > 0 && (
        <>
          {/* A scanning grid on desktop — eight voices is few enough to show
              all at once, and a marquee would hide half of them. */}
          <div className="mt-10 hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {reciters.map((r, i) => (
              <BlurFade key={r.id} delay={0.05 * i} inView className="h-full">
                <ReciterCard {...r} index={i} />
              </BlurFade>
            ))}
          </div>

          {/* On phones the grid would be an endless column, so it scrolls. */}
          <div className="relative mt-10 sm:hidden">
            <Marquee pauseOnHover className="[--duration:40s]">
              {reciters.map((r, i) => (
                <div key={r.id} className="mx-2 w-[190px] shrink-0">
                  <ReciterCard {...r} index={i} />
                </div>
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 start-0 w-14 bg-gradient-to-r from-base to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 end-0 w-14 bg-gradient-to-l from-base to-transparent" />
          </div>
        </>
      )}
    </Section>
  );
}
