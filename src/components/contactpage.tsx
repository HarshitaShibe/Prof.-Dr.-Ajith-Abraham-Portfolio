import { BrandBadge, type Brand } from './brandicons'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

/* ==========================================================================
   Contact. One large rounded panel that fills the screen: office address,
   telephone, email addresses and research profiles. Edit the lists below to
   change anything shown; every profile link is a plain URL.
   ========================================================================== */

const OFFICE = {
  role: 'Office of the Vice Chancellor',
  org: 'Sai University',
  lines: ['One Hub Road, Old Mahabalipuram Road (OMR)', 'Paiyanur, Chennai, Tamil Nadu 603104, India'],
  profile: 'https://www.saiuniversity.edu.in/team/dr.-ajith-abraham',
}

const EMAILS = [
  { address: 'ajith.a@saiuniversity.edu.in', tag: 'Official' },
  { address: 'ajith.abraham@mirlabs.org', tag: 'MIR Labs' },
  { address: 'abraham.ajith@gmail.com', tag: 'Personal' },
]

const PHONES = [
  { display: '+91-7012325144', tel: '+917012325144' },
  { display: '+91-9496829000', tel: '+919496829000' },
]

type Profile =
  | { label: string; brand: Brand; url: string }
  | { label: string; icon: 'web' | 'mir'; url: string }

const PROFILES: Profile[] = [
  { label: 'Google Scholar', brand: 'scholar', url: 'https://scholar.google.com/citations?user=i95DGLQAAAAJ' },
  { label: 'ORCID', brand: 'orcid', url: 'https://orcid.org/0000-0002-0169-6738' },
  { label: 'Scopus', brand: 'scopus', url: 'https://www.scopus.com/authid/detail.uri?authorId=7202760099' },
  { label: 'Web of Science', brand: 'wos', url: 'https://www.webofscience.com/wos/author/record/A-1416-2008' },
  { label: 'LinkedIn', brand: 'linkedin', url: 'https://www.linkedin.com/in/ajithabraham/' },
  { label: 'Personal website', icon: 'web', url: 'https://softcomputing.net' },
  { label: 'MIR Labs', icon: 'mir', url: 'https://www.mirlabs.org' },
]

const CSS = `
.ct-wrap { box-sizing: border-box; min-height: 100svh; padding: 8px; background: #EEF4FA;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
@media (min-width: 640px) { .ct-wrap { padding: 12px; } }
.ct-wrap *, .ct-wrap *::before, .ct-wrap *::after { box-sizing: border-box; }
.ct-wrap :focus-visible { outline: 2px solid #cdd9ff; outline-offset: 3px; }

.ct-box { position: relative; isolation: isolate; overflow: hidden; min-height: calc(100svh - 16px); border-radius: 22px; color: #fff;
  display: flex; flex-direction: column; justify-content: center; padding: 104px 14px 28px;
  background: #24476B; }
@media (min-width: 640px) { .ct-box { min-height: calc(100svh - 24px); border-radius: 28px; padding: 130px 56px 72px; } }
.ct-in { width: 100%; max-width: 1100px; margin: 0 auto; }

.ct-eyebrow { margin: 0; display: flex; align-items: center; gap: 8px; font-size: .74rem; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,.72); }
.ct-eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #cdd9ff; }
.ct-title { margin: 0; text-align: center; text-wrap: balance; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600; line-height: 1.05; letter-spacing: -.045em; color: #fff; }
.ct-lede { margin: 16px auto 0; max-width: 34em; text-align: center; text-wrap: balance; font-size: .92rem; font-weight: 300; line-height: 1.65; color: rgba(255,255,255,.8); }
@media (max-width: 639px) { .ct-lede { max-width: none; font-size: .85rem; line-height: 1.6; padding: 0 6px; } }

@media (min-width: 1100px) { .ct-lede { white-space: nowrap; max-width: none; } }
.ct-grid { margin-top: 32px; display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 640px) { .ct-grid { margin-top: 44px; } }
@media (min-width: 900px) { .ct-grid { grid-template-columns: 1fr 1fr; } }
.ct-card { padding: 22px 20px; border-radius: 18px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.16); }
@media (min-width: 640px) { .ct-card { padding: 28px; } }
.ct-card h2 { margin: 0 0 16px; font-size: 1rem; font-weight: 600; letter-spacing: -.01em; color: #fff; }
.ct-card h3 { margin: 22px 0 8px; font-size: .78rem; font-weight: 500; color: rgba(255,255,255,.65); }
.ct-strong { margin: 0 0 6px; font-size: .96rem; font-weight: 500; }
.ct-text { margin: 0; font-size: .86rem; font-weight: 300; line-height: 1.75; color: rgba(255,255,255,.8); }

.ct-link { color: #fff; text-decoration: none; font-weight: 400; transition: opacity .2s; }
.ct-link:hover { opacity: .75; }
.ct-link:active, .ct-link:focus { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; text-decoration-color: rgba(255,255,255,.55); }
.ct-more { margin: 20px 0 0; display: inline-flex; align-items: center; gap: 6px; font-size: .84rem; }
.ct-more svg { width: 14px; height: 14px; flex: none; }

.ct-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
.ct-list li { font-size: .88rem; font-weight: 300; color: rgba(255,255,255,.85); }
.ct-list small { display: block; margin: 2px 0 0; font-size: .72rem; color: rgba(255,255,255,.6); }

@media (min-width: 420px) { .ct-list small { display: inline; margin: 0 0 0 6px; } }

/* Profiles: 2 columns on every screen, 3 left + 3 right, last tile centred at half width */
.ct-tiles { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; max-width: 100%; }
.ct-tiles li:last-child:nth-child(odd) { grid-column: 1 / -1; justify-self: center; width: calc(50% - 4px); }
.ct-card-fill { display: flex; flex-direction: column; }
.ct-card-fill .ct-tiles { flex: 1; grid-auto-rows: 1fr; }
.ct-card-fill .ct-text { margin-bottom: 18px; }
.ct-card-fill .ct-pill { margin-top: auto; align-self: flex-start; }
.ct-pill { display: inline-flex; align-items: center; min-height: 36px; padding: 0 18px; border-radius: 999px; color: #fff; text-decoration: none; font-size: .82rem; font-weight: 400;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.28); box-shadow: inset 0 1px 0 rgba(255,255,255,.2); transition: background-color .25s, border-color .25s; }
.ct-pill:hover { background: rgba(255,255,255,.2); border-color: rgba(255,255,255,.4); }
.ct-pill:active, .ct-pill:focus { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; text-decoration-color: rgba(255,255,255,.55); }
.ct-reach { margin-top: 16px; display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 900px) { .ct-reach { grid-template-columns: 1fr 1fr; gap: 0; } .ct-reach > div:last-child { padding-left: 36px; } }

/* Tile: icon pinned left, label centred */
.ct-tile { position: relative; display: flex; align-items: center; justify-content: flex-start; min-height: 40px; height: 100%; padding: 0 12px 0 40px; border-radius: 10px; color: #fff; text-decoration: none; font-size: .82rem; font-weight: 400;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.28); box-shadow: inset 0 1px 0 rgba(255,255,255,.2); transition: background-color .25s, border-color .25s, transform .3s cubic-bezier(.16,1,.3,1); }
.ct-tile:hover { background: rgba(255,255,255,.2); border-color: rgba(255,255,255,.4); transform: translateY(-2px); }
.ct-ico { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); display: inline-flex; flex: none; }
.ct-tile span.ct-label { min-width: 0; text-align: left; line-height: 1.2; }

@media (max-width: 559px) {
  .ct-tile { font-size: .75rem; padding: 0 8px 0 36px; }
  .ct-ico { left: 9px; }
}

/* Desktop: icon + label sit together, centred inside the pill */
@media (min-width: 560px) {
  .ct-tile { justify-content: center; gap: 10px; padding: 0 14px; }
  .ct-ico { position: static; transform: none; }
  .ct-tile span.ct-label { text-align: left; }
}

@media (prefers-reduced-motion: reduce) { .ct-tile { transition: none; } .ct-tile:hover { transform: none; } }
`

