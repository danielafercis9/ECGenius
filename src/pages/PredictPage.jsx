import { useMemo, useState } from 'react'
import { classifierSchema, getPathology, pathologies } from '../data/appData'
import { classifyRhythm } from '../utils/classifier'
import { PageHeader } from '../components/AppShell'
import { Character } from '../components/Character'
import { Icon } from '../components/Icon'
import { Disclaimer, VideoPanel } from '../components/Shared'
import { Tabs } from '../components/Tabs'

const humanize = (value) => value.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const resultTabs = [
  { id: 'definition', label: 'Definition' },
  { id: 'interpretation', label: 'Why It Matches' },
  { id: 'symptoms', label: 'Symptoms' },
  { id: 'treatment', label: 'Treatment' },
  { id: 'recommendations', label: 'Recommendations' },
]

export function PredictPage() {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [errors, setErrors] = useState([])
  const [activeTab, setActiveTab] = useState('definition')
  const [showConditional, setShowConditional] = useState(false)
  const schema = classifierSchema.inputs.filter((input) => !input.conditional || showConditional)
  const inputMap = useMemo(() => new Map(classifierSchema.inputs.map((input) => [input.id, input])), [])
  const update = (id, value) => setAnswers((current) => ({ ...current, [id]: value }))
  const reset = () => { setAnswers({}); setResult(null); setErrors([]); setActiveTab('definition'); setShowConditional(false) }
  const submit = (event) => {
    event.preventDefault()
    const missing = classifierSchema.inputs.filter((input) => input.required && !answers[input.id]).map((input) => input.id)
    if (missing.length) { setErrors(missing); setResult({ status: 'insufficient_or_inconsistent', ranked: [], missingFeatures: missing }); return }
    setErrors([]); setResult(classifyRhythm(pathologies, answers)); setActiveTab('definition')
  }
  const top = result?.ranked?.[0]
  const leading = top && getPathology(top.id)
  const mascotPose = !result ? 'default' : result.status === 'strong_match' ? 'celebrating' : 'warning'

  return <div className="page predict-page">
    <PageHeader eyebrow="EDUCATIONAL PATTERN MATCHER" title="Predict the rhythm">Enter the characteristics you observe. ECGenius compares them with the classifier rules in the pathology dataset—it does not analyze a clinical ECG.</PageHeader>
    <Disclaimer/>
    <div className="predict-grid">
      <div><form className="predict-form surface" onSubmit={submit} noValidate><div className="section-title"><div><span className="eyebrow">INPUT PANEL</span><h2>ECG characteristics</h2></div><span className="form-step">{Object.values(answers).filter(Boolean).length} answered</span></div><div className="field-grid">{schema.map((input) => <ClassifierField key={input.id} input={input} value={answers[input.id] || ''} onChange={(value) => update(input.id, value)} error={errors.includes(input.id)}/>)}</div><button type="button" className="conditional-toggle" onClick={() => setShowConditional((value) => !value)}>{showConditional ? 'Hide' : 'Add'} pause & conduction details <span>{showConditional ? '−' : '+'}</span></button><div className="form-actions"><button className="button primary" type="submit">Predict pattern <Icon name="predict"/></button><button className="button secondary" type="button" onClick={reset}>Reset</button></div></form><div className="predict-mascot"><Character id="mascotCat" pose={mascotPose} alt="ECGenius mascot supporting the classifier"/><div><strong>{!result ? 'Ready when you are!' : result.status === 'strong_match' ? 'Pattern found!' : 'Let’s review the clues.'}</strong><p>{!result ? 'Complete the required fields, then compare the pattern.' : result.status === 'strong_match' ? 'The entered characteristics align with one leading educational pattern.' : 'Some inputs are missing, conflicting, or shared by multiple rhythms.'}</p></div></div></div>
      <section className="prediction-panel surface" aria-live="polite"><span className="eyebrow">PREDICTION RESULT</span>{!result && <div className="result-empty"><div className="rhythm-orbit"><span/><Icon name="heart" size={34}/></div><h2>Your result will appear here</h2><p>Complete the ECG characteristics and select <strong>Predict pattern</strong>.</p></div>}{result && <Result result={result} pathology={leading} inputMap={inputMap} activeTab={activeTab} setActiveTab={setActiveTab} onReset={reset}/>}</section>
    </div>
  </div>
}

