import { describe, expect, it } from 'vitest'
import { pathologies, validateData } from '../data/appData'
import { classifyRhythm, evaluateOperator } from './classifier'
import { mergeCompletedIds } from './storage'

describe('central pathology data', () => {
  it('contains a valid 27-rhythm course', () => {
    expect(validateData()).toEqual([])
    expect(pathologies.map((item) => item.order)).toEqual([...Array(27)].map((_, index) => index + 1))
  })

  it('keeps lesson completion idempotent', () => {
    expect(mergeCompletedIds(['sinus-rhythm'], 'sinus-rhythm')).toEqual(['sinus-rhythm'])
  })
})

describe('classifier rule engine', () => {
  it('supports every configured operator deterministically', () => {
    expect(evaluateOperator(75, 'between', { min: 60, max: 100 })).toBe(true)
    expect(evaluateOperator('wide', 'in', ['narrow', 'wide'])).toBe(true)
    expect(evaluateOperator('unmeasurable', 'unmeasurable')).toBe(true)
    expect(evaluateOperator('unclear', 'equals', 'regular')).toBe(null)
  })

  it('returns a strong match for the configured ventricular fibrillation pattern', () => {
    const result = classifyRhythm(pathologies, {
      heart_rate_bpm: 'unmeasurable', ventricular_regularity: 'chaotic', p_wave_morphology: 'absent',
      pqrs_relationship: 'none_identifiable', pr_behavior: 'not_applicable', qrs_width: 'absent',
      premature_beat_pattern: 'none', pacing_activity: 'none',
    })
    expect(result.status).toBe('strong_match')
    expect(result.leadingId).toBe('ventricular-fibrillation')
  })

  it('does not force a result when information is sparse', () => {
    const result = classifyRhythm(pathologies, { qrs_width: 'narrow' })
    expect(result.status).toBe('insufficient_or_inconsistent')
  })

  it('keeps unclear required inputs from becoming a strong match', () => {
    const result = classifyRhythm(pathologies, {
      heart_rate_bpm: 75, ventricular_regularity: 'regular', p_wave_morphology: 'unclear',
      pqrs_relationship: 'unclear', pr_behavior: 'normal_constant', qrs_width: 'narrow',
      premature_beat_pattern: 'none', pacing_activity: 'none',
    })
    expect(result.status).not.toBe('strong_match')
  })
})
