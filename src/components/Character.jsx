import { resolveCharacterAsset } from '../data/characterAssets'

export function Character({ id, pose = 'default', alt = '', className = '', decorative = false }) {
  const src = resolveCharacterAsset(id, pose)
  if (!src) return null
  return <img className={`character ${className}`} src={src} alt={decorative ? '' : alt} aria-hidden={decorative || undefined} draggable="false" loading="lazy" onError={(event) => { event.currentTarget.hidden = true }} />
}
