"use client"
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Mic, Square, Send, X, AlertCircle, Trash2, Play, Pause } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { isNative, isIOS } from '@/lib/capacitor';
import { WaveformVisualizer } from './WaveformVisualizer';

// Recording time limits following best practices (Discord/Telegram standard)
const MAX_RECORDING_DURATION = 300; // 5 minutes maximum (Discord: ~5min, Telegram: 1hr)
const MIN_RECORDING_DURATION = 1; // 1 second minimum
const WARNING_DURATION = 30; // Show warning in last 30 seconds

export function VoiceRecorder({ onSendVoiceMessage, onCancel, className, autoStart = false }) {
  const [permissionError, setPermissionError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [waveformData, setWaveformData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // Real-time audio level indicator
  const [availableMicrophones, setAvailableMicrophones] = useState([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState('default');
  const [currentMicrophoneName, setCurrentMicrophoneName] = useState('');
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const durationIntervalRef = useRef(null);
  const currentAudioRef = useRef(null);
  const audioLevelIntervalRef = useRef(null);
  const isRecordingRef = useRef(false);
  const audioStreamRef = useRef(null);
  const audioLevelContextRef = useRef(null);

  // Detect iOS and check MediaRecorder support
  useEffect(() => {
    const isIOSDevice = isIOS() || /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isNativePlatform = isNative();
    setIsIOSSafari(isIOSDevice);
    
    // Check MediaRecorder support - required for all platforms
    if (typeof MediaRecorder !== 'undefined') {
      // Test if MediaRecorder actually works
      try {
        // iOS supports audio/mp4 and audio/aac
        const testSupported = MediaRecorder.isTypeSupported('audio/webm') || 
                            MediaRecorder.isTypeSupported('audio/mp4') ||
                            MediaRecorder.isTypeSupported('audio/aac') ||
                            MediaRecorder.isTypeSupported('audio/wav');
        setBrowserSupported(testSupported);
      } catch (err) {
        // If MediaRecorder exists but throws errors, mark as unsupported
        setBrowserSupported(false);
      }
    } else {
      // No MediaRecorder support
      setBrowserSupported(false);
    }
  }, []);

  // Get all available microphones
  const enumerateMicrophones = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices.filter(device => device.kind === 'audioinput');
      setAvailableMicrophones(microphones);
      return microphones;
    } catch (err) {
      console.error('Error enumerating microphones:', err);
      return [];
    }
  };

  // Load microphones and saved preference on mount
  useEffect(() => {
    const loadMicrophones = async () => {
      await enumerateMicrophones();
      
      // Load saved microphone preference
      const savedMicId = localStorage.getItem('preferredMicrophoneId');
      if (savedMicId) {
        setSelectedMicrophoneId(savedMicId);
      }
    };
    
    loadMicrophones();
  }, []);

  // Generate real waveform from audio blob (like Discord/Telegram)
  const generateWaveform = async (audioBlob) => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const rawData = audioBuffer.getChannelData(0); // Get first channel
    const samples = 32; // Number of bars in waveform
    const blockSize = Math.floor(rawData.length / samples);
    const waveform = [];
    
    for (let i = 0; i < samples; i++) {
      const start = blockSize * i;
      let sum = 0;
      
      // Calculate RMS (Root Mean Square) for this block
      for (let j = 0; j < blockSize; j++) {
        sum += rawData[start + j] ** 2;
      }
      
      const rms = Math.sqrt(sum / blockSize);
      waveform.push(Math.min(1, rms * 5)); // Scale and cap at 1
    }
    
    // Normalize waveform data
    const max = Math.max(...waveform);
    return max > 0 ? waveform.map(v => v / max) : waveform;
  };

  const startRecording = async () => {
    try {
      // First check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error = new Error('Your browser does not support audio recording');
        error.name = 'NotSupportedError';
        throw error;
      }
      
      // On native platforms, ensure we're using HTTPS or localhost
      // Capacitor WebView should support getUserMedia, but we need proper permissions
      const isNativePlatform = isNative();
      if (isNativePlatform && !window.location.protocol.includes('https') && !window.location.hostname.includes('localhost')) {
        console.warn('Microphone access may require HTTPS on native platforms');
      }
      
      // Audio constraints optimized for voice recording
      let audioConstraints = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: 48000,
        channelCount: 1
      };
      
      // Check if user previously selected a specific microphone
      const savedMicrophoneId = localStorage.getItem('preferredMicrophoneId');
      
      if (selectedMicrophoneId && selectedMicrophoneId !== 'default') {
        audioConstraints.deviceId = { exact: selectedMicrophoneId };
      } else if (savedMicrophoneId && savedMicrophoneId !== 'default') {
        audioConstraints.deviceId = { exact: savedMicrophoneId };
      } else {
        // Try to auto-select communication device
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter(d => d.kind === 'audioinput');
          
          const commDevice = audioInputs.find(d => 
            d.label.toLowerCase().includes('communication') ||
            d.label.toLowerCase().includes('headset') ||
            d.label.toLowerCase().includes('headphone')
          );
          
          if (commDevice) {
            audioConstraints.deviceId = { exact: commDevice.deviceId };
          }
        } catch (err) {
          // Use default if auto-selection fails
          console.warn('Could not enumerate devices:', err);
        }
      }
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: audioConstraints
        });
      } catch (getUserMediaError) {
        // If specific device fails, try with default constraints
        if (getUserMediaError.name === 'OverconstrainedError' || getUserMediaError.name === 'NotFoundError') {
          console.warn('Failed with specific constraints, trying default:', getUserMediaError);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ 
              audio: true
            });
          } catch (fallbackError) {
            // Re-throw the original error if fallback also fails
            throw getUserMediaError;
          }
        } else {
          throw getUserMediaError;
        }
      }
      
      audioStreamRef.current = stream;
      
      // Get the actual microphone being used
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const micName = audioTrack.label;
        setCurrentMicrophoneName(micName);
      }
      
      // Refresh microphone list after permission is granted
      try {
        await enumerateMicrophones();
      } catch (err) {
        console.warn('Could not enumerate microphones:', err);
      }
      
      // Check MediaRecorder support - iOS 14.3+ supports MediaRecorder
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder is not supported on this device. Please update your iOS version to 14.3 or later.');
      }
      
      // Always use MediaRecorder (it's supported on iOS 14.3+ and all modern browsers)
      await startMediaRecorderRecording(stream);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      
      // Clean up any partial stream
      if (audioStreamRef.current) {
        try {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
        } catch (cleanupError) {
          console.warn('Error cleaning up stream:', cleanupError);
        }
        audioStreamRef.current = null;
      }
      
      throw error;
    }
  };

  // Standard MediaRecorder recording
  const startMediaRecorderRecording = async (stream) => {
    try {
      const isIOSDevice = isIOS() || /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      // Select best supported audio format (iOS supports mp4/aac)
      const formats = isIOSDevice ? [
        'audio/mp4',
        'audio/aac',
        'audio/wav'
      ] : [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/webm',
        'audio/ogg',
        'audio/wav'
      ];
      
      let mimeType = '';
      for (const format of formats) {
        if (MediaRecorder.isTypeSupported(format)) {
          mimeType = format;
          break;
        }
      }
      
      if (!mimeType) {
        throw new Error('No supported audio format found. Please update your device.');
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Add error listener
      mediaRecorder.onerror = (event) => {
        console.error('Recording error:', event.error);
        toast.error('Recording error: ' + event.error.name, { duration: 5000 });
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Validate we have audio data
        if (audioChunksRef.current.length === 0) {
          toast.error('❌ No audio recorded. Please check microphone permissions and try again.', { duration: 5000 });
          setIsProcessing(false);
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Validate blob size
        if (audioBlob.size === 0) {
          toast.error('❌ Recording failed. Please try again.', { duration: 3000 });
          setIsProcessing(false);
          return;
        }
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Generate waveform data by analyzing audio
        try {
          const waveform = await generateWaveform(audioBlob);
          setWaveformData(waveform);
        } catch (error) {
          console.error('Error generating waveform:', error);
          setWaveformData(Array.from({ length: 32 }, () => Math.random() * 0.8 + 0.1));
        }
        
        setIsProcessing(false);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      isRecordingRef.current = true;
      setDuration(0);
      
      // Start audio level monitoring
      startAudioLevelMonitoring(stream);
      
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


  // Helper function to start audio level monitoring
  const startAudioLevelMonitoring = (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioLevelContextRef.current = audioContext; // Store for cleanup
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      microphone.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudioLevel = () => {
        if (!isRecordingRef.current || !audioLevelContextRef.current) {
          setAudioLevel(0);
          if (microphone) {
            microphone.disconnect();
          }
          if (audioLevelContextRef.current) {
            audioLevelContextRef.current.close().catch(err => {
              console.warn('Error closing audio level context:', err);
            });
            audioLevelContextRef.current = null;
          }
          return;
        }
        
        analyser.getByteFrequencyData(dataArray);
        
        // Simple average volume calculation
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const volume = Math.round(average);
        
        setAudioLevel(volume);
        
        requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
      
    } catch (err) {
      console.error('Audio level monitoring error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // MediaRecorder recording
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      setIsProcessing(true);
      setShowTimeWarning(false);
      setAudioLevel(0);
      
      // Cleanup audio level monitoring
      if (audioLevelContextRef.current) {
        audioLevelContextRef.current.close().catch(err => {
          console.warn('Error closing audio level context:', err);
        });
        audioLevelContextRef.current = null;
      }
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    setIsProcessing(false);
    setDuration(0);
    setAudioLevel(0);
    setAudioUrl(null);
    setWaveformData([]);
    setShowTimeWarning(false);
    setPlaybackTime(0);
    setIsPlaying(false);
    
    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // Clean up audio level monitoring
    if (audioLevelContextRef.current) {
      try {
        audioLevelContextRef.current.close().catch(err => {
          console.warn('Error closing audio level context:', err);
        });
      } catch (err) {
        console.error('Error stopping audio level context:', err);
      }
      audioLevelContextRef.current = null;
    }
    
    // Clean up MediaRecorder
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping media recorder:', err);
      }
    }
    
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    
    // Clean up stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    // Clean up duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const clearRecording = () => {
    setDuration(0);
    setAudioUrl(null);
    setWaveformData([]);
    setIsProcessing(false);
    setPlaybackTime(0);
    setIsPlaying(false);
    
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
      
      // Track playback time
      const updatePlaybackTime = () => {
        if (currentAudioRef.current) {
          setPlaybackTime(currentAudioRef.current.currentTime);
        }
      };
      const timeInterval = setInterval(updatePlaybackTime, 100);
      
      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
        clearInterval(timeInterval);
        currentAudioRef.current = null;
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
        clearInterval(timeInterval);
        currentAudioRef.current = null;
        toast.error('❌ Failed to play preview', { duration: 3000 });
      };
      
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        setIsPlaying(false);
        setPlaybackTime(0);
        clearInterval(timeInterval);
        currentAudioRef.current = null;
        toast.error('❌ Failed to play preview: ' + err.message, { duration: 3000 });
      });
    }
  };

  const pause = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlaying(false);
    // Keep playbackTime where it is for resume
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
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      // Cleanup audio level monitoring
      if (audioLevelContextRef.current) {
        audioLevelContextRef.current.close().catch(() => {});
      }
      // Cleanup audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
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
      
      // Handle specific error types with detailed messages
      let errorMsg = 'Failed to start recording. Please check your microphone.';
      let errorDescription = null;
      
      if (error instanceof DOMException) {
        const isNativePlatform = isNative();
        switch (error.name) {
          case 'NotAllowedError':
            errorMsg = 'Microphone permission denied.';
            if (isNativePlatform) {
              errorDescription = 'Please allow microphone access in your device Settings > Suplient > Microphone.';
            } else {
              errorDescription = 'Please allow microphone access in your browser or device settings to record voice messages.';
            }
            break;
          case 'NotFoundError':
            errorMsg = 'No microphone found.';
            errorDescription = 'Please connect a microphone to your device and try again.';
            break;
          case 'NotReadableError':
            errorMsg = 'Microphone is already in use.';
            errorDescription = 'Another application is using your microphone. Please close it and try again.';
            break;
          case 'OverconstrainedError':
            errorMsg = 'Microphone settings not supported.';
            errorDescription = 'Your microphone does not support the required settings. Please try again or select a different microphone.';
            break;
          case 'SecurityError':
            errorMsg = 'Microphone access blocked.';
            errorDescription = 'Your browser or device has blocked microphone access. Please check your security settings.';
            break;
          case 'AbortError':
            errorMsg = 'Microphone access was interrupted.';
            errorDescription = 'The microphone access was interrupted. Please try again.';
            break;
          default:
            errorMsg = `Microphone error: ${error.name}`;
            errorDescription = error.message || 'Please check your microphone and try again.';
        }
      } else if (error.name === 'NotSupportedError') {
        errorMsg = 'Audio recording not supported.';
        errorDescription = 'Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.';
      } else if (error.message) {
        errorMsg = error.message;
        errorDescription = 'Please check your microphone permissions and try again.';
      }
      
      setPermissionError(errorMsg);
      toast.error(`❌ ${errorMsg}`, {
        description: errorDescription,
        duration: 7000
      });
    }
  };

  const handleStopRecording = () => {
    if (!isRecording) {
      return;
    }
    
    try {
      stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      clearRecording();
    }
  };

  const handleSend = async () => {
    if (audioUrl && duration > 0) {
      // Check minimum duration
      if (duration < MIN_RECORDING_DURATION) {
        toast.error('❌ Recording too short. Please record for at least 1 second.', { duration: 3000 });
        return;
      }
      
      try {
        setIsProcessing(true);
        
        // Convert blob URL to file for upload
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        
        // Determine file extension based on mime type
        let extension = 'webm';
        if (blob.type.includes('mp4') || blob.type.includes('aac')) {
          extension = 'mp4';
        } else if (blob.type.includes('ogg')) {
          extension = 'ogg';
        } else if (blob.type.includes('wav')) {
          extension = 'wav';
        }
        
        const file = new File([blob], `voice-message.${extension}`, { type: blob.type });
        
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
          const audioFileUrl = uploadData.filePath || uploadData.audioUrl;
          
          if (!audioFileUrl) {
            throw new Error('No audio URL returned from server');
          }
          
          onSendVoiceMessage(audioFileUrl, duration, waveformData);
          toast.success('✅ Voice message sent!', { duration: 2000 });
          clearRecording();
          onCancel();
        } else {
          throw new Error(uploadData.error || uploadData.details || 'Upload failed');
        }
      } catch (error) {
        console.error('Error sending voice message:', error);
        toast.error(`❌ Failed to send voice message: ${error.message}`, { duration: 5000 });
        setIsProcessing(false);
      }
    }
  };

  const handleCancel = () => {
    try {
      cancelRecording();
      onCancel();
    } catch (error) {
      console.error('Failed to cancel recording:', error);
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

  // Show warning for unsupported browsers - simplified
  if (!browserSupported) {
    return (
      <div className={cn("flex items-center gap-2 p-3 text-destructive text-sm", className)}>
        <AlertCircle className="h-4 w-4" />
        <span>Voice recording not supported</span>
        <Button variant="ghost" size="sm" onClick={onCancel} className="ml-auto">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // If there's a permission error, show simplified error
  if (permissionError) {
    return (
      <div className={cn("flex items-center gap-2 p-3 text-destructive text-sm", className)}>
        <AlertCircle className="h-4 w-4" />
        <span>{permissionError}</span>
        <Button variant="ghost" size="sm" onClick={() => setPermissionError(null)} className="ml-auto">
          Retry
        </Button>
      </div>
    );
  }

  // Generate real-time waveform data from audio level for recording visualization
  const [recordingWaveform, setRecordingWaveform] = useState(Array(32).fill(0));
  
  useEffect(() => {
    if (isRecording && audioLevel > 0) {
      // Update waveform based on audio level - create a more dynamic visualization
      const normalizedLevel = Math.min(audioLevel / 255, 1);
      const bars = 32;
      const newWaveform = Array(bars).fill(0);
      
      // Create a wave pattern that responds to audio level
      for (let i = 0; i < bars; i++) {
        const position = i / bars;
        // Use sine wave pattern with audio level modulation
        const baseHeight = Math.sin(position * Math.PI * 6) * 0.3 + 0.4;
        const height = Math.max(0.1, baseHeight * normalizedLevel);
        newWaveform[i] = height;
      }
      
      setRecordingWaveform(newWaveform);
    } else if (!isRecording) {
      setRecordingWaveform(Array(32).fill(0));
    }
  }, [isRecording, audioLevel]);

  // If recording, show simplified recording interface (like WhatsApp/Discord)
  if (isRecording) {
    const remainingTime = MAX_RECORDING_DURATION - duration;
    const isNearLimit = duration >= MAX_RECORDING_DURATION - WARNING_DURATION;
    
    return (
      <div className={cn("flex items-center gap-3 p-3", className)}>
        {/* Waveform visualization */}
        <div className="flex-1 h-12 min-w-[200px]">
          <WaveformVisualizer
            data={recordingWaveform}
            isRecording={true}
            className="h-full"
          />
        </div>
        
        {/* Timer */}
        <div className={cn(
          "text-sm font-mono min-w-[50px] text-center",
          isNearLimit ? "text-orange-600" : "text-foreground"
        )}>
          {formatDuration(duration)}
        </div>
        
        {/* Stop button */}
        <Button 
          onClick={handleStopRecording} 
          size="icon"
          variant="destructive"
          className="rounded-full h-10 w-10 flex-shrink-0"
        >
          <Square className="h-5 w-5" />
        </Button>
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

  // If we have a recorded audio, show simplified playback interface (like WhatsApp/Discord)
  if (audioUrl) {
    return (
      <div className={cn("flex items-center gap-3 p-3", className)}>
        {/* Play/Pause button */}
        <Button 
          onClick={handlePlayPause} 
          size="icon"
          variant="ghost"
          className="rounded-full h-10 w-10 flex-shrink-0"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        
        {/* Waveform visualization */}
        <div className="flex-1 h-12 min-w-[200px]">
          <WaveformVisualizer
            data={waveformData}
            isPlaying={isPlaying}
            currentTime={playbackTime}
            duration={duration}
            className="h-full"
          />
        </div>
        
        {/* Timer */}
        <span className="text-sm font-mono min-w-[50px] text-center">
          {formatDuration(isPlaying ? playbackTime : duration)}
        </span>
        
        {/* Send button */}
        <Button 
          onClick={handleSend} 
          size="icon"
          className="rounded-full h-10 w-10 flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
        
        {/* Delete button */}
        <Button 
          onClick={handleCancel} 
          size="icon"
          variant="ghost"
          className="rounded-full h-10 w-10 flex-shrink-0"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // Default state - show simple record button (like WhatsApp/Discord)
  return (
    <div className={cn("flex items-center justify-center p-2", className)}>
      <Button 
        onClick={handleStartRecording} 
        size="icon"
        className="rounded-full h-10 w-10"
        disabled={isInitializing}
      >
        {isInitializing ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}