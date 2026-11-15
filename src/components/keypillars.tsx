import { useEffect, useState } from 'react'

/* ==========================================================================
   Key Pillars: eight light cards, each with a short teaser and a "Read More"
   link. Clicking it opens that pillar on its own full page, with a back button.
   Plus Jakarta Sans, heading 600, body 300, justified.
   ========================================================================== */

interface Section {
  heading?: string
  paragraphs: string[]
  items?: string[]
}

interface Pillar {
  id: string
  title: string
  sections: Section[]
}

/* Short teaser shown on each card (taken from the content below) */
const TEASERS: Record<string, string> = {
  'global-academic-leadership':
    'Senior academic leadership across Asia, Africa, Europe, Australia, and North America, leading research programmes with more than USD 110 million in competitive funding.',
  'ai-healthcare-society':
    'Applying AI to clinical diagnostics, medical imaging, and decision support, with a focus on validation, transparency, and responsible deployment.',
  'institution-building':
    'Founding the School of Artificial Intelligence at Bennett University and establishing five new schools at Sai University.',
  'international-science-diplomacy':
    'Contributing to international AI governance and scientific cooperation through forums such as the BRICS+ Artificial Intelligence Forum.',
  'contributions-to-community':
    'Long-term leadership of scientific conference series held across Asia, Europe, the Americas, Africa, and Oceania.',
  'professional-leadership':
    'IEEE technical committee leadership, editorial boards of more than 15 journals, and Chief Editor of Engineering Applications of Artificial Intelligence.',
  'leadership-philosophy':
    'Universities as globally connected institutions that integrate research excellence, innovation, and societal responsibility.',
}

