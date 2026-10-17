# Shared map promotion and cumulative evidence - 18 October 2026

User selected the combined map and requested red dead-team markers, an X-eyed
smiling face alongside OUT, person tokens instead of lightning bolts, and a voting
model that encourages useful inspections and learns from additional cards.

Promoted shared map to index.html; old shared-map.html link remains functional.
Markers turn red on elimination and team panels show a line-art X-eyed smiling
face. Stick figures replace bolts. Clicking a panel selects that team's dotted
column highlight. Controls, independent progress/reset, six turns and three checks
remain. No extra explanatory game copy.

PW6 replaces the latest-icon-only poll with a key containing all revealed
icon/color pairs. Matching historical rows determine risk and each hidden card's
expected information gain. Under uncertainty, inspection receives 0.9*binary
entropy action mass, divided by squared information gain. Remaining action mass
is split GO/AVOID by risk. Known kills imply Avoid. Information can change the
majority; confidence is not artificially increased after each click. See
competition/EVIDENCE.md for policy and limitations.

Generated digital per-person evidence lookup tables with historical references;
browser counts actual team entries. New packs PW6-15-15-457112229b and
PW6-15-200-c077f594df. Data-generation inputs do not include live hidden values
when calculating a particular evidence poll. The old 24-row PW5 sheets cannot
encode cumulative evidence. This was communicated during work; PDFs preserved,
not regenerated. Summary/README/print catalog now state this incompatibility.
A paper encoding remains a design requirement before printing PW6.

Validation: 13 model tests pass, including all-cue provenance, exact vote counts,
known-kill certainty, exclusion of revealed inspection categories and expected
uncertainty reduction. Browser tests pass at 15 and 200: cumulative polling,
all six turns, token budget, independent reset, death/face, Easy, percentages,
desktop/mobile. Death screenshot reviewed: red A marker and X-eyed OUT face.

100-seed comparison: at 200 people mean finishers rise from 0.36 (direct decisions)
to 1.13 (tested inspection policy); at 15, 0.26 to 0.93. Default map gives 1 versus
2 at 200 and 0 versus 2 at 15. Explicit limited-policy simulation, not a guarantee.
Results saved in competition/evidence-trials.json. Existing Tailscale site rebuilt.
No public deployment.
