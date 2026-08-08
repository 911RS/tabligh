/**
 * English is the complete source of truth for the site's copy. Every other
 * locale is a Partial<Dict> that overrides what it has translated and falls
 * back to English for the rest, so a missing string is never a crash or a
 * blank — the same contract the terminal UI uses in src/tui/i18n.ts.
 *
 * Copy here is written to be indexed as much as read: the headings carry the
 * phrases people actually search for ("create a Quran reel", "Quran video
 * maker") without reading like keyword stuffing.
 */
export const en = {
  // ── meta / SEO ────────────────────────────────────────────────────────────
  htmlTitle: 'Tabligh — Free Quran Reel & Short Video Maker',
  metaTitle: 'Create Quran Reels Free — Karaoke Verse Videos for TikTok, Reels & Shorts',
  metaDescription:
    'Make cinematic Quran short videos in your browser, free and without signing up. Pick any surah and ayahs, choose a reciter, and get a vertical 1080×1920 MP4 with word-by-word karaoke subtitles, translation and a stock background — ready for TikTok, Instagram Reels, YouTube Shorts and Facebook.',
  ogAlt: 'A vertical Quran reel with gold karaoke text over a cinematic background',

  // ── nav ───────────────────────────────────────────────────────────────────
  navHome: 'Home',
  navStudio: 'Studio',
  navTemplates: 'Templates',
  navHow: 'How it works',
  navTools: 'Tools',
  navFaq: 'FAQ',
  navGithub: 'GitHub',
  skipToContent: 'Skip to content',
  chooseLanguage: 'Choose language',

  // ── hero ──────────────────────────────────────────────────────────────────
  heroBadge: 'Free forever · No account · Open source',
  heroTitleLead: 'Turn any ayah into a',
  heroTitleAccent: 'cinematic reel',
  heroSubtitle:
    'Choose a surah, a reciter and a look. We fetch the recitation, sync the words to the audio, and render a vertical video you can post anywhere — in about a minute, in your browser.',
  heroCtaPrimary: 'Create your reel',
  heroCtaSecondary: 'See how it works',
  heroNoteFree: 'No sign-up, no watermark, no cost',
  heroScroll: 'Scroll',

  statReciters: 'Reciters',
  statLanguages: 'Translations',
  statTemplates: 'Templates',
  statResolution: 'Vertical HD',

  // ── studio ────────────────────────────────────────────────────────────────
  studioKicker: 'The studio',
  studioTitle: 'Build your reel',
  studioSubtitle: 'Every option below changes only your video. Nothing is saved, and nothing is posted anywhere.',

  fieldPassage: 'Passage',
  fieldSurah: 'Surah',
  fieldAyahFrom: 'From ayah',
  fieldAyahTo: 'To ayah',
  fieldReciter: 'Reciter',
  fieldTranslation: 'Translation',
  fieldTemplate: 'Template',
  fieldBackground: 'Background',
  fieldKeywords: 'Background keywords',
  keywordsPlaceholder: 'e.g. mosque at sunset',
  keywordsHelp: 'Leave empty for a curated scene. People are always filtered out.',
  // Shown once the visitor has opted in, where "leave empty" would contradict
  // the toggle they just turned on.
  keywordsHelpOn: 'A place or a mood — two or three words. People are always filtered out.',
  fieldBasmala: 'Bismillah intro',
  fieldColor: 'Karaoke colour',
  fieldHandle: 'Your handle',
  handlePlaceholder: '@yourname',

  optionsTitle: 'Fine tuning',
  optKaraoke: 'Word-by-word karaoke',
  optKaraokeHelp: 'Highlight each word as it is recited',
  optParticles: 'Light particles',
  optParticlesHelp: 'Drifting glints over the video',
  optBgAnimation: 'Background motion',
  optBgAnimationHelp: 'Slow cinematic zoom',
  optWatermark: 'Show my handle',
  optCustomBackground: 'Customize background keywords',
  optBasmalaAlways: 'Bismillah every passage',
  optWatermarkHelp: 'Adds your handle in the corner',
  optCredit: 'Credit Tabligh in the outro',
  optCreditHelp: 'Helps other people find this tool',

  basmalaOff: 'From ayah 1 only',
  basmalaAlways: 'Every passage',
  bgAuto: 'Automatic',
  bgPexels: 'Pexels only',
  bgUnsplash: 'Unsplash only',
  translationNone: 'Arabic only',

  btnGenerate: 'Render my reel',
  btnGenerating: 'Rendering…',
  btnCancel: 'Cancel',
  btnDownload: 'Download MP4',
  btnAnother: 'Make another',
  btnCopyLink: 'Copy link',
  btnCopied: 'Copied',

  stateQueued: 'Waiting in line',
  stateFetching: 'Fetching the verses',
  stateTiming: 'Syncing words to the recitation',
  stateBackground: 'Choosing a background',
  stateRendering: 'Painting frames',
  stateEncoding: 'Encoding the video',
  stateDone: 'Your reel is ready',
  stateFailed: 'Something went wrong',

  queuePosition: 'Position in queue',
  queueOf: 'of',
  etaAbout: 'about',
  etaSeconds: 'seconds left',
  etaMinutes: 'minutes left',
  expiresIn: 'Kept for {n} more minutes — and {g} minutes after you download it.',
  renderNote: 'Renders take about a minute. Keep this tab open.',
  errorGeneric: 'The render failed. Please try a shorter passage.',
  errorBusy: 'The queue is full right now. Please try again in a few minutes.',
  metaLoading: 'Loading surahs and reciters…',
  metaFailedTitle: 'The studio could not load',
  metaFailedBody: 'We could not reach the server to fetch the surah list and reciters. Check your connection and try again.',
  metaRetry: 'Try again',
  clampNote: 'Public renders are capped at {n} ayahs. Self-host for unlimited length.',

  resultTitle: 'Ready to post',
  resultDuration: 'Duration',
  resultSize: 'Size',
  resultPhoto: 'Background photo',

  // ── templates ─────────────────────────────────────────────────────────────
  templatesKicker: 'Looks',
  templatesTitle: 'Pick the look that fits your feed',
  templatesSubtitle: 'The same ayah, the same recitation — three different treatments. Switch between them and watch the preview change.',
  tplClassic: 'Classic',
  tplClassicDesc: 'A cinematic photo behind a dark scrim, with the ayah centred and the recitation lighting each word in turn.',
  tplGlass: 'Glass',
  tplGlassDesc: 'One frosted panel that holds the verse steady while a live waveform of the recitation moves beneath it.',
  tplNoor: 'Noor',
  tplNoorDesc: 'A warm golden halo with gilded Arabic numerals — the quietest of the three, and the most reverent.',
  templatePreviewAria: 'Preview of the {name} template',
  previewLive: 'Live preview',
  previewNote: 'The real reel is animated, with the recitation and karaoke timing.',

  // ── studio steps ──────────────────────────────────────────────────────────
  stepPassageTitle: 'What should it say?',
  stepVoiceTitle: 'Who should recite it?',
  stepLookTitle: 'How should it look?',
  stepPassageHint: 'Pick a surah, then the range of ayahs.',
  stepVoiceHint: 'Eight reciters, thirteen translation languages.',
  stepLookHint: 'Three templates. Fine-tune anything you like.',
  studioReady: 'Ready when you are',
  studioSummary: 'You are making',
  studioEstimate: 'Takes about a minute',
  studioBack: 'Back',
  studioNext: 'Next',

  // ── how it works ──────────────────────────────────────────────────────────
  howKicker: 'Under the hood',
  howTitle: 'What happens after you press render',
  howSubtitle: 'Five stages, no AI generation anywhere near the text or the recitation.',
  step1: 'Fetch the verses',
  step1Desc: 'Uthmani Arabic with full tashkeel, plus your chosen translation, straight from the Quran API.',
  step2: 'Download the recitation',
  step2Desc: 'The reciter’s own audio for each ayah, so timings are exact rather than estimated.',
  step3: 'Sync the words',
  step3Desc: 'Each ayah’s span is split across its words by letter weight, giving the karaoke highlight.',
  step4: 'Paint the frames',
  step4Desc: 'A headless browser renders 25 frames per second at 1080×1920 — real type, real shaping.',
  step5: 'Encode the video',
  step5Desc: 'ffmpeg muxes the frames and the recitation into an H.264 MP4 that every platform accepts.',
  howAccuracy: 'The Arabic text and the recitation are never generated, altered or paraphrased. They are fetched verbatim and rendered as-is.',

  // ── auto-poster ───────────────────────────────────────────────────────────
  autoKicker: 'Set it and forget it',
  autoTitle: 'It keeps posting while you sleep',
  autoSubtitle:
    'Run Tabligh on your own server and it picks a passage, renders it and publishes to every channel you connect — three times a day, for as long as you leave it running.',
  autoFeat1: 'Renders on a schedule',
  autoFeat1Desc: 'Set the times and the timezone. At each slot it picks a passage you have not posted yet, renders it, and queues it up.',
  autoFeat2: 'Posts to four platforms',
  autoFeat2Desc: 'Connect TikTok, Instagram, Facebook and YouTube once. Every reel goes out to all of them, captioned in the right language.',
  autoFeat3: 'Never repeats itself',
  autoFeat3Desc: 'A ledger of everything already published means it keeps moving through the Quran instead of looping the same famous ayahs.',
  autoCta: 'Set this up on your server',
  autoNote: 'None of this runs on tabligh.cc — publishing needs your own accounts, so it only exists when you host it yourself.',

  // ── tools / ways to use ───────────────────────────────────────────────────
  toolsKicker: 'Beyond the browser',
  toolsTitle: 'The studio is one of five ways in',
  toolsSubtitle:
    'This site is the easiest way to make a single reel. Everything it does — and a lot it deliberately does not — is available on your own machine or server.',
  toolWeb: 'Web studio',
  toolWebDesc: 'What you are using. One reel at a time, no install, no account. Capped to keep the queue moving.',
  toolWebTag: 'You are here',
  toolCli: 'Command line',
  toolCliDesc: 'Render or publish from a script or a cron job. Every flag the studio exposes, plus the ones it does not.',
  toolTui: 'Terminal command center',
  toolTuiDesc: 'A full interactive terminal UI — generate, queue passages, browse history, edit settings, run health checks.',
  toolPanel: 'Control panel',
  toolPanelDesc: 'A password-protected web dashboard for your own server: settings, queue, history, analytics and live logs.',
  toolScheduler: 'Auto-publish',
  toolSchedulerDesc: 'Run it always-on and it renders and posts to TikTok, Instagram, Facebook and YouTube on a schedule.',
  toolsNote: 'Publishing, scheduling and unlimited length are self-host only — this site never posts anything to social media.',

  // ── reciters ──────────────────────────────────────────────────────────────
  recitersKicker: 'Voices',
  recitersTitle: 'Choose the voice',
  recitersSubtitle: 'Eight reciters, every one in the Hafs reading that matches the Uthmani text on screen. Their own recordings — never synthesised.',

  // ── self host ─────────────────────────────────────────────────────────────
  selfKicker: 'Run it yourself',
  selfTitle: 'Your server, your rules, no limits',
  selfSubtitle:
    'One command brings up the whole thing — scheduler, control panel and all. No queue, no length cap, and it can publish to your own accounts.',
  selfDocker: 'With Docker',
  selfNpm: 'From source',
  selfStars: 'stars',
  selfStar: 'Star on GitHub',
  selfDocs: 'Read the docs',
  selfLicense: 'MIT licensed',

  // ── faq ───────────────────────────────────────────────────────────────────
  faqKicker: 'Questions',
  faqTitle: 'Frequently asked',
  faqQ1: 'Is it really free?',
  faqA1: 'Yes. There is no account, no payment and no watermark on your video. The project is open source under the MIT licence and this site is run as sadaqah jariyah.',
  faqQ2: 'Can I post these videos on TikTok, Instagram or YouTube?',
  faqA2: 'Yes. Every reel is a standard vertical 1080×1920 H.264 MP4, which is exactly what TikTok, Instagram Reels, YouTube Shorts and Facebook Reels expect. The video is yours to post.',
  faqQ3: 'Where does the Arabic text and the recitation come from?',
  faqA3: 'The Uthmani text and translations come from the Quran API, and the recitation is the reciter’s own audio from EveryAyah. Nothing is AI-generated, paraphrased or altered — the text is rendered exactly as fetched.',
  faqQ4: 'How long does a reel take to make?',
  faqA4: 'Usually under two minutes, depending on how long your passage is and how many people are ahead of you in the queue. You will see your position and an estimate while it renders.',
  faqQ5: 'Why is the passage length limited?',
  faqA5: 'Each reel is rendered frame by frame, which costs real CPU time on a shared server. The cap keeps the queue moving for everyone. Self-host it and there is no limit at all.',
  faqQ6: 'Do you keep my video?',
  faqA6: 'No. Your file is deleted from the server about an hour after it is rendered, and nothing about your request is stored or tracked. Download it while the tab is open.',
  faqQ7: 'Can I use my own background images?',
  faqA7: 'On this site you can steer the stock photo search with keywords. If you self-host, you can point it at a folder of your own images instead.',
  faqQ8: 'Can it post to my social accounts automatically?',
  faqA8: 'Not from this site — that would mean handing over your accounts. Self-host it and the built-in scheduler can render and publish to TikTok, Instagram, Facebook and YouTube several times a day on its own.',

  // ── footer ────────────────────────────────────────────────────────────────
  footerTagline: 'Convey from me, even one verse.',
  footerHadith: '— Sahih al-Bukhari',
  footerBuilt: 'Open source, MIT licensed.',
  footerSource: 'Source code',
  footerIssues: 'Report an issue',
  footerLangs: 'Available in',
  footerSadaqah: 'Made as sadaqah jariyah. Use it, fork it, host it.',
} as const;

/**
 * `as const` above gives us exact key inference, but it also narrows every
 * value to its own string literal — which would make a translated override a
 * type error. Widening the values back to `string` keeps the key safety and
 * drops the literal constraint.
 */
export type DictKey = keyof typeof en;
export type Dict = Record<DictKey, string>;
