/* ==========================================================================
   Footer: light-blue panel (same #DCE8F1 as the Citation Metrics cards) with
   the name, quick links and full contact information (address, emails,
   telephone, website, academic profiles). Rounded to match the hero.
   Section ids in LINKS must match the ids used by the Navbar.
   ========================================================================== */

/* Profile links. Paste the real URL for each one; an empty string shows the
   name as plain text (no link) until you fill it in. */
const SCHOLAR_URL = 'https://scholar.google.com/citations?user=i95DGLQAAAAJ'
const ORCID_URL = 'https://orcid.org/0000-0002-0169-6738'
const SCOPUS_URL = 'https://www.scopus.com/authid/detail.uri?authorId=7202760099'
const WOS_URL = 'https://www.webofscience.com/wos/author/record/A-1416-2008'
const LINKEDIN_URL = 'https://www.linkedin.com/in/ajithabraham/'

const LINKS = [
  { label: 'Career and Leadership', href: '#career' },
  { label: 'Publications', href: '#publications' },
  { label: 'Journals and Publishers', href: '#journals' },
  { label: 'Contact', href: '#contact' },
]

const EMAILS = [
  { address: 'ajith.a@saiuniversity.edu.in', tag: 'Official' },
  { address: 'ajith.abraham@mirlabs.org', tag: 'MIR Labs' },
  { address: 'abraham.ajith@gmail.com', tag: 'Personal' },
]

const PHONES = [
  { display: '+91-7012325144', tel: '+917012325144' },
  { display: '+91-9496829000', tel: '+919496829000' },
]

const PROFILES = [
  { label: 'Google Scholar Profile', url: SCHOLAR_URL },
  { label: 'ORCID Registry', url: ORCID_URL },
  { label: 'Scopus Author Details', url: SCOPUS_URL },
  { label: 'Web of Science ResearcherID', url: WOS_URL },
  { label: 'LinkedIn Profile', url: LINKEDIN_URL },
]

const CSS = `
.ft-wrap {
  margin: 0; padding: 32px 30px 16px; box-sizing: border-box; border-radius: 0;
  background: #DCE8F1; color: #24476B;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (min-width: 640px) { .ft-wrap { padding: 36px 56px 16px; } }

.ft-wrap .ft-name a { color: #24476B; }
.ft-name { margin: 0; font-size: clamp(1.1rem, 1.6vw, 1.25rem); font-weight: 600; line-height: 1.15; letter-spacing: -.04em; color: #24476B; }
.ft-about { margin: 6px 0 0; max-width: 520px; font-size: .72rem; font-weight: 400; line-height: 1.65; color: #2f4d68; }


.ft-cols { margin-top: 0; display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 640px) { .ft-cols { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1100px) { .ft-cols { grid-template-columns: 1.5fr 1fr 1.1fr 1fr; gap: 40px; } }

.ft-head { margin: 0 0 8px; font-size: .85rem; font-weight: 600; letter-spacing: -.01em; color: #24476B; }
.ft-sub { margin: 18px 0 10px; font-size: .95rem; font-weight: 600; letter-spacing: -.01em; color: #24476B; }
.ft-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 5px; }
.ft-list li, .ft-text { font-size: .72rem; font-weight: 400; line-height: 1.55; color: #2f4d68; }
.ft-text { margin: 0; }
.ft-strong { font-weight: 600; color: #24476B; }
.ft-tag { font-size: .7rem; color: #2f4d68; opacity: .85; }

.ft-wrap a { color: #2f4d68; text-decoration: none; transition: color .25s; word-break: break-word; }
.ft-wrap a:hover { color: #24476B; text-decoration: underline; text-underline-offset: 4px; }
.ft-wrap a:focus-visible { outline: 2px solid #24476B; outline-offset: 3px; border-radius: 4px; }

.ft-gap { margin-top: 10px; }
.ft-lab { margin: 10px 0 5px; font-size: .68rem; font-weight: 500; letter-spacing: .02em; color: #2f4d68; opacity: .85; }
.ft-head + .ft-lab { margin-top: 0; }
.ft-by { margin-top: 22px; display: flex; align-items: center; justify-content: flex-start; gap: 12px; font-size: .72rem; color: #2f4d68; }
.ft-by a { display: inline-flex; }
.ft-logo { height: 150px; margin: -20px 0; width: auto; display: block; }
.ft-logo-dark { display: none; }

.ft-bottom {
  margin: 20px -30px -16px; padding: 14px 30px; background: #24476B; text-align: center;
  font-size: .68rem; font-weight: 400; color: rgba(255,255,255,.85);
}
@media (min-width: 640px) { .ft-bottom { margin: 20px -56px -16px; padding: 14px 56px; } }

/* Phones: name + address full width, Explore and Academic Profiles side by side, Contact below; Greenbit centred */
@media (max-width: 639px) {
  .ft-wrap { padding: 28px 22px 16px; }
  .ft-cols { grid-template-columns: 1fr 1fr; gap: 24px 18px; }
  .ft-cols > div:nth-child(1), .ft-cols > div:nth-child(3) { grid-column: 1 / -1; }
  .ft-cols > div:nth-child(2) { order: 1; }
  .ft-cols > div:nth-child(4) { order: 2; }
  .ft-cols > div:nth-child(3) { order: 3; }
  .ft-by { justify-content: center; margin-top: 20px; }
  .ft-logo { height: 120px; margin: -18px 0; }
  .ft-bottom { margin: 8px -22px -16px; padding: 14px 22px; }
}

/* Dark footer on the Career, Publications and Journals pages */
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-wrap { background: #24476B; color: #fff; }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-name,
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-head,
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-sub,
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-strong { color: #fff; }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-about { color: rgba(255,255,255,.75); }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-list li,
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-text { color: rgba(255,255,255,.78); }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-tag { color: rgba(255,255,255,.7); opacity: 1; }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-wrap a { color: rgba(255,255,255,.78); }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-wrap a:hover { color: #fff; }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-wrap a:focus-visible { outline-color: #cdd9ff; }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-by { color: rgba(255,255,255,.78); }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-logo-light { display: none; }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-logo-dark { display: block; }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-wrap .ft-name a { color: #fff; }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-lab, :is(.on-career, .on-publications, .on-journals, .on-contact) .ft-by { color: rgba(255,255,255,.7); }
:is(.on-career, .on-publications, .on-journals, .on-contact) .ft-bottom { background: transparent; color: rgba(255,255,255,.85); border-top: 1px solid rgba(255,255,255,.28); }
`

