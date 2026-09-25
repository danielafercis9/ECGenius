import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { pathologies } from '../data/appData'
import { completeLesson, loadAppState, saveAppState } from '../utils/storage'

const AppContext = createContext(null)

function getInitialTheme() {
  const saved = localStorage.getItem('ecgenius-theme')
  return saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

export function AppProvider({ children }) {
  const [appState, setAppState] = useState(loadAppState)
  const [theme, setTheme] = useState(getInitialTheme)
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])

  const toggleTheme = () => setTheme((current) => {
    const next = current === 'dark' ? 'light' : 'dark'
    localStorage.setItem('ecgenius-theme', next)
    return next
  })
  const markComplete = (id) => setAppState(completeLesson(id))
  const rememberLesson = (id) => setAppState(saveAppState({ lastLessonId: id }))
  const savePractice = (moduleId, pathologyId) => setAppState(saveAppState({ practiceModuleId: moduleId, practicePathologyId: pathologyId }))
  const completedIds = useMemo(() => new Set(appState.completedIds.filter((id) => pathologies.some((p) => p.id === id))), [appState.completedIds])
  return <AppContext.Provider value={{ appState, completedIds, theme, toggleTheme, markComplete, rememberLesson, savePractice }}>{children}</AppContext.Provider>
}

export function useApp() { return useContext(AppContext) }

