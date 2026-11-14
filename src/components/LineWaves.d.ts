import type { FC, HTMLAttributes } from 'react'

export interface LineWavesProps extends HTMLAttributes<HTMLDivElement> {
  color1?: string
  color2?: string
  color3?: string
  speed?: number
  lineCount?: number
  lineWidth?: number
  highlight?: number
  warpIntensity?: number
  rotation?: number
  brightness?: number
  colorCycleSpeed?: number
  glow?: number
  highlightWidth?: number
  warpScale?: number
  mouseInfluence?: number
  intro?: boolean
  opacity?: number
  maxDevicePixelRatio?: number
  enableMouseInteraction?: boolean
  clickRipple?: boolean
  edgeFade?: number
  lightMode?: boolean
  className?: string
}

declare const LineWaves: FC<LineWavesProps>
export default LineWaves
