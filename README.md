# diode docs

Сайт документации diode — [diode-editor.github.io/docs](https://diode-editor.github.io/docs/).
[Astro Starlight](https://starlight.astro.build/), GitHub Pages (project site, как и
[магазин](https://github.com/diode-editor/marketplace)).

## Откуда контент

Тексты живут **не здесь**, а в репозитории редактора, и меняются там же, где меняется код
(матрица API — в том же PR, что поднимает поверхность):

- `docs/public/*.md` → страницы сайта; соответствие файл → адрес — `PAGES` в
  `scripts/sync-content.mjs`, место в навигации — `sidebar` в `astro.config.mjs`;
- `extensions/diode-settings/settings-schema.generated.ts` → страница Settings с поиском.

`npm run sync` копирует их в `src/content/docs/` и `src/data/` (сгенерированное в `.gitignore`):
первый `# заголовок` становится `title`, ссылка «Edit page» ведёт в исходник в репозитории
редактора, ссылки между страницами — на адреса сайта, на прочие файлы репозитория — на GitHub.

Здесь живут только навигация, вид и страницы, которых нет в редакторе: главная
(`src/content/docs/index.mdx`) и обвязка Settings (`reference/settings.mdx`).

## Что к нам, что к VS Code

Пишем только то, чем diode отличается или чего у VS Code нет. Всё, что работает как в VS Code
(keybindings.json, settings.json, Extension API, tasks.json), — ссылкой на code.visualstudio.com.

## Вид

Шапка — один в один с лендингом и магазином (`src/components/Header.astro`), токены —
diode Design System (`src/styles/diode.css`), тема общая на домен (ключ `theme` в
`localStorage`). Раскладка — как у доки VS Code: колонка лендинга (`--page-max`) по центру,
в ней навигация с поиском, страница и оглавление (`PageFrame.astro`, `TwoColumnContent.astro`).

## Локально

```sh
npm ci
npm run dev        # редактор ищется в $DIODE_DIR, ./diode или ../diode
npm run build && npm run preview
```

## Выкладка

`.github/workflows/deploy.yml`: пуш в `main`, ручной запуск, раз в сутки и по вызову из
`docs-site.yml` репозитория редактора при изменении `docs/public` или каталога настроек
(секрет `DOCS_PAT` там).
