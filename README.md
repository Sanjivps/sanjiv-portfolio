# Sanjiv Saravanan — Portfolio

A responsive, monochrome portfolio inspired by the typography, intro sequence, ASCII imagery, and keyboard navigation of [Yannick Gregoire's website](https://yannickgregoire.nl/), without its pop-up project videos. Original implementation and résumé-based content.

- **Intro:** a full-screen ASCII scene with rain plays while the dot-matrix name rises from the bottom as stretched bars and settles into place. A curtain then lifts to reveal the same name on the page. Press any key, click, or scroll to skip. The intro is skipped for reduced-motion users and deep links.
- **Portrait:** Sanjiv's GitHub profile photo rendered as live ASCII. The person and the street are separate layers, so the figure breathes, sways, and turns toward the pointer in front of a background with parallax, rain, and flickering city lights. It also has a hover lens, occasional glitch bands, and a decode-in reveal. This is a photo animation, not video footage.
- **Type:** every size comes from how many monospace characters fit across the viewport, so text stays on one grid. Headings and hero copy decode with a text scramble.

## Live website

[Open the public portfolio](https://sanjivps.github.io/sanjiv-portfolio/) · [GitHub repository](https://github.com/Sanjivps/sanjiv-portfolio)

## Run locally

Requires Python 3. Node.js is only needed for the optional syntax check.

```sh
npm run dev
# or: python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173. No installation or build step is needed.

## Files

- `dist/index.html`: biography, experience, projects, toolkit, and contact content.
- `dist/styles.css`: responsive layout, themes, and motion preferences.
- `dist/app.js`: intro sequence, ASCII scene renderer, text scramble, keyboard navigation, theme persistence, and email copying.
- `dist/assets/portrait-ascii.png`: three grayscale layers packed into RGB and pre-toned for ASCII. R holds the person with boosted local contrast, G the street with the person painted out, and B the person's mask. The mask was generated from `portrait.png` with rembg (u2net_human_seg, plus isnet hair detail).
- `dist/assets/`: also holds the self-hosted Doto font, the original portrait, the original résumé, and the favicon.
- `.openai/hosting.json`: Sites hosting configuration.

## Keyboard controls

Use **H** (home), **B** (biography), **E** (experience), **P** (projects), **T** (toolkit), **C** (contact), **I** (invert colors), and **M** (pause or resume motion). Browser modifier shortcuts are preserved. All controls also support pointer, touch, and standard keyboard navigation. The theme follows the system setting until it is inverted. Animation respects reduced-motion settings.

## Deploy

GitHub Pages serves the root of the `gh-pages` branch. The `main` branch contains the editable source. After committing changes to `dist/`, publish from a normal clone with:

```sh
git push origin main
git subtree push --prefix dist origin gh-pages
```

In the original Codex checkout, the GitHub remote is named `github`, so substitute `github` for `origin` in both commands.

You can also deploy `dist/` on any static host. All asset paths are relative. A separate owner-private Sites deployment is available at https://sanjiv-saravanan-portfolio.sanjivian1.chatgpt.site. GitHub Pages is the public site; Sites maintains its own source snapshot.

## Editing

Update résumé content in `dist/index.html` and replace `dist/assets/sanjiv-saravanan-resume.pdf` when needed. The downloadable PDF is the user-supplied original, including its contact details. The portrait is from the user's GitHub profile. The Doto font is distributed under the SIL Open Font License in `dist/assets/OFL-Doto.txt`. No assets or source code were copied from the design reference. Jurn previews use the app's official App Store screenshots (https://apps.apple.com/us/app/jurn-daily-reset/id6760151833). The Laundrify preview is a portfolio recreation based on the user's public repository components (https://github.com/Sanjivps/laundrify), with explicitly labeled demo data and the repository's logo. It is not a live connection to laundry machines.

## Checks

```sh
npm run check
```

Verified in headless Chromium at 1440 × 900 and with a 390 px mobile viewport: no horizontal overflow; intro playback and skipping; section shortcuts; project and toolkit expanders; theme inversion and persistence; reduced-motion and deep-link loads, which skip the intro; and no console errors. Mobile verification used viewport emulation, not a physical phone.
