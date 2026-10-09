# Sruc Labs — Studio Site

Independent software studio. Function and design decided together, built with care.

**Live:** https://sruclabs.studio

## Pages

- `/` — Studio home
- `/apps/` — Releases (Magnet Search, Glide)
- Product pages live in their own repos and deploy as subpaths:
  - https://sruclabs.studio/magnetsearch/ → [sruclabs/magnetsearch](https://github.com/sruclabs/magnetsearch)
  - https://sruclabs.studio/glide/ → [sruclabs/glide](https://github.com/sruclabs/glide)

## Stack

Static plain HTML / CSS / JS. No build step, no framework.

- `index.html` — home
- `apps/index.html` — releases
- `css/style.css` — studio design language
- `js/main.js` — nav (`NAV_LINKS`), carousel, theme, menu, reveal, calm scroll
- `CNAME` — `sruclabs.studio`
- `assets/brand/`, `assets/fonts/` — wordmarks, Inter

## Run locally

```zsh
python3 -m http.server 8000
# http://localhost:8000/, /apps/
```

## Deploy

Push to `main` → GitHub Pages (user site). Product subpaths deploy independently from their own repos.

## Contact

company@sruclabs.studio
