"""Tile frames into one review image: montage.py out.png frame*.png [--cols 3]"""
import sys
from PIL import Image
args = [a for a in sys.argv[1:] if not a.startswith('--')]
cols = int(sys.argv[sys.argv.index('--cols') + 1]) if '--cols' in sys.argv else 3
out, frames = args[0], [Image.open(f) for f in args[1:] if not f.isdigit()]
w, h = frames[0].size; s = 0.5
sheet = Image.new('RGB', (int(w * s) * cols, int(h * s) * ((len(frames) + cols - 1) // cols)), (40, 40, 40))
for i, f in enumerate(frames): sheet.paste(f.resize((int(w * s), int(h * s))), (int(w * s) * (i % cols), int(h * s) * (i // cols)))
sheet.save(out)
