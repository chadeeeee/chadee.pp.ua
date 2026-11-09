// ─────────────────────────────────────────────────────────────
//  Усе, що треба редагувати, — тут.
// ─────────────────────────────────────────────────────────────

/** Посилання для підтримки. Порожній рядок = картка прихована. */
export const SUPPORT = {
  /** Банка Monobank, напр. "https://send.monobank.ua/jar/XXXXXXXX" */
  monobankJar: "",
  /** Гаманець USDT (TRC20) — показується з кнопкою «скопіювати» */
  usdtTrc20: "",
};

export const CONTACTS = [
  { label: "Telegram", value: "@chadeeeeeeeeee", href: "https://t.me/chadeeeeeeeeee", hint: "тут відповім найшвидше" },
  { label: "Пошта", value: "esurginet2011@gmail.com", href: "mailto:esurginet2011@gmail.com", hint: "якщо треба офіційно" },
  { label: "GitHub", value: "github.com/chadeeeee", href: "https://github.com/chadeeeee", hint: "тут весь мій код" },
];

export const ROLES = ["пишу ботів у Telegram", "роблю сайти на Next.js", "клепаю застосунки під iPhone", "кодю на Python", "автоматизую всяку рутину"];

export const MARQUEE_A = ["Python", "Telegram-боти", "TypeScript", "Next.js", "React", "Three.js", "SwiftUI", "Flutter", "Rust"];
export const MARQUEE_B = ["Сайти", "Боти", "Застосунки", "Крипта", "Парсери", "Автоматизація", "AI-штуки", "Сервери"];

export const SKILLS = [
  { title: "Python", icon: "🐍", items: ["Telegram-боти (aiogram)", "Парсери", "Боти для крипти", "AI-штуки", "Автоматизація"] },
  { title: "Сайти", icon: "🌐", items: ["Next.js", "React", "TypeScript", "TailwindCSS", "3D на Three.js", "Анімації"] },
  { title: "Застосунки", icon: "📱", items: ["iPhone · Mac · Apple Watch", "SwiftUI", "Android (Flutter)", "Десктоп на Rust"] },
  { title: "Бекенд", icon: "🗄️", items: ["Бази даних", "PostgreSQL · SQLite", "Логін і акаунти", "Оплата через Stripe", "Свої сервери"] },
];

export type Project = {
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  live?: string;
  repo?: string;
  hue: number;
};

export const PROJECTS: Project[] = [
  {
    name: "Світло ⚡",
    tagline: "Коли вимкнуть світло — на 5 платформах",
    description:
      "Показує графік відключень твоєї черги і нагадує заздалегідь. Працює на iPhone, Mac, Apple Watch, Android і Windows. А поки світла нема, можна погратися в міні-гру «Іскролов».",
    stack: ["SwiftUI", "Flutter", "Python"],
    hue: 52,
  },
  {
    name: "Creatora",
    tagline: "Сам робить YouTube Shorts",
    description:
      "AI пише сценарій, озвучує, придумує назву й обкладинку і сам викладає відео за розкладом. Повноцінний сервіс з акаунтами, адмінкою й оплатою.",
    stack: ["Next.js", "React", "PostgreSQL", "Stripe"],
    live: "https://creatora-gray.vercel.app",
    hue: 275,
  },
  {
    name: "chadee-crypto",
    tagline: "Робот для торгівлі на Bybit",
    description:
      "Читає сигнали з Telegram-каналів, сам сканує ринок і відсіює ризиковані угоди. Керується прямо з Telegram і спокійно крутиться на найдешевшому сервері.",
    stack: ["Python", "Bybit API", "AI"],
    hue: 150,
  },
  {
    name: "Doc-боти",
    tagline: "Боти, що роблять документи",
    description: "Telegram-боти, які оформлюють документи за тебе. Працюють в Україні, Чехії та Казахстані.",
    stack: ["Python", "aiogram", "SQLite"],
    hue: 200,
  },
  {
    name: "call-recorder",
    tagline: "Записує дзвінки на компʼютері",
    description: "Програма для Windows і Mac, яка записує дзвінки. Під капотом швидкий Rust.",
    stack: ["Rust", "Tauri", "React"],
    hue: 18,
  },
  {
    name: "Maps-парсер",
    tagline: "Шукає клієнтів у Google Maps",
    description: "Збирає контакти закладів з Google Maps, щоб було кому продавати.",
    stack: ["TypeScript", "Next.js"],
    live: "https://v0-google-maps-scraper-gray.vercel.app",
    hue: 330,
  },
];
