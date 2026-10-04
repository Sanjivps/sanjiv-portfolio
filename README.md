# Sanjiv Saravanan — Portfolio

A responsive, monochrome portfolio inspired by the typography, ASCII imagery, and keyboard navigation of [Yannick Gregoire's website](https://yannickgregoire.nl/). Original implementation and résumé-based content, with Sanjiv's GitHub profile photo rendered as animated ASCII text.

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
- `dist/app.js`: ASCII portrait, keyboard navigation, theme persistence, and email copying.
- `dist/assets/`: self-hosted Doto font, portrait, original résumé, and favicon.
- `.openai/hosting.json`: Sites hosting configuration.

## Keyboard controls

Use **H** (home), **B** (biography), **E** (experience), **P** (projects), **S** (toolkit), **C** (contact), and **I** (invert colors). Browser modifier shortcuts are preserved. All controls also support pointer, touch, and standard keyboard navigation. Animation respects reduced-motion settings and has a pause button.

## Deploy

GitHub Pages serves the root of the `gh-pages` branch. The `main` branch contains the editable source. After committing changes to `dist/`, publish from a normal clone with:

```sh
git push origin main
git subtree push --prefix dist origin gh-pages
```

In the original Codex checkout, the GitHub remote is named `github`, so substitute `github` for `origin` in both commands.

You can also deploy `dist/` on any static host. All asset paths are relative. A separate owner-private Sites deployment is available at https://sanjiv-saravanan-portfolio.sanjivian1.chatgpt.site. GitHub Pages is the public site; Sites maintains its own source snapshot.

## Editing

Update résumé content in `dist/index.html` and replace `dist/assets/sanjiv-saravanan-resume.pdf` when needed. The downloadable PDF is the user-supplied original, including its contact details. The portrait is from the user's GitHub profile. The Doto font is distributed under the SIL Open Font License in `dist/assets/OFL-Doto.txt`. No assets or source code were copied from the design reference.

## Checks

```sh
npm run check
```

Verified in the browser at desktop size and a 390 px mobile viewport: no horizontal overflow, section navigation and letter shortcuts, expandable experience entries, theme persistence, motion pause and reduced-motion preferences, and email copying. All local asset URLs, including the résumé PDF, returned HTTP 200. No browser console errors were observed. Mobile verification used viewport emulation, not a physical phone.
