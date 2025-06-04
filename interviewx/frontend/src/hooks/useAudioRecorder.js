// frontend/src/hooks/useAudioRecorder.js
import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioRecorder = () => {
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

    const streamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const durationIntervalRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const animationFrameRef = useRef(null);
    const audioPlayerRef = useRef(null);

    // Audio recording configuration
    const recordingOptions = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000 // 128 kbps
    };

    /**
     * Get available audio input devices
     */
    const getDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioDevices = devices.filter(device => device.kind === 'audioinput');
            setDevices(audioDevices);
            
            // Select default device if none selected
            if (!selectedDeviceId && audioDevices.length > 0) {
                setSelectedDeviceId(audioDevices[0].deviceId);
            }
            
            return audioDevices;
        } catch (err) {
            setError('Failed to get audio devices: ' + err.message);
            return [];
        }
    }, [selectedDeviceId]);

    /**
     * Request microphone permissions
     */
    const requestPermission = useCallback(async () => {
        try {
            setError(null);
            
            const constraints = {
                audio: {
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 1
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            setHasPermission(true);
            
            // Setup audio level monitoring
            setupAudioLevelMonitoring(stream);
            
            // Get updated device list with labels
            await getDevices();
            
            return stream;
        } catch (err) {
            console.error('Microphone permission error:', err);
            setHasPermission(false);
            
            if (err.name === 'NotAllowedError') {
                setError('Microphone access denied. Please allow microphone permission and try again.');
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone and try again.');
            } else if (err.name === 'NotReadableError') {
                setError('Microphone is being used by another application.');
            } else {
                setError('Failed to access microphone: ' + err.message);
            }
            
            throw err;
        }
    }, [selectedDeviceId, getDevices]);

    /**
     * Setup audio level monitoring for visual feedback
     */
    const setupAudioLevelMonitoring = useCallback((stream) => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            
            microphone.connect(analyser);
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            dataArrayRef.current = dataArray;
            
            // Start monitoring audio levels
            const monitorAudioLevel = () => {
                if (analyserRef.current && dataArrayRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                    
                    // Calculate average audio level
                    const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length;
                    const normalizedLevel = Math.min(100, (average / 255) * 100);
                    
                    setAudioLevel(normalizedLevel);
                }
                
                if (streamRef.current) {
                    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
                }
            };
            
            monitorAudioLevel();
        } catch (err) {
            console.error('Failed to setup audio monitoring:', err);
        }
    }, []);

    /**
     * Start audio recording
     */
    const startRecording = useCallback(async () => {
        try {
            setError(null);
            
            if (!streamRef.current) {
                await requestPermission();
            }
            
            if (!streamRef.current) {
                throw new Error('No microphone stream available');
            }

            // Clear previous recording
            chunksRef.current = [];
            setRecordedBlob(null);
            setRecordingDuration(0);
            setIsPaused(false);

            // Create media recorder
            const mediaRecorder = new MediaRecorder(streamRef.current, recordingOptions);
            mediaRecorderRef.current = mediaRecorder;

            // Handle data available
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            // Handle recording stop
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(blob);
                setIsRecording(false);
                setIsPaused(false);
                
                if (durationIntervalRef.current) {
                    clearInterval(durationIntervalRef.current);
                    durationIntervalRef.current = null;
                }
            };

            // Handle errors
            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                setError('Recording failed: ' + event.error.message);
                setIsRecording(false);
                setIsPaused(false);
            };

            // Start recording
            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);

            // Start duration timer
            durationIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Failed to start recording:', err);
            setError('Failed to start recording: ' + err.message);
        }
    }, [requestPermission]);

    /**
     * Pause audio recording
     */
    const pauseRecording = useCallback(() => {
        try {
            if (mediaRecorderRef.current && isRecording && !isPaused) {
                mediaRecorderRef.current.pause();
                setIsPaused(true);
                
                if (durationIntervalRef.current) {
                    clearInterval(durationIntervalRef.current);
                    durationIntervalRef.current = null;
                }
            }
        } catch (err) {
            console.error('Failed to pause recording:', err);
            setError('Failed to pause recording: ' + err.message);
        }
    }, [isRecording, isPaused]);

    /**
     * Resume audio recording
     */
    const resumeRecording = useCallback(() => {
        try {
            if (mediaRecorderRef.current && isRecording && isPaused) {
                mediaRecorderRef.current.resume();
                setIsPaused(false);
                
                // Resume duration timer
                durationIntervalRef.current = setInterval(() => {
                    setRecordingDuration(prev => prev + 1);
                }, 1000);
            }
        } catch (err) {
            console.error('Failed to resume recording:', err);
            setError('Failed to resume recording: ' + err.message);
        }
    }, [isRecording, isPaused]);

    /**
     * Stop audio recording
     */
    const stopRecording = useCallback(() => {
        try {
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
            }
            
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }
        } catch (err) {
            console.error('Failed to stop recording:', err);
            setError('Failed to stop recording: ' + err.message);
        }
    }, [isRecording]);

    /**
     * Stop microphone stream
     */
    const stopStream = useCallback(() => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            
            setHasPermission(null);
            setAudioLevel(0);
        } catch (err) {
            console.error('Failed to stop stream:', err);
        }
    }, []);

    /**
     * Switch microphone device
     */
    const switchDevice = useCallback(async (deviceId) => {
        try {
            setSelectedDeviceId(deviceId);
            
            if (hasPermission) {
                stopStream();
                // Small delay to ensure microphone is released
                setTimeout(() => {
                    requestPermission();
                }, 100);
            }
        } catch (err) {
            console.error('Failed to switch microphone:', err);
            setError('Failed to switch microphone: ' + err.message);
        }
    }, [hasPermission, stopStream, requestPermission]);

    /**
     * Play recorded audio
     */
    const playRecording = useCallback(() => {
        try {
            if (!recordedBlob) {
                throw new Error('No recording available');
            }

            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current = null;
            }

            const audioUrl = URL.createObjectURL(recordedBlob);
            const audio = new Audio(audioUrl);
            audioPlayerRef.current = audio;

            audio.onplay = () => setIsPlaying(true);
            audio.onpause = () => setIsPlaying(false);
            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
            };
            audio.onerror = (err) => {
                console.error('Audio playback error:', err);
                setError('Failed to play recording');
                setIsPlaying(false);
            };

            audio.play();
        } catch (err) {
            console.error('Failed to play recording:', err);
            setError('Failed to play recording: ' + err.message);
        }
    }, [recordedBlob]);

    /**
     * Stop playing recorded audio
     */
    const stopPlaying = useCallback(() => {
        try {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current.currentTime = 0;
                setIsPlaying(false);
            }
        } catch (err) {
            console.error('Failed to stop playback:', err);
        }
    }, []);

    /**
     * Get audio chunks for real-time processing
     */
    const getAudioChunks = useCallback(() => {
        return [...chunksRef.current];
    }, []);

    /**
     * Clear recorded audio
     */
    const clearRecording = useCallback(() => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current = null;
        }
        
        setRecordedBlob(null);
        setRecordingDuration(0);
        setIsPlaying(false);
        chunksRef.current = [];
    }, []);

    /**
     * Format duration for display
     */
    const formatDuration = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    /**
     * Get audio level as percentage for visual feedback
     */
    const getAudioLevelPercentage = useCallback(() => {
        return Math.min(100, Math.max(0, audioLevel));
    }, [audioLevel]);

    // Check for microphone support
    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Microphone not supported in this browser');
            setHasPermission(false);
        } else {
            getDevices();
        }
    }, [getDevices]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            stopStream();
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
            }
        };
    }, [stopStream]);

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
        
        // Stream info
        isSupported: !!navigator.mediaDevices?.getUserMedia
    };
};