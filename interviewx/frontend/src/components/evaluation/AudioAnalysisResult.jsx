// frontend/src/components/evaluation/AudioAnalysisResult.jsx
import React, { useState, useRef } from 'react';
import { Mic, Volume2, Clock, FileText, Play, Pause, AlertCircle, CheckCircle, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

const AudioAnalysisResult = ({ 
    analysis, 
    showDetails = true, 
    compact = false,
    className = "" 
}) => {
    const [isExpanded, setIsExpanded] = useState(!compact);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    if (!analysis) {
        return (
            <div className={`bg-gray-50 rounded-lg p-4 text-center ${className}`}>
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No audio analysis data available</p>
            </div>
        );
    }

    const {
        transcribedText = '',
        audioQualityScore = 0,
        speechClarity = 0,
        speakingPace = 'normal',
        volumeLevel = 'normal',
        backgroundNoise = 'low',
        durationSeconds = 0,
        wordCount = 0,
        wordsPerMinute = 0,
        pauseCount = 0,
        fillerWords = 0,
        sentimentScore = 0,
        audioUrl = null
    } = analysis;

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const getQualityLevel = (score) => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 70) return 'Fair';
        if (score >= 60) return 'Needs Improvement';
        return 'Poor';
    };

    const getPaceColor = (pace) => {
        switch (pace.toLowerCase()) {
            case 'optimal':
            case 'normal':
                return 'text-green-600';
            case 'fast':
            case 'slow':
                return 'text-yellow-600';
            default:
                return 'text-red-600';
        }
    };

    const getVolumeColor = (volume) => {
        switch (volume.toLowerCase()) {
            case 'optimal':
            case 'normal':
                return 'text-green-600';
            case 'loud':
            case 'quiet':
                return 'text-yellow-600';
            default:
                return 'text-red-600';
        }
    };

    const getNoiseColor = (noise) => {
        switch (noise.toLowerCase()) {
            case 'low':
            case 'minimal':
                return 'text-green-600';
            case 'moderate':
                return 'text-yellow-600';
            default:
                return 'text-red-600';
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = () => {
        if (!audioRef.current || !audioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const getSentimentColor = (score) => {
        if (score > 0.1) return 'text-green-600';
        if (score > -0.1) return 'text-gray-600';
        return 'text-red-600';
    };

    const getSentimentLabel = (score) => {
        if (score > 0.3) return 'Very Positive';
        if (score > 0.1) return 'Positive';
        if (score > -0.1) return 'Neutral';
        if (score > -0.3) return 'Negative';
        return 'Very Negative';
    };

    if (compact) {
        return (
            <div className={`bg-white rounded-lg border p-4 ${className}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getScoreBgColor(audioQualityScore)}`}>
                            <Mic className={`w-5 h-5 ${getScoreColor(audioQualityScore)}`} />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">Audio Quality</h3>
                            <div className="flex items-center space-x-2">
                                <span className={`text-2xl font-bold ${getScoreColor(audioQualityScore)}`}>
                                    {audioQualityScore}%
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    audioQualityScore >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {audioQualityScore >= 60 ? 'Passed' : 'Failed'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {showDetails && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                        </button>
                    )}
                </div>
                
                {isExpanded && showDetails && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-sm text-gray-600">Speech Clarity</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {speechClarity}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-gray-600">Duration</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {formatDuration(durationSeconds)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
            {/* Header */}
            <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${getScoreBgColor(audioQualityScore)}`}>
                            <Mic className={`w-6 h-6 ${getScoreColor(audioQualityScore)}`} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Audio Analysis</h2>
                            <p className="text-gray-600">Speech quality and communication assessment</p>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <div className="flex items-center space-x-2">
                            {audioQualityScore >= 60 ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className={`font-medium ${
                                audioQualityScore >= 60 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {audioQualityScore >= 60 ? 'Passed' : 'Failed'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Threshold: 60%
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Score */}
            <div className="p-6">
                <div className="text-center mb-6">
                    <div className={`text-5xl font-bold mb-2 ${getScoreColor(audioQualityScore)}`}>
                        {audioQualityScore}%
                    </div>
                    <div className="text-lg text-gray-600 mb-4">
                        Overall Audio Quality
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                        <div 
                            className={`h-3 rounded-full transition-all duration-1000 ${
                                audioQualityScore >= 80 ? 'bg-green-500' :
                                audioQualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(audioQualityScore, 100)}%` }}
                        />
                    </div>
                    
                    <div className="text-sm text-gray-600">
                        Quality Level: <span className="font-medium">{getQualityLevel(audioQualityScore)}</span>
                    </div>
                </div>

                {/* Audio Player */}
                {audioUrl && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Recorded Audio</span>
                            <button
                                onClick={handlePlayPause}
                                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {isPlaying ? (
                                    <Pause className="w-4 h-4" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                                <span>{isPlaying ? 'Pause' : 'Play'}</span>
                            </button>
                        </div>
                        <audio
                            ref={audioRef}
                            src={audioUrl}
                            onEnded={() => setIsPlaying(false)}
                            onPause={() => setIsPlaying(false)}
                            onPlay={() => setIsPlaying(true)}
                            className="hidden"
                        />
                    </div>
                )}

                {/* Detailed Metrics */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Technical Quality */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                            <BarChart3 className="w-4 h-4" />
                            <span>Technical Quality</span>
                        </h3>
                        
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Speech Clarity</span>
                                    <span className="font-medium">{speechClarity}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-1000 ${
                                            speechClarity >= 80 ? 'bg-green-500' :
                                            speechClarity >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${Math.min(speechClarity, 100)}%` }}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Speaking Pace</span>
                                <span className={`font-medium capitalize ${getPaceColor(speakingPace)}`}>
                                    {speakingPace}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Volume Level</span>
                                <span className={`font-medium capitalize ${getVolumeColor(volumeLevel)}`}>
                                    {volumeLevel}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Background Noise</span>
                                <span className={`font-medium capitalize ${getNoiseColor(backgroundNoise)}`}>
                                    {backgroundNoise}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Speech Metrics */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Speech Metrics</span>
                        </h3>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Duration</span>
                                <span className="font-medium">{formatDuration(durationSeconds)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Word Count</span>
                                <span className="font-medium">{wordCount.toLocaleString()}</span>
                            </div>
                            
                            {wordsPerMinute > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Words per Minute</span>
                                    <span className="font-medium">{wordsPerMinute}</span>
                                </div>
                            )}
                            
                            {pauseCount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Pauses</span>
                                    <span className="font-medium">{pauseCount}</span>
                                </div>
                            )}
                            
                            {fillerWords > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Filler Words</span>
                                    <span className="font-medium text-yellow-600">{fillerWords}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sentiment Analysis */}
                {sentimentScore !== 0 && (
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="font-medium text-gray-900 mb-3">Sentiment Analysis</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Overall Sentiment</span>
                            <div className="flex items-center space-x-2">
                                <span className={`font-medium ${getSentimentColor(sentimentScore)}`}>
                                    {getSentimentLabel(sentimentScore)}
                                </span>
                                <span className="text-sm text-gray-500">
                                    ({sentimentScore > 0 ? '+' : ''}{sentimentScore.toFixed(2)})
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transcription */}
                {transcribedText && (
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>Transcription</span>
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 leading-relaxed italic">
                                "{transcribedText}"
                            </p>
                        </div>
                    </div>
                )}

                {/* Analysis Info */}
                <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Audio analysis completed</span>
                        <div className="flex items-center space-x-4">
                            <span>Quality: {getQualityLevel(audioQualityScore)}</span>
                            <span>Duration: {formatDuration(durationSeconds)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioAnalysisResult;