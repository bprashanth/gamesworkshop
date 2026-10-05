# Space anchors: knowing when a smaller model is enough

This is the narrative and handoff for another agent to brainstorm a game. It is
not a finished rulebook. The two approved films are **final for now**; explore
game mechanics around them rather than redesigning their visuals.

## Watch first

- [Shared gallery](http://100.82.28.38:8651/) — both finals first, earlier versions below.
- [Mars contours — 36 seconds](../space/mars-rover-video/codex/media/contours-v3.mp4).
- [Moon fixed maps — 42 seconds](../space/moon-model-video/codex/versions/fixed-map/moon-fixed-map.mp4).

## The narrative

The question is not simply whether a bigger model is better. It is **which
decisions can be made locally, under which conditions, with what evidence?**

Start with the Moon. The spacecraft has a larger mission context: where it is
going, what resources remain, and what should happen next. Earth can help plan
and revise that context. But the spacecraft eventually passes behind the Moon.
It cannot wait for an answer from Earth during a time-critical manoeuvre.

The useful local capability is not an all-purpose replacement for Mission
Control. It handles a narrower problem: observe a few relevant variables,
compare them with a target, and correct within a known operating envelope.
The film makes that situation visible with one path, an Earth-link indicator,
and a few changing burn values. It is an analogy for bounded autonomy, not a
claim that Orion used the AI architecture proposed for this game.

Now ask where that operating envelope comes from. Move to Mars.

The rover follows a real route across a real landscape. A model can make a
prediction, but a coloured confidence area is not evidence by itself. Someone
must decide what to observe, how to measure it, and what would count as a
prediction being wrong. Terrain, atmospheric dust and rock composition make
this concrete: they are different indicators, not interchangeable units of
“more data.” Which ones matter depends on the decision being attempted.

At a stop there are two different opportunities. **Explore** conditions the
model does not understand well, or **verify** a prediction in a situation where
it already claims to know what will happen. Exploration can reveal a new kind
of case. Verification can test whether an existing expectation holds. Neither
is always the right choice, and a successful observation does not establish
that a model generalizes to every nearby place.

The proposed connection between the films is a learning loop: collect useful
indicators under a repeatable protocol; compare predictions with observations;
update a broader model; identify a bounded subset that a local model can handle;
then notice when changing conditions put the current case outside that subset.
Better indicators may improve prediction or reveal that the model should
abstain. They do not guarantee that a smaller model becomes adequate.

The lesson to discover through play is: **local autonomy is earned through
well-defined problems and tested conditions, not merely by moving a model onto
a device. More observations help only if they address the uncertainty that
matters.**

## What the films actually show

**Style.** Black background, restrained white type, one travelled path, fixed
framing, no music, camera cuts, glow, forecast fans or decorative projections.
Mars uses thin muted blue-grey/brown elevation contours. Hollow areas mean new
data; diagonal hatching means confirmation. Moon uses a simple blue Earth and
grey Moon with a Sun-derived day/night boundary, not synthetic photographic
footage. Two permanent map scales keep the full journey and lunar encounter
readable without a moving camera. Minimal corner readings carry the detail.

**Mars data.** The map uses the public JPL/USGS
[20 m Jezero CTX elevation model](https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif)
and [NASA Perseverance traverse GeoJSON](https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json).
The cached route covers days 14–1980. The renderer derives slope and relief in a
200 m square from the smoothed orbital DEM; these are not rover instrument
measurements. Distance is the cumulative length of the displayed, deduplicated
projected route, about 45.18 km at the end, not an official wheel odometer.

Environment shows the same-day median of published
[MEDA/TIRS thermal-infrared aerosol optical-depth retrievals](https://doi.org/10.5281/zenodo.20827517),
spelled `tau`. Missing days remain `no reading`; infrared tau is not substituted
with visible-wavelength opacity. Rock shows minerals reported for the **named
last acquired core**, using the cached sample inventory assembled from
[NASA's sample catalogue](https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/)
and [PDS initial sample reports](https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_sample_dossier/initial_reports/).
It is not a live chemistry reading at every rover position. `days` means Martian
days since landing. Five new/confirmation stops are staged: no NASA experiment,
confidence surface or predictive model has been reconstructed.

**Moon data.** Independently parsed cached NASA/JPL Horizons Artemis I state
vectors (`Artemis-I_ASF`, with DE441 reference-body ephemerides) supply the path,
Moon and Sun. Position-and-velocity interpolation combines ten-minute transit
samples with one-minute encounter samples. The burn is placed at 12:44 UTC on
21 November 2022 for 150 seconds, following
[NASA's flyby account](https://www.nasa.gov/blogs/missions/2022/11/21/orion-successfully-completes-lunar-flyby-re-acquires-signal-with-earth/).
The flight clock speeds through transit and slows during the burn, identically
in both views. `days` here means elapsed Earth days since launch.

Earth-link visibility is a 3D line/spherical-Moon obstruction test toward Earth's
centre, not a reconstruction of individual ground stations. The far side is
not necessarily the unlit hemisphere. Speed, pointing and path **errors** are
illustrative exponentially decaying states, visibly labelled simulated; the
fourth burn value is time remaining. They neither reproduce Orion telemetry nor
control the rendered real trajectory. The film contains no trained AI model.

Source hashes and methods: [Mars provenance](../space/mars-rover-video/codex/provenance-v2.json)
and [Moon provenance](../space/moon-model-video/codex/versions/fixed-map/provenance.json).
Both films use independent Codex renderers. Cached public raw data and the
source-backed sample inventory are shared with the earlier Claude research;
Claude artwork and rendered footage are not reused.

## Handoff: brainstorm a playable loop

Design for a room that can make meaningful choices without a technical lecture.
Use these two films as stable visual anchors, not as scientific proof of the
game's rules. A local controller need not be learned, and locality is not the
same as model size; the small-local / larger-remote pairing is the **game's
design premise**, with explicit tradeoffs rather than a universal law.

Explore a loop such as:

1. Make a prediction and define its operating envelope: conditions, indicators,
   acceptable error, and an abstain/escalate rule.
2. Spend a limited opportunity on exploration or on testing that prediction.
   Choose a protocol, not an undifferentiated quantity of data.
3. Reveal observations. Distinguish a new example, an independent confirmation,
   a contradiction, and an unmeasured condition. Testing on the same observation
   used to fit the model must not count as independent validation.
4. Spend time, energy or connectivity to revise the broader model or deploy a
   bounded local capability. The local capability should buy something tangible:
   faster response, less communication, or continued operation during an outage.
5. Change one condition or remove the link. Let players act locally, wait,
   abstain or seek remote help. Resolve consequences against rules chosen before
   the reveal, not a facilitator's preferred moral.

This sequence is a hypothesis, not a required five-phase turn. Find a much
simpler recurring decision if possible. Exploration should sometimes be better
than verification, and sometimes worse. Remote help should sometimes be worth
waiting for; local action should sometimes be clearly preferable. An unmeasured
indicator should make a genuine blind spot, not a surprise punishment the
players had no way to anticipate. Dust can change a relevant condition, but do
not assume every dust change invalidates every terrain or composition model.

**Please return three contrasting loops**, each with one core decision, a
repeatable turn, a scarce resource, a loss/win condition, and a worked example
showing a different strategy becoming preferable. Include one room-friendly
social/card loop and one lightweight single-player loop. For each, explain:

- How does evidence change the permitted scope of the local model?
- What makes exploration versus verification a real tradeoff?
- Which indicator changes a decision, and which tempting measurement is irrelevant?
- What feedback lets players discover the relationship without being told it?
- What is real data, authored simulation, or still an untested design assumption?

Recommend the smallest prototype that can falsify the central idea. Avoid a
large dashboard, a technology shopping list, a quiz, “local always wins,” or a
single score that rewards accumulating data regardless of its relevance.

For adjacent mechanics, inspect [Crew](../crew/README.md),
[Fieldwork](../fieldwork/README.md), and the
[workshop method](../chronology/2026-10-04-readme-before-anchor-films.md).
The desired outcome is a game in which the room experiences the value and limits
of bounded models, and the work required to justify those bounds.