function ClassifierField({ input, value, onChange, error }) {
  const id = `field-${input.id}`
  if (input.type === 'number_or_unmeasurable') return <fieldset className={`field ${error ? 'has-error' : ''}`}><legend>{input.label}{input.required && <span> *</span>}</legend><div className="number-special"><input id={id} type="number" min="0" inputMode="numeric" value={value === 'unmeasurable' ? '' : value} disabled={value === 'unmeasurable'} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 75"/><span>{input.unit}</span><label><input type="checkbox" checked={value === 'unmeasurable'} onChange={(e) => onChange(e.target.checked ? 'unmeasurable' : '')}/> Unmeasurable</label></div>{error && <small role="alert">This required characteristic is missing.</small>}</fieldset>
  return <label className={`field ${error ? 'has-error' : ''}`} htmlFor={id}><span>{input.label}{input.required && <b> *</b>}</span><select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error}><option value="">Select a finding…</option>{input.options.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}</select>{error && <small role="alert">This required characteristic is missing.</small>}</label>
}

function Result({ result, pathology, inputMap, activeTab, setActiveTab, onReset }) {
  if (result.status === 'insufficient_or_inconsistent') return <div className="no-result"><Icon name="alert" size={38}/><h2>Insufficient or inconsistent information</h2><p>Review the required characteristics before asking ECGenius to compare patterns.</p><MissingList result={result} inputMap={inputMap}/><button className="button secondary" onClick={onReset}>Try another rhythm</button></div>
  if (!pathology) return null
  const top = result.ranked[0]
  return <div className="result-content"><div className={`result-status ${result.status}`}><span>{result.status === 'strong_match' ? 'STRONG PATTERN MATCH' : 'AMBIGUOUS · MORE INFORMATION NEEDED'}</span><h2>{result.status === 'strong_match' ? 'Pattern most consistent with' : 'Leading possible matches'}</h2></div>{result.status === 'strong_match' ? <div className="result-title"><div><h3>{pathology.fullName}</h3><span className="short-badge">{pathology.shortName}</span></div><strong>{top.score}<small>/100</small><em>Pattern match score</em></strong></div> : <><div className="candidate-list">{result.ranked.map((candidate) => { const p = getPathology(candidate.id); return <div key={candidate.id}><span><strong>{p.fullName}</strong><small>{p.shortName}</small></span><b>{candidate.score}/100</b></div> })}</div><MissingList result={result} inputMap={inputMap}/></>}
    <VideoPanel pathology={pathology}/><div className="why-box"><h3>Why this prediction?</h3>{[...top.matchedRequired, ...top.matchedSupporting].length ? <ul>{[...top.matchedRequired, ...top.matchedSupporting].map((rule) => <li key={`${rule.feature}-${rule.explanation}`}><Icon name="check"/><span><strong>{inputMap.get(rule.feature)?.label}</strong>{rule.explanation}</span></li>)}</ul> : <p>More matched criteria are needed.</p>}{top.ambiguityNote && <p className="ambiguity-note">{top.ambiguityNote}</p>}</div>
    <Tabs tabs={resultTabs} active={activeTab} onChange={setActiveTab} ariaLabel="Prediction information"/><div className="result-tab" role="tabpanel">{activeTab === 'interpretation' ? pathology.diagnosis : activeTab === 'symptoms' ? pathology.symptoms : pathology[activeTab]}</div><button className="button secondary full" onClick={onReset}>Try another rhythm</button><p className="score-note">Scores compare matched supporting rule weights. They are not probability, confidence, diagnostic accuracy, or the chance a patient has this rhythm.</p></div>
}

function MissingList({ result, inputMap }) {
  if (!result.missingFeatures?.length) return null
  return <div className="missing-list"><strong>Review or add:</strong><ul>{result.missingFeatures.slice(0, 4).map((id) => <li key={id}>{inputMap.get(id)?.label || humanize(id)}</li>)}</ul></div>
}

