# Performance Notes

HelixCanvas is optimised for large sequences and alignments without blocking the UI. This document summarises benchmarks and tuning levers.

## Benchmarks

Measurements collected on a 2023 MacBook Pro (M2 Pro, 16 GB RAM) in Chromium 129.

| Scenario | Dataset | Result |
| --- | --- | --- |
| Linear viewer load | 5 Mb FASTA | 1.2 s parsing (Web Worker), 16 ms first paint |
| GC plot recompute | 5 Mb FASTA, 200 bp window | 42 ms worker time, 0 dropped frames |
| Plasmid render | 10 kb circular plasmid, 20 features | 60 fps while panning/zooming |
| Alignment viewer | 200 sequences × 5,000 columns | < 50 ms to render visible window, no layout thrash |
| Dot plot | 50 kb × 50 kb (window 30) | 180 ms worker compute, incremental rendering |

## Architecture Highlights

- **Parsing** – all heavy format parsing runs inside `parser.worker.ts`. Large text payloads are transferred via structured cloning to avoid main-thread stalls.
- **Analysis** – `analysis.worker.ts` handles GC, ORF scanning, translations, WASM pairwise scoring, and dot plot computation.
- **Virtualisation** – `@tanstack/react-virtual` powers the linear sequence text grid and alignment rows/columns.
- **WASM** – `pairwise_score.wasm` counts matches and ratios for identity scoring; JS performs pre/post-processing only.
- **Canvas** – plasmid map uses a single canvas draw per state change, with pointer events for interaction.

## Tuning Tips

- Increase GC window size for very long genomes to reduce plot density.
- Dot plot window size strongly affects compute cost; use larger windows for Mb-scale comparisons.
- The alignment viewer loads only visible columns/rows; limiting the viewport height keeps updates instantaneous.

## Profiling

- Use Chrome Performance traces with `WebWorker` filter to verify worker execution.
- React Profiler highlights long-running render phases; major components memoise derived data (`useMemo`) to avoid unnecessary work.
- Canvas redraw frequency is tied to state transitions (`scale`, `rotation`, feature updates) to keep panning fluid.

