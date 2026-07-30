# Framework Detection & Design Tokens

## Detection (`detect_framework.py`)

Reads `package.json` dependencies + scripts and classifies:

| Signal (in deps) | framework | default port |
|------------------|-----------|--------------|
| `next` | `next` | 3000 |
| `@angular/core` | `angular` | 4200 |
| `react`/`react-dom` + `vite` | `react-vite` | 5173 |
| `react`/`react-dom` (no vite) | `react` | — |
| `vue` + `vite` | `vue-vite` | 5173 |
| `vue` (no vite) | `vue` | — |
| `svelte`/`@sveltejs/kit` + `vite` | `svelte-vite` | 5173 |
| `vite` only | `vite` | 5173 |
| none of the above | `unknown` | — |

Dev command: the first present of `dev`, `start`, `serve`, `preview` →
`npm run <name>`. An explicit `--port N` in that script overrides the default
port. For `unknown` stacks the command is left null — ask the user.

## Design tokens (manual, optional)

Improves caption/branding fidelity. Fill the Manifest's `designTokens`:

- **primary color** — check, in order: a CSS variable like `--primary`/`--brand`
  in `src/index.css`/`globals.css`; the Tailwind config `theme.extend.colors`;
  or a prominent button's color in the running app.
- **font** — the `font-family` on `body`, or the Tailwind `fontFamily.sans`.
- **logo** — an SVG/PNG under `public/` (e.g. `public/logo.svg`); copy it into
  `assets/` and reference it as `assets/logo.svg`.

These are optional; captions fall back to a neutral style when absent.
