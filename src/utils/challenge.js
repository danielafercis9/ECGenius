import { challengePatients, reviewFallbackGroups } from '../data/challengeData'

const hashText = (value) => [...String(value)].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 2166136261)

export function seededShuffle(items, seed) {
  const shuffled = [...items]
  let value = hashText(seed)
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    value = (value * 1664525 + 1013904223) >>> 0
    const swapIndex = value % (index + 1)
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function admission(wardOrder, slotNumber, patientId, pathologyId, flags = {}) {
  return {
    id: `challenge-w${wardOrder}-e${slotNumber}`,
    wardId: `ward-${wardOrder}`,
    wardOrder,
    slotNumber,
    patientId,
    pathologyId,
    ...flags,
  }
}

function wardPatients(seed, wardOrder) {
  return seededShuffle(challengePatients, `${seed}-ward-${wardOrder}-patients`).slice(0, 5)
}

export function createChallengePlan(pathologyList, seed) {
  const rhythmIds = seededShuffle(pathologyList.map((item) => item.id), `${seed}-rhythms`)
  const ward1Patients = wardPatients(seed, 1)
  const ward2Patients = wardPatients(seed, 2)
  const ward3Patients = wardPatients(seed, 3)
  return {
    'ward-1': rhythmIds.slice(0, 5).map((pathologyId, index) => admission(1, index + 1, ward1Patients[index].id, pathologyId)),
    'ward-2': rhythmIds.slice(5, 10).map((pathologyId, index) => admission(2, index + 1, ward2Patients[index].id, pathologyId)),
    'ward-3': [
      admission(3, 1, ward3Patients[0].id, rhythmIds[10]),
      admission(3, 2, ward3Patients[1].id, rhythmIds[11]),
      admission(3, 3, ward3Patients[2].id, null, { reviewSlot: 0 }),
      admission(3, 4, ward3Patients[3].id, null, { reviewSlot: 1 }),
      admission(3, 5, ward3Patients[4].id, rhythmIds[12], { finalCase: true }),
    ],
  }
}

function randomizedMistakeRanking(mistakes, seenIds, seed) {
  const byCount = new Map()
  for (const id of seenIds) {
    const value = mistakes?.[id] || {}
    const total = Number(value.totalMistakes) || (Number(value.incorrectDiagnosisCount) || 0) + (Number(value.incorrectManagementCount) || 0)
    if (total <= 0) continue
    if (!byCount.has(total)) byCount.set(total, [])
    byCount.get(total).push(id)
  }
  return [...byCount.keys()].sort((a, b) => b - a)
    .flatMap((count) => seededShuffle(byCount.get(count), `${seed}-review-tie-${count}`))
}

export function finalizeReviewAssignments(state) {
  const assignments = state.wardAssignments
  const ward3 = assignments?.['ward-3'] || []
  if (ward3.filter((item) => item.reviewSlot !== undefined).every((item) => item.pathologyId)) return state
  const seenAdmissions = [...(assignments?.['ward-1'] || []), ...(assignments?.['ward-2'] || [])]
  const seenIds = [...new Set(seenAdmissions.map((item) => item.pathologyId).filter(Boolean))]
  const ranked = randomizedMistakeRanking(state.mistakes, seenIds, state.runSeed)
  const confusableSeen = reviewFallbackGroups.flat().filter((id) => seenIds.includes(id))
  const fallback = seededShuffle([...new Set([...confusableSeen, ...seenIds])], `${state.runSeed}-review-fallback`)
  const usedWard3 = new Set(ward3.map((item) => item.pathologyId).filter(Boolean))
  const reviewAdmissions = ward3.filter((item) => item.reviewSlot !== undefined)
  const candidateOrder = [...new Set([...ranked, ...fallback, ...seenIds])]
  const chosen = reviewAdmissions.map((reviewAdmission) => {
    const choice = candidateOrder.find((id) => !usedWard3.has(id)
      && !seenAdmissions.some((item) => item.patientId === reviewAdmission.patientId && item.pathologyId === id))
    if (choice) usedWard3.add(choice)
    return choice
  })
  const nextWard3 = ward3.map((item) => item.reviewSlot === undefined ? item : { ...item, pathologyId: chosen[item.reviewSlot] || seenIds[item.reviewSlot] })
  return { ...state, wardAssignments: { ...assignments, 'ward-3': nextWard3 }, reviewPathologyIds: chosen.slice(0, 2) }
}

function uniquePathologies(ids, pathologyMap, excludedId) {
  return [...new Set(ids)].filter((id) => id && id !== excludedId && pathologyMap.has(id)).map((id) => pathologyMap.get(id))
}

export function buildDiagnosisOptions(pathology, pathologies, seed) {
  const pathologyMap = new Map(pathologies.map((item) => [item.id, item]))
  const fallbackPeers = reviewFallbackGroups.find((group) => group.includes(pathology.id)) || []
  const directIds = [...pathology.quizDistractorIds, ...pathology.relatedRhythmIds, ...fallbackPeers]
  const direct = uniquePathologies(directIds, pathologyMap, pathology.id)
  const secondDegreeIds = direct.flatMap((item) => [...item.quizDistractorIds, ...item.relatedRhythmIds])
  const sameModule = pathologies
    .filter((item) => item.moduleId === pathology.moduleId && item.id !== pathology.id)
    .sort((a, b) => Math.abs(a.order - pathology.order) - Math.abs(b.order - pathology.order))
    .map((item) => item.id)
  const candidates = uniquePathologies([...direct.map((item) => item.id), ...secondDegreeIds, ...sameModule], pathologyMap, pathology.id)
  return seededShuffle([pathology, ...candidates.slice(0, 3)], `${seed}-diagnosis`)
}

export function treatmentSummary(value) {
  if (!value) return 'Information not available.'
  // Split only at sentence-ending punctuation followed by a new sentence.
  // Treat decimal points in doses (for example, 2.5 mg) as ordinary text.
  const sentences = String(value).split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚ])/)
  return sentences.slice(0, 2).join(' ').trim()
}

export function buildManagementOptions(pathology, pathologies, seed) {
  const diagnosisOptions = buildDiagnosisOptions(pathology, pathologies, seed).filter((item) => item.id !== pathology.id)
  const remaining = pathologies.filter((item) => item.id !== pathology.id && !diagnosisOptions.some((candidate) => candidate.id === item.id))
  const pool = [...diagnosisOptions, ...remaining]
  const seen = new Set([treatmentSummary(pathology.treatment)])
  const distractors = []
  for (const candidate of pool) {
    const label = treatmentSummary(candidate.treatment)
    if (seen.has(label)) continue
    seen.add(label)
    distractors.push({ id: candidate.id, label })
    if (distractors.length === 3) break
  }
  return seededShuffle([{ id: pathology.id, label: treatmentSummary(pathology.treatment) }, ...distractors], `${seed}-management`)
}

export function scoreQuestion(attemptNumber) { return attemptNumber === 1 ? 10 : 5 }

export function calculateAccuracy(correct, attempts) { return attempts ? Math.round((correct / attempts) * 100) : 0 }

export function remainingDiagnosisSeconds(deadline, now = Date.now()) {
  return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 30
}
