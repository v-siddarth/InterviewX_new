// // frontend/src/components/interview/VideoCapture.jsx - FIXED VERSION
// import React, { useEffect, useState, useRef } from 'react';
// import { Camera, Square, Play, Pause, RotateCcw, Settings, AlertCircle, CheckCircle } from 'lucide-react';
// import { useCamera } from '../../hooks/useCamera';
// import Button from '../ui/Button';
// import Modal from '../ui/Modal';

// const VideoCapture = ({ 
//     onRecordingComplete, 
//     onRecordingStart, 
//     onRecordingStop,
//     onFrameCapture,
//     isInterviewActive = false,
//     maxDuration = 300, // 5 minutes default
//     showControls = true,
//     autoStart = false,
//     className = ""
// }) => {
//     const {
//         isRecording,
//         isPreviewing,
//         hasPermission,
//         error,
//         devices,
//         selectedDeviceId,
//         recordedBlob,
//         recordingDuration,
//         videoRef,
//         requestPermission,
//         startRecording,
//         stopRecording,
//         stopPreview,
//         switchCamera,
//         getCurrentFrame,
//         clearRecording,
//         formatDuration,
//         isSupported
//     } = useCamera();

//     const [showSettings, setShowSettings] = useState(false);
//     const [frameInterval, setFrameInterval] = useState(null);
//     const [confidenceScore, setConfidenceScore] = useState(0);
//     const [faceDetected, setFaceDetected] = useState(false);
//     const [videoReady, setVideoReady] = useState(false);
//     const [debugInfo, setDebugInfo] = useState({
//         hasStream: false,
//         videoPlaying: false,
//         videoDimensions: { width: 0, height: 0 }
//     });

//     // FIXED: Enhanced video ready detection
//     useEffect(() => {
//         const video = videoRef.current;
//         if (!video) return;

//         const handleLoadedMetadata = () => {
//             console.log('📺 Video metadata loaded');
//             setDebugInfo(prev => ({
//                 ...prev,
//                 videoDimensions: { width: video.videoWidth, height: video.videoHeight }
//             }));
//         };

//         const handleCanPlay = () => {
//             console.log('▶️ Video can play');
//             setVideoReady(true);
//             setDebugInfo(prev => ({ ...prev, videoPlaying: true }));
//         };

//         const handlePlaying = () => {
//             console.log('✅ Video is playing');
//             setVideoReady(true);
//             setDebugInfo(prev => ({ ...prev, videoPlaying: true }));
//         };

//         const handleError = (e) => {
//             console.error('❌ Video element error:', e);
//             setVideoReady(false);
//             setDebugInfo(prev => ({ ...prev, videoPlaying: false }));
//         };

//         const handleLoadStart = () => {
//             console.log('🔄 Video load started');
//             setVideoReady(false);
//         };

//         video.addEventListener('loadedmetadata', handleLoadedMetadata);
//         video.addEventListener('canplay', handleCanPlay);
//         video.addEventListener('playing', handlePlaying);
//         video.addEventListener('error', handleError);
//         video.addEventListener('loadstart', handleLoadStart);

//         return () => {
//             video.removeEventListener('loadedmetadata', handleLoadedMetadata);
//             video.removeEventListener('canplay', handleCanPlay);
//             video.removeEventListener('playing', handlePlaying);
//             video.removeEventListener('error', handleError);
//             video.removeEventListener('loadstart', handleLoadStart);
//         };
//     }, [videoRef]);

//     // Update debug info when preview state changes
//     useEffect(() => {
//         setDebugInfo(prev => ({ ...prev, hasStream: isPreviewing }));
//     }, [isPreviewing]);

//     // Handle permission request on mount or auto start
//     useEffect(() => {
//         if (isSupported && (autoStart || isInterviewActive)) {
//             console.log('🎬 Auto-requesting camera permission...');
//             requestPermission().catch(console.error);
//         }
//     }, [isSupported, autoStart, isInterviewActive, requestPermission]);

//     // Handle frame capture for real-time analysis
//     useEffect(() => {
//         if (isPreviewing && videoReady && onFrameCapture && isInterviewActive) {
//             console.log('📸 Starting frame capture interval...');
//             const interval = setInterval(() => {
//                 const frameData = getCurrentFrame();
//                 if (frameData) {
//                     onFrameCapture(frameData);
//                     // Mock face detection for demo
//                     const mockConfidence = Math.floor(Math.random() * 20) + 80;
//                     setConfidenceScore(mockConfidence);
//                     setFaceDetected(mockConfidence > 75);
//                 }
//             }, 1000); // Capture frame every second

