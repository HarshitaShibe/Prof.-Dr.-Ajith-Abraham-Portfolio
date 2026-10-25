import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from 'react'

/* ==========================================================================
   GridPulse: a fine grid that takes colour where the pointer passes and lets
   it go a moment later. Here it is tuned to the site's blues, and it has no
   dependency on Tailwind or "@/lib/utils".

   Place it inside a positioned container, under the content. Anything marked
   with data-grid-avoid keeps the light away from its lines of text.
   ========================================================================== */

export type GridPulseProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  /** Cell size in px. The hairlines and the lit cells share it. */
  cell?: number
  /** How far from the pointer a cell can still catch light, in cells. */
  reach?: number
  /** How many cells light on their own each beat, so the grid is never dead. */
  ambient?: number
  /** A lid, so a fast sweep cannot light the whole field at once. */
  maxLit?: number
  /** Elements whose lines of text the light holds back from. */
  avoid?: string
}

/* The site's own blues: the #24476B / #DCE8F1 family (hue ~208, muted), in different tints. */
const HUE_START = 208
const HUE_SHIFT = 4
const SATURATION = 45
/* Lightness ladder. Light text on a dark ground uses the deeper set. */
const TINTS = [76, 68, 60, 52, 44]
const TINTS_DARK = [70, 62, 54, 46, 38]
/* Hairlines: a faint tint of the navy, for a light ground */
const LINE = 'rgba(36,71,107,.05)'
const FAINT = 0.13
const FADE = 2.2
const PAD = 5
const FADE_IN = 160
const FADE_OUT = 750

type Cell = {
  col: number
  row: number
  colour: string
  dim: number
  born: number
  until: number
}

const easeOut = (t: number) => 1 - (1 - t) ** 2
const easeIn = (t: number) => t * t

