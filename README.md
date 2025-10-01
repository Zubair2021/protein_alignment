# HelixCanvas

HelixCanvas is a single-page React + TypeScript application for visualising, annotating, and analysing DNA/RNA/protein sequences in the browser. It is optimised for large genomes (multi‑megabase FASTA) and matches the responsiveness of modern desktop tooling while remaining a read-only, analysis-focused environment.

## Highlights

- ⚡️ Vite + React 19 + TypeScript + Tailwind for a fast, modern UI
- 🧬 Linear sequence viewer with virtualised rendering, regex search, and annotation overlays
- 🔁 Canvas plasmid map with zoom/rotate interactions and hover tooltips
- 🤝 Alignment curator (FASTA/CLUSTAL/MAF/Stockholm) with consensus row, mismatch colouring, and inline editing
- 🧠 Analysis dashboard powered by Web Workers + WebAssembly for GC content, ORFs, translation preview, pairwise identity, dot plots, and restriction maps
- 🗂 Local-first storage using IndexedDB, export to FASTA/GenBank/CLUSTAL or zipped workspace bundles
- ✅ Vitest unit tests + Playwright smoke test + GitHub Actions pipelines (build/test/deploy + artifact bundle)

## Getting Started

```bash
npm install
npm run dev
```

Open <http://localhost:5173> to explore the app. Demo sequences and alignments are available from the overview tab.

### Scripts

- `npm run dev` – start the Vite dev server
- `npm run build` – production build (includes type check)
- `npm run preview` – preview production build
- `npm run lint` / `npm run lint:fix` – ESLint
- `npm run test` / `npm run test:watch` – Vitest unit tests
- `npm run coverage` – coverage report
- `npm run playwright:test` – Playwright smoke tests (requires `npm run dev` in another shell)
- `npm run deploy` – publish the `dist/` folder via `gh-pages`

## Deployment

1. Set `VITE_BASE_PATH` in the GitHub Pages environment if deploying under a subdirectory (defaults to `/helixcanvas/`).
2. The `build-and-deploy` workflow builds and uploads the static site. Enable GitHub Pages for the repository and set source to "GitHub Actions".
3. For manual deploys use `npm run build` and host the `dist/` folder on any static host.

## Project Structure

```
sequence_analyzer/
├─ public/                # static assets (wasm bundle, icons, sample data)
├─ src/
│  ├─ app/                # router + providers
│  ├─ components/         # shared UI + layout primitives
│  ├─ data/               # bundled demo sequences/alignments
│  ├─ features/           # feature-specific modules (sequences, alignments, analysis, etc.)
│  ├─ lib/                # utilities, parsers, workers, IndexedDB helper
│  ├─ workers/            # Web Worker entry points (analysis + parser)
│  ├─ tests/              # Vitest setup + unit tests
│  └─ pages/              # top-level workspace page
├─ wasm-src/              # wat sources compiled to public/wasm
├─ .github/workflows/     # CI/CD pipelines
└─ e2e/                   # Playwright smoke tests
```

## Licensing & Third-Party Dependencies

- Source code is MIT licensed (see [LICENSE](LICENSE)).
- Runtime dependencies are MIT/BSD licensed (React, @tanstack libraries, idb, jszip, lucide-react, etc.).
- WebAssembly module is generated from the local `wasm-src/pairwise_score.wat` source using `wabt` and bundled in `public/wasm`.

## Safety Notes

- HelixCanvas is strictly analysis-focused. It does not include primer design, cloning automation, or instructions that could be executed in the wet lab.
- Export formats (FASTA/GenBank/CLUSTAL) contain sequence and annotation metadata only.
- All computation occurs client-side; optional zip exports remain local to the user.

## Documentation

- [User Guide](docs/USER_GUIDE.md): walkthrough of core workflows and UI reference.
- [Performance Notes](docs/PERFORMANCE_NOTES.md): tuning tips, benchmarks, and profiling methodology.

