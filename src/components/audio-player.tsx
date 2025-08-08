"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Download, Repeat, Volume1 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioPlayerProps {
  src: string
  title: string
  isOpen: boolean
  onClose: () => void
  caption?: string
}

export function AudioPlayer({ src, title, isOpen, onClose, caption }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false)
      setCurrentTime(0)
      setError(null)
      setIsLoading(true)
      // Ensure the audio element reloads when the dialog opens
      if (audioRef.current) {
        audioRef.current.load()
      }
    } else if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [isOpen])

  // Audio event listeners
  useEffect(() => {
    if (!isOpen) return
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      if (!isLooping) {
        setCurrentTime(0)
      }
    }

    const handleError = () => {
      setError("Erro ao carregar o áudio")
      setIsLoading(false)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)
    audio.addEventListener("canplay", handleCanPlay)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("canplay", handleCanPlay)
    }
  }, [isOpen, isLooping, src])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "Escape":
          onClose()
          break
        case " ":
          e.preventDefault()
          togglePlayPause()
          break
        case "ArrowLeft":
          e.preventDefault()
          skipBackward()
          break
        case "ArrowRight":
          e.preventDefault()
          skipForward()
          break
        case "ArrowUp":
          e.preventDefault()
          setVolume((prev) => Math.min(prev + 0.1, 1))
          break
        case "ArrowDown":
          e.preventDefault()
          setVolume((prev) => Math.max(prev - 0.1, 0))
          break
        case "m":
        case "M":
          e.preventDefault()
          toggleMute()
          break
        case "l":
        case "L":
          e.preventDefault()
          toggleLoop()
          break
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  // Update audio properties
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = isMuted ? 0 : volume
      audio.loop = isLooping
      audio.playbackRate = playbackRate
    }
  }, [volume, isMuted, isLooping, playbackRate])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = value[0]
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const skipForward = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.min(audio.currentTime + 10, duration)
  }

  const skipBackward = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(audio.currentTime - 10, 0)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleLoop = () => {
    setIsLooping(!isLooping)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (newVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = src
    link.download = title || "audio"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeX
    if (volume < 0.5) return Volume1
    return Volume2
  }

  const VolumeIcon = getVolumeIcon()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 border-0 bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-sm text-white">
        <audio ref={audioRef} src={src} preload="metadata" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            {caption && <p className="text-sm text-white/70 truncate">{caption}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Waveform Visualization (Placeholder) */}
        <div className="px-4 py-6">
          <div className="h-20 bg-black/20 rounded-lg flex items-center justify-center mb-4">
            {isLoading ? (
              <div className="flex space-x-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-purple-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 60 + 10}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            ) : error ? (
              <p className="text-red-400 text-sm">{error}</p>
            ) : (
              <div className="flex space-x-1 items-end">
                {[...Array(40)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-colors duration-150",
                      i / 40 <= currentTime / duration ? "bg-purple-400" : "bg-white/20",
                    )}
                    style={{
                      height: `${Math.random() * 60 + 10}px`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
              disabled={isLoading || !!error}
            />
            <div className="flex justify-between text-xs text-white/70">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipBackward}
              className="text-white hover:bg-white/20"
              disabled={isLoading || !!error}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20 w-12 h-12 rounded-full bg-white/10"
              disabled={isLoading || !!error}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={skipForward}
              className="text-white hover:bg-white/20"
              disabled={isLoading || !!error}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLoop}
                className={cn("text-white hover:bg-white/20", isLooping && "bg-white/20")}
              >
                <Repeat className="h-4 w-4" />
              </Button>

              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={toggleMute} className="text-white hover:bg-white/20">
                <VolumeIcon className="h-4 w-4" />
              </Button>

              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-full"
                />
              </div>

              <Button variant="ghost" size="sm" onClick={handleDownload} className="text-white hover:bg-white/20">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Help text */}
        <div className="px-4 pb-2">
          <div className="text-center text-white/50 text-xs">
            <p>Space: Play/Pause • ←/→: Skip • ↑/↓: Volume • M: Mute • L: Loop</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
