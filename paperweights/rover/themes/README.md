# Rover Run / stage 02 / visual review

[Open the comparison gallery](index.html) or [all nine mockups in one PDF](review-all.pdf).
These are visual proposals. Neither the deployed game nor approved production word
packs have changed. Layout and original SVG glyphs come from the local Rover source;
the live Netlify page was unavailable to the browsing tool during this review.

| Direction | White paper | White screen | Black screen |
| --- | --- | --- | --- |
| Mission / mineral accents | [PDF](01-mission-paper.pdf) | [PNG](01-mission-light-preview.png) | [PNG](01-mission-dark-preview.png) |
| Terminal / pixel accents | [PDF](02-terminal-paper.pdf) | [PNG](02-terminal-light-preview.png) | [PNG](02-terminal-dark-preview.png) |
| Telemetry / monochrome | [PDF](03-dotmatrix-paper.pdf) | [PNG](03-dotmatrix-light-preview.png) | [PNG](03-dotmatrix-dark-preview.png) |

## What to compare

**Mission** is the recommended starting point for the white stage. Mineral red, steel
blue, ochre, sage, violet and rose extend the existing warm-neutral/sand vocabulary.
They occupy the context frame and label rather than flooding the icon face.

**Terminal** uses slightly stronger retro-computer accents, squared marks and segmented
rules. Try its black screen for the closest continuity with the current game's dark
presentation. This is restrained pixel detailing, not a replacement pixel-art icon set.

**Telemetry** is entirely monochrome. Six distinct 2-by-3 dot patterns plus C01–C06
replace hue as the context key. Dotted rules reinforce the low-bandwidth instrument
feel. This is a real alternative matching mechanism: people must recognize a mark or
read an ID, which may be slower than spotting a color under a ten-second deadline.
No artificially distressed type, scanlines or blurred CRT effects are applied.

All three retain the same rectangular, two-column, 24-entry Swift lookup geometry.
White paper uses outline boxes and a narrow context band; only historical hazard icon
faces are solid black. Stage cards remain monochrome, inverting hazard faces relative
to the screen background. Context frames stay outside the inverted area. Matching
uses the icon plus context, not whether the whole card is black or white.

The six codes map one-to-one to the existing context model:

| Code | Previous name | Meaning |
| --- | --- | --- |
| C01 | RED | Last two dust readings HAZE; current terrain non-flat |
| C02 | BLUE | Latest HAZE, older not HAZE; current terrain non-flat |
| C03 | AMBER | Latest dust not HAZE; current terrain non-flat |
| C04 | GREEN | Last two dust readings HAZE; current terrain flat |
| C05 | PURPLE | Latest HAZE, older not HAZE; current terrain flat |
| C06 | PINK | Latest dust not HAZE; current terrain flat |

The dot pattern, code and hue are redundant representations of the same context,
not three additional rules. Context is not a danger level. Vote bars stay neutral
because they count category suggestions, not context or safety.

## Scope and timing

Every treatment reuses exactly the first audience sheet and four stage snapshots from
`../context/`; it does not resample evidence or alter vote counts. The same Jezero
reference route appears in all panels as in the earlier map mock. It is not four newly
generated terrain maps. The terrain/card sequences remain simulated.

These show the fully revealed source-review moment (square 06), with a highlighted
cue selecting an inspection in square 07. They are static visual comparisons, not a
new implementation of flipping, voting or the temporal game flow. The known-terrain
constraint discussed in the context guide still applies. Printed C01 replaces the
spoken RED call in these proposals; existing production packs retain their old labels.

Printouts are A4; stage exports are 16:10 with white and near-black backgrounds. Test
projection and a physical print before choosing between the palettes: thin context
frames may need more area at venue distance. The dot mark and context code provide
fallback recognition; they are not a claim of completed accessibility testing.

## Regenerate

From the repository root:

```sh
paperweights/.venv/bin/python paperweights/rover/themes/render.py
```

The script reads saved source manifests, preserves SVG geometry, writes HTML/PDF/PNG,
checks each page's text bounds and single-page layout, and bundles the nine previews.
`manifest.json` records source hashes, exact palettes, context mapping and outputs.
All arrow separators remain ASCII `->`. To adopt a direction later, apply its palette
and marker convention to both the Paper Weights word sheets and Rover so the teaching gesture
stays consistent; this review intentionally leaves the approved word packs untouched.
