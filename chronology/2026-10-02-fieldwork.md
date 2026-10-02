# 2026-10-02 — A place, a service, seven shifts

This is the second experiment. The [first loop was frozen](2026-10-02-idlisseus-frozen.md)
before this work began, at `idlisseus-v0-first-cut`. Its engine, deck, tests and
balance reports remain unchanged. A checksum test guards that separation.
`python3 play.py` now opens either game from the same checkout.

## 1. Narrow the question

The new request was to choose a point anywhere in India, investigate real
problems using public data and economics research, and discover a useful AI
intervention through play. The constraint was simplicity: a few clear choices,
visible consequences, enough pressure to want another run.

We chose a service-delivery puzzle influenced by Into the Breach's advance
warning. The player can see today's exact consequences and tomorrow's capacity
and connection. Later arrivals remain unknown. This creates a different loop
from Idlisseus's route choices and probabilistic expedition.

## 2. Put evidence underneath the place

We bundled the official provisional NFHS-5 workbook, covering 707 survey
districts and 12 selected indicators. The survey is from 2019–2021 and uses
2017 districts. It supplies a dated district context, not a current measurement
of the selected village. Four supported threads turn that context into a
small service segment: vaccination attendance, antenatal visits, sanitation
repair visits, and registration-counter access.

The data audit found small-sample cells stored as negative numbers with a
parenthesized Excel display format. We preserved the positive displayed values
and precision flags. Suppressed estimates stay missing. A duplicate Chandel
row incorrectly assigned Manipur's values to Mizoram; we replaced that row
with Saiha's original official PDF values and kept both source files and
the explicit correction. Full coverage is not offered as a coverage gap.

## 3. Make place selection work offline

The place layer combines 549,021 GeoNames inhabited-place records with district
and state polygons. It accepts names, coordinates and coordinate-bearing map
links. A point must fall inside a polygon; the game does not silently choose
the nearest district. Ambiguous names get a choice list.

The map and survey have different historical boundaries. Ten officially
documented single-parent splits supply labelled parent context. Other unmatched
points need an explicit survey-area selection. A boundary audit also caught
swapped Kancheepuram/Chengalpattu labels, which were corrected with attribution.
This supports broad India coverage without pretending every point has a verified
survey-boundary match. Sources and licences travel with the bundled data.

## 4. Build one small decision repeatedly

Twelve fictional cases arrive across seven shifts. Each needs an explanation,
a checked record, or a field visit. Get eight to an existing service before
their deadlines. Prepared work does not score until service capacity admits it.

The pocket guide batches explanation cases and works offline. The records desk
batches documents but needs a connection. The worker can prepare one case of
any kind. A/B chooses the shift's work; R moves the AI once, consuming that
shift's preparation. Each option previews preparation, actual service,
remaining ready work and missed deadlines.

Economics and implementation research motivates the distinction between
information, administration and service availability. It does not calibrate
these AI capacities. Survey estimates, research findings and invented gameplay
stay separately labelled. Original short scenes use concrete details; they
are not interviews, portraits of residents or quotations from a journalist.

## 5. Play, inspect, tighten

Manual Chennai play made the intended decision visible: clear records while
connected, use the worker during an outage, move the desk during a closure,
then batch explanations when the service reopens. Three prepared cases could
only take two places; the remaining case carried over. The run reached nine.

A Bangalore run began with the poorly matched records desk. Moving immediately
to the pocket guide recovered the opening explanation backlog and kept working
through an outage. Later the worker became necessary. It also reached nine;
two records and one field case missed their window.

These passes exposed three rough edges: pointless turns after all cases were
resolved, work spent preparing a case whose last service day was already
closed, and a few starting worlds that could not win. We removed the empty
turns, skip visibly impossible preparation, and check generation for a viable
plan from either initial kit. The feasibility solver never supplies player
hints. Missed outcomes now distinguish prepared work that lacked service
capacity from work never prepared.

## 6. Freeze expectations for tomorrow's test

The final audit covers 4,000 world/tool conditions and 16,000 policy
playthroughs, plus separate full-world feasibility checks. Forecast-aware play
wins 97.5%; immediate-gain play wins 87.45%. Either kit can win every accepted
world. There is no dominant starting kit in the sampled comparison. These
are checks of the designed puzzle, not measured human enjoyment or evidence
of real AI effectiveness. See [the playtest record](../benchmarks/FIELDWORK_PLAYTEST.md).

Both games are available without installing dependencies or connecting to a
service. Tomorrow's useful questions are whether players understand the
prepared/reached distinction, notice tomorrow's constraint, discover the move
option, and want to replay the same week with another desk. The second game
has four authored service stories with generated queues, not hundreds of
individually reported local narratives. That is the current scope.
