
// frontend/src/hooks/useAudioRecorder.js - COMPLETE IMPLEMENTATION
import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioRecorder = () => {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Check if audio recording is supported
  const isSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    if (!isSupported()) {
      setError('Microphone not supported in this browser');
      setHasPermission(false);
      return false;
    }

    try {
      setError(null);
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      if (selectedDeviceId) {
        constraints.audio.deviceId = { exact: selectedDeviceId };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      // Setup audio analysis
      setupAudioAnalysis(stream);

      // Get available devices
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = deviceList.filter(device => device.kind === 'audioinput');
      setDevices(audioDevices);

      if (!selectedDeviceId && audioDevices.length > 0) {
        setSelectedDeviceId(audioDevices[0].deviceId);
      }

      return true;
    } catch (err) {
      console.error('Microphone permission error:', err);
      setError(err.message);
      setHasPermission(false);
      return false;
    }
  }, [selectedDeviceId, isSupported]);

  // Setup audio level analysis
  const setupAudioAnalysis = useCallback((stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start audio level monitoring
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
        }
        
        if (streamRef.current) {
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (err) {
      console.error('Audio analysis setup error:', err);
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!streamRef.current || isRecording) return;

    try {
      setError(null);
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setIsRecording(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setError('Recording failed: ' + event.error.message);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        if (!isPaused) {
          setRecordingDuration(prev => prev + 1);
        }
      }, 1000);

    } catch (err) {
      console.error('Start recording error:', err);
      setError('Failed to start recording: ' + err.message);
    }
  }, [isRecording, isPaused]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, [isRecording, isPaused]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, [isRecording, isPaused]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsPaused(false);
  }, [isRecording]);

  // Stop stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setHasPermission(null);
  }, []);

  // Switch device
  const switchDevice = useCallback(async (deviceId) => {
    setSelectedDeviceId(deviceId);
    
    if (hasPermission) {
      stopStream();
      setTimeout(() => {
        requestPermission();
      }, 100);
    }
  }, [hasPermission, stopStream, requestPermission]);

  // Play recording
  const playRecording = useCallback(() => {
    if (!recordedBlob || isPlaying) return;

    const url = URL.createObjectURL(recordedBlob);
    const audio = new Audio(url);
    
    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(url);
    };
    
    audio.onerror = () => {
      setIsPlaying(false);
      setError('Failed to play recording');
      URL.revokeObjectURL(url);
    };
    
    audioPlayerRef.current = audio;
    audio.play();
    setIsPlaying(true);
  }, [recordedBlob, isPlaying]);

  // Stop playing
  const stopPlaying = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Clear recording
  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingDuration(0);
    chunksRef.current = [];
    stopPlaying();
  }, [stopPlaying]);

  // Get audio level percentage
  const getAudioLevelPercentage = useCallback(() => {
    return Math.min(100, (audioLevel / 128) * 100);
  }, [audioLevel]);

  // Get audio chunks (for real-time streaming)
  const getAudioChunks = useCallback(() => {
    return chunksRef.current;
  }, []);

  // Format duration
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      stopPlaying();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stopStream, stopPlaying]);

  return {
    // State
    isRecording,
    isPaused,
    hasPermission,
    error,
    devices,
    selectedDeviceId,
    recordedBlob,
    recordingDuration,
    audioLevel,
    isPlaying,

    // Actions
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    stopStream,
    switchDevice,
    playRecording,
    stopPlaying,
    clearRecording,

    // Helpers
    formatDuration,
    getAudioLevelPercentage,
    getAudioChunks,
    isSupported: isSupported()
  };
};