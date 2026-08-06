import { describe, expect, it } from 'vitest'
import {
  keywords,
  keywordGap,
  resumeText,
  wordCount,
  sampleResume,
  emptyResume,
  uid,
  TEMPLATES,
} from '../src/lib/resume'

describe('keywords', () => {
  it('lowercases, drops stopwords + short tokens', () => {
    const k = keywords('The React and Node.js EXPERIENCE with Kubernetes')
    expect(k).toContain('react')
    expect(k).toContain('node.js')
    expect(k).toContain('kubernetes')
    expect(k).not.toContain('the')
    expect(k).not.toContain('and')
    expect(k).not.toContain('experience') // stopword
  })
  it('keeps tech tokens with + and #', () => {
    expect(keywords('C++ and Golang plus Kotlin')).toEqual(
      expect.arrayContaining(['c++', 'golang', 'kotlin']),
    )
  })
  it('empty on blank', () => {
    expect(keywords('')).toEqual([])
  })
})

describe('resumeText', () => {
  it('flattens every user field', () => {
    const t = resumeText(sampleResume())
    expect(t).toMatch(/Rust/)
    expect(t).toMatch(/observability/i)
    expect(t).toMatch(/London/)
  })
})

describe('keywordGap', () => {
  it('scores 0 with empty JD', () => {
    expect(keywordGap(sampleResume(), '')).toEqual({ matched: [], missing: [], score: 0 })
  })
  it('matches known keywords, flags missing', () => {
    const r = sampleResume()
    const g = keywordGap(r, 'We need Rust, Kubernetes, and Elixir experience.')
    expect(g.matched).toContain('rust')
    expect(g.matched).toContain('kubernetes')
    expect(g.missing).toContain('elixir')
    expect(g.score).toBeGreaterThan(0)
    expect(g.score).toBeLessThanOrEqual(100)
  })
  it('100% when all JD keywords present', () => {
    const g = keywordGap(sampleResume(), 'Rust Rust Rust')
    expect(g.score).toBe(100)
    expect(g.missing).toEqual([])
  })
})

describe('wordCount', () => {
  it('counts words in flattened text', () => {
    expect(wordCount(emptyResume())).toBe(0)
    expect(wordCount(sampleResume())).toBeGreaterThan(30)
  })
})

describe('uid + templates', () => {
  it('uid is unique-ish and 8 chars', () => {
    expect(uid()).toHaveLength(8)
    expect(uid()).not.toBe(uid())
  })
  it('ships 4 templates', () => {
    expect(TEMPLATES).toHaveLength(4)
    expect(TEMPLATES.map((t) => t.id)).toContain('ledger')
  })
})
