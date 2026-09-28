import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { pathologies } from '../data/appData'
import { getRhythmVideoSrc } from './video'

describe('local ECG video library', () => {
  it('derives a GitHub-Pages-safe path from a pathology ID', () => {
    expect(getRhythmVideoSrc('sinus-bradycardia')).toMatch(/videos\/sinus-bradycardia\.mp4$/)
    expect(getRhythmVideoSrc('sinus-bradycardia')).not.toMatch(/^[A-Za-z]:\\/)
  })

  it('contains one matching MP4 for every pathology ID', () => {
    for (const pathology of pathologies) {
      expect(existsSync(join(process.cwd(), 'assets', 'videos', `${pathology.id}.mp4`)), pathology.id).toBe(true)
    }
  })
})
