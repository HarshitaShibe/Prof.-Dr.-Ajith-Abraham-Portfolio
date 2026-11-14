# Usage: python scripts/build-quartiles.py path/to/scimagojr_2025.csv
# Matches journal-article venues in src/data/publications.json to the Scimago (SJR) journal list and
# writes src/data/quartiles.json (best SJR quartile of the latest ranking year, per journal article).
import json,csv,re,sys,collections,unicodedata
F=sys.argv[1]; m=re.search(r'scimagojr[_ -]?(20\d\d)',F); YEAR=m.group(1) if m else ''
def norm(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower().replace('&',' and ')
    s=re.sub(r'\bthe\b','',s); return re.sub(r'[^a-z0-9]+',' ',s).strip()
ALIAS={'applied soft computing journal':'applied soft computing','future generation computing systems':'future generation computer systems',
'neurocomputing journal':'neurocomputing','applied maths and computation':'applied mathematics and computation','softcomputing':'soft computing',
'fundamenta informaticae journal':'fundamenta informaticae','journal of information assurance and security':'journal of information assurance and security',
'international journal of neural parallel scientific computations':'neural parallel and scientific computations',
'ieee transactions on systems man and cybernetics part a':'ieee transactions on systems man and cybernetics part a systems and humans'}
sj={}
for r in csv.DictReader(open(F,encoding='utf-8'),delimiter=';'):
    if r['Type']=='journal': sj.setdefault(norm(r['Title']),r['SJR Best Quartile'])
loose={k.replace(' and ',' '):v for k,v in sj.items()}
def cands(v):
    v=v.strip(); out=[v]
    out.append(re.split(r',\s*(?=\d|vol|pp|p\.|no\b|issue)|:\s*\d|\s+\d+\(',v,maxsplit=1,flags=re.I)[0])
    seg=out[-1].split(',')[0]; out.append(seg); out.append(seg.split(':')[0])
    out+= [re.sub(r'\bjournal$','',x.strip(),flags=re.I) for x in list(out)]
    return [norm(x) for x in out if x.strip()]
c=collections.Counter(); n=0
for it in json.load(open('src/data/publications.json',encoding='utf-8'))['items']:
    if it['type']!='journal': continue
    n+=1; q=None
    for k in cands(it['venue']):
        k=ALIAS.get(k,k)
        q=sj.get(k) or loose.get(k.replace(' and ',' '))
        if q: break
    c[q if q in('Q1','Q2','Q3','Q4') else 'none']+=1
json.dump({'year':YEAR,'total':n,'counts':{k:c[k] for k in ('Q1','Q2','Q3','Q4')},'notMatched':c['none'],
 'note':f'Best SJR quartile in the {YEAR} Scimago ranking, matched by journal title'},open('src/data/quartiles.json','w'),indent=1)
print(dict(c),n)
