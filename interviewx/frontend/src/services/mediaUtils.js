// frontend/src/services/mediaUtils.js
/**
 * Media utilities for handling video, audio, and file operations
 */

export class MediaUtils {
    /**
     * Convert blob to base64 string
     * @param {Blob} blob - The blob to convert
     * @returns {Promise<string>} Base64 string
     */
    static blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Convert base64 string to blob
     * @param {string} base64 - Base64 string
     * @param {string} mimeType - MIME type
     * @returns {Blob} Blob object
     */
    static base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    /**
     * Get media duration from blob
     * @param {Blob} blob - Media blob
     * @param {string} type - 'video' or 'audio'
     * @returns {Promise<number>} Duration in seconds
     */
    static getMediaDuration(blob, type = 'video') {
        return new Promise((resolve, reject) => {
            const element = type === 'video' ? document.createElement('video') : document.createElement('audio');
            const url = URL.createObjectURL(blob);
            
            element.onloadedmetadata = () => {
                URL.revokeObjectURL(url);
                resolve(element.duration || 0);
            };
            
            element.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load media'));
            };
            
            element.src = url;
        });
    }

    /**
     * Get video dimensions from blob
     * @param {Blob} videoBlob - Video blob
     * @returns {Promise<Object>} Object with width and height
     */
    static getVideoDimensions(videoBlob) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const url = URL.createObjectURL(videoBlob);
            
            video.onloadedmetadata = () => {
                URL.revokeObjectURL(url);
                resolve({
                    width: video.videoWidth,
                    height: video.videoHeight
                });
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load video'));
            };
            
            video.src = url;
        });
    }

    /**
     * Compress video blob
     * @param {Blob} videoBlob - Original video blob
     * @param {Object} options - Compression options
     * @returns {Promise<Blob>} Compressed video blob
     */
    static compressVideo(videoBlob, options = {}) {
        const {
            maxWidth = 1280,
            maxHeight = 720,
            quality = 0.8,
            frameRate = 30
        } = options;

        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const url = URL.createObjectURL(videoBlob);
            
            video.onloadedmetadata = () => {
                const { videoWidth, videoHeight } = video;
                
                // Calculate new dimensions maintaining aspect ratio
                let newWidth = videoWidth;
                let newHeight = videoHeight;
                
                if (videoWidth > maxWidth || videoHeight > maxHeight) {
                    const widthRatio = maxWidth / videoWidth;
                    const heightRatio = maxHeight / videoHeight;
                    const ratio = Math.min(widthRatio, heightRatio);
                    
                    newWidth = Math.round(videoWidth * ratio);
                    newHeight = Math.round(videoHeight * ratio);
                }
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                // Create MediaRecorder for compressed output
                const stream = canvas.captureStream(frameRate);
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp8',
                    videoBitsPerSecond: quality * 2500000 // Base 2.5Mbps
                });
                
                const chunks = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };
                
                mediaRecorder.onstop = () => {
                    const compressedBlob = new Blob(chunks, { type: 'video/webm' });
                    URL.revokeObjectURL(url);
                    resolve(compressedBlob);
                };
                
                mediaRecorder.onerror = (error) => {
                    URL.revokeObjectURL(url);
                    reject(error);
                };
                
                // Start recording and play video
                mediaRecorder.start();
                video.play();
                
                // Draw frames to canvas
                const drawFrame = () => {
                    if (!video.paused && !video.ended) {
                        ctx.drawImage(video, 0, 0, newWidth, newHeight);
                        requestAnimationFrame(drawFrame);
                    } else {
                        mediaRecorder.stop();
                    }
                };
                
                video.onplay = () => drawFrame();
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load video for compression'));
            };
            
            video.src = url;
        });
    }

    /**
     * Extract thumbnail from video
     * @param {Blob} videoBlob - Video blob
     * @param {number} timeOffset - Time offset in seconds
     * @param {Object} options - Thumbnail options
     * @returns {Promise<Blob>} Thumbnail image blob
     */
    static extractVideoThumbnail(videoBlob, timeOffset = 1, options = {}) {
        const {
            width = 320,
            height = 240,
            format = 'image/jpeg',
            quality = 0.8
        } = options;

        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const url = URL.createObjectURL(videoBlob);
            
            video.onloadedmetadata = () => {
                video.currentTime = Math.min(timeOffset, video.duration - 1);
            };
            
            video.onseeked = () => {
                canvas.width = width;
                canvas.height = height;
                
                // Draw video frame to canvas
                ctx.drawImage(video, 0, 0, width, height);
                
                // Convert canvas to blob
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    resolve(blob);
                }, format, quality);
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load video for thumbnail'));
            };
            
            video.src = url;
        });
    }

    /**
     * Compress audio blob
     * @param {Blob} audioBlob - Original audio blob
     * @param {Object} options - Compression options
     * @returns {Promise<Blob>} Compressed audio blob
     */
    static compressAudio(audioBlob, options = {}) {
        const {
            bitRate = 128000,
            sampleRate = 44100
        } = options;

        return new Promise((resolve, reject) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const reader = new FileReader();
            
            reader.onload = async () => {
                try {
                    const arrayBuffer = reader.result;
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    // Create offline context for processing
                    const offlineContext = new OfflineAudioContext(
                        1, // mono
                        audioBuffer.duration * sampleRate,
                        sampleRate
                    );
                    
                    const source = offlineContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(offlineContext.destination);
                    source.start();
                    
                    const renderedBuffer = await offlineContext.startRendering();
                    
                    // Convert to WAV (simplified compression)
                    const wav = this.audioBufferToWav(renderedBuffer);
                    const compressedBlob = new Blob([wav], { type: 'audio/wav' });
                    
                    resolve(compressedBlob);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read audio file'));
            reader.readAsArrayBuffer(audioBlob);
        });
    }

    /**
     * Convert AudioBuffer to WAV format
     * @param {AudioBuffer} buffer - Audio buffer
     * @returns {ArrayBuffer} WAV data
     */
    static audioBufferToWav(buffer) {
        const length = buffer.length;
        const sampleRate = buffer.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        const channels = buffer.getChannelData(0);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);
        
        // Convert samples
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channels[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }
        
        return arrayBuffer;
    }

    /**
     * Validate file type and size
     * @param {File|Blob} file - File to validate
     * @param {Object} constraints - Validation constraints
     * @returns {Object} Validation result
     */
    static validateFile(file, constraints = {}) {
        const {
            maxSize = 100 * 1024 * 1024, // 100MB
            allowedTypes = [],
            minDuration = 0,
            maxDuration = 600 // 10 minutes
        } = constraints;

        const result = {
            valid: true,
            errors: []
        };

        // Check file size
        if (file.size > maxSize) {
            result.valid = false;
            result.errors.push(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds limit (${Math.round(maxSize / 1024 / 1024)}MB)`);
        }

        // Check file type
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            result.valid = false;
            result.errors.push(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        }

        return result;
    }

    /**
     * Create download link for blob
     * @param {Blob} blob - Blob to download
     * @param {string} filename - Download filename
     */
    static downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    /**
     * Check browser media support
     * @returns {Object} Support information
     */
    static getMediaSupport() {
        const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const hasMediaRecorder = !!window.MediaRecorder;
        
        const videoCodecs = [];
        const audioCodecs = [];
        
        if (hasMediaRecorder) {
            // Test video codecs
            const videoTypes = [
                'video/webm;codecs=vp8',
                'video/webm;codecs=vp9',
                'video/mp4;codecs=avc1.42E01E',
                'video/mp4;codecs=avc1.64001E'
            ];
            
            videoTypes.forEach(type => {
                if (MediaRecorder.isTypeSupported(type)) {
                    videoCodecs.push(type);
                }
            });
            
            // Test audio codecs
            const audioTypes = [
                'audio/webm;codecs=opus',
                'audio/webm;codecs=vorbis',
                'audio/mp4;codecs=mp4a.40.2',
                'audio/mpeg'
            ];
            
            audioTypes.forEach(type => {
                if (MediaRecorder.isTypeSupported(type)) {
                    audioCodecs.push(type);
                }
            });
        }
        
        return {
            hasGetUserMedia,
            hasMediaRecorder,
            videoCodecs,
            audioCodecs,
            fullSupport: hasGetUserMedia && hasMediaRecorder && videoCodecs.length > 0 && audioCodecs.length > 0
        };
    }

    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted size string
     */
    static formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Format duration for display
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration string
     */
    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

export default MediaUtils;