# Prior duplex as a selectable sentence deck

User requested a comparison with their attached older duplex to assess whether
the robot experiment loses the original playfulness. Extracted exact word fronts
from all 30 PDF pages: 15 people, 360 rows, 51 word/color cues. Preserve duplicates,
case, colors and person boundaries. Rover backs identify sheets but do not vote.

Added Prior duplex / Mixed corpus selector. Prior duplex locks to 15 participants;
all teams' word sheets are pooled. Both use the same real-sheet random-hand and
one-vote-per-person engine. All starting cues and punctuation remain selectable.
Direct link: `/paperweights/web/sentences.html?deck=prior`.

Verified whole-page vs separate-column extraction and front/back identity on
every sheet. Visually inspected PDF page one and the browser output. Node tests
check 600 forty-step chains, all starting cues and exact sampled-row ballots.
Browser checks cover prior URL, 15-person lock, quota cap, reset, reload, switching
back to mixed and narrow layout. Existing mixed browser tests also pass.

Both random and majority can wander and repeat on the older data. This is an
honest comparison, with no changes to manufacture a coherent majority result.
Fun still needs the user's judgement, not a diversity score.

[Provenance, source hash and commands](../paperweights/robot-majority/PRIOR_DUPLEX.md).
Existing PDFs and Rover/Households gameplay remain unchanged.
