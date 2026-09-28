import { pathologies } from '../data/appData'
import { createChallengePlan } from './challenge'

const CHALLENGE_KEY = 'ecgenius-challenge-v2'

function randomSeed(previousSeed) {
  let seed = Math.floor(Math.random() * 2147483647)
  if (seed === previousSeed) seed = (seed + 1) % 2147483647
  return seed
}

export function createInitialChallengeState(seed = randomSeed()) {
  return {
    version: 2,
    runId: `challenge-${seed}`,
    runSeed: seed,
    noticeAcknowledged: false,
    wardAssignments: createChallengePlan(pathologies, seed),
    unlockedWard: 1,
    currentWard: 1,
    currentEncounter: null,
    completedAdmissionIds: [],
    xp: 0,
    hearts: 5,
    mistakes: {},
    totals: { diagnosisAttempts: 0, diagnosisCorrect: 0, managementAttempts: 0, managementCorrect: 0 },
    wardStats: {},
    reviewPathologyIds: [],
    activeCase: null,
    pendingWardSummary: null,
    completed: false,
  }
}

function hasValidPlan(value) {
  return ['ward-1', 'ward-2', 'ward-3'].every((wardId) => Array.isArray(value?.wardAssignments?.[wardId]) && value.wardAssignments[wardId].length === 5)
}

export function normalizeChallengeState(value) {
  const fallback = createInitialChallengeState()
  if (!value || value.version !== 2 || !hasValidPlan(value)) {
    fallback.noticeAcknowledged = Boolean(value?.noticeAcknowledged)
    return fallback
  }
  return {
    ...fallback,
    ...value,
    hearts: Number.isFinite(Number(value.hearts)) ? Math.max(0, Math.min(5, Number(value.hearts))) : fallback.hearts,
    unlockedWard: Math.max(1, Math.min(3, Number(value.unlockedWard) || 1)),
    currentWard: Math.max(1, Math.min(3, Number(value.currentWard) || 1)),
    completedAdmissionIds: [...new Set(Array.isArray(value.completedAdmissionIds) ? value.completedAdmissionIds : [])],
    mistakes: value.mistakes && typeof value.mistakes === 'object' ? value.mistakes : {},
    totals: { ...fallback.totals, ...(value.totals || {}) },
    wardStats: value.wardStats && typeof value.wardStats === 'object' ? value.wardStats : {},
    reviewPathologyIds: Array.isArray(value.reviewPathologyIds) ? value.reviewPathologyIds.slice(0, 2) : [],
  }
}

export function loadChallengeState() {
  try { return normalizeChallengeState(JSON.parse(localStorage.getItem(CHALLENGE_KEY) || 'null')) }
  catch { return createInitialChallengeState() }
}

export function saveChallengeState(state) {
  const normalized = normalizeChallengeState(state)
  try { localStorage.setItem(CHALLENGE_KEY, JSON.stringify(normalized)) } catch { /* Continue in memory. */ }
  return normalized
}

export function resetChallengeState(currentState) {
  const next = createInitialChallengeState(randomSeed(currentState?.runSeed))
  next.noticeAcknowledged = Boolean(currentState?.noticeAcknowledged)
  return next
}

export const challengeStorageKey = CHALLENGE_KEY
