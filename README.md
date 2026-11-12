# chadee.pp.ua — портфоліо

Vite + TypeScript + GSAP (ScrollTrigger) + Lenis.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # готовий сайт у dist/
```

## Що редагувати

Увесь контент лежить у [`src/data.ts`](src/data.ts): контакти, навички, проєкти й посилання для підтримки.

- `SUPPORT.monobankJar` — встав посилання на банку (`https://send.monobank.ua/jar/...`), і зʼявиться картка «Банка Monobank».
- `SUPPORT.usdtTrc20` — адреса гаманця. Зʼявиться картка з кнопкою «скопіювати».
- Щоб додати проєкту кнопку, вкажи `live` (сайт) або `repo` (публічний репозиторій). Без них проєкт показується з позначкою «🔒 приватний».

## Файли

- `src/main.ts` — прелоадер, інтро, курсор зі «світлом», магнітні кнопки, анімації на скролі, горизонтальна стрічка проєктів.

## Деплой на Vercel

Framework preset: **Vite**, build command `npm run build`, output `dist`.
