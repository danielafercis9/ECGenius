import { Character } from './Character'
import { Icon } from './Icon'

export function ProgressBar({ value, max, label }) {
  const percent = max ? Math.round((value / max) * 100) : 0
  return <div className="progress-wrap" aria-label={`${label}: ${value} of ${max}`}><div className="progress-meta"><span>{label}</span><strong>{value} / {max}</strong></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div></div>
}

export function Disclaimer() {
  return <aside className="disclaimer"><Icon name="alert"/><p><strong>Educational use only.</strong> ECGenius is an educational simulation only. It is not a substitute for professional clinical diagnosis, medical advice, or treatment.</p></aside>
}

export function LoadingState({ compact = false, label = 'Loading ECGenius…' }) {
  return <div className={`loading-state ${compact ? 'compact' : ''}`} role="status"><Character id="doctor02" pose="loading" alt="Doctor preparing learning materials"/><div><div className="loading-dots"><span/><span/><span/></div><p>{label}</p></div></div>
}

export function EmptyValue() { return <p className="muted">Information not available.</p> }

export function CharacterCallout({ pose = 'presenting', children, title, id = 'mascotCat' }) {
  return <div className="character-callout"><Character id={id} pose={pose} alt=""/><div><strong>{title}</strong><p>{children}</p></div></div>
}