const PILLARS: Pillar[] = [
  {
    id: 'global-academic-leadership',
    title: 'Global Academic Leadership',
    sections: [
      {
        paragraphs: [
          "Prof. Dr. Abraham’s academic leadership career reflects sustained engagement with institutional development, research strategy, and international collaboration across diverse academic environments. Throughout his career, he has held senior leadership positions at higher education institutions, contributing to academic restructuring, research expansion, governance modernization, and the development of research-oriented academic ecosystems.",
          "His international experience spans Asia, Africa, Europe, Australia, and North America, providing a broad perspective on the challenges and opportunities facing universities in different educational and research environments.",
          "A significant dimension of his leadership has been directing and co-directing large-scale research programmes supported by national and supranational funding agencies across the United States, the European Union, Asia-Pacific, and Australia. He has led or co-led research programmes exceeding USD 110 million in competitive funding. These initiatives have involved coordinating multinational research consortia, establishing interdisciplinary research centres, and developing partnerships connecting universities, governments, and industry stakeholders.",
          "His approach to academic leadership emphasizes strategic planning, institutional effectiveness, international engagement, and the integration of research with academic development. Through these efforts, he has contributed to strengthening institutional capabilities and fostering collaborative environments that support sustained scientific progress.",
        ],
      },
    ],
  },
  {
    id: 'ai-healthcare-society',
    title: 'AI for Healthcare & Society',
    sections: [
      {
        paragraphs: [
          "Prof. Dr. Abraham’s work explores the application of Artificial Intelligence to societal challenges, with particular emphasis on healthcare innovation. His research examines how intelligent computational systems can support clinical diagnostics, treatment-related decision-making, and improvements in healthcare delivery through predictive analytics and data-driven approaches.",
          "His areas of interest include medical image analysis, clinical decision-support systems, personalized medicine, explainable Artificial Intelligence, and privacy-preserving machine learning. These areas address the potential of AI to support healthcare professionals, extract meaningful insights from complex medical data, and improve the reliability of computational assistance in clinical settings.",
          "An important aspect of his approach is the responsible deployment of AI in high-impact domains. He emphasizes validation, transparency, and ethical safeguards when developing systems that may influence healthcare decisions. This perspective recognizes that technological capability must be accompanied by appropriate evaluation, accountability, and consideration of societal consequences.",
          "Prof. Dr. Abraham has presented perspectives on AI-enabled healthcare and responsible technological innovation at international forums, including the St. Petersburg International Economic Forum (SPIEF-2025) and the Artificial Intelligence Journey Conference 2025 in Moscow. During the latter event, he participated in expert sessions and interacted with President Vladimir Putin on topics relating to AI innovation, governance, scientific cooperation, and talent development.",
          "His work highlights the importance of connecting advances in intelligent systems with practical societal needs while maintaining an emphasis on trustworthy and responsible innovation.",
        ],
      },
    ],
  },
  {
    id: 'institution-building',
    title: 'Institution Building',
    sections: [
      {
        paragraphs: [
          "Prof. Dr. Abraham has contributed to the development of research organizations and universities through institution building, academic restructuring, research infrastructure development, and strategic expansion.",
        ],
      },
      {
        heading: 'Machine Intelligence Research Labs (MIR Labs)',
        paragraphs: [
          "At MIR Labs, he established an international research organization built around collaboration among researchers, universities, and institutional partners. Its operating model has supported multinational research projects funded by government agencies, industry, and academic partners. The organization has contributed to scientific publications, doctoral and postdoctoral mentoring, and the development of collaborative research infrastructure.",
        ],
      },
      {
        heading: 'Bennett University',
        paragraphs: [
          "During his tenure at Bennett University, Prof. Dr. Abraham founded the School of Artificial Intelligence, developing it as a transdisciplinary academic unit integrating Artificial Intelligence with engineering, management, and emerging technologies. Under his leadership, student enrolment nearly doubled within two years. He also introduced performance-driven academic and research policies intended to strengthen research productivity while maintaining quality.",
          "He spearheaded the university’s NAAC accreditation process, under which Bennett University achieved an A+ grade with a score of 3.47.",
        ],
      },
      {
        heading: 'Sai University',
        paragraphs: [
          "At Sai University, his institutional initiatives included establishing five new schools in Artificial Intelligence, Media, Business, Technology, and Allied Health Sciences. He also introduced interdisciplinary academic programmes aligned with liberal education and research-led learning. Through academic planning, outreach, and institutional reforms, student enrolment increased by more than 200% within the first year, according to the provided resume.",
        ],
      },
      {
        paragraphs: [
          "These initiatives reflect an approach to institution building that combines strategic planning, academic innovation, research development, and organizational growth to establish sustainable educational and research environments.",
        ],
      },
    ],
  },
  {
    id: 'international-science-diplomacy',
    title: 'International Science Diplomacy',
    sections: [
      {
        paragraphs: [
          "Prof. Dr. Abraham contributes to international discussions on Artificial Intelligence governance, scientific cooperation, and cross-border research collaboration. His participation in international forums reflects the role of academic leadership in connecting scientific expertise with broader conversations about technology policy and global innovation.",
          "Through engagements such as the BRICS+ Artificial Intelligence Forum, he has contributed expert perspectives on responsible AI development, international research frameworks, and collaborative approaches to emerging technological challenges.",
          "His work in this area encompasses discussions on research partnerships, innovation ecosystems, talent development, and the exchange of scientific knowledge across national and institutional boundaries. These engagements support dialogue among researchers, academic institutions, and stakeholders working to advance Artificial Intelligence and related technologies.",
          "International scientific cooperation is particularly important in fields where technological developments have implications extending beyond individual institutions or countries. Prof. Dr. Abraham’s participation in these platforms contributes an academic perspective to discussions about the opportunities, governance considerations, and collaborative structures shaping the future of AI.",
          "His engagement in science diplomacy complements his research and institutional leadership by supporting international knowledge exchange and encouraging cooperation in addressing shared technological challenges.",
        ],
      },
    ],
  },
  {
    id: 'contributions-to-community',
    title: 'Contributions to the Community',
    sections: [
      {
        paragraphs: [
          "Prof. Dr. Abraham has made sustained contributions to the international scientific community through the development and long-term leadership of scientific conference series. These conferences bring together researchers, industry experts, and practitioners to exchange knowledge, present new findings, and strengthen international research networks.",
          "As founder and long-term steering chair of several conference series, he has helped establish recurring platforms for collaboration in Artificial Intelligence, intelligent systems, computational intelligence, information security, data mining, and related disciplines. According to the provided resume, these events have been organized across Asia, Europe, North America, South America, Africa, and Oceania.",
        ],
      },
      {
        heading: 'Conference series',
        paragraphs: [
          "His conference contributions include the following series, with the duration and countries in which each has been organized:",
        ],
        items: [
          "Hybrid Intelligent Systems (HIS), 23 years: Organized in Portugal, India, Morocco, South Korea, Kuwait, Tunisia, Malaysia, the USA, China, Spain, Germany, New Zealand, Brazil, Japan, Switzerland, Lithuania, Australia, and Chile.",
          "Intelligent Systems Design and Applications (ISDA), 23 years: Organized in India, Portugal, Morocco, Japan, Malaysia, Spain, Egypt, Italy, Taiwan, Brazil, China, Poland, Switzerland, Lithuania, Hungary, and the USA.",
          "Information Assurance and Security (IAS), 19 years: Organized in India, Portugal, Morocco, France, Japan, Tunisia, Brazil, Malaysia, the USA, China, Switzerland, Lithuania, Italy, and the UK.",
          "Soft Computing and Pattern Recognition (SoCPaR), 15 years: Organized in Portugal, Morocco, India, Japan, Tunisia, Vietnam, Brunei, China, Switzerland, Lithuania, France, and Malaysia.",
          "Next Generation Web Services Practices (NWeSP), 9 years: Organized in Brazil, Spain, India, the Czech Republic, and South Korea.",
          "Computational Aspects of Social Networks (CASoN), 8 years: Organized in India, South Africa, Portugal, the USA, Brazil, Spain, China, and France.",
          "Nature and Biologically Inspired Computing (NaBIC), 12 years: Organized in India, Morocco, South Africa, Portugal, the USA, Mexico, Switzerland, Lithuania, Spain, and Japan.",
          "Innovations in Bio-Inspired Computing and Applications (IBICA), 14 years: Organized in India, Portugal, Morocco, France, the Czech Republic, Switzerland, Lithuania, Taiwan, and China.",
          "World Congress on Information and Communication Technologies (WICT), 13 years: Organized in India, Portugal, Morocco, Switzerland, Lithuania, Japan, and Vietnam.",
          "European Conference on Data Mining (ECDM), 7 years: Organized in Spain, Portugal, the Czech Republic, Italy, Germany, and the Netherlands.",
          "Big Data Analytics, Data Mining and Computational Intelligence (BIGDaCI), 8 years: Organized in Portugal and Spain.",
        ],
      },
      {
        paragraphs: [
          "Collectively, these initiatives have supported the continuity of international scientific forums, encouraged scholarly networking, and created opportunities for researchers at different career stages to participate in global research communities.",
          "His contributions demonstrate a sustained commitment to knowledge dissemination, interdisciplinary exchange, and the development of international platforms through which scientific ideas and research findings can reach a wider community.",
        ],
      },
    ],
  },
  {
    id: 'professional-leadership',
    title: 'Professional Leadership',
    sections: [
      {
        paragraphs: [
          "Prof. Dr. Abraham has held professional leadership roles in scientific societies, academic publishing, and international research organizations. His contributions have focused on strengthening scholarly communication, supporting research quality, and advancing professional engagement within the Artificial Intelligence community.",
        ],
      },
      {
        heading: 'IEEE leadership',
        paragraphs: [
          "He served as Chair of the IEEE Systems, Man, and Cybernetics Society Technical Committee on Soft Computing from 2008 to 2021. During this period, the committee received the IEEE SMC Society Best Technical Committee Award in both 2008 and 2017.",
          "From 2011 to 2013, he served as a Distinguished Lecturer of the IEEE Computer Society for the Europe Region. In this role, he delivered invited lectures and promoted research engagement across academic and industrial communities.",
        ],
      },
      {
        heading: 'Editorial responsibilities',
        paragraphs: [
          "Prof. Dr. Abraham has also held editorial leadership responsibilities in Artificial Intelligence publishing. He served as Editor-in-Chief of Engineering Applications of Artificial Intelligence, an Elsevier journal, and contributed to its interdisciplinary reach and research visibility during his tenure. He continues to contribute to scholarly publishing through editorial board positions at more than 15 internationally recognized journals indexed by Thomson Reuters ISI/Web of Science, according to the provided resume.",
          "These responsibilities involve supporting peer review, maintaining scholarly standards, and facilitating the dissemination of research across disciplinary and geographical boundaries. His professional service reflects sustained engagement with the institutions and processes that underpin international scientific communication.",
        ],
      },
    ],
  },
  {
    id: 'leadership-philosophy',
    title: 'Leadership Philosophy',
    sections: [
      {
        paragraphs: [
          "Prof. Dr. Abraham advocates a model of higher education that integrates research excellence, technological innovation, interdisciplinary learning, and societal impact. His leadership philosophy positions universities as globally connected institutions that develop knowledge, cultivate innovation ecosystems, and support responsible technological advancement.",
          "His vision emphasizes the importance of creating research-intensive academic environments in which faculty and students can engage with challenging questions, pursue meaningful inquiry, and contribute to the development of new knowledge. He also highlights the value of international institutional partnerships in expanding research opportunities and encouraging the exchange of expertise across academic systems.",
          "A central element of this philosophy is strengthening doctoral education and faculty research capacity. Sustainable academic progress, in this view, depends on supporting researchers, developing institutional capabilities, and creating environments where high-quality research and teaching reinforce one another.",
          "He also advocates interdisciplinary and technology-enabled learning, recognizing the importance of connecting different fields of knowledge to address complex contemporary challenges. Digital transformation in higher education and the responsible development of Artificial Intelligence form additional priorities within this vision.",
        ],
      },
      {
        heading: 'Strategic priorities',
        paragraphs: [
          "His strategic priorities include:",
        ],
        items: [
          "Strengthening research-intensive academic environments.",
          "Expanding global institutional partnerships.",
          "Enhancing doctoral education and faculty research capacity.",
          "Promoting interdisciplinary and technology-enabled learning.",
          "Advancing digital transformation in higher education.",
          "Supporting ethical and responsible Artificial Intelligence development.",
        ],
      },
      {
        paragraphs: [
          "Overall, his leadership philosophy seeks to align academic excellence with innovation, institutional responsibility, and meaningful societal contribution.",
        ],
      },
    ],
  },
]

