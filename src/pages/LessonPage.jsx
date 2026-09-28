import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPathology, getPathologyByName, pathologies } from '../data/appData'
import { useApp } from '../context/AppContext'
import { Character } from '../components/Character'
import { EcgVideo } from '../components/EcgVideo'
import { Icon } from '../components/Icon'
import { Disclaimer, ProgressBar } from '../components/Shared'
import { preloadRhythmVideo } from '../utils/video'

export function LessonPage() {
  const { pathologyId } = useParams()
  const pathology = getPathology(pathologyId)
  const navigate = useNavigate()
  const { completedIds, markComplete, rememberLesson } = useApp()
  const [step, setStep] = useState(1)
  const [answer, setAnswer] = useState(null)
  const [matched, setMatched] = useState([])
  const [selectedLabel, setSelectedLabel] = useState(null)
  const [matchMessage, setMatchMessage] = useState('')

  useEffect(() => { if (pathology) rememberLesson(pathology.id) }, [pathology?.id])
  useEffect(() => { setStep(1); setAnswer(null); setMatched([]); setSelectedLabel(null) }, [pathologyId])
  useEffect(() => {
    if (!pathology) return
    const nextPathology = pathologies[pathology.order]
    if (nextPathology) preloadRhythmVideo(nextPathology.id, 'metadata')
  }, [pathology?.id])

  const quizOptions = useMemo(() => pathology ? [pathology, ...pathology.quiz_distractors.map(getPathologyByName).filter(Boolean)].sort((a, b) => a.id.localeCompare(b.id)) : [], [pathology])
  const matchPairs = useMemo(() => pathology ? pathology.characteristics.slice(0, 6).map((item, index) => ({ ...item, id: `${index}-${item.label}` })) : [], [pathology])
  const shuffledValues = useMemo(() => [...matchPairs].sort((a, b) => b.value.localeCompare(a.value)), [matchPairs])

  if (!pathology) return <InvalidLesson/>
  const correct = answer === pathology.id
  const canContinue = step === 1 ? answer : step === 3 ? matched.length === matchPairs.length : true

  const next = () => {
    if (step === 5) return
    setStep((value) => value + 1)
  }
  const chooseValue = (pair) => {
    if (!selectedLabel || matched.includes(pair.id)) return
    if (selectedLabel === pair.id) {
      setMatched((current) => [...current, pair.id]); setSelectedLabel(null); setMatchMessage('Matched! Nice work.')
    } else { setMatchMessage('Not quite — compare the label and finding, then try again.') }
  }
  useEffect(() => { if (step === 5 && !completedIds.has(pathology.id)) markComplete(pathology.id) }, [step, pathology.id])

  return <div className="page lesson-page">
    <div className="lesson-top"><Link to="/learn" className="quiet-link">← Exit lesson</Link><div className="lesson-progress"><ProgressBar label={`Lesson step ${step} of 5`} value={step} max={5}/></div><span className="lesson-short">{pathology.shortName}</span></div>
    <section className="lesson-card">
      {step === 1 && <div className="lesson-screen recognize"><div className="screen-heading"><span className="step-kicker">STEP 1 · RECOGNIZE</span><h1>What rhythm do you see?</h1><p>Watch the rhythm display, then choose the best match.</p></div><EcgVideo pathologyId={pathology.id} playbackMode="autoplay" preload="auto"/><div className="answer-grid">{quizOptions.map((option, index) => <button key={option.id} className={`answer-option ${answer === option.id ? (option.id === pathology.id ? 'correct' : 'incorrect') : ''}`} onClick={() => !answer && setAnswer(option.id)} disabled={Boolean(answer)}><span>{String.fromCharCode(65 + index)}</span><strong>{option.fullName}</strong>{answer === option.id && <Icon name={option.id === pathology.id ? 'check' : 'close'}/>}</button>)}</div>{answer && <div className={`feedback ${correct ? 'success' : 'error'}`} role="status"><Icon name={correct ? 'check' : 'alert'}/><div><strong>{correct ? 'Correct!' : 'Not quite.'}</strong><p>{correct ? pathology.keyLearningPoints[0] : `Look again at the defining pattern: ${pathology.keyLearningPoints[0]}`}</p></div></div>}</div>}
      {step === 2 && <div className="lesson-screen meet"><div className="character-stage"><span className="spark one">✦</span><Character id={pathology.characterId} pose="presenting" alt={`${pathology.fullName} representative doctor`}/><span className="spark two">✦</span></div><div className="reading-content"><span className="step-kicker">STEP 2 · MEET THE RHYTHM</span><h1>{pathology.fullName}</h1><span className="short-badge">{pathology.shortName}</span><p>{pathology.definition}</p></div></div>}
      {step === 3 && <div className="lesson-screen matching"><div className="screen-heading"><span className="step-kicker">STEP 3 · MATCH THE CLUES</span><h1>Pair each ECG characteristic</h1><p>Select a parameter, then its matching finding.</p></div><div className="matching-board"><div>{matchPairs.map((pair) => { const isMatched = matched.includes(pair.id); return <button key={pair.id} disabled={isMatched} className={`${selectedLabel === pair.id ? 'selected ' : ''}${isMatched ? 'matched' : ''}`} onClick={() => setSelectedLabel(pair.id)}>{isMatched && <Icon name="check" size={18}/>}<span>{pair.label}</span></button> })}</div><div>{shuffledValues.map((pair) => { const isMatched = matched.includes(pair.id); return <button key={pair.id} disabled={isMatched} className={isMatched ? 'matched' : ''} onClick={() => chooseValue(pair)}>{isMatched && <Icon name="check" size={18}/>}<span>{pair.value}</span></button> })}</div></div><p className="match-status" role="status">{matchMessage || `${matched.length} of ${matchPairs.length} pairs matched`}</p></div>}
      {step === 4 && <div className="lesson-screen clinical"><div className="screen-heading"><span className="step-kicker">STEP 4 · CLINICAL PICTURE</span><h1>Connect the rhythm to the patient</h1></div><div className="clinical-grid">{[['Symptoms', pathology.symptoms], ['ECG interpretation', pathology.diagnosis], ['Treatment', pathology.treatment], ['Recommendations', pathology.recommendations]].map(([title, content], index) => <article key={title}><span className={`section-index color-${index}`}>{String(index + 1).padStart(2, '0')}</span><h2>{title}</h2><p>{content || 'Information not available.'}</p></article>)}</div><Disclaimer/></div>}
      {step === 5 && <div className="lesson-screen recap"><div className="recap-character"><Character id={pathology.characterId} pose="recap" alt={`${pathology.fullName} representative doctor sharing a reminder`}/></div><div><span className="step-kicker">LESSON COMPLETE · +20 XP</span><h1>Don’t forget!</h1><p className="recap-name">{pathology.fullName}</p><ul>{pathology.keyLearningPoints.slice(0, 5).map((point) => <li key={point}><span><Icon name="check"/></span>{point}</li>)}</ul><div className="completion-actions"><button className="button primary" onClick={() => navigate('/learn')}>Continue path <Icon name="arrow"/></button><button className="button secondary" onClick={() => { setStep(1); setAnswer(null); setMatched([]) }}>Review lesson</button></div></div></div>}
      {step < 5 && <footer className="lesson-footer"><button className="button quiet" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))}>Back</button><button className="button primary" disabled={!canContinue} onClick={next}>Continue <Icon name="arrow"/></button></footer>}
    </section>
  </div>
}

function InvalidLesson() {
  return <div className="center-state"><Character id="doctor01" pose="error404" alt="Doctor looking for a missing rhythm"/><h1>Rhythm not found</h1><p>This lesson is not in the ECGenius course.</p><Link className="button primary" to="/learn">Back to Learn</Link></div>
}
