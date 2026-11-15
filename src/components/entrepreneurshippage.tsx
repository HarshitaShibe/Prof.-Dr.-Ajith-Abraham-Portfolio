import { useEffect } from 'react'
import SlicedWaves from './SlicedWaves'
import { Dithering } from '@paper-design/shaders-react'
import data from '../data/entrepreneurship.json'

/* ==========================================================================
   Entrepreneurship & Innovation page. All text lives in
   src/data/entrepreneurship.json. The MIR Academy and Wellermind cards only
   appear once "confirmed" is set to true there.
   ========================================================================== */

type Enterprise = { confirmed: boolean; name: string; role: string; meta: string; facts?: string[]; paragraphs?: string[]; image?: string; imageAlt?: string; links: Link[] }
type Link = { label: string; href: string; note?: string }
const shown = (l: Link[]) => l.filter((x) => x.href)
const ENTERPRISES = (data.enterprises as Enterprise[]).filter((e) => e.confirmed)

const CSS = `
.en-wrap {
  min-height: 100svh; box-sizing: border-box; background: #EEF4FA; color: #24476B;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.en-wrap section { padding: 44px 30px; box-sizing: border-box; }
@media (min-width: 640px) { .en-wrap section { padding: 60px 56px; } }
.en-in { max-width: 1100px; margin: 0 auto; }

.en-hero { position: relative; overflow: hidden; min-height: 100svh; display: flex; align-items: flex-start; background: #EEF4FA;
  padding-top: 130px !important; padding-bottom: 80px !important; }
@media (max-width: 639px) { .en-hero { padding-bottom: 230px !important; } }
@media (min-width: 640px) { .en-hero { padding-top: 150px !important; } }
.en-waves { position: absolute; inset: 0; z-index: 0; }
.en-hero .en-in { position: relative; z-index: 1; width: 100%; text-align: center; }
.en-hero .en-lede { margin-left: auto; margin-right: auto; max-width: 48rem; font-size: clamp(.84rem, 1.05vw, .92rem); line-height: 1.75; text-align: justify; text-align-last: center; hyphens: none; }
.en-title { margin: 0; font-size: clamp(2.1rem, 4.6vw, 3.8rem); font-weight: 500; line-height: 1.05; letter-spacing: -.045em; color: #24476B; animation: en-drop 1.1s cubic-bezier(.16,1,.3,1) .2s both; }
@keyframes en-drop { from { opacity: 0; transform: translateY(-34px); } to { opacity: 1; transform: none; } }
.en-hero .en-tag { animation: en-drop 1.1s cubic-bezier(.16,1,.3,1) .4s both; }
.en-hero .en-lede { animation: en-drop 1.1s cubic-bezier(.16,1,.3,1) .6s both; }
@media (prefers-reduced-motion: reduce) { .en-title, .en-hero .en-tag, .en-hero .en-lede { animation: none; } }
.en-tag { margin: 16px 0 0; font-size: clamp(.98rem, 1.5vw, 1.15rem); font-weight: 500; font-style: italic; font-synthesis: style; color: #3F7CC0; }
.en-lede { margin: 22px 0 0; max-width: 46rem; font-size: clamp(.92rem, 1.4vw, 1.02rem); font-weight: 300; line-height: 1.75; color: #3a5a7a; }
.en-lede + .en-lede { margin-top: 14px; }

.en-h2 { margin: 0 0 28px; font-size: clamp(1.6rem, 3.2vw, 2.3rem); font-weight: 600; line-height: 1.15; letter-spacing: -.04em; color: #24476B; }
.en-glass {
  background: #fff; border: 1px solid #DCE8F1; border-radius: 24px; box-sizing: border-box;
  box-shadow: 0 8px 24px -14px rgba(36,71,107,.28);
}

.en-feat { padding: 28px 24px; }
@media (min-width: 760px) { .en-feat { padding: 44px 48px; } }
.en-featgrid { display: grid; grid-template-columns: 1fr; gap: 28px; justify-items: center; }
.en-shot { display: block; position: relative; width: 100%; max-width: 980px; overflow: hidden; border-radius: 14px; border: 1px solid #DCE8F1; background: #0b1b2e; box-shadow: 0 18px 40px -22px rgba(18,36,60,.55);
  transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s; }
.en-shot img { display: block; width: 100%; height: auto; }
.en-shot-static { cursor: default; }
.en-shot-static:hover { transform: none; box-shadow: 0 18px 40px -22px rgba(18,36,60,.55); }
.en-shot:hover { transform: translateY(-3px); box-shadow: 0 24px 46px -22px rgba(18,36,60,.65); }
.en-shot:focus-visible { outline: 2px solid #24476B; outline-offset: 3px; }
.en-shot-cta { position: absolute; right: 12px; bottom: 12px; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,.92); color: #24476B; font-size: .74rem; font-weight: 600; box-shadow: 0 6px 16px -8px rgba(18,36,60,.5); }
.en-feathead { margin: 0 0 24px; text-align: left; }
.en-feathead .en-chips { margin-top: 16px; }
.en-kicker { margin: 0 0 10px; font-size: .74rem; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: #4A86C8; }
.en-name { margin: 0; font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 600; line-height: 1.15; letter-spacing: -.03em; color: #24476B; }
.en-role { margin: 8px 0 0; font-size: 1rem; font-weight: 400; color: #4A86C8; }
.en-chips { list-style: none; margin: 20px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.en-chips li { padding: 6px 14px; border-radius: 999px; font-size: .8rem; font-weight: 400; background: #EEF4FA; border: 1px solid #C5D7E6; color: #24476B; }
.en-body { position: relative; isolation: isolate; margin: 0 auto; max-width: 58rem; }
.en-body-logo::before { content: ""; position: absolute; z-index: -1; inset: -20px -10px; background: url("/mirlabs-logo.png") center / auto 72% no-repeat; opacity: .08; pointer-events: none; }
.en-body p { margin: 0 0 14px; font-size: .86rem; font-weight: 300; line-height: 1.8; color: #2f4f6e; }
.en-link { display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; height: 44px; padding: 0 20px; border-radius: 999px; background: #24476B; color: #fff;
  font-size: .86rem; font-weight: 600; text-decoration: none; transition: background .25s; }
.en-linkrow { display: flex; flex-wrap: wrap; gap: 8px 16px; }
.en-link2 { background: transparent; color: #24476B; box-shadow: inset 0 0 0 1px rgba(36,71,107,.45); }
.en-link2:hover { background: rgba(36,71,107,.08); }
.en-note { opacity: .7; font-size: .8em; }
.en-link:hover { background: #1b3652; }
.en-link2:hover { background: rgba(36,71,107,.08); }
.en-link:focus-visible { outline: 2px solid #4A86C8; outline-offset: 2px; }

.en-ents { list-style: none; margin: 0; padding: 0; display: grid; gap: 18px; grid-template-columns: 1fr; }
@media (min-width: 760px) { .en-ents { grid-template-columns: 1fr 1fr; gap: 24px; } }
.en-ent { padding: 24px; display: flex; flex-direction: column; gap: 8px; }
.en-ent-img { display: block; width: 100%; height: auto; aspect-ratio: 1200 / 560; object-fit: cover; border-radius: 14px; margin: 0 0 12px; }
.en-ent2 + .en-ent2 { margin-top: 56px; }
.en-ent2 .en-shot img { aspect-ratio: 1263 / 660; object-fit: cover; object-position: center 45%; }
.en-ent2 .en-body p { text-align: justify; hyphens: none; }
@media (min-width: 900px) {
  .en-ent2 .en-chips { flex-wrap: nowrap; gap: 6px; }
  .en-ent2 .en-chips li { white-space: nowrap; padding: 5px 11px; font-size: .74rem; }
}
.en-ent h3 { margin: 0; font-size: 1.15rem; font-weight: 600; letter-spacing: -.02em; color: #24476B; }
.en-ent p { margin: 0; font-size: .86rem; font-weight: 300; line-height: 1.8; color: #2f4f6e; text-align: justify; hyphens: none; }
.en-ent .en-small { font-size: .8rem; color: #5b7893; text-align: left; }
.en-ent a { margin-top: auto; padding-top: 8px; font-size: .86rem; font-weight: 500; color: #2E6DA4; text-decoration: none; }
.en-ent a:hover { text-decoration: underline; }

.en-imp { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; grid-template-columns: 1fr; }
@media (min-width: 640px) { .en-imp { grid-template-columns: 1fr 1fr; gap: 18px; } }
@media (min-width: 1000px) { .en-imp { grid-template-columns: repeat(4, 1fr); gap: 18px; } }
.en-card { padding: 6px 10px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.en-ico { width: 72px; height: 72px; border-radius: 50%; background: #24476B; display: grid; place-items: center; margin-bottom: 18px; color: #fff; }
.en-ico svg { width: 34px; height: 34px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.en-card h3 { margin: 0 0 18px; font-size: 1rem; font-weight: 600; letter-spacing: -.02em; line-height: 1.3; color: #24476B; }
.en-card p { margin: 0; font-size: .86rem; font-weight: 300; line-height: 1.8; color: #2f4f6e; text-align: center; }
.en-sub { margin: -10px 0 56px; max-width: none; font-size: .95rem; font-weight: 300; line-height: 1.7; color: #3a5a7a; text-align: justify; hyphens: none; }
@media (min-width: 1000px) { .en-sub { font-size: .875rem; text-align: left; text-align-last: justify; white-space: nowrap; } }

.en-close { text-align: center; }
.en-cbox { position: relative; overflow: hidden; background: #24476B; border-radius: 32px; padding: clamp(32px, 6vw, 64px); padding-block: clamp(40px, 7vw, 80px); max-width: 1040px; margin: 0 auto; box-sizing: border-box; }
.en-cbg { position: absolute; inset: 0; z-index: 0; opacity: .18; border-radius: 32px; overflow: hidden; }
.en-cin { position: relative; z-index: 1; }
.en-cbox .en-h2 { color: #fff; text-align: center; }
.en-close p { margin: 0 auto; max-width: 36rem; font-size: .9rem; font-weight: 300; line-height: 1.8; color: rgba(238,244,250,.88); text-align: center; }
.en-motto { margin-top: 24px !important; font-size: clamp(.95rem, 1.6vw, 1.15rem) !important; font-weight: 500 !important; letter-spacing: -.01em; color: #fff !important; text-align: center !important; }
.en-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 28px; }
.en-cbox .en-link { background: #DCE8F1; color: #24476B; margin-top: 0; height: 36px; padding: 0 16px; font-size: .8rem; }
.en-cbox .en-link:hover { background: #fff; }
.en-foot { padding-bottom: 90px !important; }

@media (max-width: 639px) {
  .en-body p, .en-close p { font-size: .9rem; line-height: 1.75; }
  .en-card p, .en-ent p { font-size: .9rem; }
  .en-hero .en-lede, .en-body p, .en-ent p, .en-sub { text-align: justify; -webkit-hyphens: auto; hyphens: auto; }
  .en-waves { inset: auto 0 0 0; height: 58vw; }
}
`

