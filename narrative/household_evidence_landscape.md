# Household evidence landscape

## Review now

[Contour study](http://100.82.28.38:8684/households/evidence.html)

A separate review page uses 40 measured cells from India's NSS 75th round,
2017-18. It preserves the monochrome dot lattice and muted amber inspection
points. Switch rural/urban and select a point. The game is unchanged.

The source is [MoSPI Report 585](https://mospi.gov.in/sites/default/files/publication_reports/Report_585_75th_round_Education_final_1507_0.pdf),
Statement 4.6, printed pages 86-87. Both pages were visually checked against
our transcription. The compact values and provenance are in
[attendance.json](../households/research/attendance.json).

Horizontal position is household spending quintile, separately defined within
rural and urban populations. Vertical position is education stage. Height is
net attendance ratio: the share of the official age group attending the
corresponding level. Someone attending a different level is excluded from
that numerator. Therefore 100 minus this value is NOT a dropout probability.

Bilinear interpolation creates display contours at five percentage point
intervals. Equal stage spacing is an ordinal display, not elapsed years.
There is no invented terrain noise, geographic meaning, or measured route.
This small table supports a broad landscape, not fine-grained mountains.

## Evidence that changes the design

The [IHDS February 2026 research digest](https://ndic.ncaer.org/wp-content/uploads/2026/02/IHDS-Research-Digest-Feb-2026.pdf)
summarizes an analysis of secondary dropout using IHDS 2004-05 and 2011-12.
Associations differ by shock and gender. Crop failure is not uniformly
associated with greater dropout; the reported association for boys is
negative. Multiple shocks and some household expenses show different
patterns. We read the institutional digest, not the paywalled full paper.
Its marginal effects cannot be added to generate joint monthly probabilities.

The [IHDS harmonized panel](https://www.icpsr.umich.edu/web/DSDR/studies/37382)
is a candidate for linking household circumstances and education over time.
It is not a monthly intervention trial. No raw household microdata have been
analyzed in this prototype.

[ASER 2024](https://asercentre.org/aser-2024/) provides another primary,
rural education benchmark. Its not-in-school measures include never-enrolled
children and cannot simply become monthly dropout rates either. Different
surveys must not be joined as if they describe the same households.

## Recommended playable landscape

Keep the existing six-month objective and simple card vocabulary. Construct
a state landscape around cash buffer and accumulated shocks, with separate
weather/harvest scenarios. Team actions should change the simulated household
state; projected state then determines the route through that landscape.
The current decorative vertical offsets should eventually be replaced by this
state projection, rather than giving curves a spurious empirical meaning.

Before calibrating this surface, obtain a documented household-level panel,
verify available cash/debt, harvest, shocks and education variables, apply its
survey weights, and check sample support in every conditional cell. Validate
held-out household predictions and report uncertainty. Collapse sparse states
rather than inventing detailed contours. Include contrasting contexts instead
of a universal failed-harvest rule.

Intervention effects require separate evidence. Until then their sizes and
monthly timing remain declared game assumptions, with sensitivity runs. Do
not imply an intervention moves a family into a richer spending quintile or
that aging through school is a six-month route.

Generate both audience archive and live scenarios from the same versioned
simulation. Polls use observed cards only. Keep evaluation households separate
from historical examples; test 15 and 200 sheet allocations and rare contexts.
More revealed information should improve average decisions, without granting
a guarantee on any individual household.

## Present limits

HH2 still uses synthetic loan/harvest risk and simulated intervention effects.
This study is not a calibrated replacement or an event print pack. No real
household trajectories or causal routes have been claimed. Source PDFs stay
in ignored local output; only the compact numerical transcription is tracked.