const CSS = `
.kp-wrap {
  padding: 50px 30px 110px; box-sizing: border-box; color: #fff;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (min-width: 640px) { .kp-wrap { padding: 70px 56px 130px; } }

.kp-title, .kp-page-title {
  margin: 0 0 56px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600;
  line-height: 1.15; letter-spacing: -.04em; color: #fff;
}
.kp-page-title {
  margin-bottom: 36px;
}
.kp-article { max-width: 920px; margin: 0 auto; }
.kp-layer {
  position: fixed; inset: 0; z-index: 40; overflow-y: auto;
  background: #24476B;
}
.kp-page { min-height: 100%; box-sizing: border-box; padding-top: 120px; }
@media (min-width: 640px) { .kp-page { padding-top: 140px; } }

@media (max-width: 639px) {
  .kp-title { margin-bottom: 32px; }
  .kp-grid { gap: 14px; }
  .kp-card { min-height: 0; }
  .kp-wrap .kp-name { font-size: 1.1rem; }
  .kp-wrap .kp-teaser { font-size: .9rem; }
  .kp-wrap .kp-more { font-size: .9rem; }
  .kp-wrap .kp-p, .kp-wrap .kp-li { font-size: .9rem; }
  .kp-wrap .kp-subhead { font-size: 1.1rem; }
}
.kp-acc { display: none; }
@media (min-width: 1000px) {
  .kp-acc { display: flex; gap: 2px; height: 400px; margin-top: 8px; border-radius: 20px; overflow: hidden; box-shadow: 0 18px 44px -24px rgba(18,36,60,.5); }
  .kp-grid { display: none !important; }
}
.kp-panel { position: relative; flex-basis: 0; min-width: 0; display: flex; flex-direction: column; padding: 26px 24px; text-align: left; font-family: inherit; background: #DCE8F1; border: 0; cursor: pointer; outline: none; overflow: hidden; transition: background-color .65s ease, flex-grow .85s cubic-bezier(.22,1,.3,1); }
.kp-panel > * { position: relative; z-index: 1; }
.kp-panel::after { content: ''; position: absolute; inset: 0; z-index: 0; background-image: linear-gradient(rgba(36,71,107,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(36,71,107,.05) 1px, transparent 1px); background-size: 22px 22px; opacity: 0; transition: opacity .7s ease; pointer-events: none; }
.kp-panel[data-active="true"]::after { opacity: 1; }
.kp-panel[data-active="true"] { background: #fff; }
.kp-panel-num { flex: none; align-self: flex-start; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: #24476B; color: #DCE8F1; font-size: .72rem; font-weight: 600; letter-spacing: .04em; }
.kp-panel-main { position: relative; flex: 1; width: 100%; margin-top: 20px; }
.kp-panel-vtitle { position: absolute; inset: 0; left: -7px; display: flex; align-items: flex-end; justify-content: flex-start; padding-right: 10px; font-size: .9rem; font-weight: 600; line-height: 1.32; letter-spacing: -.01em; color: #24476B; text-wrap: balance; transition: opacity .5s ease; }
.kp-panel[data-active="true"] .kp-panel-vtitle { opacity: 0; pointer-events: none; }
.kp-panel-body { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-start; opacity: 0; transform: translateY(6px); transition: opacity .28s ease, transform .32s cubic-bezier(.16,1,.3,1); pointer-events: none; }
.kp-panel[data-active="true"] .kp-panel-body { opacity: 1; transform: translateY(0); transition-delay: .18s; pointer-events: auto; }
.kp-panel-body h3 { margin: 0 0 10px; font-size: 1.1rem; font-weight: 600; line-height: 1.25; letter-spacing: -.015em; color: #24476B; text-wrap: balance; }
.kp-panel-body p { margin: 0 0 14px; font-size: .82rem; font-weight: 300; line-height: 1.6; color: #3a5a7a; max-width: 30rem; text-align: justify; text-justify: inter-word; -webkit-hyphens: auto; hyphens: auto; hyphenate-limit-chars: 7 4 3; }
.kp-panel-more { margin-top: auto; font-size: .85rem; font-weight: 600; color: #24476B; }
.kp-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 640px) { .kp-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 640px) { .kp-grid > :last-child:nth-child(odd) { grid-column: 1 / -1; } }

.kp-card {
  display: flex; flex-direction: column; gap: 10px; min-height: 180px;
  padding: 22px 22px 20px; text-align: left; cursor: pointer; font: inherit;
  background: #DCE8F1; color: #24476B; border: 0; border-radius: 16px;
  box-shadow: 0 10px 30px -18px rgba(18,36,60,.5);
  transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s cubic-bezier(.16,1,.3,1);
}
.kp-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px -18px rgba(18,36,60,.6); }
.kp-card:focus-visible { outline: 2px solid #ffffff; outline-offset: 3px; }
.kp-num { font-size: .72rem; font-weight: 500; letter-spacing: .12em; color: #5b7893; }
.kp-name { font-size: 1.05rem; font-weight: 600; line-height: 1.3; letter-spacing: -.01em; color: #24476B; }
.kp-teaser {
  font-size: .8rem; font-weight: 400; line-height: 1.6; color: #2f4d68;
  text-align: left;
}
.kp-more { margin-top: auto; padding-top: 6px; font-size: .85rem; font-weight: 600; color: #24476B; }


.kp-subhead {
  margin: 34px 0 14px; padding-left: 12px; border-left: 3px solid #cdd9ff;
  font-size: 1.05rem; font-weight: 600; letter-spacing: -.01em; color: #cdd9ff;
}
.kp-p {
  margin: 0 0 14px; font-size: .875rem; font-weight: 300; line-height: 1.7;
  letter-spacing: -.01em; text-align: justify; text-justify: inter-word;
  color: rgba(255,255,255,.95);
}
.kp-list { margin: 6px 0 16px; padding-left: 18px; }
.kp-li {
  margin: 0 0 8px; font-size: .875rem; font-weight: 300; line-height: 1.7;
  letter-spacing: -.01em; text-align: justify; text-justify: inter-word; color: rgba(255,255,255,.95);
}
.kp-modal-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(18,36,60,.55); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); animation: kp-fade .3s ease; }
.kp-modal { position: relative; width: min(1180px, 84vw); height: 86vh; max-height: 920px; border-radius: 24px; background: #fff; background-image: linear-gradient(rgba(36,71,107,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(36,71,107,.05) 1px, transparent 1px); background-size: 24px 24px; box-shadow: 0 44px 100px -34px rgba(18,36,60,.75); overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(36,71,107,.28) transparent; animation: kp-pop .42s cubic-bezier(.16,1,.3,1); }
.kp-modal::-webkit-scrollbar { width: 8px; }
.kp-modal::-webkit-scrollbar-track { background: transparent; margin: 16px 0; }
.kp-modal::-webkit-scrollbar-thumb { background: rgba(36,71,107,.28); border-radius: 999px; border: 2px solid transparent; background-clip: padding-box; }
.kp-modal::-webkit-scrollbar-thumb:hover { background: rgba(36,71,107,.45); background-clip: padding-box; }
.kp-modal-article { max-width: 1000px; margin: 0 auto; padding: 40px 26px; }
.kp-modal-article .kp-page-title { margin: 0 0 20px; font-size: clamp(1.5rem, 2.6vw, 2rem); color: #24476B; }
.kp-modal-article .kp-p { color: #2f4f6e; }
.kp-modal-article .kp-subhead { color: #24476B; border-left: 0; padding-left: 0; }
.kp-modal-article .kp-li { color: #2f4f6e; }
.kp-modal-close { position: absolute; top: 16px; right: 18px; z-index: 2; width: 32px; height: 32px; border-radius: 50%; border: 0; background: #EEF4FA; color: #24476B; font-size: 1.1rem; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .2s, transform .2s; }
.kp-modal-close:hover { background: #DCE8F1; transform: rotate(90deg); }
@keyframes kp-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes kp-pop { from { opacity: 0; transform: translateY(22px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@media (max-width: 639px) { .kp-modal { width: 92vw; height: 85vh; } .kp-modal-article { padding: 52px 24px; } }
`

