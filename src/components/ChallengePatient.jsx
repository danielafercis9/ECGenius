import { useEffect, useState } from 'react'
import { resolvePatientAsset } from '../data/challengeAssets'

export function ChallengePatient({ id, pose = 'default', alt, className = '', decorative = false }) {
  const [failed, setFailed] = useState(false)
  const src = resolvePatientAsset(id, pose)
  useEffect(() => setFailed(false), [src])

  if (!src || failed) {
    return <div className={`challenge-patient-placeholder ${className}`} aria-label={decorative ? undefined : (alt || `${id} illustration unavailable`)} aria-hidden={decorative || undefined}><span>{id}</span></div>
  }

  return <img className={`challenge-patient ${className}`} src={src} alt={decorative ? '' : alt} aria-hidden={decorative || undefined} draggable="false" onError={() => setFailed(true)}/>
}
