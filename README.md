# martinezmedia

Source for <https://www.martinezmedia.net> — the product marketing website for
**Martinez Media, LLC**, an active independent software company founded in February 2011.
WaveWrangler is the flagship; the company's 2011–2023 photography, web, and design
services are preserved as historical work, not software customer endorsements.

It is hand-written HTML with Tailwind-compiled CSS. No framework, no bundler, no
static-site generator, no CMS, no blog. It renders fully with JavaScript disabled.

## Requirements

- Node.js 22 or newer

## Getting started

```sh
npm ci
npm run dev
```

`npm run dev` starts the Tailwind CLI in watch mode alongside a static server with live
reload at <http://localhost:4173>. Edit `src/index.html` or `styles/tailwind.css` and the
browser refreshes. Pages live in route directories under `src/`.

## Scripts

| Script          | What it does                                                       |
| --------------- | ------------------------------------------------------------------ |
| `npm run dev`   | Watch CSS + serve `src/` with live reload on port 4173             |
| `npm run build` | Compile minified CSS, then assemble `_site/` (the deploy artifact) |
| `npm run css`   | Compile `styles/tailwind.css` to `src/styles.css` once             |
| `npm run check` | Check the built routes, local links, assets, metadata, and sitemap |
| `npm run clean` | Delete `_site/` and `src/styles.css`                               |

## Layout

Everything under `src/` ships; nothing outside it does. The build is a straight copy.

```
.github/workflows/deploy.yml   GitHub Pages deploy
src/                           everything that ships
  index.html                   product-led homepage
  products/                    catalog and WaveWrangler detail
  about/                       company history
  past-work/                   historical services, counts, and client logos
  support/                     documentation, issue trackers, and contact
  privacy/                     website and scoped WaveWrangler privacy information
  images/clients/              historical client logos
  images/products/             authentic product branding and screenshots
  images/                      brand SVGs, favicon, apple touch icon, Open Graph image
  robots.txt
  sitemap.xml
  styles.css                   GENERATED — never committed
styles/tailwind.css            Tailwind v4 entry point — does not ship
CNAME                          custom domain, written by GitHub Pages
package-lock.json              committed
_site/                         GENERATED — never committed
```

`_site/` and `src/styles.css` are build output and are gitignored. `package-lock.json` is
committed so CI installs the exact same tree.

## Styling

Tailwind CSS v4 via `@tailwindcss/cli`. There is no `tailwind.config.js` — the palette,
fonts, and custom utilities are declared in the `@theme` block in `styles/tailwind.css`.

## Deploying

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which runs `npm ci && npm run build` and publishes `_site/` to GitHub Pages. Nothing else
needs to be done by hand.

`CNAME` lives at the repo root, is copied into `_site/` by the build, and must not be
deleted — removing it unbinds the custom domain.

The repository is <https://github.com/Martinez-Media/martinezmedia>. The public website
continues to use `https://www.martinezmedia.net/`.

## Asset provenance

The Martinez Media SVGs are the original outlined artwork. Product assets are copied
from WaveWrangler's `docs/assets/branding/wavewrangler-logo.svg` and
`docs/assets/screenshots/episode-workspace.png`; the screenshot contains synthetic demo
content, not private recordings. Historical client marks retain their original names.

`src/images/opengraph.svg` is the editable social image source. It references the genuine
wordmark; regenerate `opengraph.png` from the SVG, not by retouching pixels. With
ImageMagick installed, run from `src/images/`:

```sh
magick -background none opengraph.svg \
  \( -background none logo-wordmark.svg -resize 410x53 \) \
  -geometry +80+65 -composite opengraph.png
```

## Contributing

See [`AGENTS.md`](AGENTS.md) for the constraints this repo is held to.

Before committing, run `npm run build && npm run check`, and check
desktop and 320px layouts with no horizontal overflow. All pages work without JavaScript.
Do not advertise unverified availability, pricing, licenses, or hosted services.
