/**
 * Server-side SEO for a client-rendered app.
 *
 * A Vite SPA ships an empty <div id="root">. Google will usually render it
 * eventually, but every other crawler — Bing, social unfurlers, LLM indexers —
 * sees nothing, and even Google ranks a shell poorly. So the Node app rewrites
 * the built index.html per request: real <title>/<meta> for the requested
 * locale, a full hreflang set, structured data, and a <noscript>-safe block of
 * the actual marketing copy so there is crawlable text on first byte.
 *
 * The copy here is the same catalogue the React app uses, kept in one place so
 * the indexed text and the rendered text cannot drift apart.
 */

/** The ten locales, mirroring web/src/i18n/index.ts. */
export const LOCALES = ['en', 'ar', 'fr', 'es', 'tr', 'id', 'ms', 'ur', 'fa', 'bn'] as const;
export type Locale = (typeof LOCALES)[number];

const RTL = new Set<Locale>(['ar', 'ur', 'fa']);

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

interface Copy {
  title: string;
  description: string;
  h1: string;
  intro: string;
  /** Six short feature lines — the crawlable body text. */
  points: string[];
  faq: [string, string][];
}

/**
 * Per-locale indexable copy. Deliberately not the full UI catalogue: this is
 * only what needs to exist in the HTML source for search. The headline phrases
 * are the ones people actually type ("create Quran reel", "Quran video maker").
 */
