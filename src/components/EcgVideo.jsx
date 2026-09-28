import { useCallback, useEffect, useRef, useState } from 'react'
import { getRhythmVideoSrc } from '../utils/video'
import { Character } from './Character'
import { Icon } from './Icon'

export function EcgVideo({ pathologyId, playbackMode = 'manual', preload = 'metadata', className = '' }) {
  const videoRef = useRef(null)
  const loadingTimerRef = useRef(null)
  const autoplayAttemptedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [showLoading, setShowLoading] = useState(false)
  const [error, setError] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [started, setStarted] = useState(false)
  const src = getRhythmVideoSrc(pathologyId)

  const stopLoadingTimer = useCallback(() => {
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current)
    loadingTimerRef.current = null
  }, [])

  const markReady = useCallback(() => {
    stopLoadingTimer()
    setReady(true)
    setShowLoading(false)
  }, [stopLoadingTimer])

  useEffect(() => {
    const video = videoRef.current
    autoplayAttemptedRef.current = false
    setReady(false)
    setShowLoading(false)
    setError(false)
    setPlaying(false)
    setStarted(false)
    stopLoadingTimer()
    loadingTimerRef.current = window.setTimeout(() => setShowLoading(true), 180)

    if (video) {
      video.pause()
      video.currentTime = 0
      video.load()
    }

    return () => {
      stopLoadingTimer()
      if (video) {
        video.pause()
        video.currentTime = 0
      }
    }
  }, [src, stopLoadingTimer])

  useEffect(() => {
    const video = videoRef.current
    if (!ready || error || playbackMode !== 'autoplay' || autoplayAttemptedRef.current || !video) return
    autoplayAttemptedRef.current = true
    video.muted = false
    setMuted(false)
    video.play().catch(() => {
      // Autoplay with sound is commonly blocked. The prominent Play control is the fallback.
      setPlaying(false)
      setStarted(false)
    })
  }, [ready, error, playbackMode])

  const play = async () => {
    const video = videoRef.current
    if (!video) return
    try {
      await video.play()
    } catch (playError) {
      if (import.meta.env.DEV) console.warn(`Playback could not start for ECG video: ${pathologyId}`, playError)
    }
  }

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) play()
    else video.pause()
  }

  const replay = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    play()
  }

  const toggleSound = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  const handleError = () => {
    stopLoadingTimer()
    setError(true)
    setShowLoading(false)
    if (import.meta.env.DEV) console.error(`ECG video unavailable for pathology ID: ${pathologyId}`, src)
  }

  if (!src) return <div className="ecg-video-error" role="status">ECG video unavailable.</div>

  return <div className={`ecg-video ${className}`}>
    <div className="ecg-video-stage">
      <video
        ref={videoRef}
        src={src}
        preload={preload}
        loop
        playsInline
        muted={muted}
        aria-label="ECG rhythm video"
        onCanPlay={markReady}
        onPlaying={() => { setPlaying(true); setStarted(true); setShowLoading(false) }}
        onPause={() => setPlaying(false)}
        onWaiting={() => { stopLoadingTimer(); loadingTimerRef.current = window.setTimeout(() => setShowLoading(true), 180) }}
        onError={handleError}
      />
      {showLoading && !error && <div className="ecg-video-loading" role="status"><Character id="doctor02" pose="loading" alt="" decorative/><span>Preparing rhythm...</span></div>}
      {error && <div className="ecg-video-error" role="status"><Icon name="alert"/><strong>ECG video unavailable.</strong></div>}
      {!error && ready && !started && <button type="button" className="ecg-video-start" onClick={play}><Icon name="play" size={28}/><span>PLAY ECG</span></button>}
    </div>
    {!error && started && <div className="ecg-video-controls" aria-label="ECG playback controls">
      <button type="button" onClick={togglePlayback}><Icon name={playing ? 'pause' : 'play'}/><span>{playing ? 'Pause' : 'Play'}</span></button>
      <button type="button" onClick={replay}><Icon name="replay"/><span>Replay</span></button>
      <button type="button" onClick={toggleSound}><Icon name={muted ? 'muted' : 'volume'}/><span>{muted ? 'Sound on' : 'Mute'}</span></button>
    </div>}
  </div>
}
