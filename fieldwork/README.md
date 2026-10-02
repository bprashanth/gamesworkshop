# Fieldwork

A separate place-based prototype. **Idlisseus is untouched.** Both are available
through `python3 play.py`, or start this one directly:

```bash
python3 -m fieldwork
```

Python 3.10+, standard library only. No API key, installation, network, account
or generated research is needed to play. The bundled evidence and geography
make this checkout larger by about 21 MB.

## One small intervention

Choose a point or place in India. The game offers two entry points from a
dated district survey: vaccination-service attendance, routine antenatal visits,
sanitation-repair visits, or birth-registration counter access. Choose **one**.
These are narrow service segments, not a plan to solve an entire district's
health or poverty problem.

Twelve fictional cases arrive during a seven-shift window. Each needs an
explanation, a checked record, or a field visit before it is ready for an
actual service. Get **eight** through. Merely preparing a case earns no point.

- **A — AI desk:** the pocket guide clears up to three explanation cases;
  the records desk clears up to three record cases. The records model needs
  a connection. Both use checked material; capacities are game assumptions.
- **B — Worker:** one case of any kind, prioritising the earliest feasible
  deadline. Physical visits cannot be replaced by an AI desk.
- **R — Move the AI:** switch between the two stacks once. Moving consumes
  this shift's preparation time; already-ready cases can still get service.
- **E — Evidence:** survey definition, year, precision flags and linked
  research. **Q** exits. Press Enter after a consequence to continue.

Service places are limited and one shift is closed. Cases have deadlines.
Today's exact results and tomorrow's capacity/connection are visible before
you act. Outcomes are deterministic: no secret die changes an action after
you choose it. Move during a closure, batch before an outage, or save a case
that a larger batch would leave behind. The design borrows advance warning
and small tactical turns from [Into the Breach](https://subsetgames.com/itb.html).

At the end, replay the same cases and closures with the other AI desk.
There are four service stories, generated queues and deadlines, and two AI
setups—not a large button menu or a second copy of Idlisseus's event deck.

## Places and evidence

Type a district, a settlement with its state, `latitude,longitude`, or a
Google/OSM link containing coordinates. Shortened map links cannot be resolved
offline. Ambiguous names produce a list rather than selecting a place for you.
Coordinates are checked against polygons, never assigned the nearest district.

```bash
python3 -m fieldwork --place 'Udaipur, Rajasthan' --problem vaccination --seed 7
python3 -m fieldwork --place '13.08,80.27' --problem sanitation --seed 9
python3 -m fieldwork --place 'Udaipur, Rajasthan' --problem vaccination --evidence
python3 -m fieldwork --place 'Udaipur, Rajasthan' --seed 7 --demo --plain
python3 -m fieldwork --place 'Chennai, Tamil Nadu' --log field-notes.json
```

`--tool guide|reader` skips the initial desk selection. `--plain` disables
terminal clearing and colour. `NO_COLOR` disables colour. Logs record the
latest run, selected point, evidence area and each action; they are not resume
files. Seeds reproduce cases and service conditions with the same source code.

**The three kinds of truth stay separate:**

1. **Observed:** NFHS-5's 2019–2021 district estimates. The official workbook
   is provisional and uses 2017 survey districts. Small samples are flagged;
   suppressed figures are absent, never converted to zero. A duplicated
   government spreadsheet row was corrected from the original district PDF,
   with the original and correction retained. See [data notes](data/README.md).
2. **Researched mechanism:** economics and implementation studies explain why
   information, administration and actual service capacity are different
   constraints. Each source retains its study place, period and limitations.
   A study elsewhere does not establish the selected place's cause.
3. **Invented game:** cases, scene details, queues, outages, deadlines, AI
   throughput and outcomes. A win does not change the survey rate or estimate
   an intervention's real effect. No dialogue or portrait is presented as
   an interview with an actual resident.

The game chooses two available, preferably adequately sampled indicators,
showing larger within-indicator coverage gaps first. Different indicators have
different denominators; this is not a ranking of local priorities or AI impact.
No district percentage is used to infer local language, internet reliability,
individual behaviour, or a cause of non-attendance.

## Geographic scope and attribution

The offline settlement index contains **549,021** inhabited-place records
from [GeoNames](https://download.geonames.org/export/dump/), licensed
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
The simplified district geometry contains **735** available features from
[geoBoundaries / Pathways Data / LGD](https://www.geoboundaries.org/api/current/gbOpen/IND/ADM2/),
2021 edition, under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
State boundaries are geoBoundaries' DataMeet/ECI source under
[CC BY 2.5 India](https://creativecommons.org/licenses/by/2.5/in/).
Source metadata, retrieval details and transformations are in `data/geography.json`
and the compressed gazetteer. These databases retain their source licences;
the repository's code licence does not replace them.

These are approximate, historical map boundaries, not a legal boundary service.
New districts and boundary ambiguities do not always match the NFHS survey
edition. Ten documented single-parent relationships use a clearly labelled
historical parent context, with official district sources retained in
`data/parent_contexts.json`. The boundary audit found 704 direct name matches,
10 parent contexts and 20 named polygons requiring explicit selection; one
additional feature has no usable district name. Swapped Kancheepuram and
Chengalpattu source labels were corrected with official sources, preserving
the original labels and correction details in the geometry metadata.
Unresolved points require an explicitly selected historical survey
district; the log identifies that choice rather than claiming it is an exact
spatial match. The game never substitutes an unlabelled neighbouring estimate.
Places outside the available polygons or absent from the gazetteer may require
coordinates or a survey-district name.

## Test and edit

```bash
python3 -m unittest discover -s tests -v
python3 -m fieldwork.simulate --seeds 500
```

The tests cover both independent games. Balance policies only receive public
observations; a separately labelled full-world solver checks feasibility.
It is not an in-game hint. See [playtest notes](../benchmarks/FIELDWORK_PLAYTEST.md).

`problems.json` holds the four scene openings and their source links.
`research.json` holds the research claims, original study scope and explicit
game inferences. `engine.py` contains the small queue puzzle. The two data
builders are developer tools; playing uses only the bundled files. See
`fieldwork/build_data.py` and `scripts/build_fieldwork_geography.py` for
reproduction details.
