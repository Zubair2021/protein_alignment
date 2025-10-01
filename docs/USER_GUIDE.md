# HelixCanvas User Guide

HelixCanvas is a local-first sequence visualisation and annotation studio. This guide walks through the main workflows and UI layout.

## Layout Overview

- **Header** – workspace name, theme toggle, and quick import/export actions.
- **Left panel** – sequence catalogue (with per-entry metadata) and alignment library.
- **Main canvas** – tabbed workspace for overview, linear viewer, plasmid map, alignment curation, and analysis.
- **Right panel** – annotation inspector, search/regex console, and bookmark manager.

## Importing Data

1. **Drag and drop** FASTA, multi-FASTA, GenBank, EMBL, CLUSTAL/MAF/Stockholm, GFF3, or CSV annotation files anywhere on the main canvas.
2. Use the **Import** button in the header to trigger the file picker.
3. Zip archives created by HelixCanvas (`helixcanvas_workspace.zip`) can be re-imported to restore sequences and alignments.

### Format Handling

- **FASTA / multi-FASTA** – loaded as individual sequence records.
- **GenBank / EMBL** – sequences plus annotated features; annotations are sanitised for in-bounds coordinates.
- **GFF3** – feature entries merged into the active sequence.
- **CSV annotations** – added to the active sequence with undo/redo history.
- **Alignment files** – surfaced in the Alignment tab with editable rows.

## Managing Sequences

- Click a sequence in the left panel to activate it.
- Use the **bookmark panel** (right column) to mark positions for quick navigation.
- Remove a sequence by revealing the contextual menu (hover → “Remove”).

## Linear Viewer

- Virtualised scrolling keeps 5 Mb FASTA responsive.
- Regex toggle enables `RegExp` queries (case-insensitive) alongside literal search.
- Matches are highlighted and summarised in the search panel.
- Copy the entire sequence via the viewer toolbar.

## Plasmid Map

- Available for circular sequences.
- Scroll to zoom, drag to rotate, hover to inspect features.
- Colours mirror annotation palettes; updates propagate whenever annotations change.

## Alignments

- Supports FASTA/CLUSTAL/MAF/Stockholm imports.
- Consensus track appears above sequences with mismatch colouring and gap shading.
- Double click a cell to edit (single character). Changes stay local and can be exported to CLUSTAL/FASTA.
- Column heatmap intensity reflects mismatch ratio for quick curation.

## Analysis Dashboard

All computations run in Web Workers, keeping the UI responsive:

- **GC Content** – adjustable window with gradient plotting.
- **ORF Finder** – frames + translation preview (read-only).
- **Translation** – quick amino-acid preview (frame 0).
- **Pairwise Identity** – WASM-backed comparison, dot-plot rendering, and curated restriction map.

## Annotations

- Create annotations from the inspector (name, type, range, colour, notes).
- Edits support undo/redo (local history per sequence).
- Export the active sequence to GenBank via the overview panel.

## Exports

- `Export FASTA` – all sequences in multi-FASTA.
- `Export Alignment` – CLUSTAL text for the primary alignment.
- `Export GenBank` – active sequence with features/annotations.
- `Export Zip` – zipped JSON bundle (sequences + alignments) for sharing.

## Keyboard Shortcuts

- `⌘/Ctrl + 1` → Overview
- `⌘/Ctrl + 2` → Linear viewer
- `⌘/Ctrl + 3` → Plasmid map
- `⌘/Ctrl + 4` → Alignment
- `⌘/Ctrl + 5` → Analysis
- `⌘/Ctrl + F` → Focus analysis tab for quick search tools

## Privacy & Safety

- All data is processed client-side; IndexedDB stores session state locally.
- No primer/cloning/synthesis automation is provided; outputs are limited to analytical views and safe exchange formats.

