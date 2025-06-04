// frontend/src/components/interview/VideoCapture.jsx
import React, { useEffect, useState } from 'react';
import { Camera, Square, Play, Pause, RotateCcw, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const VideoCapture = ({ 
    onRecordingComplete, 
    onRecordingStart, 
    onRecordingStop,
    onFrameCapture,
    isInterviewActive = false,
    maxDuration = 300, // 5 minutes default
    showControls = true,
    autoStart = false,
    className = ""
}) => {
    const {
        isRecording,
        isPreviewing,
        hasPermission,
        error,
        devices,
        selectedDeviceId,
        recordedBlob,
        recordingDuration,
        videoRef,
        requestPermission,
        startRecording,
        stopRecording,
        stopPreview,
        switchCamera,
        getCurrentFrame,
        clearRecording,
        formatDuration,
        isSupported
    } = useCamera();

    const [showSettings, setShowSettings] = useState(false);
    const [frameInterval, setFrameInterval] = useState(null);
    const [confidenceScore, setConfidenceScore] = useState(0);
    const [faceDetected, setFaceDetected] = useState(false);

    // Handle permission request on mount or auto start
    useEffect(() => {
        if (isSupported && (autoStart || isInterviewActive)) {
            requestPermission().catch(console.error);
        }
    }, [isSupported, autoStart, isInterviewActive, requestPermission]);

    // Handle frame capture for real-time analysis
    useEffect(() => {
        if (isPreviewing && onFrameCapture && isInterviewActive) {
            const interval = setInterval(() => {
                const frameData = getCurrentFrame();
                if (frameData) {
                    onFrameCapture(frameData);
                }
            }, 1000); // Capture frame every second

            setFrameInterval(interval);
            return () => {
                if (interval) clearInterval(interval);
            };
        } else if (frameInterval) {
            clearInterval(frameInterval);
            setFrameInterval(null);
        }
    }, [isPreviewing, onFrameCapture, isInterviewActive, getCurrentFrame, frameInterval]);

    // Handle recording callbacks
    useEffect(() => {
        if (isRecording && onRecordingStart) {
            onRecordingStart();
        }
    }, [isRecording, onRecordingStart]);

    useEffect(() => {
        if (!isRecording && recordedBlob && onRecordingComplete) {
            onRecordingComplete(recordedBlob);
        }
    }, [isRecording, recordedBlob, onRecordingComplete]);

    // Handle max duration
    useEffect(() => {
        if (isRecording && recordingDuration >= maxDuration) {
            stopRecording();
            if (onRecordingStop) {
                onRecordingStop();
            }
        }
    }, [isRecording, recordingDuration, maxDuration, stopRecording, onRecordingStop]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (frameInterval) {
                clearInterval(frameInterval);
            }
            stopPreview();
        };
    }, [frameInterval, stopPreview]);

    const handleStartRecording = async () => {
        try {
            await startRecording();
        } catch (err) {
            console.error('Failed to start recording:', err);
        }
    };

    const handleStopRecording = () => {
        stopRecording();
        if (onRecordingStop) {
            onRecordingStop();
        }
    };

    const handleCameraSwitch = (deviceId) => {
        switchCamera(deviceId);
        setShowSettings(false);
    };

    const handleRetry = () => {
        clearRecording();
        requestPermission().catch(console.error);
    };

    // Progress calculation
    const progressPercentage = maxDuration > 0 ? (recordingDuration / maxDuration) * 100 : 0;
    const remainingTime = maxDuration - recordingDuration;

    if (!isSupported) {
        return (
            <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Camera Not Supported
                </h3>
                <p className="text-gray-600">
                    Your browser doesn't support camera access. Please use a modern browser like Chrome, Firefox, or Safari.
                </p>
            </div>
        );
    }

    if (hasPermission === false) {
        return (
            <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
                <Camera className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Camera Permission Required
                </h3>
                <p className="text-gray-600 mb-4">
                    {error || 'Please allow camera access to continue with the interview.'}
                </p>
                <Button onClick={requestPermission} className="bg-blue-600 hover:bg-blue-700">
                    <Camera className="w-4 h-4 mr-2" />
                    Enable Camera
                </Button>
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

            {/* Recording Indicator */}
            {isRecording && (
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                        REC {formatDuration(recordingDuration)}
                    </span>
                </div>
            )}

            {/* Confidence Score Display */}
            {isInterviewActive && isPreviewing && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-lg p-2">
                    <div className="flex items-center space-x-2 text-white text-sm">
                        {faceDetected ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                        )}
                        <span>
                            {faceDetected ? 'Face Detected' : 'No Face'} 
                            {confidenceScore > 0 && ` (${confidenceScore}%)`}
                        </span>
                    </div>
                </div>
            )}

            {/* Recording Progress Bar */}
            {isRecording && maxDuration > 0 && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
                    <div 
                        className="h-full bg-red-500 transition-all duration-1000"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            )}

            {/* Time Remaining Warning */}
            {isRecording && remainingTime <= 30 && remainingTime > 0 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                        {remainingTime}s remaining
                    </div>
                </div>
            )}

            {/* Controls Overlay */}
            {showControls && isPreviewing && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                    {/* Settings Button */}
                    {devices.length > 1 && (
                        <Button
                            onClick={() => setShowSettings(true)}
                            variant="secondary"
                            size="sm"
                            className="bg-black bg-opacity-50 text-white border-white border-opacity-30 hover:bg-opacity-70"
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                    )}

                    {/* Recording Control */}
                    {!recordedBlob && (
                        <Button
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                isRecording 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                            disabled={!isPreviewing}
                        >
                            {isRecording ? (
                                <Square className="w-6 h-6 text-white" />
                            ) : (
                                <Play className="w-6 h-6 text-white ml-1" />
                            )}
                        </Button>
                    )}

                    {/* Retry Button */}
                    {recordedBlob && (
                        <Button
                            onClick={handleRetry}
                            variant="secondary"
                            size="sm"
                            className="bg-black bg-opacity-50 text-white border-white border-opacity-30 hover:bg-opacity-70"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                    )}
                </div>
            )}

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                    <div className="text-center text-white p-6">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
                        <p className="text-gray-300 mb-4">{error}</p>
                        <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">
                            Try Again
                        </Button>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {hasPermission === null && !error && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                    <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                        <p>Initializing camera...</p>
                    </div>
                </div>
            )}

            {/* Camera Settings Modal */}
            {showSettings && (
                <Modal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    title="Camera Settings"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Camera
                            </label>
                            <div className="space-y-2">
                                {devices.map((device) => (
                                    <button
                                        key={device.deviceId}
                                        onClick={() => handleCameraSwitch(device.deviceId)}
                                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                            selectedDeviceId === device.deviceId
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        <div className="font-medium">
                                            {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                                        </div>
                                        {selectedDeviceId === device.deviceId && (
                                            <div className="text-sm text-blue-600 mt-1">
                                                Currently selected
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default VideoCapture;