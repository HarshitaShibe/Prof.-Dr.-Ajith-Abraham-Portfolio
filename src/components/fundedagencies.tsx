/* ==========================================================================
   Funded Agencies: logo grid plus the list of agencies and what they funded.
   Logos live in public/logos/ (served from /logos/...). Replace the placeholder
   SVGs there with each agency's official logo file, keeping the same names.
   ========================================================================== */

interface Agency {
  name: string
  file: string
  detail: string
}

const AGENCIES: Agency[] = [
  {
    name: 'Generalitat de Catalunya, Spain',
    file: '1.jpg',
    detail: 'Evolving Artificial Intelligence Paradigms on Computational Grid for Knowledge Mining',
  },
  {
    name: 'Ministry of Education, Spain',
    file: '2.jpg',
    detail: 'Evolutionary Neural Network Optimization',
  },
  {
    name: 'Presidential Challenge Grant, Oklahoma State University',
    file: '3.jpg',
    detail: 'Web-Based Distributed Data Mining Using Hybrid Intelligent Systems',
  },
  {
    name: 'State of Oklahoma, USA',
    file: '4.jpg',
    detail: 'Startup fund as Domain Leader',
  },
  {
    name: 'Malaysian Government Grant, Higher Learning Ministry, Malaysia',
    file: '5.jpg',
    detail: 'Tree Structural-Based Method for Feature Selection',
  },
  {
    name: 'National Science Foundation of China (NSFC)',
    file: '6.jpg',
    detail: 'Hidden Chinese Cognition Model Based on Swarm Intelligence',
  },
  {
    name: 'MOSTI Science Fund, Malaysia',
    file: '7.jpg',
    detail: 'Adaptive Web Caching and Prefetching; Adaptive Hypermedia Learning System',
  },
  {
    name: 'Government of Malaysia',
    file: '8.jpg',
    detail: 'Swarm-optimized SNP diagnosis; social-network benchmark; 3D molecular reconstruction',
  },
  {
    name: 'European Social Fund and Czech Republic State Funds',
    file: '9.jpg',
    detail: 'BIO-inspired Methods; IT4Innovations Centre of Excellence',
  },
  {
    name: 'International Centre for Genetic Engineering and Biotechnology (ICGEB), Italy',
    file: '10.jpg',
    detail: '3D Descriptor of Synthetic Drug Molecular Structure',
  },
  {
    name: 'European Commission, FP7-PEOPLE-2012-ITN Programme',
    file: '11.jpg',
    detail: 'In-silico process models for roll compaction',
  },
  {
    name: 'European Commission, Horizon 2020',
    file: '12.jpg',
    detail: 'Regeneration and Optimisation of Cultural Heritage in Creative and Knowledge Cities',
  },
  {
    name: 'Permodalan Nasional Berhad, Government of Malaysia',
    file: '13.jpg',
    detail: 'Yayasan Tun Ismail Professorial Chair Programme; AI portfolio management',
  },
  {
    name: 'Analytical Center for the Government of the Russian Federation',
    file: '14.jpg',
    detail: 'Intersectoral AI Technologies for Digital Transformation',
  },
  {
    name: 'Research Council of Lithuania',
    file: '15.jpg',
    detail: 'Sensitive Cognitive Classroom project',
  },
]

const CSS = `
.fa-wrap {
  padding: 80px 30px 110px; box-sizing: border-box; color: #fff;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (min-width: 640px) { .fa-wrap { padding: 100px 56px 120px; } }

.fa-title {
  margin: 0 0 56px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600;
  line-height: 1.15; letter-spacing: -.04em; color: #fff;
}

@media (max-width: 639px) {
  .fa-wrap { padding-bottom: 80px; }
  .fa-title { margin-bottom: 32px; }
}
.fa-logos {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; list-style: none; margin: 0 0 24px; padding: 0;
}
@media (min-width: 640px) { .fa-logos { gap: 20px; } }

.fa-tile {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  width: calc(50% - 8px); aspect-ratio: 1 / 1; padding: 12px; box-sizing: border-box; background: #ffffff; border-radius: 14px;
  box-shadow: 0 10px 26px -14px rgba(18,36,60,.6);
  transition: box-shadow .4s cubic-bezier(.16,1,.3,1);
}
@media (min-width: 640px) { .fa-tile { width: calc((100% - 60px) / 4); } }
@media (min-width: 1024px) { .fa-tile { width: calc((100% - 80px) / 5); } }
.fa-tile img {
  width: 88%; height: 88%; object-fit: contain; display: block;
  transition: transform .4s cubic-bezier(.16,1,.3,1);
}
.fa-tile:hover img { transform: scale(1.15); }
.fa-tile:hover { box-shadow: 0 18px 36px -14px rgba(18,36,60,.7); }

`

export default function FundedAgencies() {
  return (
    <section id="funded-agencies" className="fa-wrap" aria-labelledby="fa-title">
      <style>{CSS}</style>

      <h2 id="fa-title" className="fa-title">Funded Agencies</h2>

      <ul className="fa-logos">
        {AGENCIES.map((a) => (
          <li key={a.file} className="fa-tile">
            <img src={`/logos/${a.file}`} alt={a.name} loading="lazy" decoding="async" />
          </li>
        ))}
      </ul>

    </section>
  )
}