const ICONS = [
  <svg viewBox="0 0 24 24"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>,
  <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><rect x="10" y="10" width="4" height="4"/></svg>,
  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-.8-1.5-1.2-2.8-1.2-1.6 0-2.8.8-2.8 2s1.1 1.7 2.8 2 2.8.8 2.8 2-1.2 2-2.8 2c-1.3 0-2.3-.4-2.8-1.2M12 6v2M12 16v2"/></svg>,
  <svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/></svg>,
];

export default function EntrepreneurshipPage() {
  useEffect(() => {
    document.documentElement.classList.add('on-entrepreneurship')
    return () => document.documentElement.classList.remove('on-entrepreneurship')
  }, [])

  const f = data.featured

  return (
    <main id="entrepreneurship-page" className="en-wrap" aria-labelledby="en-title">
      <style>{CSS}</style>

      <section className="en-hero">
        <div className="en-waves" aria-hidden="true">
          <SlicedWaves
            color1="#3F7CC0"
            color2="#16304D"
            color3="#24476B"
            brightness={2.8}
            ribbons={3}
            spacing={28}
            perspective={0.45}
            blur={0.4}
            glow={1}
            position={0.93}
            ribbonHeight={0.2}
            amplitude={0.08}
            mouseInteraction
            lightMode
          />
        </div>
        <div className="en-in">
          <h1 id="en-title" className="en-title">{data.title}</h1>
          <p className="en-tag">{data.tagline}</p>
          {data.intro.map((p, i) => <p key={i} className="en-lede">{p}</p>)}
        </div>
      </section>

      <section aria-labelledby="en-feat-h">
        <div className="en-in">
          <div className="en-feathead">
            <h2 id="en-feat-h" className="en-name">{f.name}</h2>
            <p className="en-role">{f.role} · {f.period}</p>
            <ul className="en-chips">{f.facts.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="en-glass en-feat">
           <div className="en-featgrid">
            {shown(f.links)[0] && (
              <a className="en-shot" href={shown(f.links)[0].href} target="_blank" rel="noopener noreferrer" aria-label="Open the MIR Labs website in a new tab">
                <img src="/mirlabs.jpg" alt="Home page of the Machine Intelligence Research Labs (MIR Labs) website" loading="lazy" />
                <span className="en-shot-cta">Visit website</span>
              </a>
            )}
            <div>
            <div className="en-body en-body-logo">{f.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
            </div>
           </div>
          </div>
        </div>
      </section>

      {ENTERPRISES.length > 0 && (
        <section aria-label="Enterprise and technology initiatives">
          <div className="en-in">
            {ENTERPRISES.map((e) => (
              <div key={e.name} className="en-ent2">
                <div className="en-feathead">
                  <h3 className="en-name">{e.name}</h3>
                  <p className="en-role">{e.role} · {e.meta}</p>
                  {e.facts?.length ? <ul className="en-chips">{e.facts.map((x) => <li key={x}>{x}</li>)}</ul> : null}
                </div>
                <div className="en-glass en-feat">
                  <div className="en-featgrid">
                    {e.image ? <div className="en-shot en-shot-static"><img src={e.image} alt={e.imageAlt ?? ''} loading="lazy" /></div> : null}
                    <div className="en-body">{(e.paragraphs ?? []).map((p, i) => <p key={i}>{p}</p>)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="en-imp-h">
        <div className="en-in">
          <h2 id="en-imp-h" className="en-h2">{data.impactTitle}</h2>
          <p className="en-sub">{data.impactIntro}</p>
          <ul className="en-imp">
            {data.impact.map((x, i) => (
              <li key={x.title} className="en-card">
                <span className="en-ico" aria-hidden="true">{ICONS[i % ICONS.length]}</span>
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="en-close en-foot" aria-labelledby="en-close-h">
        <div className="en-in">
          <div className="en-cbox">
            <div className="en-cbg" aria-hidden="true">
              <Dithering colorBack="#24476B" colorFront="#6391BD" shape="simplex" type="4x4" size={6} speed={0.3} style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="en-cin">
              <h2 id="en-close-h" className="en-h2">{data.closingTitle}</h2>
              <p>{data.closing}</p>
              <p className="en-motto">{data.motto}</p>
              <div className="en-links">
                <a className="en-link" href="#funding">Explore research funding &amp; projects</a>
                <a className="en-link" href="#research">Explore research</a>
                <a className="en-link" href="#journals">Explore journals &amp; publishers</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
