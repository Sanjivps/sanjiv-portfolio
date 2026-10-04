# Sanjiv Saravanan — Portfolio

A responsive, monochrome portfolio inspired by the typography, ASCII imagery, and keyboard navigation of [Yannick Gregoire's website](https://yannickgregoire.nl/). Original implementation and résumé-based content, with Sanjiv's GitHub profile photo rendered as animated ASCII text.

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
- `dist/app.js`: ASCII portrait, keyboard navigation, theme persistence, and email copying.
- `dist/assets/`: self-hosted Doto font, portrait, original résumé, and favicon.
- `.openai/hosting.json`: Sites hosting configuration.

## Keyboard controls

Use **H** (home), **B** (biography), **E** (experience), **P** (projects), **S** (toolkit), **C** (contact), and **I** (invert colors). Browser modifier shortcuts are preserved. All controls also support pointer, touch, and standard keyboard navigation. Animation respects reduced-motion settings and has a pause button.

## Deploy

Deploy the `dist/` directory on any static host. All asset paths are relative, so repository subpaths work as well. The Sites deployment starts private. The GitHub repository is a separate copy of the source.

## Editing

Update résumé content in `dist/index.html` and replace `dist/assets/sanjiv-saravanan-resume.pdf` when needed. The downloadable PDF is the user-supplied original, including its contact details. The portrait is from the user's GitHub profile. The Doto font is distributed under the SIL Open Font License in `dist/assets/OFL-Doto.txt`. No assets or source code were copied from the design reference.

## Checks

```sh
npm run check
```

Browser QA covers desktop/mobile layout, section navigation, disclosure panels, theme inversion, reduced motion, and the résumé download path.