//             setFrameInterval(interval);
//             return () => {
//                 if (interval) {
//                     console.log('🛑 Stopping frame capture interval...');
//                     clearInterval(interval);
//                 }
//             };
//         } else if (frameInterval) {
//             clearInterval(frameInterval);
//             setFrameInterval(null);
//         }
//     }, [isPreviewing, videoReady, onFrameCapture, isInterviewActive, getCurrentFrame, frameInterval]);

//     // Handle recording callbacks
//     useEffect(() => {
//         if (isRecording && onRecordingStart) {
//             onRecordingStart();
//         }
//     }, [isRecording, onRecordingStart]);

//     useEffect(() => {
//         if (!isRecording && recordedBlob && onRecordingComplete) {
//             onRecordingComplete(recordedBlob);
//         }
//     }, [isRecording, recordedBlob, onRecordingComplete]);

//     // Handle max duration
//     useEffect(() => {
//         if (isRecording && recordingDuration >= maxDuration) {
//             stopRecording();
//             if (onRecordingStop) {
//                 onRecordingStop();
//             }
//         }
//     }, [isRecording, recordingDuration, maxDuration, stopRecording, onRecordingStop]);

//     // Cleanup on unmount
//     useEffect(() => {
//         return () => {
//             if (frameInterval) {
//                 clearInterval(frameInterval);
//             }
//             stopPreview();
//         };
//     }, [frameInterval, stopPreview]);

//     const handleStartRecording = async () => {
//         try {
//             console.log('🎬 Starting recording...');
//             await startRecording();
//         } catch (err) {
//             console.error('❌ Failed to start recording:', err);
//         }
//     };

//     const handleStopRecording = () => {
//         console.log('⏹️ Stopping recording...');
//         stopRecording();
//         if (onRecordingStop) {
//             onRecordingStop();
//         }
//     };

//     const handleCameraSwitch = (deviceId) => {
//         console.log('🔄 Switching camera to:', deviceId);
//         switchCamera(deviceId);
//         setShowSettings(false);
//     };

//     const handleRetry = () => {
//         console.log('🔄 Retrying camera setup...');
//         clearRecording();
//         setVideoReady(false);
//         setDebugInfo({ hasStream: false, videoPlaying: false, videoDimensions: { width: 0, height: 0 } });
//         requestPermission().catch(console.error);
//     };

//     // Progress calculation
//     const progressPercentage = maxDuration > 0 ? (recordingDuration / maxDuration) * 100 : 0;
//     const remainingTime = maxDuration - recordingDuration;

//     if (!isSupported) {
//         return (
//             <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
//                 <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                     Camera Not Supported
//                 </h3>
//                 <p className="text-gray-600">
//                     Your browser doesn't support camera access. Please use a modern browser like Chrome, Firefox, or Safari.
//                 </p>
//             </div>
//         );
//     }

//     if (hasPermission === false) {
//         return (
//             <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
//                 <Camera className="w-12 h-12 text-gray-500 mx-auto mb-4" />
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                     Camera Permission Required
//                 </h3>
//                 <p className="text-gray-600 mb-4">
//                     {error || 'Please allow camera access to continue with the interview.'}
//                 </p>
//                 <Button onClick={requestPermission} className="bg-blue-600 hover:bg-blue-700">
//                     <Camera className="w-4 h-4 mr-2" />
//                     Enable Camera
//                 </Button>
//             </div>
//         );
//     }

//     return (
//         <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
//             {/* FIXED: Enhanced Video Element with better debugging */}
//             <video
//                 ref={videoRef}
//                 autoPlay
//                 muted
//                 playsInline
//                 className="w-full h-full object-cover"
//                 style={{ transform: 'scaleX(-1)' }} // Mirror effect
//                 onLoadedMetadata={() => console.log('📺 Video metadata loaded in component')}
//                 onCanPlay={() => console.log('▶️ Video can play in component')}
//                 onPlaying={() => console.log('✅ Video playing in component')}
//                 onError={(e) => console.error('❌ Video error in component:', e)}
//             />

