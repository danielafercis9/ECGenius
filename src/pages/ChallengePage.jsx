import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/AppShell'
import { ChallengePatient } from '../components/ChallengePatient'
import { Character } from '../components/Character'
import { EcgVideo } from '../components/EcgVideo'
import { Icon } from '../components/Icon'
import { Disclaimer, ProgressBar } from '../components/Shared'
import { challengePatients, challengeWards, getWardByOrder, resolveWardAdmissions } from '../data/challengeData'
import { challengeWardSlots, resolveWardBackground } from '../data/challengeAssets'
import { getPathology, pathologies } from '../data/appData'
import { buildDiagnosisOptions, buildManagementOptions, calculateAccuracy, finalizeReviewAssignments, remainingDiagnosisSeconds, scoreQuestion, treatmentSummary } from '../utils/challenge'
import { loadChallengeState, resetChallengeState, saveChallengeState } from '../utils/challengeStorage'

const patientMap = new Map(challengePatients.map((patient) => [patient.id, patient]))
const emptyWardStats = () => ({ diagnosisAttempts: 0, diagnosisCorrect: 0, managementAttempts: 0, managementCorrect: 0, heartsLost: 0, xpEarned: 0, bonusAwarded: false })

export function ChallengePage() {
  const [game, setGame] = useState(loadChallengeState)
  const [selectedWard, setSelectedWard] = useState(() => game.pendingWardSummary || game.currentWard || game.unlockedWard)
  const [screen, setScreen] = useState(() => game.completed ? 'complete' : game.hearts <= 0 ? 'failure' : game.pendingWardSummary ? 'ward-summary' : game.activeCase ? 'case' : 'hospital')

  const commit = (next) => {
    const saved = saveChallengeState(next)
    setGame(saved)
    return saved
  }
  const restart = () => {
    commit(resetChallengeState(game))
    setSelectedWard(1)
    setScreen('hospital')
  }

  if (!game.noticeAcknowledged) return <ChallengeNotice onStart={() => commit({ ...game, noticeAcknowledged: true })}/>
  if (screen === 'failure' || game.hearts <= 0) return <ChallengeFailure game={game} onRestart={restart}/>
  if (screen === 'complete' || game.completed) return <ChallengeComplete game={game} onReplay={restart}/>
  if (screen === 'ward-summary' && game.pendingWardSummary) return <WardSummary game={game} wardOrder={game.pendingWardSummary} onContinue={() => {
    if (game.pendingWardSummary === 3) {
      commit({ ...game, pendingWardSummary: null, completed: true })
      setScreen('complete')
      return
    }
    const nextWard = game.pendingWardSummary + 1
    commit({ ...game, pendingWardSummary: null, currentWard: nextWard })
    setSelectedWard(nextWard)
    setScreen('hospital')
  }}/>

  const activeAdmission = game.activeCase ? findAdmission(game, game.activeCase.admissionId) : null
  if (screen === 'case' && activeAdmission) return <ChallengeCase game={game} admission={activeAdmission} commit={commit} setScreen={setScreen} setSelectedWard={setSelectedWard}/>

  const openCase = (admission) => {
    if (!admission.pathologyId || game.hearts <= 0) return
    const activeCase = game.activeCase?.admissionId === admission.id ? game.activeCase : {
      admissionId: admission.id, step: 1, diagnosisAttempts: 0, managementAttempts: 0,
      attemptedDiagnosisIds: [], attemptedManagementIds: [], diagnosisComplete: false,
      managementComplete: false, diagnosisDeadline: null, timerExpired: false,
      earnedXp: 0, feedback: null,
    }
    commit({ ...game, activeCase, currentWard: admission.wardOrder, currentEncounter: admission.id })
    setScreen('case')
  }

  return <ChallengeHospital game={game} selectedWard={selectedWard} onSelectWard={setSelectedWard} onOpenCase={openCase} onResume={() => setScreen('case')} onRestart={restart}/>
}