export default function Footer() {
  return (
    <footer className="ft-wrap" aria-label="Site footer">
      <style>{CSS}</style>

      <div className="ft-cols">
        <div>
          <h2 className="ft-name">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault()
                if (window.location.hash !== '#top') window.location.hash = '#top' // opens the home page if we are elsewhere
                requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
              }}
            >
              Prof. Ajith Abraham
            </a>
          </h2>
          <p className="ft-text ft-gap">
            <span className="ft-strong">Sai University</span>
            <br />
            Vice Chancellor’s Office
            <br />
            One Hub Road, Old Mamallapuram Road (OMR), Chennai, India
          </p>
        </div>

        <div>
          <h3 className="ft-head">Explore</h3>
          <ul className="ft-list">
            {LINKS.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
            <li>
              <a href="https://softcomputing.net" target="_blank" rel="noopener noreferrer">softcomputing.net</a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="ft-head">Contact</h3>
          <h4 className="ft-lab">Telephone</h4>
          <ul className="ft-list">
            {PHONES.map((p) => (
              <li key={p.tel}>
                <a href={`tel:${p.tel}`}>{p.display}</a>
              </li>
            ))}
          </ul>
          <h4 className="ft-lab">Email</h4>
          <ul className="ft-list">
            {EMAILS.map((e) => (
              <li key={e.address}>
                <a href={`mailto:${e.address}`}>{e.address}</a> <span className="ft-tag">({e.tag})</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="ft-head">Academic Profiles</h3>
          <ul className="ft-list">
            {PROFILES.map((p) => (
              <li key={p.label}>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noopener noreferrer">{p.label}</a>
                ) : (
                  p.label
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

        <div className="ft-by">
          <span>Website by</span>
          <a href="https://greenbitsolutions.in/" target="_blank" rel="noopener noreferrer" aria-label="Greenbit Solutions">
            <img className="ft-logo ft-logo-light" src="/logo.png" alt="Greenbit Solutions" />
            <img className="ft-logo ft-logo-dark" src="/logo_lighter.png" alt="Greenbit Solutions" />
          </a>
        </div>

      <div className="ft-bottom">
        © {new Date().getFullYear()} Prof. Ajith Abraham. All rights reserved.
      </div>
    </footer>
  )
}