//             {/* FIXED: Enhanced Debug Info Display */}
//             <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono">
//                 <div className={`${debugInfo.hasStream ? 'text-green-300' : 'text-red-300'}`}>
//                     Stream: {debugInfo.hasStream ? '✅' : '❌'}
//                 </div>
//                 <div className={`${debugInfo.videoPlaying ? 'text-green-300' : 'text-yellow-300'}`}>
//                     Playing: {debugInfo.videoPlaying ? '✅' : '⏳'}
//                 </div>
//                 <div className={`${videoReady ? 'text-green-300' : 'text-yellow-300'}`}>
//                     Ready: {videoReady ? '✅' : '⏳'}
//                 </div>
//                 <div className="text-blue-300">
//                     Dims: {debugInfo.videoDimensions.width}x{debugInfo.videoDimensions.height}
//                 </div>
//                 <div className={`${hasPermission ? 'text-green-300' : 'text-red-300'}`}>
//                     Perm: {hasPermission ? '✅' : '❌'}
//                 </div>
//             </div>

//             {/* Recording Indicator */}
//             {isRecording && (
//                 <div className="absolute top-4 right-4 flex items-center space-x-2">
//                     <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
//                     <span className="text-white font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
//                         REC {formatDuration(recordingDuration)}
//                     </span>
//                 </div>
//             )}

//             {/* Confidence Score Display */}
//             {isInterviewActive && isPreviewing && videoReady && (
//                 <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-lg p-2">
//                     <div className="flex items-center space-x-2 text-white text-sm">
//                         {faceDetected ? (
//                             <CheckCircle className="w-4 h-4 text-green-400" />
//                         ) : (
//                             <AlertCircle className="w-4 h-4 text-yellow-400" />
//                         )}
//                         <span>
//                             {faceDetected ? 'Face Detected' : 'No Face'} 
//                             {confidenceScore > 0 && ` (${confidenceScore}%)`}
//                         </span>
//                     </div>
//                 </div>
//             )}

//             {/* Recording Progress Bar */}
//             {isRecording && maxDuration > 0 && (
//                 <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
//                     <div 
//                         className="h-full bg-red-500 transition-all duration-1000"
//                         style={{ width: `${progressPercentage}%` }}
//                     />
//                 </div>
//             )}

//             {/* Time Remaining Warning */}
//             {isRecording && remainingTime <= 30 && remainingTime > 0 && (
//                 <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
//                     <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium animate-pulse">
//                         {remainingTime}s remaining
//                     </div>
//                 </div>
//             )}

//             {/* FIXED: Enhanced Controls Overlay */}
//             {showControls && isPreviewing && (
//                 <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
//                     {/* Settings Button */}
//                     {devices.length > 1 && (
//                         <Button
//                             onClick={() => setShowSettings(true)}
//                             variant="secondary"
//                             size="sm"
//                             className="bg-black bg-opacity-50 text-white border-white border-opacity-30 hover:bg-opacity-70"
//                         >
//                             <Settings className="w-4 h-4" />
//                         </Button>
//                     )}

//                     {/* Recording Control */}
//                     {!recordedBlob && (
//                         <Button
//                             onClick={isRecording ? handleStopRecording : handleStartRecording}
//                             className={`w-16 h-16 rounded-full flex items-center justify-center ${
//                                 isRecording 
//                                     ? 'bg-red-600 hover:bg-red-700' 
//                                     : 'bg-blue-600 hover:bg-blue-700'
//                             }`}
//                             disabled={!videoReady}
//                         >
//                             {isRecording ? (
//                                 <Square className="w-6 h-6 text-white" />
//                             ) : (
//                                 <Play className="w-6 h-6 text-white ml-1" />
//                             )}
//                         </Button>
//                     )}

//                     {/* Retry Button */}
//                     {recordedBlob && (
//                         <Button
//                             onClick={handleRetry}
//                             variant="secondary"
//                             size="sm"
//                             className="bg-black bg-opacity-50 text-white border-white border-opacity-30 hover:bg-opacity-70"
//                         >
//                             <RotateCcw className="w-4 h-4 mr-2" />
//                             Retry
//                         </Button>
//                     )}
//                 </div>
//             )}

//             {/* Error Overlay */}
//             {error && (
//                 <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
//                     <div className="text-center text-white p-6">
//                         <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//                         <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
//                         <p className="text-gray-300 mb-4">{error}</p>
//                         <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">
//                             Try Again
//                         </Button>
//                     </div>
//                 </div>
//             )}