function ChallengeNotice({ onStart }) {
  return <div className="page challenge-page"><PageHeader eyebrow="HOSPITAL CHALLENGE" title="Your ECG shift starts here">Complete three randomized hospital shifts, protect your five hearts, and finish the timed final case.</PageHeader><section className="challenge-notice surface"><Character id="mascotCat" pose="presenting" alt="Dr. Genius welcoming you to the hospital challenge"/><div><span className="step-kicker">BEFORE YOUR SHIFT</span><h2>Ready for 15 unpredictable ECG encounters?</h2><p>Every run reshuffles rhythms and patients. Your assignment stays fixed during the run, so refreshing never changes the cases already waiting for you.</p><aside className="challenge-training-notice"><Icon name="alert"/><strong>Training tool. Does not replace clinical judgment or your institution’s protocols.</strong></aside><button className="button primary" type="button" onClick={onStart}>Start Challenge <Icon name="arrow"/></button></div></section><Disclaimer/></div>
}

function ChallengeHospital({ game, selectedWard, onSelectWard, onOpenCase, onResume, onRestart }) {
  const ward = getWardByOrder(selectedWard) || challengeWards[0]
  const admissions = resolveWardAdmissions(ward, game)
  const completedSet = new Set(game.completedAdmissionIds)
  const wardCompleted = admissions.filter((admission) => completedSet.has(admission.id)).length
  const stats = { ...emptyWardStats(), ...(game.wardStats[ward.id] || {}) }
  return <div className="page challenge-page"><PageHeader eyebrow="HOSPITAL CHALLENGE" title="ECGenius Hospital">Choose a patient directly from the floor. Their identity and position never reveal the rhythm.</PageHeader><ChallengeStatus game={game}/>{game.activeCase && <div className="challenge-resume"><Icon name="alert"/><span>You have an unfinished patient encounter.</span><button className="button secondary" type="button" onClick={onResume}>Resume case</button></div>}<div className="challenge-ward-toolbar"><div className="ward-selector" aria-label="Challenge wards">{challengeWards.map((item) => {
    const locked = item.order > game.unlockedWard
    const complete = resolveWardAdmissions(item, game).filter((admission) => completedSet.has(admission.id)).length
    return <button key={item.id} type="button" className={`${selectedWard === item.order ? 'selected' : ''} ${complete === 5 ? 'completed' : ''}`} disabled={locked} onClick={() => onSelectWard(item.order)} aria-pressed={selectedWard === item.order} aria-label={`${item.title}${locked ? ' — locked' : complete === 5 ? ' — complete' : ` — ${complete} of 5 complete`}`}><span>{locked ? <Icon name="lock"/> : item.order}</span><strong>{item.title}</strong><small>{locked ? 'Locked' : `${complete}/5`}</small></button>
  })}</div><button className="button quiet challenge-restart" type="button" onClick={onRestart}><Icon name="replay"/> Restart Challenge</button></div><section className="ward-environment" aria-labelledby="ward-title"><div className="ward-canvas"><img className="ward-background" src={resolveWardBackground(ward.id)} alt="" aria-hidden="true"/><div className="ward-station-panel"><span>WARD {ward.order}</span><h2 id="ward-title">{ward.title}</h2><div><strong>{wardCompleted}/5</strong><span>{game.hearts} ♥</span><span>{stats.xpEarned} XP</span></div></div>{admissions.map((admission, index) => {
    const completed = completedSet.has(admission.id)
    const active = game.activeCase?.admissionId === admission.id
    const available = !completed && (!game.activeCase || active) && Boolean(admission.pathologyId)
    return <WardPatient key={admission.id} admission={admission} position={challengeWardSlots[ward.id][index]} completed={completed} active={active} available={available} onOpen={() => onOpenCase(admission)}/>
  })}</div><p className="ward-instruction">Select a patient to begin. Completed patients remain on the floor in their celebration pose.</p></section><Disclaimer/></div>
}

