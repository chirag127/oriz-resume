import { describe, expect, it } from 'vitest'
import { coerceResume, serialize, parseResume, fileName } from '../src/lib/storage'
import { sampleResume, emptyResume } from '../src/lib/resume'

describe('coerceResume', () => {
  it('returns empty on garbage', () => {
    expect(coerceResume(null)).toEqual(emptyResume())
    expect(coerceResume(42)).toEqual(emptyResume())
    expect(coerceResume('nope')).toEqual(emptyResume())
  })
  it('preserves valid fields + fills missing', () => {
    const r = coerceResume({ basics: { name: 'Grace' }, template: 'compact' })
    expect(r.basics.name).toBe('Grace')
    expect(r.basics.email).toBe('')
    expect(r.template).toBe('compact')
    expect(Array.isArray(r.experience)).toBe(true)
  })
  it('rejects unknown template → default', () => {
    expect(coerceResume({ template: 'wild' }).template).toBe('ledger')
  })
  it('sanitizes non-string bullets', () => {
    const r = coerceResume({ experience: [{ role: 'X', bullets: ['ok', 5, null, 'good'] }] })
    expect(r.experience[0].bullets).toEqual(['ok', 'good'])
  })
  it('assigns ids when missing', () => {
    const r = coerceResume({ skills: [{ category: 'Lang' }] })
    expect(r.skills[0].id).toBeTruthy()
  })
})

describe('serialize / parseResume round-trip', () => {
  it('round-trips the sample', () => {
    const r = sampleResume()
    const back = parseResume(serialize(r))
    expect(back.basics.name).toBe(r.basics.name)
    expect(back.experience.length).toBe(r.experience.length)
    expect(back.template).toBe(r.template)
  })
  it('parseResume throws on invalid JSON', () => {
    expect(() => parseResume('{ not json')).toThrow()
  })
})

describe('fileName', () => {
  it('slugifies the name', () => {
    const r = sampleResume()
    expect(fileName(r, 'json')).toBe('ada-lovelace.json')
  })
  it('falls back when empty', () => {
    expect(fileName(emptyResume(), 'pdf')).toBe('resume.pdf')
  })
})
