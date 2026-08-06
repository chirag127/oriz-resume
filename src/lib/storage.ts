import { emptyResume, type ResumeData, type TemplateId, TEMPLATES } from './resume'

export const STORAGE_KEY = 'oriz-resume:v1'

const isStr = (v: unknown): v is string => typeof v === 'string'
const isArr = Array.isArray

/** Coerce arbitrary parsed JSON into a valid ResumeData, filling gaps. Pure. */
export function coerceResume(input: unknown): ResumeData {
  const base = emptyResume()
  if (!input || typeof input !== 'object') return base
  const o = input as Record<string, unknown>
  const b = (o.basics ?? {}) as Record<string, unknown>
  const pick = (v: unknown, d = '') => (isStr(v) ? v : d)

  const template: TemplateId = TEMPLATES.some((t) => t.id === o.template)
    ? (o.template as TemplateId)
    : base.template

  return {
    basics: {
      name: pick(b.name),
      title: pick(b.title),
      email: pick(b.email),
      phone: pick(b.phone),
      location: pick(b.location),
      website: pick(b.website),
      linkedin: pick(b.linkedin),
      github: pick(b.github),
      summary: pick(b.summary),
    },
    experience: isArr(o.experience)
      ? o.experience.map((e) => {
          const x = (e ?? {}) as Record<string, unknown>
          return {
            id: pick(x.id) || Math.random().toString(36).slice(2, 10),
            company: pick(x.company),
            role: pick(x.role),
            location: pick(x.location),
            start: pick(x.start),
            end: pick(x.end),
            current: x.current === true,
            bullets: isArr(x.bullets) ? x.bullets.filter(isStr) : [],
          }
        })
      : [],
    education: isArr(o.education)
      ? o.education.map((e) => {
          const x = (e ?? {}) as Record<string, unknown>
          return {
            id: pick(x.id) || Math.random().toString(36).slice(2, 10),
            school: pick(x.school),
            degree: pick(x.degree),
            field: pick(x.field),
            location: pick(x.location),
            start: pick(x.start),
            end: pick(x.end),
            note: pick(x.note),
          }
        })
      : [],
    projects: isArr(o.projects)
      ? o.projects.map((e) => {
          const x = (e ?? {}) as Record<string, unknown>
          return {
            id: pick(x.id) || Math.random().toString(36).slice(2, 10),
            name: pick(x.name),
            link: pick(x.link),
            description: pick(x.description),
            bullets: isArr(x.bullets) ? x.bullets.filter(isStr) : [],
          }
        })
      : [],
    skills: isArr(o.skills)
      ? o.skills.map((e) => {
          const x = (e ?? {}) as Record<string, unknown>
          return {
            id: pick(x.id) || Math.random().toString(36).slice(2, 10),
            category: pick(x.category),
            items: pick(x.items),
          }
        })
      : [],
    template,
    accent: pick(o.accent, base.accent),
  }
}

/** Serialize resume to pretty JSON. Pure. */
export function serialize(r: ResumeData): string {
  return JSON.stringify(r, null, 2)
}

/** Parse JSON text → validated ResumeData. Throws on invalid JSON. */
export function parseResume(text: string): ResumeData {
  return coerceResume(JSON.parse(text))
}

/** Suggested download filename from the resume name. Pure. */
export function fileName(r: ResumeData, ext: string): string {
  const slug = (r.basics.name || 'resume')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'resume'}.${ext}`
}

// --- browser-only glue (guarded) ---

export function load(): ResumeData | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return coerceResume(JSON.parse(raw))
  } catch {
    return null
  }
}

export function save(r: ResumeData): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, serialize(r))
}

export function clear(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
