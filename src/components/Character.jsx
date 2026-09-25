import { resolveCharacterAsset } from '../data/characterAssets'

export function Character({ id, pose = 'default', alt = '', className = '' }) {
  const src = resolveCharacterAsset(id, pose)
  if (!src) return null
  return <img className={`character ${className}`} src={src} alt={alt} loading="lazy" />
}

