<h1 align="center">Prof. Dr. Ajith Abraham: Portfolio</h1>

<p align="center"><b>Academic portfolio website — research publications with verified links and citation counts, talks, media and a living photo wall, built to be fast, accessible and easy to keep current.</b></p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=white&labelColor=555">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Language-3178C6?logo=typescript&logoColor=white&labelColor=555">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white&labelColor=555">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Data%20scripts-339933?logo=nodedotjs&logoColor=white&labelColor=555">
  <img alt="Data sources" src="https://img.shields.io/badge/Crossref%20%7C%20Unpaywall%20%7C%20OpenAlex-Publication%20data-E07B39?labelColor=555">
  <img alt="Google Scholar" src="https://img.shields.io/badge/Google%20Scholar-Citations-4285F4?logo=googlescholar&logoColor=white&labelColor=555">
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-Hosting-000000?logo=vercel&logoColor=white&labelColor=555">
</p>

<p align="center"><a href="https://dr-ajith-abraham-portfolio.vercel.app"><b>Live site</b></a></p>

---

## Overview

A researcher with more than 1,500 publications is hard to showcase by hand. Lists go stale, links break, citation numbers are copied from memory, and photos from conferences and awards pile up unseen.

This portfolio keeps all of that in one place and keeps it honest. The publication list is generated from the CV, every link (publisher DOI, free PDF) and citation count is matched against Crossref, Unpaywall, Google Scholar and OpenAlex, and nothing is guessed: an uncertain match is left out and queued for a human to review. Around that sits a media page built for impact, a full-screen drifting wall of moments and milestones, link cards to talks and posts, and a scrollable photo gallery.

### What you get

- **Publications page** (`#publications`): counts by type, publications per year (click a bar to filter), most-cited papers, and a searchable list with type, year-range and access filters, sorting and pagination.
- **Media page ("Moments & Milestones")**: a drifting photo wall, "Watch & Follow" cards for YouTube and LinkedIn, and a gallery strip that shows every photo uncropped.
- **Responsive and accessible**: works on desktop and phone, keyboard friendly, and respects reduced-motion settings.

## Tech stack