export default function KeyPillars() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [accActive, setAccActive] = useState(0)
  const active = PILLARS.find((p) => p.id === openId) ?? null

  // Opening a pillar pushes a history entry, so the browser back button returns to the list
  const openPillar = (id: string) => {
    window.history.pushState({ kpOpen: id }, '')
    setOpenId(id)
  }

  // While a pillar page is open: lock the page behind it and allow Escape to go back
  useEffect(() => {
    if (!openId) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.history.back()
    }
    const onPop = () => setOpenId(null)
    window.addEventListener('keydown', onKey)
    window.addEventListener('popstate', onPop)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', onPop)
    }
  }, [openId])

  return (
    <section id="key-pillars" className="kp-wrap" aria-labelledby="kp-title">
      <style>{CSS}</style>
      <h2 id="kp-title" className="kp-title">Key Pillars</h2>

      <div className="kp-acc">
        {PILLARS.map((p, i) => {
          const isActive = i === accActive
          return (
            <button
              key={p.id}
              type="button"
              className="kp-panel"
              data-active={isActive}
              aria-label={p.title}
              onMouseEnter={() => setAccActive(i)}
              onFocus={() => setAccActive(i)}
              onClick={() => openPillar(p.id)}
              style={{ flexGrow: isActive ? 2.4 : 1 }}
            >
              <span className="kp-panel-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="kp-panel-main">
                <span className="kp-panel-vtitle" aria-hidden={isActive}>{p.title}</span>
                <div className="kp-panel-body" aria-hidden={!isActive}>
                  <h3>{p.title}</h3>
                  <p>{TEASERS[p.id]}</p>
                  <span className="kp-panel-more">Read More →</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="kp-grid">
        {PILLARS.map((p) => (
          <button key={p.id} type="button" className="kp-card" onClick={() => openPillar(p.id)}>
            <span className="kp-name">{p.title}</span>
            <span className="kp-teaser">{TEASERS[p.id]}</span>
            <span className="kp-more">Read More →</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="kp-modal-overlay" onClick={() => window.history.back()}>
          <div
            className="kp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kp-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="kp-modal-close" aria-label="Close" onClick={() => window.history.back()}>×</button>
            <article className="kp-modal-article">
              <h2 id="kp-modal-title" className="kp-page-title">{active.title}</h2>
              {active.sections.map((sec, si) => (
                <div key={si}>
                  {sec.heading && <h3 className="kp-subhead">{sec.heading}</h3>}
                  {sec.paragraphs.map((text, pi) => (
                    <p key={pi} className="kp-p">{text}</p>
                  ))}
                  {sec.items && (
                    <ul className="kp-list">
                      {sec.items.map((item, ii) => (
                        <li key={ii} className="kp-li">{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </article>
          </div>
        </div>
      )}
    </section>
  )
}