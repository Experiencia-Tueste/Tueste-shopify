# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this is

A static HTML/CSS/JS **mirror/mockup** of the "Tueste" Shopify storefront (coffee brand with an "Adopta un Árbol" tree-adoption offering and a "Para Marcas" B2B sound-branding offering). It is a preview build for the store owner to review proposed changes before they are ported into the real Shopify theme — it is **not** the live store and has no backend, build step, or package manager. All content is in Spanish.

No git repo is initialized in this directory.

## Running it

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Double-clicking `INICIAR-Mac.command` (macOS) or `INICIAR-Windows.bat` (Windows) does the same and auto-opens the browser. There is no test suite, linter, or build process — verify changes by reloading the page in a browser.

## Structure

- `index.html` — single page, all sections in document order (hero → intro → marquee → adopta-árbol → featured product → collection grid → ritual → playlist → para-marcas → footer).
- `styles.css` — all styles, single file, no preprocessor/bundler.
- `script.js` — vanilla JS, no dependencies: hero slideshow autoplay/dots, per-product quantity steppers, a no-op newsletter form (`alert()` stub, not wired to Shopify), and a seeded-random equalizer-bar generator for the "Para Marcas" section.
- `assets/` — images/logos referenced directly by relative path.
- `LEEME.txt` — Spanish-language changelog/guide for the store owner describing what's new vs. original in this revision; **read/update this alongside index.html when adding or reordering sections**, since it's the owner-facing map of the page.

## Conventions to preserve

- **`ot-` prefixed classes** (`ot-adopta`, `ot-marcas`, `ot-card`, `ot-kicker`, `ot-serif`, etc.) mark sections newly added on top of the original mirrored theme (see the "UNIVERSO ORIGEN TOSTADO" banner comment in `styles.css`). Keep using this prefix for new custom sections so they stay distinguishable from the original Shopify-mirrored markup, and keep the corresponding CSS grouped under that banner comment.
- Sections without an `ot-` prefix (hero, featured-product, collection, footer, etc.) are mirrored from the real theme and are treated as "as-is" — avoid restructuring their markup/classes unless the task specifically asks to change that section, since they're meant to stay faithful to the live store.
- CSS custom properties for the palette are declared once in `:root` at the top of `styles.css` (`--text`, `--cream-page`, `--indigo`, `--pink`, `--orange`, `--border`, `--radius-lg`, `--radius-pill`, `--max-w`) — reuse these instead of hardcoding colors/radii in new rules.
- Two type families are loaded via Google Fonts: `Fraunces` (serif, used for headings/display via `.ot-serif` and section `h2`s) and `Montserrat` (sans, body/UI default and used for `.ot-kicker`/eyebrow labels).
- All links are placeholder `href="#"` and buttons are inert except the hero slideshow, quantity steppers, and newsletter stub — this is a visual mockup, not a functional storefront; don't add real checkout/cart/auth logic here.
