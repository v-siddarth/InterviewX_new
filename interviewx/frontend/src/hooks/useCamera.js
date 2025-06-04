// frontend/src/hooks/useCamera.js
import { useState, useRef, useCallback, useEffect } from 'react';

export const useCamera = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [error, setError] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [recordingDuration, setRecordingDuration] = useState(0);

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const durationIntervalRef = useRef(null);

    // Video recording configuration
    const recordingOptions = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: 128000   // 128 kbps
    };

    /**
     * Get available camera devices
     */
    const getDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setDevices(videoDevices);
            
            // Select default device if none selected
            if (!selectedDeviceId && videoDevices.length > 0) {
                setSelectedDeviceId(videoDevices[0].deviceId);
            }
            
            return videoDevices;
        } catch (err) {
            setError('Failed to get camera devices: ' + err.message);
            return [];
        }
    }, [selectedDeviceId]);

    /**
     * Request camera permissions
     */
    const requestPermission = useCallback(async () => {
        try {
            setError(null);
            
            const constraints = {
                video: {
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            
            setHasPermission(true);
            setIsPreviewing(true);
            
            // Get updated device list with labels
            await getDevices();
            
            return stream;
        } catch (err) {
            console.error('Camera permission error:', err);
            setHasPermission(false);
            
            if (err.name === 'NotAllowedError') {
                setError('Camera access denied. Please allow camera permission and try again.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera found. Please connect a camera and try again.');
            } else if (err.name === 'NotReadableError') {
                setError('Camera is being used by another application.');
            } else if (err.name === 'OverconstrainedError') {
                setError('Camera does not support the required settings.');
            } else {
                setError('Failed to access camera: ' + err.message);
            }
            
            throw err;
        }
    }, [selectedDeviceId, getDevices]);

    /**
     * Start video recording
     */
    const startRecording = useCallback(async () => {
        try {
            setError(null);
            
            if (!streamRef.current) {
                await requestPermission();
            }
            
            if (!streamRef.current) {
                throw new Error('No camera stream available');
            }

            // Clear previous recording
            chunksRef.current = [];
            setRecordedBlob(null);
            setRecordingDuration(0);

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
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setRecordedBlob(blob);
                setIsRecording(false);
                
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
     * Stop video recording
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
     * Stop camera preview
     */
    const stopPreview = useCallback(() => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            
            setIsPreviewing(false);
            setHasPermission(null);
        } catch (err) {
            console.error('Failed to stop preview:', err);
        }
    }, []);

    /**
     * Switch camera device
     */
    const switchCamera = useCallback(async (deviceId) => {
        try {
            setSelectedDeviceId(deviceId);
            
            if (isPreviewing) {
                stopPreview();
                // Small delay to ensure camera is released
                setTimeout(() => {
                    requestPermission();
                }, 100);
            }
        } catch (err) {
            console.error('Failed to switch camera:', err);
            setError('Failed to switch camera: ' + err.message);
        }
    }, [isPreviewing, stopPreview, requestPermission]);

    /**
     * Take a photo from current stream
     */
    const takePhoto = useCallback(() => {
        try {
            if (!videoRef.current || !streamRef.current) {
                throw new Error('No camera stream available');
            }

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            
            context.drawImage(videoRef.current, 0, 0);
            
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve({
                        blob,
                        dataUrl: canvas.toDataURL('image/jpeg', 0.9)
                    });
                }, 'image/jpeg', 0.9);
            });
        } catch (err) {
            console.error('Failed to take photo:', err);
            setError('Failed to take photo: ' + err.message);
            return null;
        }
    }, []);

    /**
     * Get current frame as base64 for real-time analysis
     */
    const getCurrentFrame = useCallback(() => {
        try {
            if (!videoRef.current || !streamRef.current) {
                return null;
            }

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Use smaller canvas for real-time analysis
            canvas.width = 640;
            canvas.height = 480;
            
            context.drawImage(videoRef.current, 0, 0, 640, 480);
            
            return canvas.toDataURL('image/jpeg', 0.7);
        } catch (err) {
            console.error('Failed to get current frame:', err);
            return null;
        }
    }, []);

    /**
     * Clear recorded video
     */
    const clearRecording = useCallback(() => {
        setRecordedBlob(null);
        setRecordingDuration(0);
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

    // Check for camera support
    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Camera not supported in this browser');
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
            stopPreview();
        };
    }, [stopPreview]);

    return {
        // State
        isRecording,
        isPreviewing,
        hasPermission,
        error,
        devices,
        selectedDeviceId,
        recordedBlob,
        recordingDuration,
        
        // Refs
        videoRef,
        
        // Actions
        requestPermission,
        startRecording,
        stopRecording,
        stopPreview,
        switchCamera,
        takePhoto,
        getCurrentFrame,
        clearRecording,
        
        // Helpers
        formatDuration,
        
        // Stream info
        isSupported: !!navigator.mediaDevices?.getUserMedia
    };
};