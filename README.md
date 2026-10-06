# Auralis

A complete music streaming web app in **one HTML file** — vanilla HTML, CSS and JavaScript, no framework, no build step, no external JS. All audio is synthesized live with the Web Audio API and all cover art is generated on canvas, so there are no media assets or licensing concerns.

## Run it
Double-click `index.html`, or serve the folder:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

### Deploy on GitHub Pages
Settings → Pages → Deploy from branch → `main` / root. The `.nojekyll` file is already included.

## Features
- 76 fictional tracks, 12 artists, 16 albums, 8 genres, 4 podcast shows (20 episodes); every song has its own generative recipe
- Playback: seek, volume, shuffle, repeat, speed (0.5–2×), crossfade (0–12 s), 10-band EQ with presets, sleep timer, drag-and-drop queue
- Full-screen player with bars / waveform / circular visualizers and time-synced original placeholder lyrics
- Home shelves, fuzzy instant search, genre/mood browse, artist & album pages, playlists (create, rename, duplicate, delete, reorder, public/private, collaborative), Liked Songs, library tabs
- Daily Mix 1–3 and Discover Mix from a simple recommender; onboarding; listening stats (heatmap + donut)
- Command palette, context menus, undo toasts, share modal, mini-player + floating widget, Media Session, "Listen together" across tabs (BroadcastChannel)
- Responsive (desktop / tablet / mobile with swipe-up player), reduced-motion support, everything persisted in `localStorage`

## Keyboard shortcuts
| Key | Action |
|---|---|
| Space | Play / pause |
| ← / → | Seek 5 s |
| Shift + ← / → | Previous / next |
| ↑ / ↓ | Volume |
| M · L · S · R | Mute · Like · Shuffle · Repeat |
| F | Full-screen player |
| Q | Queue panel |
| / | Focus search |
| Ctrl/⌘ + K | Command palette |
| Alt + ↑ / ↓ | Reorder focused row |
| ? | Shortcut list |

## Notes
- Fonts (DM Sans, Orbitron) load from Google Fonts; the app falls back to system fonts offline.
- "Listen together" syncs tabs of the same browser only.
- All artists, albums and lyrics are fictional placeholders.

## License
MIT

## Project structure
```
index.html          markup + icon sprite, loads CSS and scripts
css/style.css       design system (CSS variables), layout, components, responsive rules
js/01-core.js       utils, i18n, catalog data, procedural art, store
js/02-audio-engine.js   Web Audio engine (synth voices, decks, EQ, crossfade)
js/03-services-player.js recommender, playlists, player controller, downloads, listen-together
js/04-views.js      components and page views
js/05-shell-ui.js   sidebar, topbar, player bar, full-screen player, visualizer
js/06-menus-router.js sliders, menus, modals, command palette, router
js/07-actions-init.js actions, events, shortcuts, routes, init
```
The scripts are classic (non-module) files that share one global scope, so keep the load order in `index.html`.
