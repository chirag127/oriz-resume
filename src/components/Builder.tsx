import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  emptyResume,
  sampleResume,
  uid,
  TEMPLATES,
  type ResumeData,
  type TemplateId,
} from '../lib/resume'
import { load, save, clear, serialize, parseResume, fileName } from '../lib/storage'
import ResumePreview from './ResumePreview'
import AiPanel from './AiPanel'

const ACCENTS = ['#b3541e', '#14213d', '#1b5e20', '#6a1b9a', '#0d47a1', '#37474f']

type AiState = { key: string; busy: boolean; error: string }

export default function Builder() {
  const [data, setData] = useState<ResumeData>(emptyResume)
  const [saved, setSaved] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const [ai, setAi] = useState<AiState>({ key: '', busy: false, error: '' })
  const fileInput = useRef<HTMLInputElement>(null)

  // hydrate from localStorage once
  useEffect(() => {
    const stored = load()
    if (stored) setData(stored)
    setHydrated(true)
  }, [])

  // debounced autosave
  useEffect(() => {
    if (!hydrated) return
    setSaved(false)
    const t = setTimeout(() => {
      save(data)
      setSaved(true)
    }, 500)
    return () => clearTimeout(t)
  }, [data, hydrated])

  const patch = useCallback((fn: (d: ResumeData) => ResumeData) => setData((d) => fn(structuredClone(d))), [])

  // ---- basics ----
  const setBasic = (k: keyof ResumeData['basics'], v: string) =>
    patch((d) => {
      d.basics[k] = v
      return d
    })

  // ---- experience ----
  const addExp = () =>
    patch((d) => {
      d.experience.push({
        id: uid(),
        company: '',
        role: '',
        location: '',
        start: '',
        end: '',
        current: false,
        bullets: [''],
      })
      return d
    })
  const rmExp = (id: string) =>
    patch((d) => {
      d.experience = d.experience.filter((e) => e.id !== id)
      return d
    })
  const moveExp = (id: string, dir: -1 | 1) =>
    patch((d) => {
      const i = d.experience.findIndex((e) => e.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= d.experience.length) return d
      ;[d.experience[i], d.experience[j]] = [d.experience[j], d.experience[i]]
      return d
    })
  const setExp = (id: string, k: string, v: unknown) =>
    patch((d) => {
      const e = d.experience.find((x) => x.id === id)
      if (e) (e as unknown as Record<string, unknown>)[k] = v
      return d
    })
  const setBullet = (id: string, i: number, v: string) =>
    patch((d) => {
      const e = d.experience.find((x) => x.id === id)
      if (e) e.bullets[i] = v
      return d
    })
  const addBullet = (id: string) =>
    patch((d) => {
      d.experience.find((x) => x.id === id)?.bullets.push('')
      return d
    })
  const rmBullet = (id: string, i: number) =>
    patch((d) => {
      const e = d.experience.find((x) => x.id === id)
      if (e) e.bullets.splice(i, 1)
      return d
    })

  // ---- education ----
  const addEdu = () =>
    patch((d) => {
      d.education.push({ id: uid(), school: '', degree: '', field: '', location: '', start: '', end: '', note: '' })
      return d
    })
  const rmEdu = (id: string) => patch((d) => ((d.education = d.education.filter((e) => e.id !== id)), d))
  const setEdu = (id: string, k: string, v: string) =>
    patch((d) => {
      const e = d.education.find((x) => x.id === id)
      if (e) (e as unknown as Record<string, unknown>)[k] = v
      return d
    })

  // ---- projects ----
  const addProj = () =>
    patch((d) => {
      d.projects.push({ id: uid(), name: '', link: '', description: '', bullets: [''] })
      return d
    })
  const rmProj = (id: string) => patch((d) => ((d.projects = d.projects.filter((p) => p.id !== id)), d))
  const setProj = (id: string, k: string, v: string) =>
    patch((d) => {
      const p = d.projects.find((x) => x.id === id)
      if (p) (p as unknown as Record<string, unknown>)[k] = v
      return d
    })
  const setProjBullet = (id: string, i: number, v: string) =>
    patch((d) => {
      const p = d.projects.find((x) => x.id === id)
      if (p) p.bullets[i] = v
      return d
    })
  const addProjBullet = (id: string) => patch((d) => (d.projects.find((x) => x.id === id)?.bullets.push(''), d))

  // ---- skills ----
  const addSkill = () => patch((d) => (d.skills.push({ id: uid(), category: '', items: '' }), d))
  const rmSkill = (id: string) => patch((d) => ((d.skills = d.skills.filter((s) => s.id !== id)), d))
  const setSkill = (id: string, k: string, v: string) =>
    patch((d) => {
      const s = d.skills.find((x) => x.id === id)
      if (s) (s as unknown as Record<string, unknown>)[k] = v
      return d
    })

  // ---- meta ----
  const setTemplate = (t: TemplateId) => patch((d) => ((d.template = t), d))
  const setAccent = (a: string) => patch((d) => ((d.accent = a), d))

  // ---- import / export / print / reset ----
  const exportJson = async () => {
    const { downloadBlob } = await import('@chirag127/oz-file')
    downloadBlob(new Blob([serialize(data)], { type: 'application/json' }), fileName(data, 'json'))
  }
  const importJson = async (file: File) => {
    const { readAsText } = await import('@chirag127/oz-file')
    try {
      const text = await readAsText(file)
      setData(parseResume(text))
    } catch {
      alert('Could not read that file — expected a resume JSON export.')
    }
  }
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) importJson(f)
    e.target.value = ''
  }
  const doPrint = async () => {
    const { printToPdf } = await import('@chirag127/oz-file')
    const node = document.getElementById('print-root')
    printToPdf(node ?? undefined)
  }
  const loadSample = () => {
    if (confirm('Replace current content with a sample resume?')) setData(sampleResume())
  }
  const reset = () => {
    if (confirm('Clear everything? This wipes your saved draft.')) {
      clear()
      setData(emptyResume())
    }
  }

  // ---- AI: rewrite / tailor a bullet (lazy import) ----
  const jdFor = () => {
    try {
      return sessionStorage.getItem('oriz-resume:jd') ?? ''
    } catch {
      return ''
    }
  }
  const runBulletAi = async (
    key: string,
    current: string,
    kind: 'rewrite' | 'tailor',
    apply: (out: string) => void,
  ) => {
    if (!current.trim()) return
    setAi({ key, busy: true, error: '' })
    try {
      const mod = await import('../lib/ai')
      const out =
        kind === 'tailor' ? await mod.tailorBullet(current, jdFor()) : await mod.rewriteBullet(current)
      if (out) apply(out)
      setAi({ key: '', busy: false, error: '' })
    } catch {
      setAi({ key, busy: false, error: 'AI unavailable right now — your text is unchanged.' })
    }
  }

  const hasJd = () => jdFor().trim().length > 0

  return (
    <div className="builder">
      <div className="toolbar">
        <button className="btn btn--accent" onClick={doPrint}>
          Download PDF
        </button>
        <button className="btn btn--ghost btn--sm" onClick={exportJson}>
          Export JSON
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => fileInput.current?.click()}>
          Import JSON
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          hidden
        />
        <button className="btn btn--ghost btn--sm" onClick={loadSample}>
          Load sample
        </button>
        <button className="btn btn--ghost btn--sm" onClick={reset}>
          Reset
        </button>
        <span className="toolbar__spacer" />
        <span className="toolbar__status" data-saved={saved}>
          {saved ? 'Saved locally' : 'Saving…'}
        </span>
      </div>

      {/* FORM PANE */}
      <div className="form-pane">
        <section className="section">
          <h2>Details</h2>
          <div className="grid-2">
            <Field label="Full name" value={data.basics.name} onChange={(v) => setBasic('name', v)} />
            <Field label="Headline / title" value={data.basics.title} onChange={(v) => setBasic('title', v)} />
            <Field label="Email" value={data.basics.email} onChange={(v) => setBasic('email', v)} type="email" />
            <Field label="Phone" value={data.basics.phone} onChange={(v) => setBasic('phone', v)} />
            <Field label="Location" value={data.basics.location} onChange={(v) => setBasic('location', v)} />
            <Field label="Website" value={data.basics.website} onChange={(v) => setBasic('website', v)} />
            <Field label="LinkedIn" value={data.basics.linkedin} onChange={(v) => setBasic('linkedin', v)} />
            <Field label="GitHub" value={data.basics.github} onChange={(v) => setBasic('github', v)} />
          </div>
          <div className="field" style={{ marginTop: '1rem' }}>
            <label htmlFor="summary">Summary</label>
            <textarea
              id="summary"
              value={data.basics.summary}
              onChange={(e) => setBasic('summary', e.target.value)}
              rows={4}
              placeholder="2–3 sentences: who you are, your edge, quantified impact."
            />
          </div>
        </section>

        {/* Experience */}
        <section className="section">
          <h2>Experience</h2>
          {data.experience.length === 0 && <p className="empty-hint">No roles yet — add your most recent first.</p>}
          {data.experience.map((e, idx) => (
            <div className="entry" key={e.id}>
              <div className="entry__head">
                <strong>{e.role || e.company || `Role ${idx + 1}`}</strong>
                <div className="entry__controls">
                  <button className="icon-btn" onClick={() => moveExp(e.id, -1)} aria-label="Move up">↑</button>
                  <button className="icon-btn" onClick={() => moveExp(e.id, 1)} aria-label="Move down">↓</button>
                  <button className="icon-btn" onClick={() => rmExp(e.id)} aria-label="Remove">✕</button>
                </div>
              </div>
              <div className="grid-2">
                <Field label="Role" value={e.role} onChange={(v) => setExp(e.id, 'role', v)} />
                <Field label="Company" value={e.company} onChange={(v) => setExp(e.id, 'company', v)} />
                <Field label="Location" value={e.location} onChange={(v) => setExp(e.id, 'location', v)} />
                <div />
                <Field label="Start (YYYY-MM)" value={e.start} onChange={(v) => setExp(e.id, 'start', v)} placeholder="2022-03" />
                <Field
                  label="End (YYYY-MM)"
                  value={e.end}
                  onChange={(v) => setExp(e.id, 'end', v)}
                  placeholder="2024-01"
                  disabled={e.current}
                />
              </div>
              <label style={{ fontSize: '0.82rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input type="checkbox" checked={e.current} onChange={(ev) => setExp(e.id, 'current', ev.target.checked)} />
                I currently work here
              </label>
              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'var(--ink-soft)' }}>
                  Bullets
                </label>
                {e.bullets.map((b, i) => {
                  const key = `exp:${e.id}:${i}`
                  return (
                    <div className="bullet-row" key={i}>
                      <textarea
                        value={b}
                        onChange={(ev) => setBullet(e.id, i, ev.target.value)}
                        rows={2}
                        placeholder="Led / shipped / cut … with a number."
                      />
                      <div className="bullet-actions">
                        <button
                          className="icon-btn icon-btn--ai"
                          disabled={ai.busy || !b.trim()}
                          onClick={() => runBulletAi(key + ':rw', b, 'rewrite', (out) => setBullet(e.id, i, out))}
                          title="Rewrite stronger with AI"
                        >
                          {ai.busy && ai.key === key + ':rw' ? <span className="spinner" /> : 'AI ✎'}
                        </button>
                        <button
                          className="icon-btn icon-btn--ai"
                          disabled={ai.busy || !b.trim() || !hasJd()}
                          onClick={() => runBulletAi(key + ':t', b, 'tailor', (out) => setBullet(e.id, i, out))}
                          title={hasJd() ? 'Tailor to the pasted job description' : 'Paste a job description below first'}
                        >
                          {ai.busy && ai.key === key + ':t' ? <span className="spinner" /> : 'Tailor'}
                        </button>
                        <button className="icon-btn" onClick={() => rmBullet(e.id, i)} aria-label="Remove bullet">–</button>
                      </div>
                    </div>
                  )
                })}
                {ai.error && ai.key.startsWith(`exp:${e.id}`) === false && null}
                <button className="icon-btn add-btn" onClick={() => addBullet(e.id)}>+ bullet</button>
              </div>
            </div>
          ))}
          {ai.error && <p className="ai-error">{ai.error}</p>}
          <button className="btn btn--ghost btn--sm add-btn" onClick={addExp}>+ Add role</button>
        </section>

        {/* Projects */}
        <section className="section">
          <h2>Projects</h2>
          {data.projects.length === 0 && <p className="empty-hint">Optional — side projects, OSS, notable work.</p>}
          {data.projects.map((p, idx) => (
            <div className="entry" key={p.id}>
              <div className="entry__head">
                <strong>{p.name || `Project ${idx + 1}`}</strong>
                <div className="entry__controls">
                  <button className="icon-btn" onClick={() => rmProj(p.id)} aria-label="Remove">✕</button>
                </div>
              </div>
              <div className="grid-2">
                <Field label="Name" value={p.name} onChange={(v) => setProj(p.id, 'name', v)} />
                <Field label="Link" value={p.link} onChange={(v) => setProj(p.id, 'link', v)} />
              </div>
              <Field label="Description" value={p.description} onChange={(v) => setProj(p.id, 'description', v)} />
              {p.bullets.map((b, i) => (
                <div className="bullet-row" key={i}>
                  <textarea value={b} onChange={(ev) => setProjBullet(p.id, i, ev.target.value)} rows={1} placeholder="Highlight" />
                </div>
              ))}
              <button className="icon-btn add-btn" onClick={() => addProjBullet(p.id)}>+ highlight</button>
            </div>
          ))}
          <button className="btn btn--ghost btn--sm add-btn" onClick={addProj}>+ Add project</button>
        </section>

        {/* Education */}
        <section className="section">
          <h2>Education</h2>
          {data.education.length === 0 && <p className="empty-hint">Add degrees, certs, bootcamps.</p>}
          {data.education.map((ed, idx) => (
            <div className="entry" key={ed.id}>
              <div className="entry__head">
                <strong>{ed.school || `Education ${idx + 1}`}</strong>
                <div className="entry__controls">
                  <button className="icon-btn" onClick={() => rmEdu(ed.id)} aria-label="Remove">✕</button>
                </div>
              </div>
              <div className="grid-2">
                <Field label="School" value={ed.school} onChange={(v) => setEdu(ed.id, 'school', v)} />
                <Field label="Degree" value={ed.degree} onChange={(v) => setEdu(ed.id, 'degree', v)} />
                <Field label="Field" value={ed.field} onChange={(v) => setEdu(ed.id, 'field', v)} />
                <Field label="Location" value={ed.location} onChange={(v) => setEdu(ed.id, 'location', v)} />
                <Field label="Start" value={ed.start} onChange={(v) => setEdu(ed.id, 'start', v)} placeholder="2011" />
                <Field label="End" value={ed.end} onChange={(v) => setEdu(ed.id, 'end', v)} placeholder="2015" />
              </div>
              <Field label="Note (honours, GPA…)" value={ed.note} onChange={(v) => setEdu(ed.id, 'note', v)} />
            </div>
          ))}
          <button className="btn btn--ghost btn--sm add-btn" onClick={addEdu}>+ Add education</button>
        </section>

        {/* Skills */}
        <section className="section">
          <h2>Skills</h2>
          {data.skills.length === 0 && <p className="empty-hint">Group by category — e.g. Languages, Infra.</p>}
          {data.skills.map((s) => (
            <div className="grid-2" key={s.id} style={{ marginBottom: '0.75rem', gridTemplateColumns: '1fr 2fr auto', alignItems: 'end' }}>
              <Field label="Category" value={s.category} onChange={(v) => setSkill(s.id, 'category', v)} />
              <Field label="Items (comma-separated)" value={s.items} onChange={(v) => setSkill(s.id, 'items', v)} />
              <button className="icon-btn" onClick={() => rmSkill(s.id)} aria-label="Remove" style={{ marginBottom: '1rem' }}>✕</button>
            </div>
          ))}
          <button className="btn btn--ghost btn--sm add-btn" onClick={addSkill}>+ Add skill group</button>
        </section>

        {/* Template + accent */}
        <section className="section">
          <h2>Template</h2>
          <div className="template-picker">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                className="template-chip"
                aria-pressed={data.template === t.id}
                onClick={() => setTemplate(t.id)}
              >
                <strong>{t.name}</strong>
                <span>{t.blurb}</span>
              </button>
            ))}
          </div>
          <div className="accent-row">
            <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'var(--ink-soft)' }}>
              Accent
            </label>
            {ACCENTS.map((a) => (
              <button
                key={a}
                className="accent-swatch"
                style={{ background: a }}
                aria-pressed={data.accent === a}
                aria-label={`Accent ${a}`}
                onClick={() => setAccent(a)}
              />
            ))}
          </div>
        </section>

        {/* AI / job match */}
        <AiPanel data={data} />
      </div>

      {/* PREVIEW PANE */}
      <div className="preview-pane">
        <div className="preview-scroll">
          <div id="print-root">
            <ResumePreview data={data} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
