# Builds src/data/sdg.json and src/data/coauthors.json from publications.json (+ affiliations from network.json)
import json,re,collections,unicodedata
D='src/data/'
pubs=json.load(open(D+'publications.json'))['items']
net=json.load(open(D+'network.json'))
def norm(s): return re.sub(r'[^a-z ]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip()
G={1:('No Poverty',[r'poverty']),
2:('Zero Hunger',[r'agricultur',r'crop',r'food',r'farm',r'plant disease',r'soil',r'yield']),
3:('Good Health and Well-being',[r'health',r'medic',r'clinical',r'disease',r'cancer',r'covid',r'patient',r'diagnos',r'epilep',r'diabet',r'drug',r'biomedic',r'hospital',r'pandemic',r'ecg',r'eeg',r'tumou?r',r'protein',r'genom',r'gene ']),
4:('Quality Education',[r'educat',r'learning analytics',r'student',r'e-learning',r'curricul']),
5:('Gender Equality',[r'gender',r'women']),
6:('Clean Water and Sanitation',[r'\bwater\b',r'wastewater',r'sanitation']),
7:('Affordable and Clean Energy',[r'\benergy\b',r'power system',r'solar',r'wind ',r'smart grid',r'renewable',r'battery',r'electricity',r'load forecast']),
8:('Decent Work and Economic Growth',[r'econom',r'financ',r'stock',r'market',r'business',r'bank',r'employ',r'credit',r'tourism']),
9:('Industry, Innovation and Infrastructure',[r'industr',r'manufactur',r'infrastructure',r'internet of things',r'\biot\b',r'wireless sensor',r'sensor network',r'5g',r'cloud',r'blockchain',r'cyber',r'intrusion',r'security',r'software',r'edge comput',r'embedded',r'robot']),
10:('Reduced Inequalities',[r'inequalit',r'inclusi',r'disabilit',r'accessib']),
11:('Sustainable Cities and Communities',[r'smart city',r'smart cities',r'urban',r'traffic',r'transport',r'vehicul',r'disaster',r'earthquake',r'flood']),
12:('Responsible Consumption and Production',[r'supply chain',r'recycl',r'waste',r'sustainab',r'logistic',r'inventory']),
13:('Climate Action',[r'climate',r'carbon',r'emission',r'global warming',r'weather']),
14:('Life Below Water',[r'ocean',r'marine',r'fish',r'underwater',r'sea ']),
15:('Life on Land',[r'forest',r'biodivers',r'wildlife',r'ecolog',r'species']),
16:('Peace, Justice and Strong Institutions',[r'privacy',r'fraud',r'crime',r'forensic',r'governance',r'ethic',r'e-government',r'misinformation',r'fake news',r'terror']),
17:('Partnerships for the Goals',[r'collaborat',r'partnership',r'co-authorship',r'cooperat'])}
COL={1:'#E5243B',2:'#DDA63A',3:'#4C9F38',4:'#C5192D',5:'#FF3A21',6:'#26BDE2',7:'#FCC30B',8:'#A21942',9:'#FD6925',10:'#DD1367',11:'#FD9D24',12:'#BF8B2E',13:'#3F7E44',14:'#0A97D9',15:'#56C02B',16:'#00689D',17:'#19486A'}
cnt=collections.Counter(); ex=collections.defaultdict(list); mapped=0; pmap={}
for it in pubs:
    t=(it['title']+' '+(it.get('venue') or '')).lower()
    hit=[g for g,(_,ps) in G.items() if any(re.search(p,t) for p in ps)]
    # drop the generic ones when something more specific matched
    if len(hit)>1: hit=[g for g in hit if g not in (9,16,17,4)] or hit
    hit=hit[:2]
    if hit: mapped+=1; pmap[it['id']]=hit
    for g in hit:
        cnt[g]+=1
        if len(ex[g])<3 and it.get('year'): ex[g].append(it['title'])
goals=[{'n':g,'name':G[g][0],'color':COL[g],'count':cnt[g],'examples':ex[g]} for g in G]
json.dump({'total':len(pubs),'mapped':mapped,'method':'Keyword match on publication title and venue (CV, June 2026)','goals':goals},open(D+'sdg.json','w'),indent=1,ensure_ascii=False)
json.dump(pmap,open(D+'sdg-map.json','w'),separators=(',',':'))
aff={norm(c['name']):c for c in net['collaborators']}
cc=collections.Counter(); disp={}
for it in pubs:
    for a in it['authors']:
        a=a.strip()
        if norm(a)=='ajith abraham' or not a: continue
        cc[norm(a)]+=1; disp.setdefault(norm(a),a)
out=[]
for k,n in cc.most_common():
    r={'name':disp[k],'papers':n}
    if k in aff: r['institution']=aff[k]['institution']; r['country']=aff[k]['country']
    out.append(r)
json.dump(out,open(D+'coauthors.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(out),'coauthors',sum(1 for r in out if 'institution' in r),'with affiliation; sdg mapped',mapped,'/',len(pubs)); print([(g['n'],g['count']) for g in goals])