function WardPatient({ admission, position, completed, active, available, onOpen }) {
  const patient = patientMap.get(admission.patientId)
  const state = completed ? 'completed' : active ? 'active' : available ? 'available' : 'unavailable'
  const action = completed ? 'completed' : active ? 'resume encounter' : available ? 'start encounter' : 'unavailable'
  return <button type="button" className={`ward-patient ${state}`} style={{ '--patient-x': `${position.x}%`, '--patient-y': `${position.y}%` }} disabled={!available && !active} onClick={onOpen} aria-label={`${patient?.displayName} — ${action}`} aria-pressed={active || undefined}><ChallengePatient id={admission.patientId} pose={completed ? 'success' : 'default'} alt="" decorative/><span className="ward-patient-label"><strong>{patient?.displayName}</strong><small>{completed ? '✓ Complete' : active ? 'Resume encounter' : 'Start encounter'}</small></span>{completed && <span className="ward-patient-check" aria-hidden="true"><Icon name="check"/></span>}</button>
}

function ChallengeCase({ game, admission, commit, setScreen, setSelectedWard }) {
  const ward = getWardByOrder(admission.wardOrder)
  const pathology = getPathology(admission.pathologyId)
  const optionPathology = pathology || pathologies[0]
  const patient = patientMap.get(admission.patientId)
  const active = game.activeCase
  const diagnosisOptions = useMemo(() => buildDiagnosisOptions(optionPathology, pathologies, `${game.runSeed}-${admission.id}`), [optionPathology.id, game.runSeed, admission.id])
  const managementOptions = useMemo(() => buildManagementOptions(optionPathology, pathologies, `${game.runSeed}-${admission.id}`), [optionPathology.id, game.runSeed, admission.id])
  const isFinal = Boolean(admission.finalCase)
  const updateCase = (patch) => commit({ ...game, activeCase: { ...active, ...patch } })

  const answer = (type, optionId, { timedOut = false } = {}) => {
    const isDiagnosis = type === 'diagnosis'
    const completeKey = isDiagnosis ? 'diagnosisComplete' : 'managementComplete'
    const attemptedKey = isDiagnosis ? 'attemptedDiagnosisIds' : 'attemptedManagementIds'
    if (active[completeKey] || (!timedOut && active[attemptedKey].includes(optionId))) return
    const correct = optionId === pathology.id
    const attemptsKey = isDiagnosis ? 'diagnosisAttempts' : 'managementAttempts'
    const attemptNumber = active[attemptsKey] + 1
    const points = correct ? scoreQuestion(attemptNumber) : 0
    const next = recordChallengeAnswer(game, admission, type, correct, points)
    const feedbackText = timedOut ? 'Time expired. Review the strip and try the diagnosis again.' : correct
      ? isDiagnosis ? 'Correct — the ECG clues support this rhythm.' : 'Correct — this management summary matches the ECGenius reference.'
      : isDiagnosis
        ? `Look again at ${pathology.characteristics.slice(0, 2).map((item) => `${item.label.toLowerCase()}: ${item.value}`).join(' and ')}.`
        : String(pathology.recommendations || pathology.treatment).split(/(?<=[.!?])\s+/)[0]
    next.activeCase = { ...next.activeCase, [attemptsKey]: attemptNumber, [attemptedKey]: correct || timedOut ? next.activeCase[attemptedKey] : [...next.activeCase[attemptedKey], optionId], [completeKey]: correct, timerExpired: next.activeCase.timerExpired || timedOut, diagnosisDeadline: correct ? null : next.activeCase.diagnosisDeadline, earnedXp: next.activeCase.earnedXp + points, feedback: { type, correct, text: feedbackText, points, timedOut } }
    commit(next)
    if (next.hearts <= 0) setScreen('failure')
  }

  const completeEncounter = () => commit(completeChallengeEncounter(game, admission))
  const leaveCompletedEncounter = () => {
    const wardComplete = resolveWardAdmissions(ward, game).every((item) => game.completedAdmissionIds.includes(item.id))
    if (wardComplete) {
      commit({ ...game, activeCase: null, currentEncounter: null, pendingWardSummary: ward.order })
      setScreen('ward-summary')
    } else {
      commit({ ...game, activeCase: null, currentEncounter: null })
      setSelectedWard(ward.order)
      setScreen('hospital')
    }
  }

  if (!pathology) return <div className="page challenge-page"><div className="challenge-inline-error surface"><Icon name="alert"/><h1>Case unavailable</h1><p>This Challenge case could not find its rhythm record.</p><button className="button primary" onClick={() => { commit({ ...game, activeCase: null, currentEncounter: null }); setScreen('hospital') }}>Return to hospital</button></div></div>
  return <div className="page challenge-page challenge-case-page"><div className="case-topbar"><button className="button quiet" type="button" onClick={() => setScreen('hospital')}>← Ward floor</button><ChallengeStatus game={game} compact/><span className="case-location">WARD {ward.order} · ENCOUNTER {admission.slotNumber}</span></div><div className="case-progress"><ProgressBar label={`Encounter step ${active.step} of 6`} value={active.step} max={6}/></div><section className={`challenge-case surface ${isFinal ? 'final-case' : ''}`}>{active.step === 1 && <div className="case-intro"><div className="case-patient-stage"><ChallengePatient id={admission.patientId} pose="default" alt={`${patient.displayName} arriving for an ECG review`}/></div><div><span className="step-kicker">PATIENT INTRO</span><h1>{patient.displayName}</h1><p className="case-neutral-copy">A patient is ready for rhythm assessment. Their identity and location provide no diagnostic clue—the ECG is your evidence.</p><button className="button primary" onClick={() => updateCase({ step: 2, feedback: null })}>View ECG monitor <Icon name="arrow"/></button></div></div>}{active.step === 2 && <div className="case-monitor"><div className="screen-heading"><span className="step-kicker">{isFinal ? 'TIMED FINAL CASE' : 'ECG MONITOR'}</span><h1>Read the strip carefully</h1><p>{isFinal ? 'The 30-second countdown begins when you open the diagnosis question.' : 'The rhythm will remain hidden until you answer.'}</p></div><EcgVideo pathologyId={pathology.id} playbackMode="autoplay" preload="auto"/><button className="button primary" onClick={() => updateCase({ step: 3, feedback: null, diagnosisDeadline: isFinal ? Date.now() + 30000 : null, timerExpired: false })}>Identify rhythm <Icon name="arrow"/></button></div>}{active.step === 3 && <ChallengeQuestion type="diagnosis" prompt={`What rhythm does ${patient.displayName} have today?`} options={diagnosisOptions.map((item) => ({ id: item.id, label: item.fullName }))} correctId={pathology.id} active={active} timed={isFinal} videoPathologyId={isFinal ? pathology.id : null} onExpire={() => answer('diagnosis', '__timer_expired__', { timedOut: true })} onAnswer={(id) => answer('diagnosis', id)} onContinue={() => updateCase({ step: 4, feedback: null, diagnosisDeadline: null })}/>} {active.step === 4 && <ChallengeQuestion type="management" prompt="What is the correct initial management?" options={managementOptions} correctId={pathology.id} active={active} onAnswer={(id) => answer('management', id)} onContinue={() => updateCase({ step: 5, feedback: null })}/>} {active.step === 5 && <ChallengeRecap pathology={pathology} onComplete={completeEncounter}/>} {active.step === 6 && <EncounterComplete admission={admission} patient={patient} pathology={pathology} earnedXp={active.earnedXp} isFinal={isFinal} onContinue={leaveCompletedEncounter}/>}</section><Disclaimer/></div>
}

function ChallengeQuestion({ type, prompt, options, correctId, active, timed = false, videoPathologyId, onExpire, onAnswer, onContinue }) {
  const isDiagnosis = type === 'diagnosis'
  const complete = active[isDiagnosis ? 'diagnosisComplete' : 'managementComplete']
  const attempted = active[isDiagnosis ? 'attemptedDiagnosisIds' : 'attemptedManagementIds']
  const feedback = active.feedback?.type === type ? active.feedback : null
  const seconds = useDiagnosisTimer(timed && !complete && !active.timerExpired, active.diagnosisDeadline, onExpire)
  return <div className="challenge-question"><div className="screen-heading"><span className="step-kicker">{timed ? 'FINAL DIAGNOSIS' : isDiagnosis ? 'DIAGNOSIS QUESTION' : 'MANAGEMENT QUESTION'}</span><h1>{prompt}</h1><p>{isDiagnosis ? 'Choose the rhythm that best matches the ECG.' : 'Choose the single summary supported by the ECGenius pathology reference.'}</p>{timed && <div className={`final-timer ${seconds <= 10 ? 'urgent' : ''}`} role="timer" aria-live="polite"><Icon name="challenge"/><strong>{complete ? 'Timer stopped' : active.timerExpired ? 'Time expired' : `${seconds}s`}</strong></div>}</div>{videoPathologyId && <EcgVideo pathologyId={videoPathologyId} playbackMode="autoplay" preload="auto" className="final-diagnosis-video"/>}<div className={`challenge-options ${isDiagnosis ? '' : 'management-options'}`}>{options.map((option, index) => {
    const wasWrong = attempted.includes(option.id)
    const isCorrect = complete && option.id === correctId
    return <button key={option.id} type="button" disabled={complete || wasWrong} className={`${wasWrong ? 'incorrect' : ''} ${isCorrect ? 'correct' : ''}`} onClick={() => onAnswer(option.id)}><span>{isCorrect ? <Icon name="check"/> : wasWrong ? <Icon name="close"/> : String.fromCharCode(65 + index)}</span><strong>{option.label}</strong>{isCorrect && <small>Correct answer</small>}{wasWrong && <small>Try another option</small>}</button>
  })}</div>{feedback && <div className={`challenge-feedback ${feedback.correct ? 'success' : 'error'}`} role="status"><Character id="mascotCat" pose={feedback.correct ? 'celebrating' : 'warning'} alt="" decorative/><div><strong>{feedback.correct ? `Correct! +${feedback.points} XP` : feedback.timedOut ? 'Time expired — one heart lost.' : 'Not quite — one heart lost.'}</strong><p>{feedback.text}</p></div></div>}{complete && <div className="case-next"><button className="button primary" onClick={onContinue}>Continue <Icon name="arrow"/></button></div>}</div>
}

function useDiagnosisTimer(enabled, deadline, onExpire) {
  const [seconds, setSeconds] = useState(() => remainingDiagnosisSeconds(deadline))
  const expiredRef = useRef(false)
  const onExpireRef = useRef(onExpire)
  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])
  useEffect(() => {
    expiredRef.current = false
    if (!enabled || !deadline) return undefined
    const tick = () => {
      const remaining = remainingDiagnosisSeconds(deadline)
      setSeconds(remaining)
      if (remaining === 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpireRef.current()
      }
    }
    tick()
    const timer = window.setInterval(tick, 250)
    return () => window.clearInterval(timer)
  }, [enabled, deadline])
  return seconds
}

function ChallengeRecap({ pathology, onComplete }) {
  return <div className="challenge-recap"><div className="recap-character"><Character id={pathology.characterId} pose="recap" alt="ECGenius doctor reviewing the case"/></div><div><span className="step-kicker">LEARNING RECAP</span><h1>Don’t forget!</h1><h2>{pathology.fullName} <span className="short-badge">{pathology.shortName}</span></h2><ul>{pathology.keyLearningPoints.slice(0, 3).map((point) => <li key={point}><span><Icon name="check"/></span>{point}</li>)}</ul><div className="challenge-management-recap"><strong>Management reference</strong><p>{treatmentSummary(pathology.treatment)}</p></div><button className="button primary" onClick={onComplete}>Complete encounter <Icon name="arrow"/></button></div></div>
}

