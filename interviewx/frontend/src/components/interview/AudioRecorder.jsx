// frontend/src/components/interview/AudioRecorder.jsx
import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Square, Play, Pause, RotateCcw, Settings, AlertCircle, Volume2 } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const AudioRecorder = ({ 
    onRecordingComplete, 
    onRecordingStart, 
    onRecordingStop,
    onAudioChunk,
    isInterviewActive = false,
    maxDuration = 300, // 5 minutes default
    showControls = true,
    autoStart = false,
    visualFeedback = true,
    className = ""
}) => {
    const {
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
        formatDuration,
        getAudioLevelPercentage,
        getAudioChunks,
        isSupported
    } = useAudioRecorder();

    const [showSettings, setShowSettings] = useState(false);
    const [chunkInterval, setChunkInterval] = useState(null);
    const [transcription, setTranscription] = useState('');

    // Handle permission request on mount or auto start
    useEffect(() => {
        if (isSupported && (autoStart || isInterviewActive)) {
            requestPermission().catch(console.error);
        }
    }, [isSupported, autoStart, isInterviewActive, requestPermission]);

    // Handle audio chunk streaming for real-time analysis
    useEffect(() => {
        if (isRecording && onAudioChunk && isInterviewActive) {
            const interval = setInterval(() => {
                const chunks = getAudioChunks();
                if (chunks.length > 0) {
                    const latestChunk = chunks[chunks.length - 1];
                    onAudioChunk(latestChunk);
                }
            }, 2000); // Send chunks every 2 seconds

            setChunkInterval(interval);
            return () => {
                if (interval) clearInterval(interval);
            };
        } else if (chunkInterval) {
            clearInterval(chunkInterval);
            setChunkInterval(null);
        }
    }, [isRecording, onAudioChunk, isInterviewActive, getAudioChunks, chunkInterval]);

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
            if (chunkInterval) {
                clearInterval(chunkInterval);
            }
            stopStream();
        };
    }, [chunkInterval, stopStream]);

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

    const handleDeviceSwitch = (deviceId) => {
        switchDevice(deviceId);
        setShowSettings(false);
    };

    const handleRetry = () => {
        clearRecording();
        setTranscription('');
        requestPermission().catch(console.error);
    };

    // Progress calculation
    const progressPercentage = maxDuration > 0 ? (recordingDuration / maxDuration) * 100 : 0;
    const remainingTime = maxDuration - recordingDuration;
    const audioLevelPercentage = getAudioLevelPercentage();

    if (!isSupported) {
        return (
            <div className={`bg-gray-100 rounded-lg p-6 text-center ${className}`}>
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Microphone Not Supported
                </h3>
                <p className="text-gray-600">
                    Your browser doesn't support microphone access. Please use a modern browser.
                </p>
            </div>
        );
    }

    if (hasPermission === false) {
        return (
            <div className={`bg-gray-100 rounded-lg p-6 text-center ${className}`}>
                <Mic className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Microphone Permission Required
                </h3>
                <p className="text-gray-600 mb-4">
                    {error || 'Please allow microphone access to record your interview responses.'}
                </p>
                <Button onClick={requestPermission} className="bg-blue-600 hover:bg-blue-700">
                    <Mic className="w-4 h-4 mr-2" />
                    Enable Microphone
                </Button>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${isRecording ? 'bg-red-100' : 'bg-gray-100'}`}>
                        {isRecording ? (
                            <Mic className={`w-5 h-5 ${isPaused ? 'text-yellow-600' : 'text-red-600'}`} />
                        ) : (
                            <MicOff className="w-5 h-5 text-gray-600" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">
                            Audio Recorder
                        </h3>
                        <p className="text-sm text-gray-500">
                            {isRecording 
                                ? (isPaused ? 'Recording paused' : 'Recording...') 
                                : 'Ready to record'
                            }
                        </p>
                    </div>
                </div>

                {/* Settings Button */}
                {devices.length > 1 && (
                    <Button
                        onClick={() => setShowSettings(true)}
                        variant="secondary"
                        size="sm"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Visual Feedback */}
            {visualFeedback && hasPermission && (
                <div className="p-4 border-b">
                    {/* Audio Level Indicator */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600">Audio Level</span>
                            <span className="text-xs text-gray-500">{Math.round(audioLevelPercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-100 ${
                                    audioLevelPercentage > 70 ? 'bg-green-500' :
                                    audioLevelPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${audioLevelPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Recording Progress */}
                    {isRecording && (
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600">Duration</span>
                                <span className="text-xs text-gray-500">
                                    {formatDuration(recordingDuration)} / {formatDuration(maxDuration)}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-1000 ${
                                        progressPercentage > 90 ? 'bg-red-500' :
                                        progressPercentage > 70 ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Time Warning */}
                    {isRecording && remainingTime <= 30 && remainingTime > 0 && (
                        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-2 mb-3">
                            <div className="flex items-center">
                                <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                                <span className="text-sm text-yellow-800">
                                    {remainingTime} seconds remaining
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Real-time Transcription */}
                    {transcription && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center mb-2">
                                <Volume2 className="w-4 h-4 text-blue-600 mr-2" />
                                <span className="text-sm font-medium text-blue-800">Live Transcription</span>
                            </div>
                            <p className="text-sm text-blue-700 italic">
                                {transcription}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Controls */}
            {showControls && (
                <div className="p-4">
                    <div className="flex items-center justify-center space-x-3">
                        {/* Main Recording Control */}
                        {!recordedBlob && (
                            <>
                                {!isRecording ? (
                                    <Button
                                        onClick={handleStartRecording}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full"
                                        disabled={!hasPermission}
                                    >
                                        <Mic className="w-5 h-5 mr-2" />
                                        Start Recording
                                    </Button>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        {/* Pause/Resume */}
                                        <Button
                                            onClick={isPaused ? resumeRecording : pauseRecording}
                                            variant="secondary"
                                            className="px-4 py-2"
                                        >
                                            {isPaused ? (
                                                <Play className="w-4 h-4" />
                                            ) : (
                                                <Pause className="w-4 h-4" />
                                            )}
                                        </Button>

                                        {/* Stop */}
                                        <Button
                                            onClick={handleStopRecording}
                                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
                                        >
                                            <Square className="w-4 h-4 mr-2" />
                                            Stop
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Playback Controls */}
                        {recordedBlob && (
                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={isPlaying ? stopPlaying : playRecording}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                                >
                                    {isPlaying ? (
                                        <Square className="w-4 h-4 mr-2" />
                                    ) : (
                                        <Play className="w-4 h-4 mr-2" />
                                    )}
                                    {isPlaying ? 'Stop' : 'Play'}
                                </Button>

                                <Button
                                    onClick={handleRetry}
                                    variant="secondary"
                                    className="px-4 py-2"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Retry
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Status Text */}
                    <div className="text-center mt-3">
                        {isRecording && (
                            <p className="text-sm text-gray-600">
                                Recording: {formatDuration(recordingDuration)}
                                {isPaused && ' (Paused)'}
                            </p>
                        )}
                        {recordedBlob && !isRecording && (
                            <p className="text-sm text-green-600">
                                Recording complete: {formatDuration(recordingDuration)}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="p-4 border-t">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                            <span className="text-sm text-red-800">{error}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Device Settings Modal */}
            {showSettings && (
                <Modal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    title="Microphone Settings"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Microphone
                            </label>
                            <div className="space-y-2">
                                {devices.map((device) => (
                                    <button
                                        key={device.deviceId}
                                        onClick={() => handleDeviceSwitch(device.deviceId)}
                                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                            selectedDeviceId === device.deviceId
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        <div className="font-medium">
                                            {device.label || `Microphone ${device.deviceId.slice(0, 8)}...`}
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

export default AudioRecorder;