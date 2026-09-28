const preloadedVideos = new Map()

export function getRhythmVideoSrc(pathologyId) {
  if (!pathologyId) return null
  return `${import.meta.env.BASE_URL}videos/${pathologyId}.mp4`
}

export function preloadRhythmVideo(pathologyId, preload = 'metadata') {
  const src = getRhythmVideoSrc(pathologyId)
  if (!src || typeof document === 'undefined' || preloadedVideos.has(src)) return

  const video = document.createElement('video')
  video.preload = preload
  video.src = src
  video.load()
  preloadedVideos.set(src, video)

  // Keep only a small rolling window; the course should never preload all 27 clips.
  if (preloadedVideos.size > 3) {
    const oldestSrc = preloadedVideos.keys().next().value
    const oldestVideo = preloadedVideos.get(oldestSrc)
    oldestVideo?.removeAttribute('src')
    oldestVideo?.load()
    preloadedVideos.delete(oldestSrc)
  }
}