- [React](https://react.dev) + TypeScript
- [Vite](https://vite.dev) (dev server, HMR and build)
- ESLint with `typescript-eslint`
- Hosted on [Vercel](https://vercel.com)
- Node.js scripts (in `scripts/`) for building publication data

## Design

The look is clean and calm: a deep navy canvas, white type and soft, rounded glass-style cards. The details below come from the media page.

### Colour

| Use | Value |
| --- | --- |
| Page background and wall overlay | `#24476B` (navy) |
| Text | `#fff`, with softer `rgba(255,255,255,.85)` for descriptions |
| Cards and buttons | translucent white (`rgba(255,255,255,.08)`) with a thin white border |
| Call-to-action pills | solid white with navy text |

### Typography

- **Font:** Plus Jakarta Sans, falling back to Inter and then the system UI font.
- **Headings:** semibold (600) with tight letter-spacing (`-.04em`) and fluid sizes using `clamp()`.
- **Hero subtitle:** light (300) italic, balanced line wrapping.

### Layout and components

- **Hero wall:** the first screen is a full-viewport (`100svh`) wall of photos in 6 columns on desktop and 1 column on phones. Columns drift up and down at slightly different speeds. The edges fade out with a mask, and a soft navy gradient sits behind the title so the text stays readable.
- **Watch & Follow cards:** 3 cards in a row on desktop (stacked on screens under 860px), 28px rounded corners, brand icon badge, title, short description and a white pill button with a diagonal arrow.
- **Gallery strip:** a horizontal scroll strip with snap-to-photo, 18px rounded frames, a thin border and soft shadow. Frame width follows each photo's own aspect ratio so photos are never cropped, with small round previous/next buttons below.

### Motion and interaction

- Hovering or focusing a wall tile brightens it and enlarges it (about 1.16x) while the other tiles stay dimmed.
- Link cards fade and slide in when they scroll into view, and grow slightly with a glow ring on hover.
- Gallery photos zoom gently on hover.
- `prefers-reduced-motion` turns off the animations.

### Responsive behaviour

- **Under 640px:** one wall column, larger title and subtitle, smaller gallery frames.
- **Under 860px:** link cards stack into a single column.
- **Desktop:** tile size is calculated from the screen width so exactly 4 columns fit across the visible wall.

### Accessibility

- Wall tiles are keyboard focusable with a visible focus ring.
- Buttons have `aria-label`s, decorative icons are hidden from screen readers, and every photo has alt text.
- Text on the photo wall sits on a dark gradient to keep contrast readable.

## Project structure

```
components/        Shared components
public/            Static files: CV PDF, wall photos (public/wall/), author PDFs (public/papers/)
scripts/           Node scripts: publication links, citations, PDF checks, tests
src/               App source: components (publications page, media page, DriftWall ...) and data (src/data/*.json)
index.html         Vite entry
vite.config.ts     Vite config
eslint.config.js   ESLint config
tsconfig*.json     TypeScript configs
```

## Getting started

```bash
git clone https://github.com/HarshitaShibe/Prof.-Dr.-Ajith-Abraham-Portfolio.git
cd Prof.-Dr.-Ajith-Abraham-Portfolio
npm install
npm run dev        # start the dev server
npm run build      # production build
```

`scripts/check-local-papers.mjs` runs automatically before every `dev` and `build`.

## Media page photos

Photos live in `public/wall/`, named with consecutive numbers: `1.jpg`, `2.jpg` ... `N.jpg`. When you add or remove photos, update the counts so nothing shows up broken:

| File | Setting | What it controls |
| --- | --- | --- |
| media page (`mediapage.tsx`) | `TOTAL_PHOTOS` | How many photos the bottom gallery strip shows |
| `driftwall.tsx` | `PHOTO_COUNT` | How many photos the wall can pick from |
| `driftwall.tsx` | `TILE_COUNT` | Total tiles on the wall (keep it a multiple of 6 so the desktop columns stay even) |

Currently there are **141** photos. The wall shows the first `TILE_COUNT` of them and the gallery strip shows all of them. Compressing the photos (about 1600px on the long side is plenty) makes the page load much faster.

## Publications page

`#publications` opens `src/components/publications.tsx`: a count per publication type, publications per year (click a bar to filter), the most-cited papers on Google Scholar, and the full list with search, type, year-range and access filters, sorting and pages of 25.

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

Crossref and Unpaywall are free; Unpaywall requires an email address. The first run takes roughly half an hour for 1,580 entries; answers are cached in `scripts/.cache`, so later runs are quick. Options go after the address as `name=value`, which works in every shell, PowerShell included: `limit=30` for a trial run, `only=journal-12,book-3`, or `refresh` to ignore the cache. (In PowerShell, `npm run … -- --email …` does not work because PowerShell drops the `--`. Running `node scripts/enrich-publications.mjs --email you@example.org` also works.)

- `src/data/publication-links.json`: the result, read by the page.
- `scripts/output/publication-links-review.csv`: near misses that were not linked, for a person to check. To confirm one, add it to `src/data/publication-links.overrides.json` (`"journal-494": { "doi": "10.1109/tevc.2008.2009457" }`) and run again. To remove a wrong link use `{ "doi": null }`; to hide an open-access link use `{ "oa": null }`.

### Citation counts (Google Scholar first, OpenAlex as fallback)

You need a key for Google Scholar, read through [SerpAPI](https://serpapi.com) (the free plan covers a run of about 16 searches), and optionally a free [OpenAlex key](https://openalex.org/settings/api) for papers missing from the Scholar profile. In PowerShell:

```powershell
$env:SERPAPI_KEY="your-serpapi-key"
$env:OPENALEX_API_KEY="your-openalex-key"
npm run publications:links you@example.org        # first, if not done: DOIs
npm run publications:citations you@example.org    # then: citations
```

Keys set this way last for the PowerShell window. **Never commit them.**

For each CV entry:

1. **Google Scholar**: the article on Prof. Abraham's profile that matches by title and year (and, when the CV words the title differently, by journal and page numbers).
2. **OpenAlex**, only for entries not on the profile: by DOI first, then title, year and author.
3. **No guessing**: an entry with no match, with several equally good matches, or whose article was also matched by another CV entry gets no count, and is listed in `scripts/output/citations-review.csv` with the candidates and the reason.

The page shows each count with its source and links to the paper there. Counts of zero are not shown, and "Most cited first" sorts by them. The same run refreshes the "Most cited" box (`src/data/scholar-top.json`). Saved answers expire after 7 days, so a later run brings fresh counts. Fix an entry by hand in `src/data/publication-links.overrides.json`: `"scholar": "i95DGLQAAAAJ:…"` (the `citation_for_view` value of its Scholar page) or `"scholar": null`, and `"openalex": "W…"` or `"openalex": null`.

### Author PDFs

1. Check that sharing is allowed: most publishers let authors post the accepted manuscript on a personal website, with conditions that differ by publisher and sometimes an embargo. Jisc's publisher-policy database (formerly Sherpa Romeo) lists them. Open-access articles under CC BY can be shared as published.
2. Put the file in `public/papers/`, named after the entry's id (for example `journal-203.pdf`).
3. Add it to `src/data/local-papers.json` with `version` (`published`, `accepted` or `submitted`) and `permission` (what allows sharing).

`scripts/check-local-papers.mjs` runs before every `dev` and `build`. It offers a PDF only when it is both listed and present, and it stops the build if a PDF in `public/papers/` is not listed, because everything in `public/` is published.

### Other data

- `src/data/publications.json` is generated from the publication list in `public/Ajith-Abraham-CV.pdf`. After replacing the CV: `pip install pymupdf`, then `npm run publications:update`.
- `src/data/scholar-top.json` holds the 20 most-cited papers and their Google Scholar citation counts, with the date they were retrieved.
- `npm run test:scripts` tests the link and citation matching and the PDF check (no network needed).

## Deployment

The site is deployed on Vercel at https://dr-ajith-abraham-portfolio.vercel.app. Pushing to `main` redeploys it.

## License

All content and photos belong to Prof. Dr. Ajith Abraham. _Add a license here if you want to open-source the code._