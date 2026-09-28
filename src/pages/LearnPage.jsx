import { Link } from 'react-router-dom'
import { modules, pathologies, totalLessons } from '../data/appData'
import { useApp } from '../context/AppContext'
import { PageHeader } from '../components/AppShell'
import { Character } from '../components/Character'
import { Icon } from '../components/Icon'
import { ProgressBar } from '../components/Shared'
import { learnPathDecorations } from '../data/learnPathDecorations'
import { resolveExactCharacterAsset } from '../data/characterAssets'

export function LearnPage() {
  const { completedIds, appState } = useApp()
  const currentIndex = Math.min(pathologies.findIndex((p) => !completedIds.has(p.id)), pathologies.length - 1)
  return <div className="page learn-page">
    <section className="hero-band">
      <div><span className="hero-pill">Your ECG learning path</span><h1>Master every rhythm,<br/><em>one beat at a time.</em></h1><p>Learn the clues, match the pattern, and build lasting ECG confidence.</p><Link className="button primary" to={`/learn/${appState.lastLessonId || pathologies[Math.max(0, currentIndex)]?.id}`}>{appState.lastLessonId ? 'Continue learning' : 'Start learning'} <Icon name="arrow"/></Link></div>
      <Character id="mascotCat" pose="presenting" alt="ECGenius cat doctor welcoming you"/>
    </section>
    <div className="learn-heading"><PageHeader eyebrow="COURSE PATH" title="Your rhythm journey">Complete lessons in order. Every node opens a reusable five-step lesson.</PageHeader><div className="course-progress-card"><ProgressBar label="Course progress" value={completedIds.size} max={totalLessons}/></div></div>
    <div className="learning-path">
      {modules.map((module) => <section className="module-section" key={module.id}>
        <div className="module-banner"><div className="module-number">{module.order}</div><div><span>MODULE {module.order}</span><h2>{module.title}</h2><p>{module.description}</p></div><strong>{module.pathologyIds.length} lessons</strong></div>
        <ol className="node-list">
          {module.pathologyIds.map((id) => {
            const pathology = pathologies.find((p) => p.id === id)
            const completed = completedIds.has(id)
            const available = pathology.order === 1 || completedIds.has(pathologies[pathology.order - 2]?.id)
            const current = !completed && pathology.order - 1 === currentIndex
            const state = completed ? 'completed' : current ? 'current' : available ? 'available' : 'locked'
            const decoration = learnPathDecorations.find((item) => item.anchorPathologyId === id)
            return <li key={id} className={`node-row offset-${(pathology.order - 1) % 3}`}>
              <div className="node-connector"/>
              {decoration && <PathDecoration decoration={decoration}/>}
              {available || completed ? <Link className={`lesson-node ${state}`} to={`/learn/${id}`} aria-label={`${pathology.fullName}, ${state}`}><span className="node-order">{completed ? <Icon name="check"/> : pathology.order}</span><span className="node-label">{current ? 'CURRENT' : completed ? 'COMPLETE' : 'AVAILABLE'}</span><span className="node-popover"><strong>{pathology.fullName}</strong><small>{pathology.shortName}</small><b>{completed ? 'Review lesson' : 'Start lesson'} →</b></span></Link> : <button className="lesson-node locked" disabled aria-label={`${pathology.fullName}, locked`}><span className="node-order"><Icon name="lock"/></span><span className="node-label">LOCKED</span><span className="node-popover"><strong>{pathology.fullName}</strong><small>Complete the previous lesson to unlock.</small></span></button>}
            </li>
          })}
        </ol>
      </section>)}
      <section className="challenge-node"><Character id="mascotCat" pose="celebrating" alt="ECGenius mascot celebrating"/><div><span>FINAL CHALLENGE</span><h2>Identify the ECG</h2><p>Put all 27 rhythm patterns to the test.</p><Link className="button accent" to="/challenge">View challenge <Icon name="arrow"/></Link></div></section>
    </div>
  </div>
}

function PathDecoration({ decoration }) {
  if (!resolveExactCharacterAsset(decoration.characterId, decoration.pose)) return null
  return <div className={`path-decoration side-${decoration.side}`}><Character id={decoration.characterId} pose={decoration.pose} decorative/></div>
}