export function GridPulse({
  cell = 24,
  reach = 2.6,
  ambient = 10,
  maxLit = 180,
  avoid = '[data-grid-avoid]',
  className,
  style,
  ...props
}: GridPulseProps) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = box.current
    const paper = canvas.current
    const ctx = paper?.getContext('2d')
    if (!el || !paper || !ctx) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cols = 1
    let rows = 1
    let width = 0
    let height = 0
    let clear: DOMRect[] = []
    let tints = TINTS
    const cells = new Map<string, Cell>()

    // Light or dark ground, read from the text colour the grid inherits.
    const probe = document.createElement('canvas').getContext('2d', {
      willReadFrequently: true,
    })
    const readTheme = () => {
      if (!probe) return
      probe.clearRect(0, 0, 1, 1)
      probe.fillStyle = getComputedStyle(el).color
      probe.fillRect(0, 0, 1, 1)
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data
      const isLight = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5
      tints = isLight ? TINTS_DARK : TINTS
    }

    // Protect the lines of text, not the boxes that hold them.
    const measureText = () => {
      const bounds = el.getBoundingClientRect()
      const scope = el.parentElement ?? document
      clear = [...scope.querySelectorAll(avoid)].flatMap((node) => {
        const range = document.createRange()
        range.selectNodeContents(node)
        const lines = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0)
        const boxes = lines.length > 0 ? lines : [node.getBoundingClientRect()]
        return boxes.map(
          (r) =>
            new DOMRect(
              r.left - bounds.left - PAD,
              r.top - bounds.top - PAD,
              r.width + PAD * 2,
              r.height + PAD * 2,
            ),
        )
      })
    }

    const measure = () => {
      width = el.clientWidth
      height = el.clientHeight
      cols = Math.max(1, Math.ceil(width / cell))
      rows = Math.max(1, Math.ceil(height / cell))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      paper.width = Math.round(width * dpr)
      paper.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      readTheme()
      measureText()
      wake()
    }

    // Cells behind the words go faint rather than dark.
    const brightness = (col: number, row: number) => {
      const x = col * cell + cell / 2
      const y = row * cell + cell / 2
      let nearest = Number.POSITIVE_INFINITY
      for (const r of clear) {
        const dx = Math.max(r.left - x, 0, x - r.right)
        const dy = Math.max(r.top - y, 0, y - r.bottom)
        nearest = Math.min(nearest, Math.hypot(dx, dy))
        if (nearest === 0) break
      }
      if (nearest === Number.POSITIVE_INFINITY) return 1
      return FAINT + (1 - FAINT) * Math.min(1, nearest / (FADE * cell))
    }

    const ink = (row: number) => {
      const t = rows > 1 ? Math.min(1, row / (rows - 1)) : 0
      const hue = Math.round(HUE_START + t * HUE_SHIFT)
      const tint = tints[Math.floor(Math.random() * tints.length)]
      return `hsl(${hue} ${SATURATION}% ${tint}%)`
    }

    // One loop draws every cell; it runs only while something is lit.
    let frame = 0
    const draw = (now: number) => {
      frame = 0
      ctx.clearRect(0, 0, width, height)
      for (const [key, c] of cells) {
        let alpha: number
        if (now < c.until) {
          alpha = easeOut(Math.min(1, (now - c.born) / FADE_IN))
        } else {
          const t = (now - c.until) / FADE_OUT
          if (t >= 1) {
            cells.delete(key)
            continue
          }
          alpha = 1 - easeIn(t)
        }
        ctx.globalAlpha = alpha * c.dim
        ctx.fillStyle = c.colour
        ctx.fillRect(c.col * cell + 1, c.row * cell + 1, cell - 1, cell - 1)
      }
      ctx.globalAlpha = 1
      if (cells.size > 0) frame = requestAnimationFrame(draw)
    }
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(draw)
    }

    const light = (col: number, row: number, hold: number) => {
      if (col < 0 || row < 0 || col >= cols || row >= rows) return
      if (cells.size >= maxLit) return
      const key = `${col},${row}`
      const now = performance.now()
      const lit = cells.get(key)
      if (lit && now < lit.until) return
      let born = now
      if (lit) {
        const faded = 1 - easeIn(Math.min(1, (now - lit.until) / FADE_OUT))
        born = now - (1 - Math.sqrt(1 - faded)) * FADE_IN
      }
      cells.set(key, {
        col,
        row,
        colour: lit?.colour ?? ink(row),
        dim: brightness(col, row),
        born,
        until: now + hold,
      })
      wake()
    }

    // The pointer paints; cells further from it catch light less often.
    let pending = 0
    let at: { x: number; y: number } | null = null
    const paint = () => {
      pending = 0
      if (!at) return
      const cx = Math.floor(at.x / cell)
      const cy = Math.floor(at.y / cell)
      const span = Math.ceil(reach)
      for (let dy = -span; dy <= span; dy++) {
        for (let dx = -span; dx <= span; dx++) {
          const away = Math.hypot(dx, dy)
          if (away > reach) continue
          if (Math.random() > 1 - away / (reach + 0.6)) continue
          light(cx + dx, cy + dy, 260 + Math.random() * 900)
        }
      }
    }
    // Listened for on the window: the grid sits under the content.
    const onMove = (event: PointerEvent) => {
      const bounds = el.getBoundingClientRect()
      at = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
      if (!pending) pending = requestAnimationFrame(paint)
    }

    // A few cells light on their own, so the grid is alive on arrival.
    let visible = true
    let beat = 0
    const drift = () => {
      beat = window.setTimeout(drift, 1400 + Math.random() * 1800)
      if (!visible || document.hidden) return
      // Spread the lit cells across the full width: one per vertical band,
      // so they never bunch up in one corner of the page.
      for (let i = 0; i < ambient; i++) {
        const from = Math.floor((i * cols) / ambient)
        const to = Math.max(from + 1, Math.floor(((i + 1) * cols) / ambient))
        light(
          from + Math.floor(Math.random() * (to - from)),
          Math.floor(Math.random() * rows),
          900 + Math.random() * 1600,
        )
      }
    }
    beat = window.setTimeout(drift, 500)

    const sight = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
    })
    sight.observe(el)
    const resize = new ResizeObserver(measure)
    resize.observe(el)
    let recheck = 0
    const copy = new MutationObserver(() => {
      if (!recheck) {
        recheck = requestAnimationFrame(() => {
          recheck = 0
          measureText()
        })
      }
    })
    copy.observe(el.parentElement ?? document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    measure()
    document.fonts?.ready.then(measureText).catch(() => {})
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      sight.disconnect()
      resize.disconnect()
      copy.disconnect()
      cancelAnimationFrame(recheck)
      cancelAnimationFrame(frame)
      cancelAnimationFrame(pending)
      clearTimeout(beat)
      window.removeEventListener('pointermove', onMove)
    }
  }, [cell, reach, ambient, maxLit, avoid])

  const fade = 'linear-gradient(to bottom, #000 92%, transparent)'
  return (
    <div
      ref={box}
      aria-hidden
      data-slot="grid-pulse"
      className={className}
      style={
        {
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          maskImage: fade,
          WebkitMaskImage: fade,
          backgroundImage: `linear-gradient(to right, ${LINE} 1px, transparent 1px), linear-gradient(to bottom, ${LINE} 1px, transparent 1px)`,
          backgroundSize: `${cell}px ${cell}px`,
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <canvas ref={canvas} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  )
}

export default GridPulse