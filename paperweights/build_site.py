#!/usr/bin/env python3
"""Assemble the competitive page into the existing Netlify publish tree."""
from pathlib import Path
import argparse
import json
import shutil

ROOT = Path(__file__).resolve().parent.parent
LIVE = ROOT / 'space/rover-run/src/web'
COMPETITIVE = ROOT / 'paperweights/web'

def build(output=None):
    target = Path(output).resolve() if output else LIVE
    if target != LIVE:
        target.mkdir(parents=True, exist_ok=True)
        shutil.copytree(LIVE, target, dirs_exist_ok=True, ignore=shutil.ignore_patterns('paperweights'))
    dest = target / 'paperweights/web'
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copytree(COMPETITIVE, dest, dirs_exist_ok=True)
    stages = json.loads((dest / 'stages.json').read_text())
    for stage in stages:
        if stage['id'] == 'collaborative':
            stage['href'] = '/'
    (dest / 'stages.json').write_text(json.dumps(stages, indent=2) + '\n')
    # Make the currently selectable print packs available on the rehearsal site.
    for item in json.loads((COMPETITIVE / 'packs' / 'index.json').read_text()):
        source = ROOT / 'paperweights' / 'printouts' / item['packId']
        if source.is_dir():
            shutil.copytree(source, target / 'paperweights' / 'printouts' / item['packId'], dirs_exist_ok=True)
    print(f'Competitive stage: {dest}')
    return target

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, help='Separate directory for local deployment verification')
    build(parser.parse_args().output)
