/* ==========================================================================
   Collaborated Universities: heading in the Key Pillars style, then three
   rows of logo tiles that flow continuously, always visible (rows 1 and 3
   move one way, row 2 the other).

   Logos live in public/logos/ (served from /logos/...). Edit LOGO_COUNT and
   logoSrc() below to match your file names.
   ========================================================================== */

const LOGO_COUNT = 117
const logoSrc = (n: number) => `/logos/${n}.png` // 1.png ... 117.png
const ROWS = 2

const LOGOS = Array.from({ length: LOGO_COUNT }, (_, i) => logoSrc(i + 1))

// Split the logos across the rows (every ROWS-th logo goes to the same row)
const ROW_LOGOS = Array.from({ length: ROWS }, (_, r) => LOGOS.filter((_, i) => i % ROWS === r))

const CSS = `
.cu-wrap {
  padding: 50px 0 60px; box-sizing: border-box; color: #fff; overflow: hidden;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (min-width: 640px) { .cu-wrap { padding: 70px 0 80px; } }

.cu-title {
  margin: 0 0 56px; padding: 0 30px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600;
  line-height: 1.15; letter-spacing: -.04em; color: #fff;
}
@media (min-width: 640px) { .cu-title { padding: 0 56px; } }

@media (max-width: 639px) {
  .cu-title { margin-bottom: 32px; }
}
.cu-rows { display: flex; flex-direction: column; gap: 16px; }

.cu-strip {
  width: 100%; overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
}
.cu-track { display: flex; width: max-content; animation: cu-scroll 90s linear infinite; }
.cu-row-1 .cu-track { animation-direction: reverse; animation-duration: 105s; }
.cu-row-2 .cu-track { animation-duration: 95s; }

/* Tile size matches the Funded Agencies grid: 2 tiles across on mobile, 4 on
   tablets, 5 on desktop (same padding, shadow, hover zoom and logo size). */
.cu-tile {
  --s: calc((100vw - 76px) / 2); --m: 16px;
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  width: var(--s); height: var(--s); margin-right: var(--m); padding: 12px; box-sizing: border-box;
  background: #ffffff; border-radius: 14px; box-shadow: 0 10px 26px -14px rgba(18,36,60,.6);
  transition: box-shadow .4s cubic-bezier(.16,1,.3,1);
}
@media (min-width: 640px) { .cu-tile { --s: calc((100vw - 172px) / 4); --m: 20px; } }
@media (min-width: 1024px) { .cu-tile { --s: calc((100vw - 192px) / 5); } }
.cu-tile:hover { box-shadow: 0 18px 36px -14px rgba(18,36,60,.7); }
.cu-tile img { width: 88%; height: 88%; object-fit: contain; display: block; transition: transform .4s cubic-bezier(.16,1,.3,1); }
.cu-tile:hover img { transform: scale(1.15); }

@keyframes cu-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) {
  .cu-track { animation: none; }
  .cu-strip { overflow-x: auto; -webkit-mask-image: none; mask-image: none; }
}
`

export default function Collaborations() {
  return (
    <section id="collaborations" className="cu-wrap" aria-labelledby="cu-title">
      <style>{CSS}</style>

      <h2 id="cu-title" className="cu-title">Collaborated Universities</h2>

      <div className="cu-rows">
        {ROW_LOGOS.map((logos, r) => (
          <div key={r} className={`cu-strip cu-row-${r}`}>
            <div className="cu-track">
              {[...logos, ...logos].map((src, i) => {
                const isCopy = i >= logos.length
                return (
                  <div key={i} className="cu-tile" aria-hidden={isCopy ? true : undefined}>
                    <img
                      src={src}
                      alt={isCopy ? '' : 'Collaborating university logo'}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      onError={(e) => {
                        // a logo file is missing: remove its tile so no empty box shows
                        const tile = e.currentTarget.parentElement
                        if (tile) tile.style.display = 'none'
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}