const COPY: Record<Locale, Copy> = {
  en: {
    title: 'Create Quran Reels Free — Quran Short Video Maker | Tabligh',
    description:
      'Make cinematic Quran short videos in your browser, free and without signing up. Any surah, any reciter, word-by-word karaoke subtitles and translation, exported as a vertical 1080×1920 MP4 for TikTok, Instagram Reels, YouTube Shorts and Facebook.',
    h1: 'Create a Quran reel, free',
    intro:
      'Tabligh is a free, open-source Quran video maker. Choose a surah and a range of ayahs, pick one of eight reciters, and get a vertical short video with the verse rendered in Uthmani Arabic, a word-by-word karaoke highlight synced to the recitation, your chosen translation and a cinematic background — ready to post.',
    points: [
      'Free Quran reel maker — no account, no watermark, no payment.',
      'Word-by-word karaoke subtitles synced to the reciter’s own audio.',
      'Vertical 1080×1920 MP4 for TikTok, Instagram Reels, YouTube Shorts and Facebook Reels.',
      'Eight reciters in the Hafs reading, and translations in thirteen languages.',
      'Three cinematic templates: classic, frosted glass and a golden Noor style.',
      'Open source and self-hostable, with a scheduler that can auto-publish for you.',
    ],
    faq: [
      ['Is this Quran video maker free?', 'Yes — no account, no payment and no watermark. It is open source under the MIT licence.'],
      ['Can I post these videos on TikTok, Instagram or YouTube?', 'Yes. Every reel is a vertical 1080×1920 H.264 MP4, exactly the format TikTok, Instagram Reels, YouTube Shorts and Facebook expect.'],
      ['Where does the Quran text and recitation come from?', 'The Uthmani text and translations come from the Quran API and the recitation is the reciter’s own audio from EveryAyah. Nothing is AI-generated or altered.'],
      ['How long does it take to make a Quran reel?', 'Usually under two minutes, depending on passage length and how many people are in the queue.'],
    ],
  },
  ar: {
    title: 'أنشئ ريلز قرآنية مجاناً — صانع فيديوهات قرآنية قصيرة | تبليغ',
    description:
      'اصنع مقاطع قرآنية سينمائية من متصفحك مجاناً وبدون تسجيل. أي سورة، أي قارئ، تظليل الكلمات مع التلاوة والترجمة، بصيغة MP4 عمودية 1080×1920 لتيك توك وإنستغرام ويوتيوب شورتس وفيسبوك.',
    h1: 'أنشئ مقطعاً قرآنياً مجاناً',
    intro:
      'تبليغ أداة مجانية ومفتوحة المصدر لصنع فيديوهات قرآنية. اختر السورة ونطاق الآيات، واختر أحد ثمانية قرّاء، لتحصل على مقطع عمودي بالنص العثماني وتظليل الكلمات مع التلاوة والترجمة وخلفية سينمائية — جاهز للنشر.',
    points: [
      'صانع ريلز قرآنية مجاني — بلا حساب وبلا علامة مائية وبلا دفع.',
      'تظليل الكلمات كلمة بكلمة متزامن مع صوت القارئ نفسه.',
      'ملف MP4 عمودي 1080×1920 لتيك توك وإنستغرام ويوتيوب شورتس وفيسبوك.',
      'ثمانية قرّاء برواية حفص، وترجمات بثلاث عشرة لغة.',
      'ثلاثة قوالب سينمائية: كلاسيكي وزجاجي ونور الذهبي.',
      'مفتوح المصدر وقابل للاستضافة الذاتية، مع مجدول ينشر تلقائياً نيابة عنك.',
    ],
    faq: [
      ['هل صانع الفيديوهات القرآنية مجاني؟', 'نعم — بلا حساب وبلا دفع وبلا علامة مائية. المشروع مفتوح المصدر برخصة MIT.'],
      ['هل يمكنني نشر هذه المقاطع على تيك توك أو إنستغرام أو يوتيوب؟', 'نعم. كل مقطع ملف MP4 عمودي 1080×1920 بترميز H.264، وهو تماماً ما تتوقعه هذه المنصات.'],
      ['من أين يأتي النص القرآني والتلاوة؟', 'النص العثماني والترجمات من واجهة القرآن، والتلاوة صوت القارئ نفسه من EveryAyah. لا شيء مُولّد أو مُعدّل.'],
      ['كم يستغرق إنشاء المقطع؟', 'أقل من دقيقتين عادة، حسب طول المقطع وعدد المنتظرين في الطابور.'],
    ],
  },
  fr: {
    title: 'Créer des Reels coraniques gratuitement — Créateur de vidéos du Coran | Tabligh',
    description:
      'Créez des vidéos coraniques cinématographiques dans votre navigateur, gratuitement et sans inscription. Toute sourate, tout récitateur, sous-titres karaoké mot à mot et traduction, en MP4 vertical 1080×1920 pour TikTok, Reels, Shorts et Facebook.',
    h1: 'Créez un reel coranique, gratuitement',
    intro:
      'Tabligh est un créateur de vidéos coraniques gratuit et open source. Choisissez une sourate et des versets, l’un des huit récitateurs, et obtenez une vidéo verticale avec le texte outhmanien, un karaoké mot à mot synchronisé à la récitation, votre traduction et un fond cinématographique — prête à publier.',
    points: [
      'Créateur de Reels coraniques gratuit — sans compte, sans filigrane, sans paiement.',
      'Sous-titres karaoké mot à mot synchronisés avec l’audio du récitateur.',
      'MP4 vertical 1080×1920 pour TikTok, Instagram Reels, YouTube Shorts et Facebook.',
      'Huit récitateurs en lecture Hafs et des traductions en treize langues.',
      'Trois styles cinématographiques : classique, verre dépoli et Noor doré.',
      'Open source et auto-hébergeable, avec un planificateur de publication automatique.',
    ],
    faq: [
      ['Ce créateur de vidéos coraniques est-il gratuit ?', 'Oui — sans compte, sans paiement et sans filigrane. Le projet est open source sous licence MIT.'],
      ['Puis-je publier ces vidéos sur TikTok, Instagram ou YouTube ?', 'Oui. Chaque reel est un MP4 vertical 1080×1920 en H.264, exactement le format attendu par ces plateformes.'],
      ['D’où viennent le texte coranique et la récitation ?', 'Le texte outhmanien et les traductions viennent de l’API du Coran, la récitation est l’audio du récitateur depuis EveryAyah. Rien n’est généré par IA.'],
      ['Combien de temps pour créer un reel coranique ?', 'Moins de deux minutes en général, selon la longueur du passage et la file d’attente.'],
    ],
  },
  es: {
    title: 'Crear Reels del Corán gratis — Creador de vídeos cortos del Corán | Tabligh',
    description:
      'Crea vídeos coránicos cinematográficos desde tu navegador, gratis y sin registro. Cualquier sura, cualquier recitador, subtítulos karaoke palabra por palabra y traducción, en MP4 vertical 1080×1920 para TikTok, Reels, Shorts y Facebook.',
    h1: 'Crea un reel del Corán, gratis',
    intro:
      'Tabligh es un creador de vídeos del Corán gratuito y de código abierto. Elige una sura y un rango de aleyas, uno de ocho recitadores, y obtén un vídeo vertical con el texto uzmaní, karaoke palabra por palabra sincronizado con la recitación, tu traducción y un fondo cinematográfico.',
    points: [
      'Creador de Reels del Corán gratis — sin cuenta, sin marca de agua, sin pago.',
      'Subtítulos karaoke palabra por palabra sincronizados con el audio del recitador.',
      'MP4 vertical 1080×1920 para TikTok, Instagram Reels, YouTube Shorts y Facebook.',
      'Ocho recitadores en lectura Hafs y traducciones en trece idiomas.',
      'Tres estilos cinematográficos: clásico, cristal esmerilado y Noor dorado.',
      'Código abierto y auto-alojable, con un planificador que publica por ti.',
    ],
    faq: [
      ['¿Este creador de vídeos del Corán es gratis?', 'Sí — sin cuenta, sin pago y sin marca de agua. Es código abierto con licencia MIT.'],
      ['¿Puedo publicar estos vídeos en TikTok, Instagram o YouTube?', 'Sí. Cada reel es un MP4 vertical 1080×1920 en H.264, justo lo que esperan esas plataformas.'],
      ['¿De dónde vienen el texto del Corán y la recitación?', 'El texto uzmaní y las traducciones vienen de la API del Corán y la recitación es el audio del recitador desde EveryAyah.'],
      ['¿Cuánto tarda en crearse un reel del Corán?', 'Normalmente menos de dos minutos, según la longitud del pasaje y la cola.'],
    ],
  },
  tr: {
    title: 'Ücretsiz Kuran Reels oluştur — Kuran kısa video yapıcı | Tabligh',
    description:
      'Tarayıcınızda ücretsiz ve üyeliksiz sinematik Kuran videoları oluşturun. Her sure, her kâri, kelime kelime karaoke altyazı ve meal, TikTok, Reels, Shorts ve Facebook için dikey 1080×1920 MP4.',
    h1: 'Ücretsiz bir Kuran reels oluşturun',
    intro:
      'Tabligh, ücretsiz ve açık kaynaklı bir Kuran video yapıcısıdır. Sure ve ayet aralığını, sekiz kâriden birini seçin; Osmanî metin, tilavetle eşitlenmiş kelime kelime karaoke, meal ve sinematik arka planla dikey bir video alın.',
    points: [
      'Ücretsiz Kuran Reels yapıcı — hesap yok, filigran yok, ödeme yok.',
      'Kârinin kendi sesiyle eşitlenmiş kelime kelime karaoke altyazı.',
      'TikTok, Instagram Reels, YouTube Shorts ve Facebook için dikey 1080×1920 MP4.',
      'Hafs kıraatinde sekiz kâri ve on üç dilde meal.',
      'Üç sinematik şablon: klasik, buzlu cam ve altın Nur.',
      'Açık kaynak ve kendi sunucunuzda çalıştırılabilir, otomatik paylaşım zamanlayıcısıyla.',
    ],
    faq: [
      ['Bu Kuran video yapıcı ücretsiz mi?', 'Evet — hesap, ödeme ve filigran yok. MIT lisanslı açık kaynak bir projedir.'],
      ['Bu videoları TikTok, Instagram veya YouTube’da paylaşabilir miyim?', 'Evet. Her reels dikey 1080×1920 H.264 MP4’tür; bu platformların beklediği tam olarak budur.'],
      ['Kuran metni ve tilavet nereden geliyor?', 'Osmanî metin ve mealler Kuran API’sinden, tilavet EveryAyah üzerinden kârinin kendi kaydından gelir.'],
      ['Bir Kuran reels ne kadar sürede hazırlanır?', 'Genellikle iki dakikadan az; bölüm uzunluğuna ve kuyruğa bağlı.'],
    ],
  },
  id: {
    title: 'Buat Reels Al-Quran gratis — Pembuat video pendek Al-Quran | Tabligh',
    description:
      'Buat video Al-Quran sinematik di browser, gratis dan tanpa mendaftar. Surah apa pun, qari mana pun, teks karaoke per kata dan terjemahan, MP4 vertikal 1080×1920 untuk TikTok, Reels, Shorts, dan Facebook.',
    h1: 'Buat Reels Al-Quran, gratis',
    intro:
      'Tabligh adalah pembuat video Al-Quran gratis dan sumber terbuka. Pilih surah dan rentang ayat, salah satu dari delapan qari, lalu dapatkan video vertikal dengan teks Utsmani, karaoke per kata yang selaras dengan bacaan, terjemahan, dan latar sinematik.',
    points: [
      'Pembuat Reels Al-Quran gratis — tanpa akun, tanpa watermark, tanpa biaya.',
      'Teks karaoke per kata yang selaras dengan audio qari sendiri.',
      'MP4 vertikal 1080×1920 untuk TikTok, Instagram Reels, YouTube Shorts, dan Facebook.',
      'Delapan qari riwayat Hafs dan terjemahan dalam tiga belas bahasa.',
      'Tiga template sinematik: klasik, kaca buram, dan Noor keemasan.',
      'Sumber terbuka dan bisa dipasang sendiri, dengan penjadwal unggah otomatis.',
    ],
    faq: [
      ['Apakah pembuat video Al-Quran ini gratis?', 'Ya — tanpa akun, tanpa bayaran, dan tanpa watermark. Sumber terbuka berlisensi MIT.'],
      ['Bolehkah saya unggah video ini ke TikTok, Instagram, atau YouTube?', 'Boleh. Setiap reels adalah MP4 vertikal 1080×1920 H.264, persis yang diharapkan platform tersebut.'],
      ['Dari mana teks Al-Quran dan bacaannya berasal?', 'Teks Utsmani dan terjemahan dari Quran API, bacaannya audio qari sendiri dari EveryAyah.'],
      ['Berapa lama membuat satu Reels Al-Quran?', 'Biasanya kurang dari dua menit, tergantung panjang petikan dan antrean.'],
    ],
  },
  ms: {
    title: 'Cipta Reels Al-Quran percuma — Pencipta video pendek Al-Quran | Tabligh',
    description:
      'Cipta video Al-Quran sinematik dalam pelayar anda, percuma dan tanpa pendaftaran. Mana-mana surah, mana-mana qari, sari kata karaoke setiap perkataan dan terjemahan, MP4 menegak 1080×1920.',
    h1: 'Cipta Reels Al-Quran, percuma',
    intro:
      'Tabligh ialah pencipta video Al-Quran percuma dan sumber terbuka. Pilih surah dan julat ayat, salah satu daripada lapan qari, dan dapatkan video menegak dengan teks Uthmani, karaoke setiap perkataan, terjemahan dan latar sinematik.',
    points: [
      'Pencipta Reels Al-Quran percuma — tanpa akaun, tera air atau bayaran.',
      'Sari kata karaoke setiap perkataan diselaraskan dengan audio qari.',
      'MP4 menegak 1080×1920 untuk TikTok, Instagram Reels, YouTube Shorts dan Facebook.',
      'Lapan qari riwayat Hafs dan terjemahan dalam tiga belas bahasa.',
      'Tiga templat sinematik: klasik, kaca kabur dan Noor keemasan.',
      'Sumber terbuka dan boleh dihos sendiri, dengan penjadual terbitan automatik.',
    ],
    faq: [
      ['Adakah pencipta video Al-Quran ini percuma?', 'Ya — tanpa akaun, bayaran atau tera air. Sumber terbuka berlesen MIT.'],
      ['Bolehkah saya muat naik video ini ke TikTok, Instagram atau YouTube?', 'Boleh. Setiap reels ialah MP4 menegak 1080×1920 H.264.'],
      ['Dari mana datangnya teks Al-Quran dan bacaan?', 'Teks Uthmani dan terjemahan dari Quran API, bacaan ialah audio qari sendiri dari EveryAyah.'],
      ['Berapa lama untuk mencipta satu Reels Al-Quran?', 'Biasanya kurang dua minit, bergantung pada panjang petikan dan giliran.'],
    ],
  },
  ur: {
    title: 'مفت قرآنی ریلز بنائیں — قرآنی مختصر ویڈیو میکر | تبلیغ',
    description:
      'اپنے براؤزر میں مفت اور بغیر اکاؤنٹ کے سینمائی قرآنی ویڈیوز بنائیں۔ کوئی بھی سورہ، کوئی بھی قاری، لفظ بہ لفظ کیراوکی اور ترجمہ، ٹک ٹاک، ریلز، شارٹس اور فیس بک کے لیے عمودی 1080×1920 MP4۔',
    h1: 'مفت قرآنی ریل بنائیں',
    intro:
      'تبلیغ ایک مفت اور اوپن سورس قرآنی ویڈیو میکر ہے۔ سورہ اور آیات منتخب کریں، آٹھ قاریوں میں سے ایک چنیں، اور عثمانی متن، تلاوت کے ساتھ ہم آہنگ لفظ بہ لفظ کیراوکی، ترجمے اور سینمائی پس منظر کے ساتھ عمودی ویڈیو حاصل کریں۔',
    points: [
      'مفت قرآنی ریلز میکر — نہ اکاؤنٹ، نہ واٹر مارک، نہ ادائیگی۔',
      'قاری کی اپنی آواز کے ساتھ ہم آہنگ لفظ بہ لفظ کیراوکی۔',
      'ٹک ٹاک، انسٹاگرام ریلز، یوٹیوب شارٹس اور فیس بک کے لیے عمودی 1080×1920 MP4۔',
      'روایت حفص میں آٹھ قاری اور تیرہ زبانوں میں تراجم۔',
      'تین سینمائی ٹیمپلیٹس: کلاسک، شیشہ اور سنہری نور۔',
      'اوپن سورس اور خود میزبانی کے قابل، خودکار اشاعت کے شیڈیولر کے ساتھ۔',
    ],
    faq: [
      ['کیا یہ قرآنی ویڈیو میکر مفت ہے؟', 'جی ہاں — نہ اکاؤنٹ، نہ ادائیگی، نہ واٹر مارک۔ یہ MIT لائسنس کے تحت اوپن سورس ہے۔'],
      ['کیا میں یہ ویڈیوز ٹک ٹاک، انسٹاگرام یا یوٹیوب پر شائع کر سکتا ہوں؟', 'جی ہاں۔ ہر ریل عمودی 1080×1920 H.264 MP4 ہے۔'],
      ['قرآنی متن اور تلاوت کہاں سے آتے ہیں؟', 'عثمانی متن اور تراجم قرآن API سے، اور تلاوت EveryAyah سے قاری کی اپنی آواز ہے۔'],
      ['قرآنی ریل بننے میں کتنا وقت لگتا ہے؟', 'عموماً دو منٹ سے کم، اقتباس کی لمبائی اور قطار پر منحصر ہے۔'],
    ],
  },
  fa: {
    title: 'ساخت رایگان ریلز قرآنی — سازندهٔ ویدیوی کوتاه قرآنی | تبلیغ',
    description:
      'ویدیوهای سینمایی قرآنی را رایگان و بدون ثبت‌نام در مرورگر بسازید. هر سوره، هر قاری، زیرنویس کارائوکه کلمه‌به‌کلمه و ترجمه، MP4 عمودی ۱۰۸۰×۱۹۲۰ برای تیک‌تاک، ریلز، شورتس و فیسبوک.',
    h1: 'یک ریلز قرآنی رایگان بسازید',
    intro:
      'تبلیغ یک سازندهٔ ویدیوی قرآنی رایگان و متن‌باز است. سوره و محدودهٔ آیات و یکی از هشت قاری را انتخاب کنید تا ویدیویی عمودی با متن عثمانی، کارائوکهٔ کلمه‌به‌کلمهٔ هماهنگ با تلاوت، ترجمه و پس‌زمینهٔ سینمایی بگیرید.',
    points: [
      'سازندهٔ رایگان ریلز قرآنی — بدون حساب، واترمارک و پرداخت.',
      'زیرنویس کارائوکهٔ کلمه‌به‌کلمه هماهنگ با صدای خود قاری.',
      'MP4 عمودی ۱۰۸۰×۱۹۲۰ برای تیک‌تاک، اینستاگرام ریلز، یوتیوب شورتس و فیسبوک.',
      'هشت قاری به روایت حفص و ترجمه به سیزده زبان.',
      'سه قالب سینمایی: کلاسیک، شیشه‌ای و نور طلایی.',
      'متن‌باز و قابل میزبانی شخصی، با زمان‌بند انتشار خودکار.',
    ],
    faq: [
      ['آیا این سازندهٔ ویدیوی قرآنی رایگان است؟', 'بله — بدون حساب، پرداخت و واترمارک. متن‌باز با مجوز MIT.'],
      ['می‌توانم این ویدیوها را در تیک‌تاک، اینستاگرام یا یوتیوب منتشر کنم؟', 'بله. هر ریلز یک MP4 عمودی ۱۰۸۰×۱۹۲۰ با کدک H.264 است.'],
      ['متن قرآن و تلاوت از کجا می‌آید؟', 'متن عثمانی و ترجمه‌ها از Quran API و تلاوت صدای خود قاری از EveryAyah است.'],
      ['ساخت یک ریلز قرآنی چقدر طول می‌کشد؟', 'معمولاً کمتر از دو دقیقه، بسته به طول قطعه و صف.'],
    ],
  },
  bn: {
    title: 'বিনামূল্যে কুরআন রিলস বানান — কুরআন শর্ট ভিডিও মেকার | তাবলিগ',
    description:
      'ব্রাউজারেই বিনামূল্যে ও নিবন্ধন ছাড়াই সিনেম্যাটিক কুরআন ভিডিও তৈরি করুন। যেকোনো সূরা, যেকোনো ক্বারী, শব্দে-শব্দে ক্যারাওকে ও অনুবাদ, TikTok, Reels ও Shorts-এর জন্য ১০৮০×১৯২০ উল্লম্ব MP4।',
    h1: 'বিনামূল্যে একটি কুরআন রিল বানান',
    intro:
      'তাবলিগ একটি বিনামূল্যের ওপেন সোর্স কুরআন ভিডিও মেকার। সূরা ও আয়াতের পরিসর এবং আটজন ক্বারীর একজনকে বেছে নিন, আর পান উসমানী পাঠ, তিলাওয়াতের সঙ্গে মেলানো শব্দে-শব্দে ক্যারাওকে, অনুবাদ ও সিনেম্যাটিক পটভূমিসহ উল্লম্ব ভিডিও।',
    points: [
      'বিনামূল্যে কুরআন রিলস মেকার — অ্যাকাউন্ট, জলছাপ বা খরচ নেই।',
      'ক্বারীর নিজের কণ্ঠের সঙ্গে মেলানো শব্দে-শব্দে ক্যারাওকে সাবটাইটেল।',
      'TikTok, Instagram Reels, YouTube Shorts ও Facebook-এর জন্য ১০৮০×১৯২০ উল্লম্ব MP4।',
      'হাফস কিরাআতে আটজন ক্বারী এবং তেরোটি ভাষায় অনুবাদ।',
      'তিনটি সিনেম্যাটিক টেমপ্লেট: ক্লাসিক, কাচ ও সোনালি নূর।',
      'ওপেন সোর্স ও নিজে হোস্ট করার উপযোগী, স্বয়ংক্রিয় প্রকাশের শিডিউলারসহ।',
    ],
    faq: [
      ['এই কুরআন ভিডিও মেকার কি বিনামূল্যে?', 'হ্যাঁ — অ্যাকাউন্ট, অর্থ বা জলছাপ নেই। MIT লাইসেন্সে ওপেন সোর্স।'],
      ['এই ভিডিও কি TikTok, Instagram বা YouTube-এ দেওয়া যাবে?', 'হ্যাঁ। প্রতিটি রিল উল্লম্ব ১০৮০×১৯২০ H.264 MP4।'],
      ['কুরআনের পাঠ ও তিলাওয়াত কোথা থেকে আসে?', 'উসমানী পাঠ ও অনুবাদ Quran API থেকে, তিলাওয়াত EveryAyah থেকে ক্বারীর নিজের কণ্ঠ।'],
      ['একটি কুরআন রিল বানাতে কত সময় লাগে?', 'সাধারণত দুই মিনিটের কম, অংশের দৈর্ঘ্য ও সারির উপর নির্ভর করে।'],
    ],
  },
};

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Canonical origin. Set SITE_URL when hosting under a different domain. */
export const siteOrigin = (): string =>
  (process.env.SITE_URL || 'https://tabligh.cc').replace(/\/$/, '').replace(/^(?!https?:)/, 'https://');

