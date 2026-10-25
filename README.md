# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Publications page

`#publications` opens `src/components/publications.tsx`: a count per publication type,
publications per year (click a bar to filter), the most-cited papers on Google Scholar, and the
full list with search, type, year-range and access filters, sorting and pages of 25.

Every entry in the CV list is always shown. Links are added only where they are reliable:

| Link on an entry | Shown when | Comes from |
| --- | --- | --- |
| Publisher page (DOI) | Crossref has a record that confidently matches: same title (or the same journal plus page numbers when the CV words the title differently), year, and Prof. Abraham as author or editor | `npm run publications:links` |
| Free PDF | Unpaywall lists a legal open-access copy and the file was downloaded and checked to be a PDF | `npm run publications:links` |
| Free to read | the paper is open access on a web page, but no checkable PDF file was found | `npm run publications:links` |
| Download PDF | the file is in `public/papers/` and listed, with the permission to share it, in `src/data/local-papers.json` | you |

### Refreshing the links

```bash
npm run publications:links you@example.org
```

Crossref and Unpaywall are free; Unpaywall requires an email address. The first run takes
roughly half an hour for 1,580 entries; answers are cached in `scripts/.cache`, so later runs
are quick. Options go after the address as `name=value`, which works in every shell,
PowerShell included: `limit=30` for a trial run, `only=journal-12,book-3`, or `refresh` to
ignore the cache. (In PowerShell, `npm run … -- --email …` does not work: PowerShell drops the
`--`. Running `node scripts/enrich-publications.mjs --email you@example.org` also works.)

- `src/data/publication-links.json`: the result, read by the page.
- `scripts/output/publication-links-review.csv`: near misses that were not linked, for a
  person to check. To confirm one, add it to `src/data/publication-links.overrides.json`
  (`"journal-494": { "doi": "10.1109/tevc.2008.2009457" }`) and run again. To remove a wrong
  link: `{ "doi": null }`; to hide an open-access link: `{ "oa": null }`.

### Citation counts (Google Scholar first, OpenAlex as fallback)

You need a key for Google Scholar, read through SerpAPI (serpapi.com; the free plan covers a
run of about 16 searches), and optionally a free OpenAlex key (openalex.org/settings/api) for
papers missing from the Scholar profile. In PowerShell:

```powershell
$env:SERPAPI_KEY="your-serpapi-key"
$env:OPENALEX_API_KEY="your-openalex-key"
npm run publications:links you@example.org        # first, if not done: DOIs
npm run publications:citations you@example.org    # then: citations
```

Keys set this way last for the PowerShell window. Never commit them.

For each CV entry:

1. **Google Scholar**: the article on Prof. Abraham's profile that matches by title and year
   (and, when the CV words the title differently, by journal and page numbers).
2. **OpenAlex**, only for entries not on the profile: by DOI first, then title, year and author.
3. **No guessing**: an entry with no match, with several equally good matches, or whose
   article was also matched by another CV entry gets no count, and is listed in
   `scripts/output/citations-review.csv` with the candidates and the reason.

The page shows each count with its source and links to the paper there; counts of zero are not
shown, and "Most cited first" sorts by them. The same run refreshes the "Most cited" box
(`src/data/scholar-top.json`). Saved answers expire after 7 days, so a later run brings fresh
counts. Fix an entry by hand in `src/data/publication-links.overrides.json`:
`"scholar": "i95DGLQAAAAJ:…"` (the `citation_for_view` value of its Scholar page) or
`"scholar": null`, and `"openalex": "W…"` or `"openalex": null`.

### Author PDFs

1. Check that sharing is allowed: most publishers let authors post the accepted manuscript
   on a personal website, with conditions that differ by publisher and sometimes an embargo.
   Jisc's publisher-policy database (formerly Sherpa Romeo) lists them. Open-access articles
   under CC BY can be shared as published.
2. Put the file in `public/papers/`, named after the entry's id (e.g. `journal-203.pdf`).
3. Add it to `src/data/local-papers.json` with `version` (`published`, `accepted` or
   `submitted`) and `permission` (what allows sharing).

`scripts/check-local-papers.mjs` runs before every `dev` and `build`. It offers a PDF only when
it is both listed and present, and it stops the build if a PDF in `public/papers/` is not
listed, because everything in `public/` is published.

### Other data

- `src/data/publications.json` is generated from the publication list in
  `public/Ajith-Abraham-CV.pdf`. After replacing the CV: `pip install pymupdf`, then
  `npm run publications:update`.
- `src/data/scholar-top.json` holds the 20 most-cited papers and their Google Scholar citation
  counts, with the date they were retrieved.
- `npm run test:scripts` tests the link and citation matching and the PDF check (no network
  needed).