//             {/* FIXED: Enhanced Loading Overlay */}
//             {hasPermission === true && !videoReady && !error && (
//                 <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
//                     <div className="text-center text-white">
//                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
//                         <p className="mb-2">Setting up camera...</p>
//                         <p className="text-sm text-gray-300">
//                             Stream: {debugInfo.hasStream ? 'Connected' : 'Connecting...'}
//                         </p>
//                         <p className="text-sm text-gray-300">
//                             Video: {debugInfo.videoPlaying ? 'Playing' : 'Loading...'}
//                         </p>
//                     </div>
//                 </div>
//             )}

//             {/* Initial Permission Loading */}
//             {hasPermission === null && !error && (
//                 <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
//                     <div className="text-center text-white">
//                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
//                         <p>Initializing camera...</p>
//                     </div>
//                 </div>
//             )}

//             {/* Camera Settings Modal */}
//             {showSettings && (
//                 <Modal
//                     isOpen={showSettings}
//                     onClose={() => setShowSettings(false)}
//                     title="Camera Settings"
//                 >
//                     <div className="space-y-4">
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Select Camera
//                             </label>
//                             <div className="space-y-2">
//                                 {devices.map((device) => (
//                                     <button
//                                         key={device.deviceId}
//                                         onClick={() => handleCameraSwitch(device.deviceId)}
//                                         className={`w-full text-left p-3 rounded-lg border transition-colors ${
//                                             selectedDeviceId === device.deviceId
//                                                 ? 'border-blue-500 bg-blue-50 text-blue-700'
//                                                 : 'border-gray-300 hover:border-gray-400'
//                                         }`}
//                                     >
//                                         <div className="font-medium">
//                                             {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
//                                         </div>
//                                         {selectedDeviceId === device.deviceId && (
//                                             <div className="text-sm text-blue-600 mt-1">
//                                                 Currently selected
//                                             </div>
//                                         )}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>
                        
//                         {/* Debug Information */}
//                         <div className="mt-4 p-3 bg-gray-50 rounded-lg">
//                             <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Info</h4>
//                             <div className="text-xs text-gray-600 space-y-1">
//                                 <div>Stream: {debugInfo.hasStream ? 'Active' : 'Inactive'}</div>
//                                 <div>Video Playing: {debugInfo.videoPlaying ? 'Yes' : 'No'}</div>
//                                 <div>Ready: {videoReady ? 'Yes' : 'No'}</div>
//                                 <div>Dimensions: {debugInfo.videoDimensions.width}x{debugInfo.videoDimensions.height}</div>
//                                 <div>Devices: {devices.length}</div>
//                             </div>
//                         </div>
//                     </div>
//                 </Modal>
//             )}
//         </div>
//     );
// };

// export default VideoCapture;



// Simple Camera Component - Replace VideoCapture with this
import React, { useRef, useEffect, useState } from 'react';

const SimpleCameraFeed = ({ className = "" }) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        console.log('🎥 Requesting camera access...');
        setIsLoading(true);
        setError(null);

        // Simple camera request
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false // Start with video only for simplicity
        });

        console.log('✅ Camera stream obtained');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            console.log('📺 Video metadata loaded');
            videoRef.current.play()
              .then(() => {
                console.log('▶️ Video playing');
                setIsLoading(false);
                setHasPermission(true);
              })
              .catch((playError) => {
                console.error('❌ Play error:', playError);
                setError('Failed to play video');
                setIsLoading(false);
              });
          };

          videoRef.current.onerror = (e) => {
            console.error('❌ Video error:', e);
            setError('Video playback error');
            setIsLoading(false);
          };
        }

      } catch (err) {
        console.error('❌ Camera error:', err);
        let errorMessage = 'Camera access failed';
        
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application.';
        }
        
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    startCamera();

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('🛑 Stopped camera track');
        });
      }
    };
  }, []);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    window.location.reload(); // Simple retry by reloading
  };

  if (error) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="flex items-center justify-center h-full min-h-[300px] text-white">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
            <p className="text-sm text-gray-300 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // Mirror effect
      />

      {/* Live Indicator */}
      {hasPermission && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          🔴 LIVE
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p>Starting camera...</p>
          </div>
        </div>
      )}

      {/* Status Info */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs">
        {hasPermission ? '📹 Camera Active' : '⏳ Connecting...'}
      </div>
    </div>
  );
};

export default SimpleCameraFeed;