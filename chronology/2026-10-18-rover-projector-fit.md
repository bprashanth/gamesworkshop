# Fit shared Rover view to projector screens - 18 October 2026

User requested one-screen fit across typical laptop/projector resolutions.
Desktop layout now fills the actual viewport height, reserving header and four
side-by-side panels, with the shared map taking the remaining space. Map canvas
keeps its native aspect ratio and updates through ResizeObserver when panels,
window size or available space change. No scrolling or overflow hiding is used to
conceal controls. Compact desktop styles retain all four panels down to 800px.

Browser geometry stress checks include all six possible poll rows and outcomes
in all four panels. Tested 800x600, 1024x768, 1280x720, 1280x800, 1366x768,
1440x900, 1920x1080, 1920x1200 and 2560x1440. All controls stay onscreen and map
height remains above 100px; no document overflow or browser errors. Existing
six-turn gameplay tests also pass. Screenshots under paperweights/out/projector-*.

Local review site rebuilt. No gameplay, distribution or print changes.
