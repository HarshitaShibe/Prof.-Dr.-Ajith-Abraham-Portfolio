import type { FC, HTMLAttributes } from 'react'

export interface SlicedWavesProps extends HTMLAttributes<HTMLDivElement> {
  color1?: string
  color2?: string
  color3?: string
  ribbons?: number
  spacing?: number
  barWidth?: number
  ribbonHeight?: number
  spread?: number
  amplitude?: number
  frequency?: number
  speed?: number
  perspective?: number
  curve?: number
  blur?: number
  glow?: number
  brightness?: number
  position?: number
  rotation?: number
  slices?: number
  grain?: number
  mouseInteraction?: boolean
  intro?: boolean
  fade?: number
  opacity?: number
  lightMode?: boolean
  paused?: boolean
  dpr?: number
  className?: string
}

declare const SlicedWaves: FC<SlicedWavesProps>
export default SlicedWaves
