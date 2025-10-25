"use client"
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Mic, Square, Send, X, AlertCircle, Trash2, Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { toast } from 'sonner';

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
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // Real-time audio level indicator
  const [availableMicrophones, setAvailableMicrophones] = useState([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState('default');
  const [currentMicrophoneName, setCurrentMicrophoneName] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const durationIntervalRef = useRef(null);
  const currentAudioRef = useRef(null);
  const audioLevelIntervalRef = useRef(null);
  const isRecordingRef = useRef(false);

  // Get all available microphones
  const enumerateMicrophones = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices.filter(device => device.kind === 'audioinput');
      console.log('🎤 Available microphones:', microphones.map(m => ({ id: m.deviceId, label: m.label })));
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
        console.log('💾 Loaded saved microphone preference:', savedMicId);
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
      console.log('🎤 Requesting microphone access...');
      
      // First check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording');
      }
      
      // Try to use the "communications" device first (like Discord/Telegram)
      // This automatically selects the microphone Windows uses for calls
      // Start with minimal constraints - some browsers have issues with advanced audio processing
      const audioConstraints = {
        echoCancellation: false, // Disable initially to test if this is the problem
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: 48000, // Standard sample rate
        channelCount: 1 // Mono audio for voice
      };
      
      // Check if user previously selected a specific microphone
      const savedMicrophoneId = localStorage.getItem('preferredMicrophoneId');
      
      if (selectedMicrophoneId && selectedMicrophoneId !== 'default') {
        // User manually selected a microphone
        audioConstraints.deviceId = { exact: selectedMicrophoneId };
        console.log('🎤 Using user-selected microphone:', selectedMicrophoneId);
      } else if (savedMicrophoneId && savedMicrophoneId !== 'default') {
        // Use previously saved microphone
        audioConstraints.deviceId = { exact: savedMicrophoneId };
        console.log('🎤 Using saved microphone:', savedMicrophoneId);
      } else {
        // Try to get the "communications" device (what Discord/Telegram use)
        // This is supported in modern browsers
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter(d => d.kind === 'audioinput');
          
          // Look for communication device keywords
          const commDevice = audioInputs.find(d => 
            d.label.toLowerCase().includes('communication') ||
            d.label.toLowerCase().includes('headset') ||
            d.label.toLowerCase().includes('headphone')
          );
          
          if (commDevice) {
            audioConstraints.deviceId = { exact: commDevice.deviceId };
            console.log('🎤 Auto-selected communication device:', commDevice.label);
          } else {
            console.log('🎤 Using browser default microphone');
          }
        } catch (err) {
          console.log('🎤 Could not auto-select microphone, using default');
        }
      }
      
      console.log('🎤 Requesting microphone with constraints:', audioConstraints);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints
      });
      
      console.log('✅ Microphone access granted');
      
      // Get the actual microphone being used
      const audioTrack = stream.getAudioTracks()[0];
      const micName = audioTrack.label;
      setCurrentMicrophoneName(micName);
      console.log('🎤 Using microphone:', micName);
      
      console.log('📡 Stream info:', {
        active: stream.active,
        id: stream.id,
        tracks: stream.getTracks().length,
        audioTrack: {
          label: audioTrack.label,
          enabled: audioTrack.enabled,
          muted: audioTrack.muted,
          readyState: audioTrack.readyState,
          settings: audioTrack.getSettings ? audioTrack.getSettings() : 'not available'
        }
      });
      
      // Add event listeners to track changes
      audioTrack.onmute = () => console.warn('⚠️ Audio track muted!');
      audioTrack.onunmute = () => console.log('✅ Audio track unmuted');
      audioTrack.onended = () => console.warn('⚠️ Audio track ended unexpectedly!');
      
      // Refresh microphone list after permission is granted
      await enumerateMicrophones();
      
      // Test multiple formats and choose the best one
      const formats = [
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
          console.log('✅ Selected audio format:', format);
          break;
        }
      }
      
      if (!mimeType) {
        throw new Error('No supported audio format found');
      }
      
      console.log('🎤 Recording with format:', mimeType);
      console.log('📋 All supported formats:', formats.filter(f => MediaRecorder.isTypeSupported(f)));
      
      console.log('🎙️ Creating MediaRecorder with:', { mimeType, audioBitsPerSecond: 32000 });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000 // 32kbps - good quality for voice (Discord uses 32-64kbps)
      });
      
      console.log('✅ MediaRecorder created:', {
        state: mediaRecorder.state,
        mimeType: mediaRecorder.mimeType,
        audioBitsPerSecond: mediaRecorder.audioBitsPerSecond,
        videoBitsPerSecond: mediaRecorder.videoBitsPerSecond
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Add state change listener
      mediaRecorder.onstatechange = () => {
        console.log('🎙️ MediaRecorder state changed:', mediaRecorder.state);
      };
      
      // Add error listener
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
        toast.error('Recording error: ' + event.error.name, { duration: 5000 });
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('📊 Chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🎙️ Recording stopped, processing audio...');
        console.log('📊 Total chunks collected:', audioChunksRef.current.length);
        console.log('📊 Chunk sizes:', audioChunksRef.current.map(chunk => chunk.size + ' bytes'));
        
        // Validate we have audio data
        if (audioChunksRef.current.length === 0) {
          console.error('❌ No audio data recorded - MediaRecorder did not produce any chunks');
          toast.error('❌ No audio recorded. Please check microphone permissions and try again.', { duration: 5000 });
          setIsProcessing(false);
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('📦 Audio blob created:', { 
          type: audioBlob.type,
          size: audioBlob.size, 
          sizeKB: (audioBlob.size / 1024).toFixed(2) + ' KB',
          chunks: audioChunksRef.current.length,
          avgChunkSize: Math.round(audioBlob.size / audioChunksRef.current.length) + ' bytes'
        });
        
        // Validate blob size
        if (audioBlob.size === 0) {
          console.error('❌ Audio blob is empty - chunks had no data');
          toast.error('❌ Recording failed. Please try again.', { duration: 3000 });
          setIsProcessing(false);
          return;
        }
        
        // Check if blob size is suspiciously small (less than 100 bytes per second)
        const recordingDuration = duration;
        const expectedMinSize = recordingDuration * 100; // Very conservative estimate
        if (audioBlob.size < expectedMinSize) {
          console.warn('⚠️ Audio blob is very small for duration:', {
            size: audioBlob.size,
            duration: recordingDuration,
            expectedMin: expectedMinSize
          });
        }
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        console.log('🔗 Blob URL created for preview:', url);
        
        // Test if the blob URL is valid by creating a test audio element
        const testAudio = new Audio(url);
        
        testAudio.onloadedmetadata = () => {
          console.log('✅ Audio blob metadata loaded:', {
            duration: testAudio.duration,
            readyState: testAudio.readyState,
            paused: testAudio.paused,
            volume: testAudio.volume,
            muted: testAudio.muted
          });
          
          // Try to play a tiny bit to test if there's actual audio
          testAudio.volume = 0.5;
          testAudio.play().then(() => {
            console.log('✅ Test playback successful - audio blob is valid');
            setTimeout(() => {
              testAudio.pause();
              testAudio.currentTime = 0;
            }, 100);
          }).catch(err => {
            console.error('❌ Test playback failed:', err);
          });
        };
        
        testAudio.onerror = (e) => {
          console.error('❌ Invalid audio blob:', {
            event: e,
            error: testAudio.error,
            errorCode: testAudio.error?.code,
            errorMessage: testAudio.error?.message
          });
        };
        
        // Generate REAL waveform data by analyzing audio
        try {
          console.log('📊 Generating waveform...');
          const waveform = await generateWaveform(audioBlob);
          setWaveformData(waveform);
          console.log('✅ Waveform generated successfully');
        } catch (error) {
          console.warn('⚠️ Failed to generate waveform, using fallback:', error);
          // Fallback to mock data if waveform generation fails
          setWaveformData(Array.from({ length: 32 }, () => Math.random() * 0.8 + 0.1));
        }
        
        setIsProcessing(false);
        console.log('✅ Recording ready for preview!');
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms for better streaming
      setIsRecording(true);
      isRecordingRef.current = true;
      setDuration(0);
      
      console.log('🎤 Recording started with stream tracks:', stream.getTracks().map(t => ({
        kind: t.kind,
        label: t.label,
        enabled: t.enabled,
        muted: t.muted
      })));
      
      // Monitor audio levels to verify microphone is working
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let checkCount = 0;
        const checkAudioLevel = () => {
          if (!isRecordingRef.current || checkCount++ > 300) {
            setAudioLevel(0);
            return;
          }
          
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          
          // Update visual indicator
          setAudioLevel(Math.round(average));
          
          // Log to console
          if (checkCount % 2 === 0) { // Log every 2 seconds
            const level = Math.round(average);
            console.log('🎚️ Audio level:', level, '/ 255', level < 5 ? '⚠️ VERY LOW - MICROPHONE NOT WORKING!' : level < 20 ? '⚠️ LOW' : '✅ GOOD');
          }
          
          if (isRecordingRef.current) {
            setTimeout(checkAudioLevel, 1000);
          }
        };
        checkAudioLevel();
      } catch (err) {
        console.warn('Audio level monitoring not available:', err);
      }
      
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
      isRecordingRef.current = false;
      setIsProcessing(true);
      setShowTimeWarning(false); // Reset warning state
      setAudioLevel(0); // Reset audio level indicator
      
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
      console.log('▶️ Preview playing from blob URL:', audioUrl);
      
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      // Set up event handlers BEFORE playing
      audio.onloadedmetadata = () => {
        console.log('✅ Audio metadata loaded:', {
          duration: audio.duration,
          readyState: audio.readyState
        });
      };
      
      audio.oncanplay = () => {
        console.log('✅ Audio ready to play');
      };
      
      audio.onended = () => {
        console.log('⏹️ Preview playback ended');
        setIsPlaying(false);
        currentAudioRef.current = null;
      };
      
      audio.onerror = (e) => {
        console.error('❌ Preview playback error:', {
          error: e,
          audioError: audio.error,
          audioUrl: audioUrl
        });
        setIsPlaying(false);
        currentAudioRef.current = null;
        toast.error('❌ Failed to play preview', { duration: 3000 });
      };
      
      // Now try to play
      audio.play().then(() => {
        console.log('✅ Preview playback started successfully');
        setIsPlaying(true);
      }).catch((err) => {
        console.error('❌ Preview play failed:', {
          error: err.message,
          name: err.name,
          audioUrl: audioUrl
        });
        setIsPlaying(false);
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
        const errorMsg = 'Microphone permission denied. Please allow microphone access to record voice messages.';
        setPermissionError(errorMsg);
        toast.error(`❌ ${errorMsg}`, { duration: 5000 });
      } else {
        const errorMsg = 'Failed to start recording. Please check your microphone.';
        setPermissionError(errorMsg);
        toast.error(`❌ ${errorMsg}`, { duration: 5000 });
      }
    }
  };

  const handleStopRecording = () => {
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
        toast.error('❌ Recording too short. Please record for at least 1 second.', { duration: 3000 });
        return;
      }
      
      try {
        setIsProcessing(true);
        
        // Convert blob URL to file for upload
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        
        // Determine file extension based on mime type
        const extension = blob.type.includes('webm') ? 'webm' : 
                         blob.type.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `voice-message.${extension}`, { type: blob.type });
        
        console.log('📦 Uploading audio:', { 
          type: blob.type, 
          size: blob.size, 
          sizeKB: (blob.size / 1024).toFixed(2) + ' KB' 
        });
        
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
        console.log('📤 Upload response:', uploadData);
        
        if (uploadData.success) {
          // Use filePath (which contains the CDN URL) or fallback to audioUrl
          const audioFileUrl = uploadData.filePath || uploadData.audioUrl;
          console.log('✅ Upload successful, audio URL:', audioFileUrl);
          
          if (!audioFileUrl) {
            throw new Error('No audio URL returned from server');
          }
          
          // Send message with uploaded audio URL (S3 CDN)
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

  // Test speakers/headphones by playing a beep
  const testSpeakers = () => {
    console.log('🔊 Testing speakers/headphones...');
    
    try {
      // Create a simple beep tone using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440; // A4 note
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('✅ Test tone playing - if you hear a beep, your speakers work!');
      toast.success('🔊 If you hear a beep, your speakers are working!', { duration: 3000 });
      
      oscillator.onended = () => {
        console.log('✅ Test tone finished');
      };
    } catch (err) {
      console.error('❌ Failed to play test tone:', err);
      toast.error('❌ Could not test speakers', { duration: 3000 });
    }
  };

  // Test microphone by playing back what you hear (echo test)
  const testMicrophone = async () => {
    console.log('🎤 Testing microphone with live playback...');
    toast.info('🎤 Speak now - you should hear yourself!', { duration: 3000 });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      
      console.log('✅ Microphone stream obtained');
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      source.connect(analyser);
      analyser.connect(audioContext.destination); // This creates echo - you hear yourself
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkLevel = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        console.log('🎚️ Live mic level:', Math.round(average), '/ 255');
      }, 500);
      
      // Stop after 3 seconds
      setTimeout(() => {
        clearInterval(checkLevel);
        stream.getTracks().forEach(track => track.stop());
        source.disconnect();
        analyser.disconnect();
        toast.success('✅ Microphone test complete!', { duration: 2000 });
        console.log('✅ Microphone test finished');
      }, 3000);
      
    } catch (err) {
      console.error('❌ Microphone test failed:', err);
      toast.error('❌ Microphone test failed: ' + err.message, { duration: 5000 });
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
    
    // Audio level indicator
    const levelPercentage = (audioLevel / 255) * 100;
    const getLevelColor = () => {
      if (audioLevel < 5) return 'bg-destructive';
      if (audioLevel < 20) return 'bg-yellow-500';
      return 'bg-green-500';
    };
    
    return (
      <div className={cn("flex flex-col items-center justify-center p-4 space-y-3", className)}>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full animate-pulse",
              isNearLimit ? "bg-orange-500" : "bg-red-500"
            )} />
            <span className="text-sm font-medium">Recording...</span>
          </div>
          {currentMicrophoneName && (
            <span className="text-xs text-muted-foreground">
              🎤 {currentMicrophoneName}
            </span>
          )}
        </div>
        
        {/* Audio Level Indicator */}
        <div className="w-full max-w-xs space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Microphone Level</span>
            <span className={cn(
              "font-medium",
              audioLevel < 5 ? "text-destructive" : audioLevel < 20 ? "text-yellow-500" : "text-green-500"
            )}>
              {audioLevel < 5 ? '⚠️ TOO LOW!' : audioLevel < 20 ? 'Low' : 'Good'} ({audioLevel}/255)
            </span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-200", getLevelColor())}
              style={{ width: `${levelPercentage}%` }}
            />
          </div>
          {audioLevel < 5 && duration > 2 && (
            <div className="text-xs text-destructive text-center space-y-1">
              <p className="font-medium">⚠️ Microphone not detecting sound!</p>
              <p>Check Windows sound settings or select a different microphone.</p>
            </div>
          )}
        </div>
        
        {/* Show microphone selector if having issues */}
        {availableMicrophones.length > 1 && audioLevel < 5 && duration > 2 && (
          <div className="w-full max-w-xs space-y-2 border border-destructive/20 rounded-md p-3 bg-destructive/5">
            <label className="text-xs font-medium text-foreground">Try a different microphone:</label>
            <select
              value={selectedMicrophoneId}
              onChange={(e) => {
                const newMicId = e.target.value;
                setSelectedMicrophoneId(newMicId);
                localStorage.setItem('preferredMicrophoneId', newMicId);
                toast.info('🔄 Microphone changed. Please stop and start recording again.', { duration: 3000 });
              }}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            >
              <option value="default">Auto-detect</option>
              {availableMicrophones.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}
        
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
      {/* Microphone selector - only show if multiple microphones or having issues */}
      {availableMicrophones.length > 1 && (
        <details className="w-full max-w-xs">
          <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground">
            ⚙️ Microphone Settings ({availableMicrophones.length} devices)
          </summary>
          <div className="mt-2 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Select Microphone:</label>
            <select
              value={selectedMicrophoneId}
              onChange={(e) => {
                const newMicId = e.target.value;
                setSelectedMicrophoneId(newMicId);
                // Save to localStorage for future use
                localStorage.setItem('preferredMicrophoneId', newMicId);
                console.log('💾 Saved microphone preference:', newMicId);
                toast.success('✅ Microphone preference saved!', { duration: 2000 });
              }}
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
            >
              <option value="default">Auto-detect (Recommended)</option>
              {availableMicrophones.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Your choice will be remembered for next time
            </p>
          </div>
        </details>
      )}
      
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
      
      {/* Test buttons for debugging */}
      <div className="flex gap-2">
        <Button 
          onClick={testMicrophone}
          variant="outline"
          size="sm"
        >
          <Mic className="h-4 w-4 mr-2" />
          Test Mic
        </Button>
        <Button 
          onClick={testSpeakers}
          variant="outline"
          size="sm"
        >
          <Volume2 className="h-4 w-4 mr-2" />
          Test Speakers
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Click "Test Mic" - you should hear yourself speak
      </p>
    </div>
  );
}