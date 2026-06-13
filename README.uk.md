<div align="center">

<img src="https://raw.githubusercontent.com/jarryuser/github-visualizer/main/preview.png" alt="GitHub Activity Visualizer preview" width="100%" />

# GitHub Activity Visualizer

**Чистий дашборд для будь-якого GitHub-профілю - теплова карта контрибуцій, розподіл мов програмування, топ репозиторіїв, порівняння профілів та живі статистики**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-→-2f81f7?style=flat-square)](https://jarryuser.github.io/github-visualizer/?user=jarryuser)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![D3.js](https://img.shields.io/badge/D3.js-7.9-F9A03C?style=flat-square&logo=d3.js&logoColor=white)](https://d3js.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Cloudflare Workers](https://img.shields.io/badge/Proxy-Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=flat-square&logo=github)](https://pages.github.com/)

[English](README.md) · **Українська** · [Slovenčina](README.sk.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)


</div>

---

## Огляд

GitHub Activity Visualizer - це фронтенд-дашборд, який використовує **GitHub REST API** та **D3.js** для візуалізації будь-якого публічного профілю

Введіть ім'я користувача → отримайте повний розбір його активності за секунди. Перемкніться на вкладку **Compare**, щоб порівняти два профілі поряд

Усі запити до GitHub API проходять через невеликий **Cloudflare Worker**, який зберігає токен API як серверний секрет і кешує відповіді в Workers KV. Ефективний ліміт: 5000 req/год від GitHub, але на практиці майже кожен запит обслуговується з кешу

**Спробуйте:** [`?user=jarryuser`](https://jarryuser.github.io/github-visualizer/?user=jarryuser) · [`?user=torvalds`](https://jarryuser.github.io/github-visualizer/?user=torvalds) · [`?tab=compare&a=torvalds&b=gaearon`](https://jarryuser.github.io/github-visualizer/?tab=compare&a=torvalds&b=gaearon)

---

## Можливості

| | Функція | Деталі |
|---|---|---|
| 📊 | **Теплова карта контрибуцій** | 12-місячна сітка активності з підказками по днях, лічильник поточного стріку |
| 🕐 | **Теплова карта годин кодування** | Сітка 7×24, яка показує, коли користувач зазвичай пушить код, за годинами та днями тижня |
| 🌐 | **Розподіл мов програмування** | Агреговано по всіх репозиторіях, анімована діаграма, кольорове кодування за мовами |
| ⭐ | **Топ репозиторіїв** | Відсортовано за зірками, з описом, мовою, форками та часом останнього оновлення |
| 📈 | **Статистика профілю** | Загальна кількість публічних репозиторіїв, отриманих зірок, підписників, поточний стрік |
| 📉 | **Тренд активності** | Графік щотижневих контрибуцій за останні 12 місяців із підказками при наведенні |
| 🏢 | **Профілі організацій** | Працює як для організацій, так і для користувачів - репозиторії, мови, здоров'я, години кодування відображаються; графіки контрибуцій показують заглушку |
| 📖 | **README профілю** | Якщо користувач має репозиторій `{username}/{username}`, рендерить його README.md з повною підтримкою Markdown |
| 🪄 | **Віджет для вбудовування** | Компактна картка профілю, яку можна вбудувати через `<iframe>`; кнопка `</>` у шапці копіює готовий фрагмент |
| ⚔️ | **Порівняння профілів** | Перегляд двох профілів поряд: статистика з індикатором переможця, перетин мов, суміщені теплові карти |
| 🔗 | **Посилання для поширення** | Пряме посилання на будь-який профіль: `?user=username` або `?tab=compare&a=…&b=…` |
| ⚡ | **Паралельне завантаження** | Усі API-запити виконуються одночасно через `Promise.all` - завантаження за ~1с |
| 🛡️ | **Токен-безпечний проксі** | Cloudflare Worker зберігає токен GitHub; браузер ніколи його не бачить |
| 💾 | **Кеш на краю мережі** | Workers KV зберігає відповіді 10–60 хвилин; повторні запити повністю оминають GitHub |
| 📡 | **Індикатор ліміту запитів** | Живий значок у шапці, що показує залишок квоти API з кольоровою позначкою |
| 🩺 | **Здоров'я репозиторіїв** | Перевіряє власні репозиторії на опис, ліцензію, недавню активність і теми - з показниками за критеріями та загальним балом |
| 🌙 | **Темна / світла тема** | Перемикання між GitHub-dark і світлим режимом; налаштування зберігається в localStorage |
| 🖼️ | **Експорт як зображення** | Завантаження повного дашборду як PNG одним кліком |

---

## Технологічний стек

| Шар | Інструмент | Чому |
|---|---|---|
| Мова | TypeScript 5.3 | Безпека типів для всіх відповідей API |
| Графіки | D3.js v7 | Дрібнозернистий контроль над SVG-рендерингом |
| Бандлер | Vite 5 | Миттєвий HMR, підтримка TS без налаштувань |
| Проксі / кеш | Cloudflare Workers + Workers KV | Зберігає токен GitHub; кешує відповіді глобально |
| Дані | GitHub REST API v3 | Публічні endpoints профілю, репозиторіїв та мов |
| Контрибуції | github-contributions-api | REST-обхідний шлях для GraphQL-only теплової карти GitHub |
| Хостинг фронтенду | GitHub Pages + gh-pages | Деплой однією командою, безкоштовний хостинг |

---

## Архітектура

```
┌──────────────┐   fetch /users/foo   ┌────────────────────────────┐
│   Browser    │ ───────────────────▶ │  Cloudflare Worker proxy   │
│ (GitHub Pgs) │ ◀─────────────────── │  github-visualizer-proxy   │
└──────────────┘     JSON (cached)    │                            │
                                       │   ┌────────┐  KV lookup    │
                                       │   │   KV   │ ◀──────────── │
                                       │   │ CACHE  │ ──────────▶   │
                                       │   └────────┘   (hit/miss)  │
                                       │                            │
                                       │   on miss ↓ Bearer <secret>│
                                       └─────────────┬──────────────┘
                                                     │
                                                     ▼
                                             api.github.com
```

Браузер ніколи не зберігає токен GitHub. Він знає лише URL Worker-а
Worker має дозволений список з трьох маршрутів GitHub; все інше повертає 404

---

## Початок роботи

```bash
git clone https://github.com/jarryuser/github-visualizer.git
cd github-visualizer
npm install

# Фронтенд:
npm run dev        # → http://localhost:5173 (за замовчуванням використовує розгорнутий Worker)

# Worker (опціонально - лише якщо ви хочете редагувати проксі):
cp .env.example .env                # встановлює VITE_PROXY_URL=http://localhost:8787
npm run worker:dev                  # → http://localhost:8787
```

Відкрийте застосунок, введіть будь-яке ім'я користувача GitHub, натисніть **View profile**. Або відкрийте вкладку **Compare**, щоб порівняти два профілі поряд

---

## Розгортання

### Фронтенд → GitHub Pages

```bash
npm run deploy
```

Оновлює `https://jarryuser.github.io/github-visualizer/` приблизно за 30 секунд.

### Worker → Cloudflare (перше налаштування)

```bash
# 1. Увійдіть один раз
npx wrangler login

# 2. Створіть простір імен KV для кешування
npx wrangler kv:namespace create CACHE
# → скопіюйте отриманий id у wrangler.toml замість REPLACE_WITH_KV_NAMESPACE_ID

# 3. Збережіть токен GitHub як секрет Worker-а (НЕ в .env)
npm run worker:secret               # потім вставте ваш fine-grained PAT

# 4. Розгорніть
npm run worker:deploy
```

Worker публікується за адресою `https://github-visualizer-proxy.<your-subdomain>.workers.dev`
Оновіть значення `PROXY_BASE` у `src/api.ts`, якщо ви використовуєте інше ім'я

### Оновлення існуючого розгортання

```bash
npm run worker:deploy   # розгортає зміни worker/index.ts
npm run deploy          # розгортає зміни фронтенду
```

### Створення GitHub токена

GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate. Токену потрібен лише дозвіл **`Public Repositories (read-only)`**. Вставте його один раз через `npm run worker:secret`; відтоді він зберігається в Cloudflare і ніколи не потрапляє в git

---

## Змінні середовища

| Де | Змінна | Призначення |
|---|---|---|
| `.env` (браузер, лише локальна розробка) | `VITE_PROXY_URL` | Перевизначити URL Worker-а під час розробки з локальним Worker-ом. Якщо не встановлено, фронтенд використовує продакшн Worker |
| Секрет Worker-а (Cloudflare) | `GITHUB_TOKEN` | Fine-grained PAT, який Worker додає до запитів GitHub. Встановлюється через `npm run worker:secret` |

**Немає** `VITE_GITHUB_TOKEN` - це б призвело до витоку токена в браузерний бандл. Токен належить Worker-у

---

## Структура проєкту

```
github-visualizer/
├── index.html                 - єдина HTML-оболонка, без фреймворків
├── src/                       - фронтенд
│   ├── api.ts                 - всі запити через Worker проксі
│   ├── streak.ts              - D3 теплова карта контрибуцій + лічильник стріку
│   ├── commitHeatmap.ts       - D3 теплова карта годин кодування (7×24 сітка)
│   ├── languages.ts           - D3 анімована діаграма мов
│   ├── repos.ts               - рендеринг карток топ репозиторіїв
│   ├── activityChart.ts       - D3 графік щотижневої активності
│   ├── embed.ts               - компактна картка для вбудовування: завантаження + рендеринг для iframe-віджета
│   ├── profileReadme.ts       - завантаження та рендеринг README.md профілю
│   ├── compare.ts             - порівняння профілів поряд
│   ├── healthScore.ts         - рендеринг звіту здоров'я репозиторіїв
│   └── main.ts                - точка входу, маршрутизація вкладок, стан URL
├── worker/
│   └── index.ts               - Cloudflare Worker: токен, дозволені маршрути, KV кеш
├── styles/
│   └── main.css               - дизайн-система GitHub-dark, CSS-змінні
├── wrangler.toml              - конфігурація Worker-а (ім'я, прив'язка KV)
├── tsconfig.json              - конфігурація TS фронтенду (компілює src/)
├── tsconfig.worker.json       - конфігурація TS Worker-а (перевіряє worker/)
├── vite.config.ts
└── .env.example               - перевизначення для локальної розробки (без секретів)
```

---

## Як відбувається завантаження профілю

```
User enters username
        │
        ▼
  Promise.all([
    fetchUser()           → Worker → KV hit? return.  miss → GitHub /users/{u}
    fetchRepos()          → Worker → KV hit? return.  miss → GitHub /users/{u}/repos
  ])
        │
        ▼ (паралельно, після отримання репозиторіїв)
  Promise.all([
    fetchAllLanguages()   → Worker → KV per-repo /repos/{u}/{r}/languages  ×≤20
    fetchContributions()  → github-contributions-api.jogruber.de/v4/{u}
    fetchUserEvents()     → Worker → KV /users/{u}/events (2 сторінки, до 200 подій)
  ])
        │
        ▼
  renderStreakGraph()     → D3 SVG теплова карта
  renderCommitHeatmap()  → D3 7×24 сітка годин кодування
  renderLanguageChart()   → D3 анімовані смуги
  renderTopRepos()        → HTML картки
  renderHealthReport()    → смуги здоров'я репозиторіїв (опис, ліцензія, активність, теми)
  animateCount()          → лічильники статистики (requestAnimationFrame)
  updateRateLimitBadge() → fetch /rate_limit → оновлення значка в шапці
```

Агрегація мов підсумовує байти коду в до 20 найсвіжіше оновлених репозиторіях, потім конвертує у відсотки. Форки виключені - враховуються лише оригінальні роботи.

**TTL кешу** (налаштовується в `worker/index.ts`):

| Маршрут | TTL | Чому |
|---|---|---|
| `/rate_limit` | 1 хв | Жива квота - має бути свіжою |
| `/users/:u` | 10 хв | Дані профілю (підписники, біо) змінюються час від часу |
| `/users/:u/repos` | 10 хв | Список репозиторіїв змінюється при публікації нових |
| `/users/:u/events` | 15 хв | Недавні події push для теплової карти годин кодування |
| `/repos/:u/:r/languages` | 60 хв | Байти мов майже не змінюються щогодини |

Додайте `?fresh=1` до будь-якого запиту Worker-а, щоб обійти кеш для одного виклику.

---

## Плани розвитку

### ✅ Зроблено

- [x] **Віджет для вбудовування** - компактна картка профілю через `?embed=1&user=…&theme=dark/light`; кнопка `</>` копіює iframe-фрагмент; картка показує аватар, ім'я, місцезнаходження та ключові статистики
- [x] **README профілю** - рендерить `{username}/{username}/README.md` з повною підтримкою Markdown; картка прихована, коли README не існує
- [x] **Профілі організацій** - автоматично визначаються через поле `type`; окремо завантажує опис організації; графіки контрибуцій показують заглушку
- [x] **Тренд активності** - графік щотижневих контрибуцій за останні 12 місяців; при наведенні показує точну кількість за тиждень
- [x] **Експорт як зображення** - кнопка завантаження з'являється після завантаження профілю; експортує повний дашборд як PNG з назвою `{username}-github-stats.png`
- [x] **Світла тема** - перемикач сонця/місяця в шапці; D3 графіки перерендерюються з кольорами, що враховують тему; налаштування зберігається в localStorage
- [x] **Оцінка здоров'я репозиторіїв** - смуги за критеріями (опис, ліцензія, недавня активність, теми) для всіх власних репозиторіїв із загальним відсотковим балом
- [x] **Індикатор ліміту запитів** - значок у шапці, що показує залишок/загальну кількість API-запитів з кольоровою позначкою; оновлюється після кожного завантаження профілю. Підказка показує час до оновлення квоти
- [x] **Теплова карта часу комітів** - сітка 7×24, яка показує, коли користувач зазвичай кодує, за годинами дня та днями тижня. "Найактивніший у середу ввечері"
- [x] **Порівняння профілів** - `?tab=compare&a=…&b=…`, статистика поряд з індикатором переможця, перетин мов, суміщені теплові карти
- [x] **Cloudflare Worker проксі** - токен ніколи не потрапляє в браузер
- [x] **Workers KV кеш** - TTL 10–60 хв на маршрут, `?fresh=1` для обходу

### 💡 Ідеї на розгляд

- [ ] **Генератор GitHub Profile README** - аналіз профілю через API, генерація персоналізованого `README.md` через GPT, копіювання одним кліком

---

## Відомі обмеження

- **Теплова карта контрибуцій** використовує сторонній проксі (`github-contributions-api.jogruber.de`), оскільки GitHub надає дані контрибуцій лише через GraphQL API з автентифікацією. Цей проксі іноді буває недоступним
- **Статистика мов** відображає байти коду, а не кількість файлів або витрачений час - та сама методологія, що й GitHub Linguist
- **Приватні репозиторії** не видно - Worker використовує токен з доступом лише до публічних репозиторіїв
- **Перший запит до холодного профілю** все ще витрачає ~20 викликів GitHub (по одному на репозиторій для мов). Наступні завантаження протягом години надходять з KV

---

## Як зробити внесок

Проблеми та pull request-и вітаються. Якщо ви знайшли помилку або маєте ідею для функції, спочатку відкрийте issue, щоб ми могли це обговорити

---

## Ліцензія

MIT © [Dmytro Filiurskyi](https://github.com/jarryuser)
