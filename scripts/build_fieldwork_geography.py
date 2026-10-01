#!/usr/bin/env python3
"""Rebuild offline India data from its attributed upstream downloads.

Run from the repository root. Requires the network only when a download is not
already present in --cache. Runtime gameplay has no network dependency.
"""
from pathlib import Path
import argparse
from datetime import date
import urllib.request

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--cache', type=Path, default=Path('/tmp/fieldwork-geography'))
args = parser.parse_args()
args.cache.mkdir(parents=True, exist_ok=True)
Path('fieldwork/data').mkdir(parents=True, exist_ok=True)

def download(filename, url):
    target = args.cache / filename
    if not target.exists():
        request = urllib.request.Request(url, headers={'User-Agent': 'FieldworkGameDataBuilder/1.0'})
        with urllib.request.urlopen(request, timeout=90) as response:
            contents = response.read()
        target.write_bytes(contents)
    return target

for level in ('ADM1', 'ADM2'):
    download('india-' + level + '.json',
             'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IND/'
             + level + '/geoBoundaries-IND-' + level + '_simplified.geojson')
for filename in ('IN.zip', 'admin1CodesASCII.txt', 'admin2Codes.txt'):
    download('geonames-' + filename, 'https://download.geonames.org/export/dump/' + filename)
import json, gzip,zipfile,unicodedata,re,hashlib

def norm(s):
 s=''.join(c for c in unicodedata.normalize('NFKD',s) if not unicodedata.combining(c))
 return ' '.join(re.sub(r'[^\w\s]',' ',s.casefold()).split())

def round_coords(x):
 if isinstance(x[0],(int,float)):return [round(n,5) for n in x]
 return [round_coords(a) for a in x]

def points(x):
 if isinstance(x[0],(int,float)):yield x
 else:
  for a in x:yield from points(a)

geo={'metadata':{'retrieved':date.today().isoformat(),'boundary_provider':'geoBoundaries','district_boundary_year':2021,'state_boundary_year_as_reported':2011,'note':'Simplified boundaries are approximate. Names/territories reflect the source edition, not necessarily current administration. NFHS district survey areas can differ. No nearest-district fallback.','district_source':'Pathways Data Pvt. Ltd., lgdirectory.gov.in via geoBoundaries','district_license':'ODbL 1.0','district_license_url':'https://opendatacommons.org/licenses/odbl/1-0/','state_source':'DataMeet India community, Election Commission of India via geoBoundaries','state_license':'CC BY 2.5 IN','state_license_url':'https://creativecommons.org/licenses/by/2.5/in/','api_url':'https://www.geoboundaries.org/api/current/gbOpen/IND/ADM2/','upstream_revision':'9469f09','transformation':'Upstream simplified polygons, coordinates rounded to 5 decimal places; no further simplification.'},'states':[],'districts':[]}
for level,key in [('ADM1','states'),('ADM2','districts')]:
 data=json.load(open(args.cache / ('india-'+level+'.json')))
 geo['metadata'][key+'_url']='https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IND/'+level+'/geoBoundaries-IND-'+level+'_simplified.geojson'
 for f in data['features']:
  coords=round_coords(f['geometry']['coordinates']); pts=list(points(coords))
  bbox=[min(p[0] for p in pts),min(p[1] for p in pts),max(p[0] for p in pts),max(p[1] for p in pts)]
  geo[key].append({'name':unicodedata.normalize('NFKD',f['properties']['shapeName']).encode('ascii','ignore').decode(),'bbox':bbox,'type':f['geometry']['type'],'coordinates':coords})
# Correct the upstream swapped labels, preserving raw names and all coordinates.
geo['metadata']['label_corrections'] = [{'description': 'Source ADM2 labels Kancheepuram and Chengalputtu were exchanged: its coastal polygon contains Chengalpattu/Mamallapuram, while its inland polygon contains Kancheepuram. Corrected labels only; coordinates unchanged.', 'source_urls': ['https://chengalpattu.nic.in/about-district/', 'https://kancheepuram.nic.in/', 'https://kancheepuram.nic.in/local-body-ward-delimitation-2020-chengalpattu-district/'], 'checked': '2026-10-02'}]
for feature in geo['districts']:
    if feature['name'] in ('Kancheepuram', 'Chengalputtu'):
        feature['original_name'] = feature['name']
        feature['name'] = {'Kancheepuram': 'Chengalputtu', 'Chengalputtu': 'Kancheepuram'}[feature['name']]
Path('fieldwork/data/geography.json').write_text(json.dumps(geo,separators=(',',':'),ensure_ascii=False)+'\n')
admin1={};admin2={}
for file,out in [('admin1CodesASCII.txt',admin1),('admin2Codes.txt',admin2)]:
 for line in (args.cache / ('geonames-'+file)).read_text().splitlines():
  f=line.split('\t')
  if f[0].startswith('IN.'):out[f[0]]=f[2]
rows=[]
with zipfile.ZipFile(args.cache / 'geonames-IN.zip') as z:
 for raw in z.read('IN.txt').decode().splitlines():
  f=raw.split('\t')
  if f[6]!='P' or f[7] in ('PPLQ','PPLW','PPLH'):continue
  state=admin1.get('IN.'+f[10],'');district=admin2.get('IN.'+f[10]+'.'+f[11],'')
  aliases=sorted(set(norm(a) for a in [f[1],f[2]]+f[3].split(',') if a))
  rows.append([int(f[0]),f[2] or f[1],float(f[4]),float(f[5]),f[10],district,aliases,int(f[14] or 0)])
gaz={'metadata':{'source':'GeoNames India country extract','url':'https://download.geonames.org/export/dump/IN.zip','retrieved':date.today().isoformat(),'license':'CC BY 4.0','license_url':'https://creativecommons.org/licenses/by/4.0/','attribution':'GeoNames.org','source_sha256':hashlib.sha256((args.cache / 'geonames-IN.zip').read_bytes()).hexdigest(),'filter':'Feature class P; excludes abandoned PPLQ, destroyed PPLW and historical PPLH. Names may be incomplete or dated.','columns':['geonameid','name','lat','lon','state_code','district','normalized_names','population'],'settlements':len(rows)},'states':{k.split('.')[1]:v for k,v in admin1.items()},'places':rows}
with open('fieldwork/data/gazetteer.json.gz','wb') as f:
 with gzip.GzipFile(filename='',mode='wb',fileobj=f,mtime=0) as g:g.write(json.dumps(gaz,separators=(',',':'),ensure_ascii=False).encode())
print('geography bytes',Path('fieldwork/data/geography.json').stat().st_size,'gazetteer',len(rows),'bytes',Path('fieldwork/data/gazetteer.json.gz').stat().st_size)