const localePath = (l: Locale): string => (l === 'en' ? '/' : `/${l}/`);

/** JSON-LD. Four graphs: what the software is, the site itself, the FAQ (which
 *  can win a rich result), and the how-to steps. */
function jsonLd(locale: Locale, copy: Copy): string {
  const origin = siteOrigin();
  const graph = [
    {
      '@type': 'WebApplication',
      '@id': `${origin}/#app`,
      name: 'Tabligh',
      url: origin,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any (web browser)',
      description: copy.description,
      inLanguage: locale,
      isAccessibleForFree: true,
      license: 'https://opensource.org/licenses/MIT',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: copy.points,
    },
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url: origin,
      name: 'Tabligh',
      inLanguage: locale,
      description: copy.description,
    },
    {
      '@type': 'FAQPage',
      '@id': `${origin}${localePath(locale)}#faq`,
      mainEntity: copy.faq.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    {
      '@type': 'HowTo',
      '@id': `${origin}${localePath(locale)}#howto`,
      name: copy.h1,
      description: copy.intro,
      totalTime: 'PT2M',
      step: [
        { '@type': 'HowToStep', name: 'Choose a surah and ayahs', text: 'Pick the passage you want to share.' },
        { '@type': 'HowToStep', name: 'Choose a reciter', text: 'Select one of eight reciters in the Hafs reading.' },
        { '@type': 'HowToStep', name: 'Pick a template', text: 'Classic, glass or noor.' },
        { '@type': 'HowToStep', name: 'Render and download', text: 'The vertical MP4 is ready in about a minute.' },
      ],
    },
  ];
  // </script> inside JSON would close the tag early.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

/** The crawlable body. Hidden from sighted users (the React app paints over
 *  it), but present in the source and readable by crawlers and screen readers
 *  before hydration. */
function noscriptBody(copy: Copy): string {
  return `<div id="seo-content">
  <h1>${esc(copy.h1)}</h1>
  <p>${esc(copy.intro)}</p>
  <ul>${copy.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
  <h2>FAQ</h2>
  <dl>${copy.faq.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl>
</div>`;
}

/**
 * Rewrite the built index.html for `locale`. `shell` is the Vite output, which
 * already carries the hashed script/style tags — we only replace the parts that
 * vary by language.
 */
export function renderShell(shell: string, locale: Locale): string {
  const copy = COPY[locale];
  const origin = siteOrigin();
  const canonical = `${origin}${localePath(locale)}`;
  const dir = RTL.has(locale) ? 'rtl' : 'ltr';

  const alternates = [
    ...LOCALES.map((l) => `<link rel="alternate" hreflang="${l}" href="${origin}${localePath(l)}"/>`),
    `<link rel="alternate" hreflang="x-default" href="${origin}/"/>`,
  ].join('\n    ');

  const head = `
    <title>${esc(copy.title)}</title>
    <meta name="description" content="${esc(copy.description)}"/>
    <link rel="canonical" href="${canonical}"/>
    ${alternates}
    <meta property="og:type" content="website"/>
    <meta property="og:site_name" content="Tabligh"/>
    <meta property="og:locale" content="${locale}"/>
    <meta property="og:title" content="${esc(copy.title)}"/>
    <meta property="og:description" content="${esc(copy.description)}"/>
    <meta property="og:url" content="${canonical}"/>
    <meta property="og:image" content="${origin}/og.png"/>
    <meta property="og:image:width" content="1200"/>
    <meta property="og:image:height" content="630"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="${esc(copy.title)}"/>
    <meta name="twitter:description" content="${esc(copy.description)}"/>
    <meta name="twitter:image" content="${origin}/og.png"/>
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"/>
    <script type="application/ld+json">${jsonLd(locale, copy)}</script>`;

  return shell
    .replace(/<html[^>]*>/, `<html lang="${locale}" dir="${dir}">`)
    // Drop the dev-time title/description/canonical so we never emit two.
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta\s+name="description"[^>]*>/i, '')
    .replace(/<link\s+rel="canonical"[^>]*>/i, '')
    .replace('</head>', `${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${noscriptBody(copy)}</div>`);
}

export function sitemap(): string {
  const origin = siteOrigin();
  const urls = LOCALES.map((l) => {
    const alts = LOCALES.map(
      (a) => `    <xhtml:link rel="alternate" hreflang="${a}" href="${origin}${localePath(a)}"/>`,
    ).join('\n');
    return `  <url>
    <loc>${origin}${localePath(l)}</loc>
${alts}
    <changefreq>weekly</changefreq>
    <priority>${l === 'en' ? '1.0' : '0.9'}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
}

export function robots(): string {
  return `User-agent: *
Allow: /
# Rendered files are per-visitor, short-lived and not content.
Disallow: /d/
Disallow: /api/

Sitemap: ${siteOrigin()}/sitemap.xml
`;
}
