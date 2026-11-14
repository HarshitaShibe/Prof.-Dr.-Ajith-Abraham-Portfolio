/* ==========================================================================
   Brand marks for the profile / platform links (LinkedIn, YouTube, Google
   Scholar, ORCID, Scopus, Web of Science). Each one renders as a small white
   badge with the platform's colour, so it reads well on dark and light
   backgrounds. Scopus and Web of Science are simple lettermarks: swap in the
   official logo files from public/ if you have them.
   ========================================================================== */

export type Brand = 'linkedin' | 'youtube' | 'scholar' | 'orcid' | 'scopus' | 'wos'

const COLORS: Record<Brand, string> = {
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  scholar: '#4285F4',
  orcid: '#A6CE39',
  scopus: '#E9711C',
  wos: '#5E33BF',
}

const PATHS: Partial<Record<Brand, string>> = {
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452z',
  youtube:
    'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  scholar: 'M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z',
  orcid:
    'M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-4.097-3.722h-2.222z',
}

const LABEL: Record<Brand, string> = {
  linkedin: 'LinkedIn', youtube: 'YouTube', scholar: 'Google Scholar', orcid: 'ORCID', scopus: 'Scopus', wos: 'Web of Science',
}

export function BrandBadge({ brand, size = 22 }: { brand: Brand; size?: number }) {
  const color = COLORS[brand]
  const glyph = Math.round(size * 0.68)
  return (
    <span
      aria-hidden="true"
      title={LABEL[brand]}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        width: size, height: size, borderRadius: Math.round(size * 0.24), background: '#fff', color,
        boxShadow: '0 1px 3px rgba(18,36,60,.25)',
      }}
    >
      {PATHS[brand] ? (
        <svg viewBox="0 0 24 24" width={glyph} height={glyph} fill="currentColor"><path d={PATHS[brand]} /></svg>
      ) : (
        <svg viewBox="0 0 24 24" width={glyph} height={glyph}>
          {brand === 'scopus' ? (
            <text x="12" y="19" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="22" fill="currentColor">S</text>
          ) : (
            <text x="12" y="17.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="13" fill="currentColor">WoS</text>
          )}
        </svg>
      )}
    </span>
  )
}