/* White rounded-square badge, same size and look as the brand badges, for links without a brand logo */
function PlainBadge({ kind }: { kind: 'web' | 'mir' }) {
  return (
    <span
      aria-hidden="true"
      style={{ display: 'inline-flex', width: 20, height: 20, borderRadius: 5, background: '#fff', color: '#24476B', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
    >
      {kind === 'web' ? (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
        </svg>
      ) : (
        <b style={{ fontSize: 7, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1 }}>MIR</b>
      )}
    </span>
  )
}

function Card({ title, children, fill }: { title: string; children: ReactNode; fill?: boolean }) {
  return (
    <section className={fill ? 'ct-card ct-card-fill' : 'ct-card'}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export default function ContactPage() {
  useEffect(() => {
    document.documentElement.classList.add('on-contact')
    return () => document.documentElement.classList.remove('on-contact')
  }, [])

  return (
    <main id="contact" className="ct-wrap" aria-labelledby="ct-title">
      <style>{CSS}</style>

      <div className="ct-box">
        <div className="ct-in">
          <h1 id="ct-title" className="ct-title">Let&rsquo;s build intelligent futures together</h1>
          <p className="ct-lede">For research collaboration, doctoral supervision, keynote invitations or editorial matters.</p>

          <div className="ct-grid">
            <Card title="Office" fill>
              <p className="ct-strong">{OFFICE.role}</p>
              <p className="ct-text">
                {OFFICE.org}
                {OFFICE.lines.map((l) => (
                  <span key={l}><br />{l}</span>
                ))}
              </p>
              <a className="ct-pill" href={OFFICE.profile} target="_blank" rel="noopener noreferrer">University profile</a>
            </Card>

            <Card title="Research profiles" fill>
              <ul className="ct-tiles">
                {PROFILES.map((p) => (
                  <li key={p.label}>
                    <a className="ct-tile" href={p.url} target="_blank" rel="noopener noreferrer">
                      <span className="ct-ico">
                        {'brand' in p ? <BrandBadge brand={p.brand} size={20} /> : <PlainBadge kind={p.icon} />}
                      </span>
                      <span className="ct-label">{p.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <section className="ct-card ct-reach">
            <div>
              <h2>Telephone</h2>
              <ul className="ct-list">
                {PHONES.map((p) => (
                  <li key={p.tel}><a className="ct-link" href={`tel:${p.tel}`}>{p.display}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h2>Email</h2>
              <ul className="ct-list">
                {EMAILS.map((e) => (
                  <li key={e.address}>
                    <a className="ct-link" href={`mailto:${e.address}`}>{e.address}</a>
                    <small>{e.tag}</small>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}