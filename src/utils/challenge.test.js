import { describe, expect, it } from 'vitest'
import { pathologies } from '../data/appData'
import { challengeWards, resolveWardAdmissions } from '../data/challengeData'
import { challengeWardAssets, challengeWardSlots } from '../data/challengeAssets'
import { buildDiagnosisOptions, buildManagementOptions, createChallengePlan, finalizeReviewAssignments, remainingDiagnosisSeconds, scoreQuestion, treatmentSummary } from './challenge'
import { createInitialChallengeState, normalizeChallengeState, resetChallengeState } from './challengeStorage'

describe('Challenge run planning', () => {
  it('creates exactly three wards with five encounters each', () => {
    expect(challengeWards).toHaveLength(3)
    const plan = createChallengePlan(pathologies, 1234)
    expect(Object.values(plan).every((ward) => ward.length === 5)).toBe(true)
    expect(Object.values(plan).flat()).toHaveLength(15)
  })

  it('maps one background and five percentage-based patient zones per ward', () => {
    expect(Object.values(challengeWardAssets).map((value) => value.split('/').at(-1))).toEqual(['ward1.png', 'ward2.png', 'ward3.png'])
    expect(Object.values(challengeWardSlots).every((slots) => slots.length === 5)).toBe(true)
    expect(Object.values(challengeWardSlots).flat().every(({ x, y }) => x > 0 && x < 100 && y > 0 && y < 100)).toBe(true)
  })

  it('uses ten distinct rhythms across the first two randomized wards', () => {
    const plan = createChallengePlan(pathologies, 44)
    const firstTen = [...plan['ward-1'], ...plan['ward-2']].map((item) => item.pathologyId)
    expect(new Set(firstTen).size).toBe(10)
    expect(new Set(plan['ward-1'].map((item) => item.patientId)).size).toBe(5)
    expect(new Set(plan['ward-2'].map((item) => item.patientId)).size).toBe(5)
  })

  it('changes rhythm and patient assignments for a new run seed', () => {
    const first = createChallengePlan(pathologies, 100)
    const second = createChallengePlan(pathologies, 101)
    const signature = (plan) => Object.values(plan).flat().map((item) => `${item.patientId}:${item.pathologyId}`).join('|')
    expect(signature(first)).not.toBe(signature(second))
  })

  it('fills final-shift review slots from the two most-missed earlier rhythms', () => {
    const state = createInitialChallengeState(91)
    const seen = [...state.wardAssignments['ward-1'], ...state.wardAssignments['ward-2']]
    state.mistakes = {
      [seen[0].pathologyId]: { incorrectDiagnosisCount: 3, incorrectManagementCount: 1, totalMistakes: 4 },
      [seen[1].pathologyId]: { incorrectDiagnosisCount: 1, incorrectManagementCount: 1, totalMistakes: 2 },
    }
    const reviewed = finalizeReviewAssignments(state)
    const reviewIds = reviewed.wardAssignments['ward-3'].filter((item) => item.reviewSlot !== undefined).map((item) => item.pathologyId)
    expect(reviewIds).toContain(seen[0].pathologyId)
    expect(reviewIds).toContain(seen[1].pathologyId)
    expect(new Set(reviewIds).size).toBe(2)
  })

  it('uses seen-rhythm fallbacks without repeating a patient/rhythm pairing', () => {
    const state = finalizeReviewAssignments(createInitialChallengeState(512))
    const admissions = Object.values(state.wardAssignments).flat()
    const pairs = admissions.map((item) => `${item.patientId}:${item.pathologyId}`)
    expect(state.reviewPathologyIds).toHaveLength(2)
    expect(state.reviewPathologyIds.every((id) => state.wardAssignments['ward-1'].concat(state.wardAssignments['ward-2']).some((item) => item.pathologyId === id))).toBe(true)
    expect(new Set(pairs).size).toBe(pairs.length)
  })

  it('keeps a generated plan stable when normalized after persistence', () => {
    const state = createInitialChallengeState(808)
    const restored = normalizeChallengeState(JSON.parse(JSON.stringify(state)))
    expect(restored.runId).toBe(state.runId)
    expect(restored.wardAssignments).toEqual(state.wardAssignments)
    expect(resolveWardAdmissions(challengeWards[0], restored)).toEqual(state.wardAssignments['ward-1'])
  })
})

describe('Challenge questions, scoring, and reset', () => {
  it('creates four distinct, data-derived options for every rhythm', () => {
    for (const pathology of pathologies) {
      const diagnosis = buildDiagnosisOptions(pathology, pathologies, pathology.id)
      const management = buildManagementOptions(pathology, pathologies, pathology.id)
      expect(diagnosis).toHaveLength(4)
      expect(new Set(diagnosis.map((option) => option.id)).size).toBe(4)
      expect(diagnosis.some((option) => option.id === pathology.id)).toBe(true)
      expect(management).toHaveLength(4)
      expect(new Set(management.map((option) => option.label)).size).toBe(4)
      expect(management.some((option) => option.id === pathology.id)).toBe(true)
    }
  })

  it('awards the required first-try and retry values', () => {
    expect(scoreQuestion(1)).toBe(10)
    expect(scoreQuestion(2)).toBe(5)
    expect(scoreQuestion(4)).toBe(5)
  })

  it('runs the final diagnosis countdown for 30 seconds and clamps at zero', () => {
    expect(remainingDiagnosisSeconds(40000, 10000)).toBe(30)
    expect(remainingDiagnosisSeconds(10000, 10000)).toBe(0)
    expect(remainingDiagnosisSeconds(9000, 10000)).toBe(0)
  })

  it('keeps decimal medication doses intact when shortening treatment text', () => {
    expect(treatmentSummary('Give 2.5 mg IV. Reassess the patient. A third sentence is omitted.'))
      .toBe('Give 2.5 mg IV. Reassess the patient.')
  })

  it('restarts only Challenge state with a fresh randomized plan', () => {
    const current = { ...createInitialChallengeState(1), noticeAcknowledged: true, hearts: 1, xp: 200, completedAdmissionIds: ['challenge-w1-e1'] }
    const reset = resetChallengeState(current)
    expect(reset.noticeAcknowledged).toBe(true)
    expect(reset.runSeed).not.toBe(current.runSeed)
    expect(reset.wardAssignments).not.toEqual(current.wardAssignments)
    expect(reset.hearts).toBe(5)
    expect(reset.xp).toBe(0)
    expect(reset.completedAdmissionIds).toEqual([])
    expect(reset.unlockedWard).toBe(1)
  })
})
