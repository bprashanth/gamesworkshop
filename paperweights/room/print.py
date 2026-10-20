#!/usr/bin/env python3
"""Print the room's sheets as one duplex PDF: words on the front, data on the back.

    paperweights/.venv/bin/python paperweights/room/print.py --sheets 20

Sheet k on paper is sheet k on the phones (same deal for the same room size).
Print A4, colour, double-sided, flip on long edge.
"""
import argparse
import json
import re
from html import escape
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import deck
from printkit import CSS, document, write_bundle, preview

HERE = Path(__file__).resolve().parent
LIGHT = {'RED': '#a74638', 'BLUE': '#316b8c', 'AMBER': '#8b681d', 'GREEN': '#39785c', 'PURPLE': '#72528e', 'PINK': '#a24b7d'}
CONTEXT = {'C01': 'RED', 'C02': 'BLUE', 'C03': 'AMBER', 'C04': 'GREEN', 'C05': 'PURPLE', 'C06': 'PINK'}
HH = json.loads((HERE.parent.parent / 'households/assets/icons.json').read_text())['primary']
ROVER = json.loads((HERE / 'rover-symbols.json').read_text())
EXTRA = '''
.top{display:flex;justify-content:space-between;align-items:baseline;border-top:3px solid #20201e;border-bottom:1px solid #b8b8af;padding:3mm 0;margin-bottom:5mm}
.top h1{margin:0;font-size:18pt}.top span{font-size:11pt}
.grid{display:grid;grid-template-columns:1fr 1fr;column-gap:5mm}
.card{width:46mm;height:10mm;border:1.2px solid;border-radius:.6mm;display:flex;align-items:center;gap:2mm;padding:0 1.5mm}
.card .tag{width:15mm}.card svg{width:9mm;height:7mm;fill:none;stroke:#20201e;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.card svg .fill{fill:#20201e;stroke:none}.card .val{font-size:6.5pt;color:#20201e}
.flip{font-size:13pt;font-weight:bold}
.avoid{display:flex;gap:4mm;align-items:center;margin-top:4mm;border:1px solid #b8b8af;padding:2.5mm 3mm}
.avoid b{font-size:10pt;margin-right:2mm;white-space:nowrap}.avoid .card{width:36mm;border-color:#20201e}.avoid .card .tag{width:auto}
'''
_n = 0


def icon(svg):
    global _n
    _n += 1
    svg = re.sub(r'#(\w+)\)', rf'#\g<1>{_n})', re.sub(r'id="(\w+)"', rf'id="\g<1>{_n}"', svg))
    # WeasyPrint does not cascade CSS into inline SVG: use presentation attributes.
    svg = svg.replace('<svg ', '<svg fill="none" stroke="#20201e" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" ', 1)
    for cls, attrs in (('fill', 'fill="#20201e" stroke="none"'), ('thin', 'stroke-width="1"'), ('hair', 'stroke-width=".7"'), ('faint', 'stroke-opacity=".55"')):
        svg = svg.replace(f'class="{cls}"', attrs)
    return svg


def split(key):
    color, word = key.split(':', 1)
    return color, word


def word_pair(left, right):
    lc, lw = split(left)
    rc, rw = split(right)
    return (f'<div class="pair"><div class="left" style="background:{LIGHT[lc]}"><span class="tag">{lc}</span>'
            f'<span class="word">{escape(lw)}</span></div><div class="arrow">-&gt;</div>'
            f'<div class="right"><span class="word" style="color:{LIGHT[rc]}">{escape(rw)}</span><span class="tag">({rc})</span></div></div>')


def card(color, label, svg, value, border):
    return (f'<div class="card" style="border-color:{border}"><span class="tag" style="color:{border}">{color}<br>{label}</span>'
            f'{icon(svg)}<span class="val">{value.upper()}</span></div>')


def data_pair(r):
    color = CONTEXT[r['context']]
    return (f'<div class="pair">{card(color, r["category"].upper(), HH[r["category"]][r["value"]], r["value"], LIGHT[color])}'
            f'<div class="arrow">-&gt;</div><div class="right"><span class="flip">{r["flip"].upper()}</span></div></div>')


def top(seat, side):
    return f'<div class="top"><h1>Paper Weights</h1><span>{side} - Team {deck.team(seat)} - {seat:03d}</span></div>'


def build(n, out):
    words = deck.word_sheets(n)
    pages = []
    for seat in range(1, n + 1):
        pages.append(f'<section class="sheet">{top(seat, "Words")}<div class="grid">'
                     + ''.join(word_pair(a, b) for a, b in words[seat - 1]) + '</div></section>')
        squares = ''.join(card('', q['category'].upper(), ROVER[q['category']][q['value']], q['value'], '#20201e')
                          for q in deck.rover_squares(seat))
        pages.append(f'<section class="sheet">{top(seat, "Data")}<div class="grid">'
                     + ''.join(data_pair(r) for r in deck.household_rows(seat))
                     + f'</div><div class="avoid"><b>Rover - avoid</b>{squares}</div></section>')
    html = document(pages, f'Paper Weights room {n}', EXTRA)
    report = {'sheets': n, 'wordDeal': f'RM4 bucket {deck.bucket(n)}', 'print': 'A4, colour, duplex, flip on long edge'}
    write_bundle(html, out, 2 * n, report)
    preview(out, 0, 'front')
    preview(out, 1, 'back')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--sheets', type=int, default=20)
    a = ap.parse_args()
    build(a.sheets, HERE.parent / 'printouts' / 'room' / f'room-{a.sheets}.pdf')
