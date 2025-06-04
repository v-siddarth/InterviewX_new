// frontend/src/components/interview/AnswerInput.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Save, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

const AnswerInput = ({
    question,
    currentAnswer = '',
    onAnswerChange,
    onSave,
    questionStatus,
    isReadOnly = false,
    placeholder = "Type your answer here...",
    maxLength = 5000,
    minLength = 50,
    showWordCount = true,
    showSaveButton = true,
    autoSave = true,
    autoSaveDelay = 2000,
    className = ""
}) => {
    const [text, setText] = useState(currentAnswer);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);

    // Update local text when current answer changes
    useEffect(() => {
        setText(currentAnswer);
    }, [currentAnswer]);

    // Auto-save functionality
    useEffect(() => {
        if (autoSave && text !== currentAnswer && text.trim().length > 0) {
            // Clear existing timeout
            if (autoSaveTimeout) {
                clearTimeout(autoSaveTimeout);
            }

            // Set new timeout
            const timeout = setTimeout(() => {
                handleSave(text);
            }, autoSaveDelay);

            setAutoSaveTimeout(timeout);

            // Cleanup
            return () => {
                if (timeout) {
                    clearTimeout(timeout);
                }
            };
        }
    }, [text, currentAnswer, autoSave, autoSaveDelay, autoSaveTimeout]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimeout) {
                clearTimeout(autoSaveTimeout);
            }
        };
    }, [autoSaveTimeout]);

    const handleTextChange = (e) => {
        const newText = e.target.value;
        
        // Enforce max length
        if (newText.length <= maxLength) {
            setText(newText);
            
            // Immediate callback for real-time updates
            if (onAnswerChange) {
                onAnswerChange(newText);
            }
        }
    };

    const handleSave = useCallback(async (textToSave = text) => {
        if (!onSave || isSaving) return;

        try {
            setIsSaving(true);
            setSaveError(null);

            await onSave(textToSave);
            setLastSaved(new Date());
        } catch (error) {
            console.error('Failed to save answer:', error);
            setSaveError(error.message || 'Failed to save answer');
        } finally {
            setIsSaving(false);
        }
    }, [text, onSave, isSaving]);

    const handleManualSave = () => {
        handleSave();
    };

    const getWordCount = () => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const getCharacterCount = () => {
        return text.length;
    };

    const isValidLength = () => {
        const wordCount = getWordCount();
        return wordCount >= Math.floor(minLength / 6); // Roughly 6 chars per word
    };

    const getTextAreaHeight = () => {
        // Dynamic height based on content
        const lineCount = text.split('\n').length;
        const minHeight = 150;
        const maxHeight = 400;
        const lineHeight = 24;
        
        const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, lineCount * lineHeight + 50));
        return calculatedHeight;
    };

    const formatLastSaved = () => {
        if (!lastSaved) return null;
        
        const now = new Date();
        const diff = Math.floor((now - lastSaved) / 1000);
        
        if (diff < 60) return 'Saved just now';
        if (diff < 3600) return `Saved ${Math.floor(diff / 60)} minutes ago`;
        return `Saved at ${lastSaved.toLocaleTimeString()}`;
    };

    // Don't render if question doesn't allow text input
    if (!question?.allowText) {
        return null;
    }

    const isDisabled = isReadOnly || questionStatus === 'completed' || questionStatus === 'evaluating' || questionStatus === 'submitting';

    return (
        <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Text Answer</h3>
                    {questionStatus === 'completed' && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            Submitted
                        </span>
                    )}
                </div>

                {showSaveButton && !isDisabled && (
                    <Button
                        onClick={handleManualSave}
                        disabled={isSaving || text === currentAnswer}
                        size="sm"
                        variant="secondary"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Text Area */}
            <div className="p-4">
                <textarea
                    value={text}
                    onChange={handleTextChange}
                    placeholder={isDisabled ? "Answer submitted" : placeholder}
                    disabled={isDisabled}
                    className={`w-full resize-none border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        isDisabled 
                            ? 'bg-gray-50 text-gray-600 cursor-not-allowed' 
                            : 'bg-white text-gray-900'
                    }`}
                    style={{ height: `${getTextAreaHeight()}px` }}
                    rows={6}
                />

                {/* Status Bar */}
                <div className="flex items-center justify-between mt-3 text-sm">
                    <div className="flex items-center space-x-4">
                        {/* Word/Character Count */}
                        {showWordCount && (
                            <div className="flex items-center space-x-2">
                                <span className={`${
                                    getCharacterCount() > maxLength * 0.9 
                                        ? 'text-red-600' 
                                        : getCharacterCount() > maxLength * 0.7 
                                        ? 'text-yellow-600' 
                                        : 'text-gray-600'
                                }`}>
                                    {getWordCount()} words
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className={`${
                                    getCharacterCount() > maxLength * 0.9 
                                        ? 'text-red-600' 
                                        : 'text-gray-600'
                                }`}>
                                    {getCharacterCount()}/{maxLength} characters
                                </span>
                            </div>
                        )}

                        {/* Length Validation */}
                        {!isValidLength() && text.trim().length > 0 && (
                            <div className="flex items-center space-x-1 text-yellow-600">
                                <AlertCircle className="w-4 h-4" />
                                <span>Answer too short</span>
                            </div>
                        )}
                    </div>

                    {/* Save Status */}
                    <div className="flex items-center space-x-2">
                        {isSaving && (
                            <div className="flex items-center space-x-2 text-blue-600">
                                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span>Saving...</span>
                            </div>
                        )}

                        {saveError && (
                            <div className="flex items-center space-x-1 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span>Save failed</span>
                            </div>
                        )}

                        {!isSaving && !saveError && lastSaved && autoSave && (
                            <span className="text-gray-500">
                                {formatLastSaved()}
                            </span>
                        )}

                        {!isSaving && !saveError && text !== currentAnswer && text.trim().length > 0 && autoSave && (
                            <span className="text-yellow-600">
                                Unsaved changes
                            </span>
                        )}
                    </div>
                </div>

                {/* Guidelines */}
                {!isDisabled && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Writing Tips:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Be specific and provide concrete examples</li>
                            <li>• Structure your answer with clear points</li>
                            <li>• Address all parts of the question</li>
                            <li>• Minimum {Math.floor(minLength / 6)} words recommended</li>
                        </ul>
                    </div>
                )}

                {/* Error Display */}
                {saveError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{saveError}</span>
                        </div>
                    </div>
                )}

                {/* Submit Warning */}
                {getCharacterCount() > maxLength * 0.9 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-yellow-700">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">
                                You're approaching the character limit. Consider being more concise.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnswerInput;