import { useState, useRef } from 'react'
import { Upload, Mic, Play, Pause, Trash2, CheckCircle, AlertCircle, FileAudio, Clock, Volume2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AudioFile {
  id: string
  file: File
  name: string
  size: string
  duration?: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
}

export default function VoiceTraining() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration)
      })
      audio.src = URL.createObjectURL(file)
    })
  }

  const handleFileUpload = async (files: FileList) => {
    const newFiles: AudioFile[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        toast.error(`${file.name} is not an audio file`)
        continue
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 50MB`)
        continue
      }

      const duration = await getAudioDuration(file)
      const audioFile: AudioFile = {
        id: Date.now().toString() + i,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        duration,
        status: 'uploading',
        progress: 0
      }
      newFiles.push(audioFile)
    }

    setAudioFiles(prev => [...prev, ...newFiles])
    await simulateUpload(newFiles)
  }

  const simulateUpload = async (files: AudioFile[]) => {
    for (const file of files) {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setAudioFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress } : f
        ))
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Simulate processing
      setAudioFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' } : f
      ))
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mark as completed
      setAudioFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'completed' } : f
      ))
    }
    
    toast.success('Audio files uploaded successfully!')
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files)
    }
  }

  const removeFile = (id: string) => {
    setAudioFiles(prev => prev.filter(f => f.id !== id))
    if (currentPlaying === id) {
      setCurrentPlaying(null)
    }
  }

  const playAudio = (id: string) => {
    if (currentPlaying === id) {
      // Pause current audio
      if (audioRefs.current[id]) {
        audioRefs.current[id].pause()
      }
      setCurrentPlaying(null)
    } else {
      // Stop any currently playing audio
      if (currentPlaying && audioRefs.current[currentPlaying]) {
        audioRefs.current[currentPlaying].pause()
      }
      
      // Play new audio
      if (audioRefs.current[id]) {
        audioRefs.current[id].play()
        setCurrentPlaying(id)
      }
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = (status: AudioFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: AudioFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...'
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Ready for training'
      case 'error':
        return 'Upload failed'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Training</h1>
          <p className="text-gray-600">
            Upload audio samples to train your AI voice agent. We'll use these recordings to create a personalized voice that matches your style.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mic className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload Audio Samples</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload high-quality audio recordings (MP3, WAV, M4A) of your voice. 
              We recommend at least 10 minutes of clear speech for optimal results.
            </p>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop audio files here or click to browse
            </p>
            <p className="text-gray-500 mb-4">
              Supports MP3, WAV, M4A up to 50MB per file
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Choose Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Upload Guidelines */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Volume2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Clear Audio</h3>
              <p className="text-sm text-gray-600">Use a quiet environment with minimal background noise</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Mic className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Natural Speech</h3>
              <p className="text-sm text-gray-600">Speak naturally as you would in conversations</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">10+ Minutes</h3>
              <p className="text-sm text-gray-600">Aim for at least 10 minutes of audio content</p>
            </div>
          </div>
        </div>

        {/* File List */}
        {audioFiles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Uploaded Files</h3>
            <div className="space-y-4">
              {audioFiles.map((audioFile) => (
                <div key={audioFile.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileAudio className="h-8 w-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{audioFile.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{audioFile.size}</span>
                        {audioFile.duration && (
                          <span>{formatDuration(audioFile.duration)}</span>
                        )}
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(audioFile.status)}
                          <span>{getStatusText(audioFile.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Progress Bar */}
                    {audioFile.status === 'uploading' && (
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${audioFile.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Audio Player */}
                    {audioFile.status === 'completed' && (
                      <button
                        onClick={() => playAudio(audioFile.id)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {currentPlaying === audioFile.id ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </button>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(audioFile.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Hidden Audio Element */}
                  <audio
                    ref={(el) => {
                      if (el) audioRefs.current[audioFile.id] = el
                    }}
                    src={URL.createObjectURL(audioFile.file)}
                    onEnded={() => setCurrentPlaying(null)}
                    onPause={() => setCurrentPlaying(null)}
                  />
                </div>
              ))}
            </div>

            {/* Training Button */}
            {audioFiles.some(f => f.status === 'completed') && (
              <div className="mt-8 text-center">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg">
                  Start Voice Training
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Training will begin with your uploaded audio samples
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
