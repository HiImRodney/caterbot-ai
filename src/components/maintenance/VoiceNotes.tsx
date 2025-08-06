import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Trash2, Check, AlertTriangle } from 'lucide-react';

interface VoiceNote {
  id: string;
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  timestamp: Date;
  transcription?: string;
  isTranscribing?: boolean;
}

interface VoiceNotesProps {
  onVoiceNotesChange: (notes: VoiceNote[]) => void;
  maxNotes?: number;
  maxDurationSeconds?: number;
  enableTranscription?: boolean;
  disabled?: boolean;
  existingNotes?: VoiceNote[];
}

const VoiceNotes: React.FC<VoiceNotesProps> = ({
  onVoiceNotesChange,
  maxNotes = 3,
  maxDurationSeconds = 120, // 2 minutes max
  enableTranscription = true,
  disabled = false,
  existingNotes = []
}) => {
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>(existingNotes);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Update parent component when voice notes change
  useEffect(() => {
    onVoiceNotesChange(voiceNotes);
  }, [voiceNotes, onVoiceNotesChange]);

  // Check microphone permission on component mount
  useEffect(() => {
    checkMicrophonePermission();
    return () => {
      // Cleanup on unmount
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      Object.values(audioElementsRef.current).forEach(audio => {
        audio.pause();
        URL.revokeObjectURL(audio.src);
      });
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Voice recording not supported on this device');
        return;
      }

      // Check permission status
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permission.state === 'denied') {
          setPermissionDenied(true);
          setError('Microphone access denied. Please enable microphone permissions.');
        }
      }
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
    }
  };

  const startRecording = async () => {
    if (voiceNotes.length >= maxNotes) {
      setError(`Maximum ${maxNotes} voice notes allowed`);
      return;
    }

    try {
      setError(null);
      setPermissionDenied(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Good for speech recognition
        }
      });

      // Create MediaRecorder with optimized settings for speech
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000 // Good quality for speech
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const voiceNote: VoiceNote = {
          id: `voice-${Date.now()}`,
          audioBlob,
          audioUrl,
          duration: recordingTime,
          timestamp: new Date(),
          isTranscribing: enableTranscription
        };

        setVoiceNotes(prev => [...prev, voiceNote]);
        
        // Start transcription if enabled
        if (enableTranscription) {
          transcribeAudio(voiceNote);
        }

        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at max duration
          if (newTime >= maxDurationSeconds) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Microphone access denied. Please enable microphone permissions and try again.');
      } else {
        setError('Failed to start recording. Please check your microphone.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const transcribeAudio = async (voiceNote: VoiceNote) => {
    // Note: This is a placeholder for speech-to-text functionality
    // In a production environment, you would integrate with:
    // - Browser's built-in SpeechRecognition API (if available)
    // - Cloud speech services (Google Speech-to-Text, Azure Speech, etc.)
    // - Supabase Edge Function for server-side transcription
    
    try {
      // Check if browser supports speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        // Browser-based transcription (limited support)
        // This is a simplified implementation - would need audio playback for recognition
        setTimeout(() => {
          updateVoiceNoteTranscription(voiceNote.id, 'Transcription not available in current setup');
        }, 1000);
      } else {
        // Fallback: Could call Supabase Edge Function for server-side transcription
        setTimeout(() => {
          updateVoiceNoteTranscription(voiceNote.id, 'Voice note recorded successfully');
        }, 1000);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      updateVoiceNoteTranscription(voiceNote.id, 'Transcription failed');
    }
  };

  const updateVoiceNoteTranscription = (noteId: string, transcription: string) => {
    setVoiceNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, transcription, isTranscribing: false }
        : note
    ));
  };

  const playVoiceNote = (noteId: string) => {
    const note = voiceNotes.find(n => n.id === noteId);
    if (!note) return;

    // Stop any currently playing audio
    Object.values(audioElementsRef.current).forEach(audio => audio.pause());
    setPlayingNoteId(null);

    // Create or get audio element
    if (!audioElementsRef.current[noteId]) {
      const audio = new Audio(note.audioUrl);
      audio.onended = () => setPlayingNoteId(null);
      audio.onerror = () => {
        setError('Failed to play voice note');
        setPlayingNoteId(null);
      };
      audioElementsRef.current[noteId] = audio;
    }

    const audio = audioElementsRef.current[noteId];
    audio.play()
      .then(() => setPlayingNoteId(noteId))
      .catch(error => {
        console.error('Error playing audio:', error);
        setError('Failed to play voice note');
      });
  };

  const stopPlayback = () => {
    if (playingNoteId && audioElementsRef.current[playingNoteId]) {
      audioElementsRef.current[playingNoteId].pause();
      audioElementsRef.current[playingNoteId].currentTime = 0;
      setPlayingNoteId(null);
    }
  };

  const deleteVoiceNote = (noteId: string) => {
    // Stop playback if this note is playing
    if (playingNoteId === noteId) {
      stopPlayback();
    }

    // Cleanup audio element and URL
    if (audioElementsRef.current[noteId]) {
      const audio = audioElementsRef.current[noteId];
      audio.pause();
      URL.revokeObjectURL(audio.src);
      delete audioElementsRef.current[noteId];
    }

    // Remove from notes
    setVoiceNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="bg-slate-800/30 border border-slate-600/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">Voice Notes</h3>
          <span className="text-sm text-slate-400">
            {voiceNotes.length} / {maxNotes}
          </span>
        </div>

        {/* Main Recording Button */}
        <div className="flex flex-col items-center space-y-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={disabled || voiceNotes.length >= maxNotes || permissionDenied}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
            >
              <Mic className="h-8 w-8 text-white" />
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              {/* Recording indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-medium">
                  Recording {formatDuration(recordingTime)}
                </span>
              </div>
              
              {/* Stop button */}
              <button
                onClick={stopRecording}
                className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
              >
                <Square className="h-6 w-6 text-white fill-current" />
              </button>
            </div>
          )}

          {/* Recording time limit */}
          <p className="text-xs text-slate-400 text-center">
            {isRecording 
              ? `${maxDurationSeconds - recordingTime}s remaining`
              : `Hold to record up to ${maxDurationSeconds}s`
            }
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}

      {/* Permission Help */}
      {permissionDenied && (
        <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
          <h4 className="text-sm font-medium text-orange-200 mb-2">Microphone Access Required</h4>
          <p className="text-xs text-orange-300 mb-2">
            To record voice notes, please:
          </p>
          <ol className="text-xs text-orange-300 space-y-1 ml-4">
            <li>1. Click the microphone icon in your browser's address bar</li>
            <li>2. Select "Allow" for microphone access</li>
            <li>3. Refresh the page and try again</li>
          </ol>
        </div>
      )}

      {/* Voice Notes List */}
      {voiceNotes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">Recorded Notes</h4>
          
          {voiceNotes.map((note) => (
            <div key={note.id} className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {/* Play/Pause Button */}
                  <button
                    onClick={() => playingNoteId === note.id ? stopPlayback() : playVoiceNote(note.id)}
                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
                  >
                    {playingNoteId === note.id ? (
                      <Pause className="h-4 w-4 text-white" />
                    ) : (
                      <Play className="h-4 w-4 text-white ml-0.5" />
                    )}
                  </button>
                  
                  {/* Note Info */}
                  <div>
                    <p className="text-sm text-white">
                      {formatDuration(note.duration)} • {formatTimestamp(note.timestamp)}
                    </p>
                    {note.isTranscribing && (
                      <p className="text-xs text-blue-400">Transcribing...</p>
                    )}
                  </div>
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={() => deleteVoiceNote(note.id)}
                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              {/* Transcription */}
              {note.transcription && (
                <div className="bg-slate-800/50 rounded p-2 mt-2">
                  <p className="text-xs text-slate-300">{note.transcription}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Usage Guidelines */}
      <div className="p-3 bg-slate-800/30 border border-slate-600/30 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">Voice Note Tips</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Speak clearly and close to your device</li>
          <li>• Record in a quiet area when possible</li>
          <li>• Keep notes concise and relevant to maintenance</li>
          <li>• Include important details like part numbers or observations</li>
          {enableTranscription && (
            <li>• Transcription helps make notes searchable</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default VoiceNotes;