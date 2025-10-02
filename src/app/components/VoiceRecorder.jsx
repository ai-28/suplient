"use client"
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Mic, Square, Send, X, AlertCircle, Trash2, Play, Pause } from 'lucide-react';
import { cn } from '@/app/lib/utils';

// Recording time limits following best practices
const MAX_RECORDING_DURATION = 60; // 1 minute maximum (industry standard)
const MIN_RECORDING_DURATION = 1; // 1 second minimum
const WARNING_DURATION = 10; // Show warning in last 10 seconds

export function VoiceRecorder({ onSendVoiceMessage, onCancel, className, autoStart = false }) {
  const [permissionError, setPermissionError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [waveformData, setWaveformData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const durationIntervalRef = useRef(null);
  const currentAudioRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Generate mock waveform data (in a real app, you'd analyze the audio)
        setWaveformData(Array.from({ length: 32 }, () => Math.random() * 0.8 + 0.1));
        
        setIsProcessing(false);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      // Start duration counter with time limit checks
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          
          // Show warning when approaching max duration
          if (newDuration >= MAX_RECORDING_DURATION - WARNING_DURATION) {
            setShowTimeWarning(true);
          }
          
          // Auto-stop at maximum duration
          if (newDuration >= MAX_RECORDING_DURATION) {
            stopRecording();
            return MAX_RECORDING_DURATION;
          }
          
          return newDuration;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      setShowTimeWarning(false); // Reset warning state
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setIsProcessing(false);
    setDuration(0);
    setAudioUrl(null);
    setWaveformData([]);
    setShowTimeWarning(false); // Reset warning state
    
    // Clean up media recorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    // Clean up duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    // Clean up audio chunks
    audioChunksRef.current = [];
  };

  const clearRecording = () => {
    setDuration(0);
    setAudioUrl(null);
    setWaveformData([]);
    setIsProcessing(false);
    
    // Clean up audio URL if it exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const play = () => {
    if (audioUrl) {
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.play().then(() => {
        setIsPlaying(true);
        audio.onended = () => {
          setIsPlaying(false);
          currentAudioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlaying(false);
          currentAudioRef.current = null;
        };
      }).catch(() => {
        setIsPlaying(false);
        currentAudioRef.current = null;
      });
    }
  };

  const pause = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlaying(false);
  };

  // Auto-start recording when component mounts if autoStart is true
  useEffect(() => {
    if (autoStart && !isRecording && !audioUrl && !isProcessing && !isInitializing) {
      handleStartRecording();
    }
  }, [autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, [audioUrl]);

  const handleStartRecording = async () => {
    if (isRecording || isProcessing || isInitializing) return;
    
    // Immediately show recording interface
    setIsInitializing(true);
    setPermissionError(null);
    
    try {
      await startRecording();
      setIsInitializing(false);
    } catch (error) {
      console.error('Recording error:', error);
      setIsInitializing(false);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setPermissionError('Microphone permission denied. Please allow microphone access to record voice messages.');
      } else {
        setPermissionError('Failed to start recording. Please check your microphone.');
      }
    }
  };

  const handleStopRecording = () => {
    console.log('VoiceRecorder: Stop button clicked - isRecording:', isRecording);
    if (!isRecording) {
      console.log('VoiceRecorder: Not recording, ignoring stop request');
      return;
    }
    
    try {
      stopRecording();
    } catch (error) {
      console.error('VoiceRecorder: Failed to stop recording:', error);
      clearRecording();
    }
  };

  const handleSend = async () => {
    if (audioUrl && duration > 0) {
      // Check minimum duration
      if (duration < MIN_RECORDING_DURATION) {
        console.warn('Recording too short, minimum duration required');
        return;
      }
      
      try {
        setIsProcessing(true);
        
        // Convert blob URL to file for upload
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const file = new File([blob], 'voice-message.wav', { type: 'audio/wav' });
        
        // Upload audio file
        const formData = new FormData();
        formData.append('audio', file);
        
        const uploadResponse = await fetch('/api/upload/audio', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload audio');
        }
        
        const uploadData = await uploadResponse.json();
        
        if (uploadData.success) {
          // Send message with uploaded audio URL
          onSendVoiceMessage(uploadData.audioUrl, duration, waveformData);
          clearRecording();
          onCancel();
        } else {
          throw new Error(uploadData.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Error sending voice message:', error);
        setIsProcessing(false);
        // You might want to show an error message to the user here
      }
    }
  };

  const handleCancel = () => {
    try {
      cancelRecording();
      onCancel();
    } catch (error) {
      console.error('Failed to cancel recording:', error);
      // Force reset
      clearRecording();
      onCancel();
    }
  };

  const handlePlayPause = () => {
    if (!audioUrl) return;
    
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'away': return 'Away';
      default: return 'Unknown';
    }
  };

  // If there's a permission error, show it
  if (permissionError) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-4 space-y-3", className)}>
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive text-center">{permissionError}</p>
        <Button variant="outline" size="sm" onClick={() => setPermissionError(null)}>
          Try Again
        </Button>
      </div>
    );
  }

  // If recording, show recording interface
  if (isRecording) {
    const remainingTime = MAX_RECORDING_DURATION - duration;
    const isNearLimit = duration >= MAX_RECORDING_DURATION - WARNING_DURATION;
    
    return (
      <div className={cn("flex flex-col items-center justify-center p-4 space-y-3", className)}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-3 h-3 rounded-full animate-pulse",
            isNearLimit ? "bg-orange-500" : "bg-red-500"
          )} />
          <span className="text-sm font-medium">Recording...</span>
        </div>
        
        <div className={cn(
          "text-2xl font-mono",
          isNearLimit ? "text-orange-600" : "text-foreground"
        )}>
          {formatDuration(duration)}
        </div>
        
        {/* Time limit indicator */}
        <div className="text-xs text-muted-foreground">
          {isNearLimit ? (
            <span className="text-orange-600 font-medium">
              Auto-stop in {remainingTime}s
            </span>
          ) : (
            `Max: ${formatDuration(MAX_RECORDING_DURATION)}`
          )}
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleStopRecording} size="sm" variant="destructive">
            <Square className="h-4 w-4" />
            Stop
          </Button>
        </div>
      </div>
    );
  }

  // If processing, show processing interface
  if (isProcessing) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-4 space-y-3", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground">Processing recording...</span>
      </div>
    );
  }

  // If we have a recorded audio, show playback interface
  if (audioUrl) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-4 space-y-3", className)}>
        <div className="flex items-center gap-2">
          <Button onClick={handlePlayPause} size="sm" variant="outline">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <span className="text-sm font-mono">{formatDuration(duration)}</span>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSend} size="sm">
            <Send className="h-4 w-4" />
            Send
          </Button>
          <Button onClick={handleCancel} size="sm" variant="outline">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    );
  }

  // Default state - show record button
  return (
    <div className={cn("flex flex-col items-center justify-center p-4 space-y-3", className)}>
      <Button 
        onClick={handleStartRecording} 
        size="lg" 
        className="rounded-full w-16 h-16"
        disabled={isInitializing}
      >
        <Mic className="h-6 w-6" />
      </Button>
      <span className="text-sm text-muted-foreground">
        {isInitializing ? 'Initializing...' : 'Tap to record'}
      </span>
    </div>
  );
}