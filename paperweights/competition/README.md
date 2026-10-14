# Competitive Paper Weights model

This is an authored teaching world, not a claim about NASA hazard frequencies or the collaborative game's fixed deck. Four teams each face four surveyed route checkpoints. Each checkpoint has its own known two-reading history and source square, then one hidden target. They are spaced checkpoints, **not four contiguous squares**: the source of checkpoint two is not claimed to be the target of checkpoint one.

## One shared distribution

`generate.py` is the authority for both historical observations on paper and target maps. Each of the 24 cue keys is an icon plus C01–C06. Context compresses two previous dust readings and the known source slope: persistent haze / fresh haze / other, crossed with flat / uneven. It never consults hidden target values. Every sheet has every cue exactly once, so **100% of a team's audience can vote on every call**.

A target is safe or contains one fatal battery, dust or ground reading. Uneven persistent histories favor one failure; other contexts produce close dust/battery or ground/battery splits. Two valid storm cues lead to certain lagged battery failure. The precise probabilities live in `kernel()`. Storm targets cannot have flat slopes; sand targets cannot have steep slopes. Battery is dead exactly when the source had storm or sand. Storm only follows haze; sand only follows soft ground. Source windows also obey these constraints. Flat-context storm cues and C03 storm are unreachable, so those rows use a full-battery cue instead.

Historical observations use that same target kernel. The recorded inspection focuses on a failure 80% of the time and explores uniformly 20% of the time; safe observations explore uniformly. The printed right-hand word is that historical inspection. Thus the room estimates an **inspection suggestion distribution**, not a literal probability of death. `observations` retains source, target and inspection for every row, including safe/exploratory counterexamples.

For dependable event packs, category frequencies are stratified by largest remainder separately for each team and cue, then shuffled between participants. Each category's rounding error is below one voter. A 3–4-person test team necessarily produces coarse ties; 25–50-person teams resolve the intended distributions more accurately. Historical outcomes are sampled conditionally on each allocated inspection using Bayes' rule, so no impossible category/outcome pairs are invented.

The kernel is a joint mixture of valid source/target observations conditioned on the cue, not a claim that every source variable is independently randomized. The source ground or dust readings beyond the called icon are latent to the audience; these distinguish cases sharing an icon/context. For example, haze accompanied by unshown sand can lead to a dead battery, while haze on firm/soft ground can lead to storm. Display the called source icon and context, not the complete source record. The history and lateral slope used by the color are known; no target information is used in the color.

The maps draw independently from the same kernel. Changing paper count leaves every map unchanged. The game never selects outcomes to punish a vote, force a winner or reward a specific player. The demo seed is curated, but arbitrary seeds are never filtered or retried. Every source window and target is stored in the pack before play.

## Play and balance

One category may be inspected per checkpoint. GO on any fatal target eliminates; AVOID on a safe target also eliminates. AVOID on a fatal target or GO on a safe one advances. Four successful calls finish the route. The reference paper policy inspects the largest printed category count (ties use battery, slope, dust, ground order), avoids a revealed fatal card, otherwise goes. The uninformed comparator rotates categories independently of the clue. Neither gets hidden-target knowledge.

`simulation.json` reports 500 route seeds for each of 15, 100 and 200 sheets, including all 0- and 4-finisher outcomes. One or two finishers is an average design goal, **not a guarantee**. Seed 374 is the shipped reproducible event seed, explicitly selected during rehearsal because the reference policy yields two finishers with 15, 100 and 200 sheets and all four teams reach checkpoint three; see its complete policy logs in that report. A group may be eliminated before round three: sudden death takes effect immediately.

## Regenerate / verify

```sh
python3 paperweights/competition/generate.py --sheets 200 --seed 374 --out paperweights/competition/pack-200.json
python3 -m unittest discover -s paperweights/competition -p 'test_*.py'
python3 paperweights/competition/simulate.py
```

`packId` hashes the complete generated pack. Print and game must have the same ID. Print production should import `make_pack(sheet_count, seed)` rather than recreate any model logic. The full pack contains hidden targets for the local static game: it is suitable for a trusted on-stage operator, not adversarial secret-server play. Do not give spectators the JSON. A later online competitive deployment would need a server to withhold future targets.

## Actual event vote examples

The 200-sheet pack has 50 voters per team. Team B checkpoint 1 is an exact leading tie: battery 19, dust 19, slope 6, ground 6. Team A checkpoint 1 is ground 20 versus dust 18, with battery 6 and slope 6. Team A checkpoint 2 is dust 22 versus battery 16, with slope 6 and ground 6. These are actual printed counts, not screen decoration. All 50 people have a matching row in each case. The smaller pack has four/four/four/three voters; percentages are correspondingly coarse.

Across 500 unfiltered seeds (0–499), the reference paper policy averages 0.984, 1.188 and 1.116 finishers at 15, 100 and 200 sheets, versus 0.228 for clue-independent inspection. One or two finishers occurs in 62.0%, 66.8% and 62.6% of runs respectively. This measures one declared policy; people can do better or worse. The 374 rehearsal seed is in that sweep, so the sweep is unfiltered rather than an entirely unseen evaluation set.
