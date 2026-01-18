'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Play, Pause, X, Send } from 'lucide-react'

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  onCancel: () => void
  maxDuration?: number // in seconds
}

export default function VoiceRecorder({ onRecordingComplete, onCancel, maxDuration = 60 }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Unable to access microphone. Please allow microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    }
  }

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleSend = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      onRecordingComplete(audioBlob, duration)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="glass rounded-2xl p-6 max-w-sm w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Voice Note</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Waveform visualization placeholder */}
        <div className="mb-6 h-20 bg-white/5 rounded-lg flex items-center justify-center">
          {isRecording && !isPaused && (
            <motion.div
              className="flex items-center gap-1"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary-red rounded-full"
                  animate={{
                    height: [10, Math.random() * 60 + 10, 10]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.05
                  }}
                />
              ))}
            </motion.div>
          )}
          {!isRecording && !audioURL && (
            <Mic className="w-8 h-8 text-gray-400" />
          )}
          {audioURL && (
            <div className="text-center">
              <Play className="w-8 h-8 text-primary-turquoise mx-auto" />
              <p className="text-xs text-gray-400 mt-2">Ready to send</p>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="text-center mb-6">
          <p className="text-3xl font-bold">{formatDuration(duration)}</p>
          <p className="text-xs text-gray-400 mt-1">Max: {formatDuration(maxDuration)}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording && !audioURL && (
            <motion.button
              onClick={startRecording}
              className="w-16 h-16 rounded-full gradient-red flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Mic className="w-6 h-6 text-white" />
            </motion.button>
          )}

          {isRecording && (
            <>
              <motion.button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isPaused ? (
                  <Play className="w-5 h-5 text-white" />
                ) : (
                  <Pause className="w-5 h-5 text-white" />
                )}
              </motion.button>

              <motion.button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full gradient-red flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Square className="w-6 h-6 text-white" />
              </motion.button>
            </>
          )}

          {audioURL && (
            <>
              <motion.button
                onClick={isPlaying ? pauseAudio : playAudio}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </motion.button>

              <motion.button
                onClick={handleSend}
                className="w-16 h-16 rounded-full gradient-turquoise flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Send className="w-6 h-6 text-white" />
              </motion.button>
            </>
          )}
        </div>

        {audioURL && (
          <audio
            ref={audioRef}
            src={audioURL}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}
      </motion.div>
    </motion.div>
  )
}
