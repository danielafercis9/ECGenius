import { useEffect, useMemo, useState } from 'react'
import { modules, pathologies, getModule, getPathology } from '../data/appData'
import { useApp } from '../context/AppContext'
import { PageHeader } from '../components/AppShell'
import { Character } from '../components/Character'
import { Icon } from '../components/Icon'
import { Disclaimer, EmptyValue, VideoPanel } from '../components/Shared'
import { Tabs } from '../components/Tabs'

const infoTabs = [
  { id: 'characteristics', label: 'ECG Characteristics' },
  { id: 'symptoms', label: 'Symptoms' },
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'treatment', label: 'Treatment' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'keyPoints', label: 'Key Points' },
]

export function PracticePage() {
  const { appState, savePractice } = useApp()
  const initial = getPathology(appState.practicePathologyId) || getPathology(getModule(appState.practiceModuleId)?.pathologyIds[0]) || pathologies[0]
  const [selectedId, setSelectedId] = useState(initial.id)
  const [activeInfo, setActiveInfo] = useState('characteristics')
  const [query, setQuery] = useState('')
  const pathology = getPathology(selectedId)
  const module = getModule(pathology.moduleId)
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return pathologies.filter((p) => `${p.fullName} ${p.shortName} ${p.definition}`.toLowerCase().includes(needle)).slice(0, 8)
  }, [query])

  useEffect(() => savePractice(pathology.moduleId, pathology.id), [pathology.id])
  const selectModule = (moduleId) => { setSelectedId(getModule(moduleId).pathologyIds[0]); setActiveInfo('characteristics') }
  const choosePathology = (id) => { setSelectedId(id); setQuery(''); setActiveInfo('characteristics') }
  const index = pathologies.findIndex((p) => p.id === selectedId)

  return <div className="page practice-page">
    <PageHeader eyebrow="REFERENCE LIBRARY" title="Practice & Review" actions={<label className="module-select"><span>Module</span><select value={module.id} onChange={(e) => selectModule(e.target.value)}>{modules.map((item) => <option value={item.id} key={item.id}>{item.order}. {item.title}</option>)}</select></label>}>Browse all 27 rhythms from one fast, data-driven reference center.</PageHeader>
    <div className="practice-tools"><div className="search-wrap"><Icon name="search"/><label className="sr-only" htmlFor="practice-search">Search rhythms</label><input id="practice-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by rhythm, abbreviation, or keyword…"/>{query && <div className="search-results">{results.length ? results.map((result) => <button key={result.id} onClick={() => choosePathology(result.id)}><span><strong>{result.fullName}</strong><small>{result.shortName} · Module {result.moduleId.at(-1)}</small></span><Icon name="arrow"/></button>) : <p>No matching rhythms found.</p>}</div>}</div></div>
    <Tabs ariaLabel="Pathologies in selected module" tabs={module.pathologyIds.map((id) => ({ id, label: getPathology(id).shortName }))} active={pathology.id} onChange={choosePathology}/>
    <section className="practice-hero"><div className="practice-character"><Character id={pathology.characterId} pose="default" alt={`${pathology.fullName} representative doctor`}/><span>{pathology.order.toString().padStart(2, '0')}</span></div><div><span className="step-kicker">MODULE {module.order} · {module.title}</span><h1>{pathology.fullName}</h1><span className="short-badge">{pathology.shortName}</span><p>{pathology.definition}</p></div></section>
    <div className="preview-layout"><section className="surface"><div className="section-title"><div><span className="eyebrow">RHYTHM DISPLAY</span><h2>ECG Preview</h2></div><span className="live-badge"><i/> Video with sound</span></div><VideoPanel pathology={pathology}/></section><aside className="quick-facts"><span className="eyebrow">QUICK LOOK</span><h2>Key pattern</h2>{pathology.characteristics.slice(0, 4).map((item) => <div key={item.label}><small>{item.label}</small><strong>{item.value}</strong></div>)}</aside></div>
    <section className="reference-panel"><Tabs ariaLabel="Pathology information" tabs={infoTabs} active={activeInfo} onChange={setActiveInfo}/><div className="reference-content" role="tabpanel"><InfoContent pathology={pathology} active={activeInfo}/></div></section>
    {pathology.relatedRhythmIds.length > 0 && <section className="related"><h2>Related rhythms</h2><div>{pathology.relatedRhythmIds.map((id) => { const related = getPathology(id); return related && <button key={id} onClick={() => choosePathology(id)}>{related.fullName}<Icon name="arrow"/></button> })}</div></section>}
    <div className="previous-next"><button disabled={index === 0} onClick={() => choosePathology(pathologies[index - 1].id)}>← <span>Previous<br/><strong>{index > 0 && pathologies[index - 1].shortName}</strong></span></button><span>{index + 1} / {pathologies.length}</span><button disabled={index === pathologies.length - 1} onClick={() => choosePathology(pathologies[index + 1].id)}><span>Next<br/><strong>{index < pathologies.length - 1 && pathologies[index + 1].shortName}</strong></span> →</button></div>
    <Disclaimer/>
  </div>
}

function InfoContent({ pathology, active }) {
  if (active === 'characteristics') return <div className="characteristics-grid">{pathology.characteristics.map((item) => <article key={item.label}><span>{item.label}</span><p>{item.value}</p></article>)}</div>
  if (active === 'keyPoints') return <ul className="key-points">{pathology.keyLearningPoints.map((point) => <li key={point}><span><Icon name="check"/></span>{point}</li>)}</ul>
  const value = active === 'symptoms' ? pathology.symptoms : pathology[active]
  return value ? <div className="prose-card"><h2>{infoTabs.find((tab) => tab.id === active)?.label}</h2><p>{value}</p></div> : <EmptyValue/>
}
