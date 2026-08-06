import { useState } from 'react'
import { keywordGap, type ResumeData } from '../lib/resume'

export default function AiPanel({ data }: { data: ResumeData }) {
  const [jd, setJd] = useState('')
  const gap = jd.trim() ? keywordGap(data, jd) : null

  return (
    <div className="section">
      <h2>Job-match check</h2>
      <p className="empty-hint">
        Paste a job description. Keyword-gap runs instantly, offline. AI bullet-tailoring lives on
        each Experience bullet (the “Tailor” button) once you paste a JD here.
      </p>
      <div className="field">
        <label htmlFor="jd">Job description</label>
        <textarea
          id="jd"
          value={jd}
          onChange={(e) => {
            setJd(e.target.value)
            try {
              sessionStorage.setItem('oriz-resume:jd', e.target.value)
            } catch {
              /* ignore */
            }
          }}
          placeholder="Paste the target job posting here…"
          rows={6}
        />
      </div>

      {gap && (
        <div className="gap-meter">
          <div className="r-item__head">
            <strong>Keyword coverage</strong>
            <span>{gap.score}%</span>
          </div>
          <div className="gap-bar">
            <i style={{ width: `${gap.score}%` }} />
          </div>
          {gap.missing.length > 0 && (
            <>
              <p className="empty-hint" style={{ marginTop: '0.75rem' }}>
                Missing keywords — weave the true ones into your bullets:
              </p>
              <div className="tag-list">
                {gap.missing.slice(0, 30).map((k) => (
                  <span className="tag tag--miss" key={k}>
                    {k}
                  </span>
                ))}
              </div>
            </>
          )}
          {gap.matched.length > 0 && (
            <div className="tag-list">
              {gap.matched.slice(0, 20).map((k) => (
                <span className="tag tag--have" key={k}>
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
