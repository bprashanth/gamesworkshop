"""Recreate the approved sample using the production minimal layout."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from generator import build_deck, render_sheet, MINIMAL_CSS
from printkit import document, write_bundle, preview
sheets, colors = build_deck(15, seed=42)
path = Path(__file__).resolve().parents[1] / 'words/paper-weights-clean-mockup.pdf'
write_bundle(document([render_sheet(sheets[0], colors)], 'Paper Weights', MINIMAL_CSS),
             path, 1, {'kind': 'Approved minimal sample', 'source_deck_sheets': 15,
                       'source_sheet': 1, 'seed': 42, 'pairs': sheets[0]})
preview(path)
