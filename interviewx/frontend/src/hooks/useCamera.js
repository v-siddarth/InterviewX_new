// frontend/src/hooks/useCamera.js - FIXED VERSION with proper video stream handling
import { useState, useRef, useEffect, useCallback } from 'react';

export const useCamera = () => {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Check if camera is supported
  const isSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  // FIXED: Enhanced video element setup with better error handling
  const setupVideoElement = useCallback(async (stream) => {
    if (!videoRef.current || !stream) {
      console.error('❌ Video element or stream not available');
      return false;
    }

    try {
      console.log('🔄 Setting up video element...');
      const video = videoRef.current;
      
      // Clear any existing listeners
      video.removeEventListener('loadedmetadata', null);
      video.removeEventListener('canplay', null);
      video.removeEventListener('error', null);
      
      // Ensure video is ready for new stream
      video.pause();
      video.srcObject = null;
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set the new stream
      video.srcObject = stream;
      video.muted = true; // Prevent audio feedback
      video.playsInline = true;
      video.autoplay = true;
      
      console.log('📺 Video srcObject set, waiting for metadata...');

      // Enhanced promise-based video setup
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('❌ Video setup timeout');
          reject(new Error('Video setup timeout'));
        }, 10000);

        const handleLoadedMetadata = async () => {
          try {
            console.log('✅ Video metadata loaded');
            console.log('📏 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
            
            // Try to play the video
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
              await playPromise;
              console.log('✅ Video playing successfully');
            }
            
            clearTimeout(timeout);
            cleanup();
            resolve(true);
            
          } catch (playError) {
            console.warn('⚠️ Video play failed, trying muted:', playError);
            
            try {
              video.muted = true;
              await video.play();
              console.log('✅ Video playing (muted)');
              clearTimeout(timeout);
              cleanup();
              resolve(true);
            } catch (mutedError) {
              console.error('❌ Video play failed even muted:', mutedError);
              clearTimeout(timeout);
              cleanup();
              reject(mutedError);
            }
          }
        };

        const handleCanPlay = () => {
          console.log('📹 Video can play');
        };

        const handleError = (e) => {
          console.error('❌ Video error during setup:', e);
          clearTimeout(timeout);
          cleanup();
          reject(new Error('Video element error: ' + (e.message || 'Unknown error')));
        };

        const cleanup = () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('error', handleError);
        };

        // Add event listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        video.addEventListener('canplay', handleCanPlay, { once: true });
        video.addEventListener('error', handleError, { once: true });
        
        // Force load if not already loading
        if (video.readyState >= 1) {
          // Already have metadata
          handleLoadedMetadata();
        } else {
          video.load();
        }
      });

    } catch (error) {
      console.error('❌ Video setup failed:', error);
      setError('Video setup failed: ' + error.message);
      return false;
    }
  }, []);

  // FIXED: Enhanced permission request with better retry logic
  const requestPermission = useCallback(async (retryCount = 0) => {
    if (!isSupported()) {
      setError('Camera not supported in this browser');
      setHasPermission(false);
      return false;
    }

    try {
      console.log(`🎥 Requesting camera permissions (attempt ${retryCount + 1})...`);
      setError(null);
      
      // Stop any existing stream first
      if (streamRef.current) {
        console.log('🛑 Stopping existing stream...');
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('🔇 Stopped track:', track.kind, track.label);
        });
        streamRef.current = null;
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsPreviewing(false);
      
      // Enhanced constraints with fallback options
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: 'user'
        },
        audio: false // Separate audio handling
      };

      // Use specific device if selected
      if (selectedDeviceId) {
        constraints.video.deviceId = { exact: selectedDeviceId };
      }

      console.log('📋 Using constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Media stream obtained');
      console.log('📹 Video tracks:', stream.getVideoTracks().map(t => ({
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState,
        settings: t.getSettings()
      })));
      
      // Store stream reference
      streamRef.current = stream;
      
      // Setup video element
      const videoSetupSuccess = await setupVideoElement(stream);
      
      if (videoSetupSuccess) {
        setHasPermission(true);
        setIsPreviewing(true);
        
        // Get available devices after successful setup
        try {
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
          setDevices(videoDevices);

          if (!selectedDeviceId && videoDevices.length > 0) {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
          
          console.log('📷 Available cameras:', videoDevices.length);
        } catch (deviceError) {
          console.warn('⚠️ Could not enumerate devices:', deviceError);
        }
        
        return true;
      } else {
        throw new Error('Video setup failed');
      }
      
    } catch (err) {
      console.error('❌ Camera permission error:', err);
      
      let errorMessage = 'Camera access failed';
      
      // Handle specific error types
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permission and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application. Please close other applications and try again.';
      } else if (err.name === 'OverconstrainedError') {
        // Try with simpler constraints
        if (retryCount < 2) {
          console.log('🔄 Trying with simpler constraints...');
          
          // Clear retry timeout
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          // Try again with basic constraints
          retryTimeoutRef.current = setTimeout(() => {
            requestPermission(retryCount + 1);
          }, 1000);
          
          return false;
        }
        errorMessage = 'Camera does not support the required settings.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setHasPermission(false);
      
      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      return false;
    }
  }, [selectedDeviceId, isSupported, setupVideoElement]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!streamRef.current || isRecording) return;

    try {
      setError(null);
      chunksRef.current = [];
      
      // Check if we have video tracks
      const videoTracks = streamRef.current.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video tracks available');
      }
      
      console.log('🎬 Starting recording with tracks:', videoTracks.map(t => t.label));
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('📊 Recording chunk:', event.data.size, 'bytes');
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('⏹️ Recording stopped, creating blob...');
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        console.log('💾 Recording blob created:', blob.size, 'bytes');
        setRecordedBlob(blob);
        setIsRecording(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
        setError('Recording failed: ' + event.error.message);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('✅ Recording started successfully');

    } catch (err) {
      console.error('❌ Start recording error:', err);
      setError('Failed to start recording: ' + err.message);
    }
  }, [isRecording]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🛑 Stopping recording...');
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [isRecording]);

  // Stop preview
  const stopPreview = useCallback(() => {
    console.log('🛑 Stopping preview...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Stopped track:', track.kind, track.label);
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    setIsPreviewing(false);
    setHasPermission(null);
    setError(null);
  }, []);

  // Switch camera
  const switchCamera = useCallback(async (deviceId) => {
    console.log('🔄 Switching camera to:', deviceId);
    setSelectedDeviceId(deviceId);
    
    if (isPreviewing) {
      stopPreview();
      // Small delay before requesting new stream
      setTimeout(() => {
        requestPermission();
      }, 500);
    }
  }, [isPreviewing, stopPreview, requestPermission]);

  // Get current frame (for AI analysis)
  const getCurrentFrame = useCallback(() => {
    if (!videoRef.current || !isPreviewing || !streamRef.current) return null;

    try {
      const video = videoRef.current;
      
      // Check if video has valid dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn('⚠️ Video has no dimensions');
        return null;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (err) {
      console.error('❌ Failed to capture frame:', err);
      return null;
    }
  }, [isPreviewing]);

  // Clear recording
  const clearRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingDuration(0);
    chunksRef.current = [];
  }, []);

  // Format duration
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // FIXED: Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up camera hook...');
      
      // Stop all timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Stop recording if active
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isRecording]);

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
    videoRef,

    // Actions
    requestPermission,
    startRecording,
    stopRecording,
    stopPreview,
    switchCamera,
    getCurrentFrame,
    clearRecording,

    // Helpers
    formatDuration,
    isSupported: isSupported()
  };
};