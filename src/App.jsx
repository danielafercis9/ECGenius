import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { LearnPage } from './pages/LearnPage'
import { LessonPage } from './pages/LessonPage'
import { PracticePage } from './pages/PracticePage'
import { PredictPage } from './pages/PredictPage'
import { GuidePage } from './pages/GuidePage'
import { ChallengePage } from './pages/ChallengePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { dataValidationErrors } from './data/appData'

export default function App() {
  if (dataValidationErrors.length) return <div className="fatal-error"><h1>ECGenius data could not be loaded</h1><ul>{dataValidationErrors.map((error) => <li key={error}>{error}</li>)}</ul></div>
  return <Routes><Route element={<AppShell/>}><Route index element={<Navigate to="/learn" replace/>}/><Route path="learn" element={<LearnPage/>}/><Route path="learn/:pathologyId" element={<LessonPage/>}/><Route path="practice" element={<PracticePage/>}/><Route path="predict" element={<PredictPage/>}/><Route path="challenge" element={<ChallengePage/>}/><Route path="guide" element={<GuidePage/>}/><Route path="*" element={<NotFoundPage/>}/></Route></Routes>
}