function EncounterComplete({ admission, patient, pathology, earnedXp, isFinal, onContinue }) {
  return <div className="bed-complete"><div className="success-rays"/><ChallengePatient id={admission.patientId} pose="success" alt={`${patient.displayName} celebrating a completed ECG review`}/><div><span className="step-kicker">ENCOUNTER COMPLETE</span><h1>Patient cared for!</h1><h2>{pathology.fullName}</h2><p>You earned <strong>{earnedXp + (isFinal ? 50 : 0)} XP</strong> from this encounter{isFinal ? ', including the timed-final bonus' : ''}.</p><button className="button primary" onClick={onContinue}>Return to ward <Icon name="arrow"/></button></div></div>
}

function WardSummary({ game, wardOrder, onContinue }) {
  const ward = getWardByOrder(wardOrder)
  const stats = { ...emptyWardStats(), ...(game.wardStats[ward.id] || {}) }
  return <div className="page challenge-page"><PageHeader eyebrow="WARD COMPLETE" title={`${ward.title} complete`}>Five randomized ECG encounters completed. Review your results before continuing.</PageHeader><section className="ward-summary surface"><div className="ward-summary-characters"><Character id="mascotCat" pose="celebrating" alt="Dr. Genius celebrating the completed ward"/></div><div><span className="step-kicker">WARD {ward.order} RESULTS</span><h2>{stats.bonusAwarded ? 'Perfect ward!' : 'Strong work — shift complete!'}</h2><div className="summary-metrics"><article><small>Ward XP</small><strong>{stats.xpEarned}</strong></article><article><small>Diagnosis accuracy</small><strong>{calculateAccuracy(stats.diagnosisCorrect, stats.diagnosisAttempts)}%</strong></article><article><small>Management accuracy</small><strong>{calculateAccuracy(stats.managementCorrect, stats.managementAttempts)}%</strong></article><article><small>Hearts remaining</small><strong>{game.hearts} / 5</strong></article></div>{stats.bonusAwarded && <div className="perfect-bonus"><Icon name="check"/><strong>+25 XP perfect-ward bonus</strong></div>}<button className="button primary" onClick={onContinue}>{ward.order === 3 ? 'Complete Challenge' : `Continue to ${getWardByOrder(ward.order + 1).title}`} <Icon name="arrow"/></button></div></section></div>
}

function ChallengeFailure({ game, onRestart }) {
  return <div className="page challenge-page"><section className="challenge-failure surface"><Character id="mascotCat" pose="warning" alt="Dr. Genius offering encouragement"/><div><span className="step-kicker">SHIFT OVER · 0 HEARTS</span><h1>Shift over. Review your rhythms and try again.</h1><p>You earned {game.xp} XP this run. Restarting creates a fresh randomized assignment with five hearts without changing any other ECGenius progress.</p><button className="button primary" type="button" onClick={onRestart}>Restart Challenge <Icon name="replay"/></button><Link className="button secondary" to="/practice">Review in Practice</Link></div></section></div>
}

function ChallengeComplete({ game, onReplay }) {
  return <div className="page challenge-page"><PageHeader eyebrow="CHALLENGE COMPLETE" title="Your hospital shifts are complete!">You cleared all three wards and finished the timed ECGenius final case.</PageHeader><section className="challenge-complete surface"><div className="celebration-cast"><Character id="doctor01" pose="recap" alt="ECGenius doctor celebrating"/><Character id="doctor02" pose="recap" alt="ECGenius doctor celebrating"/><Character id="mascotCat" pose="celebrating" alt="Dr. Genius celebrating"/><Character id="doctor03" pose="recap" alt="ECGenius doctor celebrating"/></div><div className="challenge-complete-copy"><span className="step-kicker">ALL 15 ENCOUNTERS COMPLETE</span><h2>Outstanding ECG teamwork!</h2><div className="summary-metrics"><article><small>Total Challenge XP</small><strong>{game.xp}</strong></article><article><small>Diagnosis accuracy</small><strong>{calculateAccuracy(game.totals.diagnosisCorrect, game.totals.diagnosisAttempts)}%</strong></article><article><small>Management accuracy</small><strong>{calculateAccuracy(game.totals.managementCorrect, game.totals.managementAttempts)}%</strong></article><article><small>Hearts remaining</small><strong>{game.hearts} / 5</strong></article><article><small>Wards completed</small><strong>3 / 3</strong></article></div><div className="completion-actions"><Link className="button primary" to="/learn">Back to Learn <Icon name="arrow"/></Link><button className="button secondary" onClick={onReplay}>Replay Challenge <Icon name="replay"/></button></div></div></section><Disclaimer/></div>
}

