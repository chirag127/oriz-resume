import type { ResumeData } from '../lib/resume'

function fmtDate(s: string): string {
  if (!s) return ''
  const m = /^(\d{4})-(\d{2})$/.exec(s)
  if (!m) return s
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[+m[2] - 1]} ${m[1]}`
}

function range(start: string, end: string, current: boolean): string {
  const s = fmtDate(start)
  const e = current ? 'Present' : fmtDate(end)
  if (!s && !e) return ''
  return [s, e].filter(Boolean).join(' – ')
}

const CONTACT_KEYS: [keyof ResumeData['basics'], string][] = [
  ['email', ''],
  ['phone', ''],
  ['location', ''],
  ['website', ''],
  ['linkedin', ''],
  ['github', ''],
]

export default function ResumePreview({ data }: { data: ResumeData }) {
  const { basics, experience, education, projects, skills, template, accent } = data
  const hasAny =
    basics.name ||
    basics.summary ||
    experience.length ||
    education.length ||
    projects.length ||
    skills.length

  if (!hasAny) {
    return <div className="preview-empty">Start filling the form — your resume appears here, live.</div>
  }

  const contacts = CONTACT_KEYS.map(([k]) => basics[k]).filter(Boolean)

  return (
    <div className={`sheet sheet--${template}`} style={{ ['--sheet-accent' as string]: accent }}>
      <header className="r-masthead">
        <h1 className="r-name">{basics.name || 'Your Name'}</h1>
        {basics.title && <p className="r-title">{basics.title}</p>}
        {contacts.length > 0 && (
          <div className="r-contact">
            {contacts.map((c, i) => (
              <span key={i}>
                {c}
                {i < contacts.length - 1 ? ' •' : ''}
              </span>
            ))}
          </div>
        )}
      </header>

      {basics.summary && <p className="r-summary">{basics.summary}</p>}

      {experience.length > 0 && (
        <section className="r-section">
          <h2>Experience</h2>
          {experience.map((e) => (
            <div className="r-item" key={e.id}>
              <div className="r-item__head">
                <div>
                  <span className="r-item__title">{e.role || 'Role'}</span>
                  {e.company && <span className="r-item__sub">, {e.company}</span>}
                  {e.location && <span> — {e.location}</span>}
                </div>
                <span className="r-item__dates">{range(e.start, e.end, e.current)}</span>
              </div>
              {e.bullets.filter(Boolean).length > 0 && (
                <ul className="r-bullets">
                  {e.bullets.filter(Boolean).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {projects.length > 0 && (
        <section className="r-section">
          <h2>Projects</h2>
          {projects.map((p) => (
            <div className="r-item" key={p.id}>
              <div className="r-item__head">
                <div>
                  <span className="r-item__title">{p.name || 'Project'}</span>
                  {p.link && <span className="r-item__sub"> — {p.link}</span>}
                </div>
              </div>
              {p.description && <div>{p.description}</div>}
              {p.bullets.filter(Boolean).length > 0 && (
                <ul className="r-bullets">
                  {p.bullets.filter(Boolean).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section className="r-section">
          <h2>Education</h2>
          {education.map((ed) => (
            <div className="r-item" key={ed.id}>
              <div className="r-item__head">
                <div>
                  <span className="r-item__title">
                    {[ed.degree, ed.field].filter(Boolean).join(', ') || 'Degree'}
                  </span>
                  {ed.school && <span className="r-item__sub"> — {ed.school}</span>}
                </div>
                <span className="r-item__dates">{range(ed.start, ed.end, false)}</span>
              </div>
              {ed.note && <div>{ed.note}</div>}
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section className="r-section">
          <h2>Skills</h2>
          <div className="r-skills">
            {skills.map((s) => (
              <div className="r-skill-row" key={s.id}>
                <b>{s.category || 'Category'}</b>
                <span>{s.items}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
