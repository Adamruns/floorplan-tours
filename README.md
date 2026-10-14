# Floor plan tours

Walkable three.js tours built to scale from a builder's 2D floor plan. One engine, one data file per plan.

- `src/` — engine (`tour.js`), furniture and fixture library (`furniture.js`), procedural textures (`textures.js`), UI styles (`tour.css`)
- `plans/` — one file per floor plan: rooms (polygons in feet), walls with door and window openings, finish options, and a `furnish()` function
- `pages/template.html` — page shell; `build.py` inlines everything into `dist/<plan>.html` (artifact) and `docs/<plan>/index.html` (hosted site, served by GitHub Pages)
- Local only (git-ignored): `reference/` source plans and photos, `review/` critic renders, `leads.md`, `outreach/`
- `vendor/` — the three.js add-ons the engine uses (composer, ambient occlusion, rounded boxes), inlined at build time

Build: `python3 build.py`. Preview the hosted site: `cd docs && python3 -m http.server 8766`, then open http://127.0.0.1:8766/.

The site sets `noindex` and a disallow-all robots.txt so builders' plans stay out of search until a builder agrees to be shown publicly.

Adding a plan: trace the floor plan into feet (find px-per-foot from two labeled room dimensions), list rooms and walls, place fixtures with `kit.add(type, { x, z, facing, ... })`, add an entry to `PAGES` in `build.py`.
