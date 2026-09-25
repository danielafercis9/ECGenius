const unknownValues = new Set(['', null, undefined, 'unclear'])

export function isKnown(value) { return !unknownValues.has(value) }

export function evaluateOperator(actual, operator, expected) {
  if (!isKnown(actual)) return null
  if (operator === 'unmeasurable') return actual === 'unmeasurable'
  if (actual === 'unmeasurable') return false
  const numeric = typeof actual === 'number' ? actual : Number(actual)
  switch (operator) {
    case 'equals': return actual === expected
    case 'not_equals': return actual !== expected
    case 'in': return expected.includes(actual)
    case 'between': return Number.isFinite(numeric) && numeric >= expected.min && numeric <= expected.max
    case 'lt': return Number.isFinite(numeric) && numeric < expected
    case 'lte': return Number.isFinite(numeric) && numeric <= expected
    case 'gt': return Number.isFinite(numeric) && numeric > expected
    case 'gte': return Number.isFinite(numeric) && numeric >= expected
    default: return false
  }
}

export function evaluateCandidate(pathology, answers) {
  const rules = pathology.classifier
  const required = rules.required.map((rule) => ({ ...rule, result: evaluateOperator(answers[rule.feature], rule.operator, rule.value) }))
  const supporting = rules.supporting.map((rule) => ({ ...rule, result: evaluateOperator(answers[rule.feature], rule.operator, rule.value) }))
  const conflicts = rules.conflicts.map((rule) => ({ ...rule, result: evaluateOperator(answers[rule.feature], rule.operator, rule.value) }))
  const contradictedRequired = required.filter((rule) => rule.result === false)
  const missingRequired = required.filter((rule) => rule.result === null)
  const activeConflicts = conflicts.filter((rule) => rule.result === true)
  const possible = contradictedRequired.length === 0 && activeConflicts.length === 0
  const totalWeight = supporting.reduce((sum, rule) => sum + (rule.weight || 0), 0)
  const matchedWeight = supporting.filter((rule) => rule.result === true).reduce((sum, rule) => sum + (rule.weight || 0), 0)
  const score = totalWeight ? Math.round((matchedWeight / totalWeight) * 100) : 0
  return {
    id: pathology.id,
    possible,
    score,
    matchedRequired: required.filter((rule) => rule.result === true),
    missingRequired,
    contradictedRequired,
    matchedSupporting: supporting.filter((rule) => rule.result === true),
    activeConflicts,
    ambiguityNote: rules.ambiguity_note,
  }
}

export function classifyRhythm(pathologies, answers) {
  const knownCount = Object.values(answers).filter(isKnown).length
  const ranked = pathologies.map((p) => evaluateCandidate(p, answers)).filter((c) => c.possible).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
  if (knownCount < 4 || !ranked.length) {
    return { status: 'insufficient_or_inconsistent', ranked: ranked.slice(0, 3), missingFeatures: findUsefulMissing(pathologies, ranked, answers) }
  }
  const top = ranked[0]
  const second = ranked[1]
  const close = second && Math.abs(top.score - second.score) <= 10
  if (top.missingRequired.length || top.score < 50 || close) {
    return { status: 'ambiguous', ranked: ranked.slice(0, close ? 2 : 3), missingFeatures: findUsefulMissing(pathologies, ranked, answers) }
  }
  return { status: 'strong_match', ranked: ranked.slice(0, 3), leadingId: top.id, missingFeatures: [] }
}

function findUsefulMissing(pathologies, ranked, answers) {
  const candidateIds = new Set(ranked.slice(0, 3).map((item) => item.id))
  const features = pathologies.filter((p) => !candidateIds.size || candidateIds.has(p.id)).flatMap((p) => p.classifier.required.map((r) => r.feature))
  return [...new Set(features.filter((feature) => !isKnown(answers[feature])))]
}