function ChallengeStatus({ game, compact = false }) {
  return <div className={`challenge-status ${compact ? 'compact' : ''}`} aria-label={`${game.hearts} hearts remaining, ${game.xp} XP`}><span className="hearts" aria-label={`${game.hearts} of 5 hearts`}>{Array.from({ length: 5 }, (_, index) => <span key={index} className={index < game.hearts ? 'full' : 'empty'}><Icon name="heart" size={compact ? 18 : 22}/></span>)}</span><strong>{game.xp} XP</strong><span>{game.completedAdmissionIds.length} / 15 encounters</span></div>
}

function findAdmission(game, admissionId) {
  return Object.values(game.wardAssignments || {}).flat().find((item) => item.id === admissionId) || null
}

function recordChallengeAnswer(game, admission, type, correct, points) {
  const wardStats = { ...emptyWardStats(), ...(game.wardStats[admission.wardId] || {}) }
  const attemptsKey = `${type}Attempts`
  const correctKey = `${type}Correct`
  const mistake = { attempts: 0, incorrectDiagnosisCount: 0, incorrectManagementCount: 0, totalMistakes: 0, ...(game.mistakes[admission.pathologyId] || {}) }
  const incorrectKey = type === 'diagnosis' ? 'incorrectDiagnosisCount' : 'incorrectManagementCount'
  return { ...game, hearts: correct ? game.hearts : Math.max(0, game.hearts - 1), xp: game.xp + points, totals: { ...game.totals, [attemptsKey]: game.totals[attemptsKey] + 1, [correctKey]: game.totals[correctKey] + (correct ? 1 : 0) }, wardStats: { ...game.wardStats, [admission.wardId]: { ...wardStats, [attemptsKey]: wardStats[attemptsKey] + 1, [correctKey]: wardStats[correctKey] + (correct ? 1 : 0), heartsLost: wardStats.heartsLost + (correct ? 0 : 1), xpEarned: wardStats.xpEarned + points } }, mistakes: { ...game.mistakes, [admission.pathologyId]: { ...mistake, attempts: mistake.attempts + 1, totalMistakes: mistake.totalMistakes + (correct ? 0 : 1), [incorrectKey]: mistake[incorrectKey] + (correct ? 0 : 1) } } }
}

function completeChallengeEncounter(game, admission) {
  if (game.completedAdmissionIds.includes(admission.id)) return { ...game, activeCase: { ...game.activeCase, step: 6 } }
  const ward = getWardByOrder(admission.wardOrder)
  const completedAdmissionIds = [...game.completedAdmissionIds, admission.id]
  const wardComplete = resolveWardAdmissions(ward, game).every((item) => completedAdmissionIds.includes(item.id))
  const currentStats = { ...emptyWardStats(), ...(game.wardStats[ward.id] || {}) }
  const perfectBonus = wardComplete && currentStats.heartsLost === 0 && !currentStats.bonusAwarded ? 25 : 0
  const finalBonus = admission.finalCase ? 50 : 0
  let next = { ...game, completedAdmissionIds, xp: game.xp + perfectBonus + finalBonus, unlockedWard: wardComplete ? Math.min(3, Math.max(game.unlockedWard, ward.order + 1)) : game.unlockedWard, wardStats: { ...game.wardStats, [ward.id]: { ...currentStats, xpEarned: currentStats.xpEarned + perfectBonus + finalBonus, bonusAwarded: currentStats.bonusAwarded || perfectBonus > 0 } }, activeCase: { ...game.activeCase, step: 6, feedback: null, diagnosisDeadline: null } }
  if (ward.order === 2 && wardComplete) next = finalizeReviewAssignments(next)
  return next
}
