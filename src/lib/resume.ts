// Resume data model + pure helpers. No DOM, no I/O — unit-testable.

export interface ResumeBasics {
  name: string
  title: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
  github: string
  summary: string
}

export interface ExperienceItem {
  id: string
  company: string
  role: string
  location: string
  start: string
  end: string
  current: boolean
  bullets: string[]
}

export interface EducationItem {
  id: string
  school: string
  degree: string
  field: string
  location: string
  start: string
  end: string
  note: string
}

export interface ProjectItem {
  id: string
  name: string
  link: string
  description: string
  bullets: string[]
}

export interface SkillGroup {
  id: string
  category: string
  items: string
}

export interface ResumeData {
  basics: ResumeBasics
  experience: ExperienceItem[]
  education: EducationItem[]
  projects: ProjectItem[]
  skills: SkillGroup[]
  template: TemplateId
  accent: string
}

export type TemplateId = 'ledger' | 'compact' | 'modern' | 'classic'

export const TEMPLATES: { id: TemplateId; name: string; blurb: string }[] = [
  { id: 'ledger', name: 'Ledger', blurb: 'Editorial serif masthead, single column' },
  { id: 'compact', name: 'Compact', blurb: 'Dense one-page, tight leading' },
  { id: 'modern', name: 'Modern', blurb: 'Sans, sidebar accents, airy' },
  { id: 'classic', name: 'Classic', blurb: 'Times-like, centred header' },
]

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function emptyResume(): ResumeData {
  return {
    basics: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
      summary: '',
    },
    experience: [],
    education: [],
    projects: [],
    skills: [],
    template: 'ledger',
    accent: '#b3541e',
  }
}

export function sampleResume(): ResumeData {
  return {
    basics: {
      name: 'Ada Lovelace',
      title: 'Senior Software Engineer',
      email: 'ada@example.com',
      phone: '+1 555 0100',
      location: 'London, UK',
      website: 'adalovelace.dev',
      linkedin: 'in/adalovelace',
      github: 'adalovelace',
      summary:
        'Backend engineer with 8 years building high-throughput distributed systems. Reduced p99 latency 60% across payments infra; shipped a real-time ledger serving 40M requests/day.',
    },
    experience: [
      {
        id: uid(),
        company: 'Analytical Engines Inc.',
        role: 'Senior Software Engineer',
        location: 'London, UK',
        start: '2022-03',
        end: '',
        current: true,
        bullets: [
          'Led migration of the billing pipeline to event-sourced architecture, cutting reconciliation errors 92%.',
          'Mentored 4 engineers; introduced trunk-based development and cut release cycle from 2 weeks to daily.',
          'Owned observability stack (OpenTelemetry + Grafana) reducing MTTR from 45m to 8m.',
        ],
      },
      {
        id: uid(),
        company: 'Difference Systems',
        role: 'Software Engineer',
        location: 'Remote',
        start: '2019-06',
        end: '2022-02',
        current: false,
        bullets: [
          'Built a Rust service handling 40M req/day at p99 < 20ms.',
          'Cut cloud spend 35% by right-sizing autoscaling policies and caching hot paths.',
        ],
      },
    ],
    education: [
      {
        id: uid(),
        school: 'University of London',
        degree: 'B.Sc.',
        field: 'Mathematics & Computer Science',
        location: 'London, UK',
        start: '2011',
        end: '2015',
        note: 'First Class Honours',
      },
    ],
    projects: [
      {
        id: uid(),
        name: 'openledger',
        link: 'github.com/adalovelace/openledger',
        description: 'Open-source double-entry accounting engine.',
        bullets: ['4.2k stars', 'Used by 3 fintech startups in production'],
      },
    ],
    skills: [
      { id: uid(), category: 'Languages', items: 'Rust, TypeScript, Python, Go, SQL' },
      { id: uid(), category: 'Infra', items: 'Kubernetes, Postgres, Kafka, Terraform, AWS' },
      { id: uid(), category: 'Practices', items: 'TDD, DDD, observability, on-call leadership' },
    ],
    template: 'ledger',
    accent: '#b3541e',
  }
}

// --- pure text / analysis helpers (tested) ---

const STOP = new Set([
  'the', 'and', 'for', 'with', 'you', 'your', 'our', 'are', 'will', 'have', 'has',
  'this', 'that', 'from', 'they', 'their', 'a', 'an', 'to', 'of', 'in', 'on', 'as',
  'at', 'by', 'be', 'is', 'it', 'or', 'we', 'us', 'able', 'who', 'can', 'all', 'any',
  'work', 'team', 'role', 'job', 'years', 'year', 'experience', 'skills', 'ability',
  'strong', 'good', 'plus', 'etc', 'including', 'across', 'within', 'using', 'about',
])

/** Tokenise to lowercase alnum words (len >= 3), stopwords removed. Pure. */
export function keywords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9+#.]{2,}/g) ?? [])
    .map((w) => w.replace(/^[.]+|[.]+$/g, ''))
    .filter((w) => w.length >= 3 && !STOP.has(w))
}

/** Flatten all user-entered resume text into one searchable string. Pure. */
export function resumeText(r: ResumeData): string {
  const parts: string[] = [r.basics.summary, r.basics.title]
  for (const e of r.experience) parts.push(e.role, e.company, ...e.bullets)
  for (const p of r.projects) parts.push(p.name, p.description, ...p.bullets)
  for (const s of r.skills) parts.push(s.category, s.items)
  for (const ed of r.education) parts.push(ed.degree, ed.field, ed.school)
  return parts.join(' ')
}

export interface KeywordGap {
  matched: string[]
  missing: string[]
  score: number // 0..100
}

/** Compare a job description's keywords against the resume. Pure. */
export function keywordGap(resume: ResumeData, jobDescription: string): KeywordGap {
  const jd = Array.from(new Set(keywords(jobDescription)))
  if (jd.length === 0) return { matched: [], missing: [], score: 0 }
  const have = new Set(keywords(resumeText(resume)))
  const matched: string[] = []
  const missing: string[] = []
  for (const k of jd) (have.has(k) ? matched : missing).push(k)
  const score = Math.round((matched.length / jd.length) * 100)
  return { matched, missing, score }
}

/** Rough single-word/char counts used for the length meter. Pure. */
export function wordCount(r: ResumeData): number {
  return resumeText(r).split(/\s+/).filter(Boolean).length
}
