const KEY = 'ecgenius-state-v1'
const defaultState = { version: 1, completedIds: [], lastLessonId: null, practiceModuleId: 'module-1', practicePathologyId: null }

export function loadAppState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!parsed || parsed.version !== 1) return { ...defaultState }
    return { ...defaultState, ...parsed, completedIds: [...new Set(Array.isArray(parsed.completedIds) ? parsed.completedIds : [])] }
  } catch { return { ...defaultState } }
}

export function saveAppState(patch) {
  const next = { ...loadAppState(), ...patch, version: 1 }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* Continue in-memory when storage is unavailable. */ }
  return next
}

export function completeLesson(id) {
  const state = loadAppState()
  return saveAppState({ completedIds: mergeCompletedIds(state.completedIds, id), lastLessonId: id })
}

export function mergeCompletedIds(completedIds, id) {
  return [...new Set([...(Array.isArray(completedIds) ? completedIds : []), id])]
}

export const storageKey = KEY
