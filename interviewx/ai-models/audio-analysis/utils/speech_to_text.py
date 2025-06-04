#!/usr/bin/env python3
"""
Speech-to-Text Processing for InterviewX
Handles speech recognition and transcription with multiple engine support
"""

import logging
import numpy as np
import tempfile
import os
from typing import Dict, List, Optional, Tuple
import traceback

try:
    import speech_recognition as sr
    import soundfile as sf
    import librosa
    from pydub import AudioSegment
    import webrtcvad
except ImportError as e:
    logging.error(f"Required packages not installed: {e}")
    raise

# Configure logging
logger = logging.getLogger(__name__)

class SpeechToTextProcessor:
    """
    Speech-to-text processing with multiple engine support
    """
    
    def __init__(self):
        """Initialize speech-to-text processor"""
        self.version = "1.0.0"
        
        # Initialize speech recognition
        self.recognizer = sr.Recognizer()
        
        # Configure recognizer settings
        self.recognizer.energy_threshold = 300
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 0.8
        self.recognizer.operation_timeout = None
        self.recognizer.phrase_threshold = 0.3
        self.recognizer.non_speaking_duration = 0.8
        
        # Supported languages
        self.supported_languages = [
            'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-NZ', 'en-ZA',
            'es-ES', 'es-MX', 'fr-FR', 'fr-CA', 'de-DE', 'it-IT', 'pt-BR',
            'pt-PT', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'ar-SA',
            'hi-IN', 'th-TH', 'tr-TR', 'pl-PL', 'nl-NL', 'sv-SE', 'da-DK',
            'no-NO', 'fi-FI', 'cs-CZ', 'hu-HU', 'ro-RO', 'sk-SK', 'sl-SI',
            'hr-HR', 'bg-BG', 'et-EE', 'lv-LV', 'lt-LT', 'mt-MT', 'ga-IE'
        ]
        
        # Available engines
        self.engines = {
            'google': self._transcribe_google,
            'sphinx': self._transcribe_sphinx,
            'wit': self._transcribe_wit,
            'azure': self._transcribe_azure,
            'ibm': self._transcribe_ibm
        }
        
        # Default engine priority
        self.engine_priority = ['google', 'sphinx', 'wit']
        
        # VAD for voice activity detection
        self.vad = None
        try:
            self.vad = webrtcvad.Vad()
            self.vad.set_mode(2)  # Moderately aggressive
        except:
            logger.warning("WebRTC VAD not available, using energy-based VAD")
        
        logger.info("✅ Speech-to-text processor initialized")
    
    def transcribe_audio(self, audio_data: np.ndarray, sample_rate: int, 
                        language: str = 'en-US', include_timestamps: bool = False,
                        engine: str = 'auto') -> Dict:
        """
        Transcribe audio to text
        
        Args:
            audio_data: Audio signal array
            sample_rate: Sample rate of audio
            language: Language code for recognition
            include_timestamps: Whether to include word timestamps
            engine: Speech recognition engine to use
            
        Returns:
            Dictionary containing transcription results
        """
        try:
            logger.debug(f"Starting transcription with engine: {engine}, language: {language}")
            
            # Validate language
            if language not in self.supported_languages:
                logger.warning(f"Language {language} not supported, using en-US")
                language = 'en-US'
            
            # Preprocess audio
            processed_audio = self._preprocess_audio(audio_data, sample_rate)
            
            # Convert to audio data that speech_recognition can use
            audio_file = self._convert_to_wav_temp(processed_audio, sample_rate)
            
            try:
                # Load audio with speech_recognition
                with sr.AudioFile(audio_file) as source:
                    # Adjust for ambient noise
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    
                    # Record audio
                    audio_sr = self.recognizer.record(source)
                
                # Choose engine and transcribe
                if engine == 'auto':
                    result = self._transcribe_with_fallback(audio_sr, language, include_timestamps)
                else:
                    if engine in self.engines:
                        result = self.engines[engine](audio_sr, language, include_timestamps)
                    else:
                        logger.warning(f"Engine {engine} not available, using auto")
                        result = self._transcribe_with_fallback(audio_sr, language, include_timestamps)
                
                # Add metadata
                result['metadata'] = {
                    'engine_used': result.get('engine_used', 'unknown'),
                    'language': language,
                    'duration': len(audio_data) / sample_rate,
                    'sample_rate': sample_rate,
                    'audio_length': len(audio_data)
                }
                
                logger.info(f"Transcription complete: {len(result.get('transcription', ''))} characters")
                return result
                
            finally:
                # Cleanup temp file
                try:
                    os.unlink(audio_file)
                except:
                    pass
                    
        except Exception as e:
            logger.error(f"Error in speech transcription: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': str(e),
                'language_detected': language
            }
    
    def _preprocess_audio(self, audio_data: np.ndarray, sample_rate: int) -> np.ndarray:
        """Preprocess audio for better recognition"""
        try:
            # Normalize audio
            if np.max(np.abs(audio_data)) > 0:
                audio_normalized = audio_data / np.max(np.abs(audio_data))
            else:
                audio_normalized = audio_data
            
            # Resample to 16kHz if needed (standard for speech recognition)
            if sample_rate != 16000:
                audio_normalized = librosa.resample(audio_normalized, orig_sr=sample_rate, target_sr=16000)
                sample_rate = 16000
            
            # Apply pre-emphasis filter to balance frequency spectrum
            pre_emphasis = 0.97
            audio_normalized = np.append(audio_normalized[0], audio_normalized[1:] - pre_emphasis * audio_normalized[:-1])
            
            # Voice activity detection and trimming
            audio_trimmed = self._trim_silence(audio_normalized, sample_rate)
            
            return audio_trimmed
            
        except Exception as e:
            logger.error(f"Error in audio preprocessing: {str(e)}")
            return audio_data
    
    def _trim_silence(self, audio_data: np.ndarray, sample_rate: int) -> np.ndarray:
        """Remove silence from beginning and end of audio"""
        try:
            if self.vad is not None:
                # Use WebRTC VAD
                return self._trim_silence_vad(audio_data, sample_rate)
            else:
                # Use energy-based trimming
                return self._trim_silence_energy(audio_data)
                
        except Exception as e:
            logger.error(f"Error in silence trimming: {str(e)}")
            return audio_data
    
    def _trim_silence_vad(self, audio_data: np.ndarray, sample_rate: int) -> np.ndarray:
        """Trim silence using WebRTC VAD"""
        try:
            # Convert to 16-bit PCM
            audio_int16 = (audio_data * 32767).astype(np.int16)
            
            # Frame settings for VAD
            frame_duration = 30  # ms
            frame_length = int(sample_rate * frame_duration / 1000)
            
            # Find voice segments
            voice_frames = []
            for i in range(0, len(audio_int16) - frame_length, frame_length):
                frame = audio_int16[i:i + frame_length]
                is_speech = self.vad.is_speech(frame.tobytes(), sample_rate)
                voice_frames.append(is_speech)
            
            # Find start and end of speech
            if not any(voice_frames):
                return audio_data  # No speech detected, return original
            
            start_frame = next(i for i, is_voice in enumerate(voice_frames) if is_voice)
            end_frame = len(voice_frames) - 1 - next(i for i, is_voice in enumerate(reversed(voice_frames)) if is_voice)
            
            # Convert frame indices to sample indices
            start_sample = start_frame * frame_length
            end_sample = min((end_frame + 1) * frame_length, len(audio_data))
            
            return audio_data[start_sample:end_sample]
            
        except Exception as e:
            logger.error(f"Error in VAD trimming: {str(e)}")
            return self._trim_silence_energy(audio_data)
    
    def _trim_silence_energy(self, audio_data: np.ndarray) -> np.ndarray:
        """Trim silence using energy-based method"""
        try:
            # Calculate frame energies
            frame_length = 1024
            hop_length = 512
            
            frame_energies = []
            for i in range(0, len(audio_data) - frame_length, hop_length):
                frame = audio_data[i:i + frame_length]
                energy = np.sum(frame ** 2)
                frame_energies.append(energy)
            
            if not frame_energies:
                return audio_data
            
            frame_energies = np.array(frame_energies)
            
            # Determine threshold
            threshold = np.percentile(frame_energies, 20)  # Bottom 20th percentile
            
            # Find voice activity
            voice_frames = frame_energies > threshold
            
            if not np.any(voice_frames):
                return audio_data
            
            # Find start and end
            voice_indices = np.where(voice_frames)[0]
            start_frame = voice_indices[0]
            end_frame = voice_indices[-1]
            
            # Convert to sample indices
            start_sample = start_frame * hop_length
            end_sample = min((end_frame + 1) * hop_length + frame_length, len(audio_data))
            
            return audio_data[start_sample:end_sample]
            
        except Exception as e:
            logger.error(f"Error in energy-based trimming: {str(e)}")
            return audio_data
    
    def _convert_to_wav_temp(self, audio_data: np.ndarray, sample_rate: int) -> str:
        """Convert audio to temporary WAV file"""
        try:
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            temp_file.close()
            
            # Write audio data
            sf.write(temp_file.name, audio_data, sample_rate)
            
            return temp_file.name
            
        except Exception as e:
            logger.error(f"Error creating temp WAV file: {str(e)}")
            raise
    
    def _transcribe_with_fallback(self, audio_data, language: str, include_timestamps: bool) -> Dict:
        """Transcribe with engine fallback"""
        try:
            last_error = None
            
            for engine_name in self.engine_priority:
                try:
                    logger.debug(f"Trying engine: {engine_name}")
                    result = self.engines[engine_name](audio_data, language, include_timestamps)
                    result['engine_used'] = engine_name
                    return result
                    
                except Exception as e:
                    last_error = e
                    logger.warning(f"Engine {engine_name} failed: {str(e)}")
                    continue
            
            # All engines failed
            logger.error(f"All engines failed. Last error: {str(last_error)}")
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': f'All engines failed. Last error: {str(last_error)}',
                'engine_used': 'none'
            }
            
        except Exception as e:
            logger.error(f"Error in fallback transcription: {str(e)}")
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': str(e),
                'engine_used': 'none'
            }
    
    def _transcribe_google(self, audio_data, language: str, include_timestamps: bool) -> Dict:
        """Transcribe using Google Speech Recognition"""
        try:
            # Basic Google recognition
            transcription = self.recognizer.recognize_google(audio_data, language=language)
            
            return {
                'transcription': transcription,
                'confidence': 0.8,  # Google doesn't provide confidence in free version
                'language_detected': language,
                'timestamps': [] if include_timestamps else None
            }
            
        except sr.UnknownValueError:
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': 'Could not understand audio',
                'language_detected': language
            }
        except sr.RequestError as e:
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': f'Google API error: {str(e)}',
                'language_detected': language
            }
    
    def _transcribe_sphinx(self, audio_data, language: str, include_timestamps: bool) -> Dict:
        """Transcribe using PocketSphinx (offline)"""
        try:
            # PocketSphinx only supports English well
            if not language.startswith('en'):
                raise Exception("PocketSphinx only supports English")
            
            transcription = self.recognizer.recognize_sphinx(audio_data)
            
            return {
                'transcription': transcription,
                'confidence': 0.6,  # Lower confidence for offline recognition
                'language_detected': 'en-US',
                'timestamps': [] if include_timestamps else None
            }
            
        except sr.UnknownValueError:
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': 'Could not understand audio',
                'language_detected': language
            }
        except sr.RequestError as e:
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': f'Sphinx error: {str(e)}',
                'language_detected': language
            }
    
    def _transcribe_wit(self, audio_data, language: str, include_timestamps: bool) -> Dict:
        """Transcribe using Wit.ai"""
        try:
            # Note: Requires WIT_AI_KEY environment variable
            wit_key = os.getenv('WIT_AI_KEY')
            if not wit_key:
                raise Exception("WIT_AI_KEY not set")
            
            transcription = self.recognizer.recognize_wit(audio_data, key=wit_key)
            
            return {
                'transcription': transcription,
                'confidence': 0.7,
                'language_detected': language,
                'timestamps': [] if include_timestamps else None
            }
            
        except sr.UnknownValueError:
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': 'Could not understand audio',
                'language_detected': language
            }
        except sr.RequestError as e:
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': f'Wit.ai error: {str(e)}',
                'language_detected': language
            }
    
    def _transcribe_azure(self, audio_data, language: str, include_timestamps: bool) -> Dict:
        """Transcribe using Azure Speech"""
        try:
            # Note: Requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION
            azure_key = os.getenv('AZURE_SPEECH_KEY')
            azure_region = os.getenv('AZURE_SPEECH_REGION')
            
            if not azure_key or not azure_region:
                raise Exception("Azure credentials not set")
            
            transcription = self.recognizer.recognize_azure(
                audio_data, 
                key=azure_key, 
                location=azure_region,
                language=language
            )
            
            return {
                'transcription': transcription,
                'confidence': 0.85,
                'language_detected': language,
                'timestamps': [] if include_timestamps else None
            }
            
        except sr.UnknownValueError:
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': 'Could not understand audio',
                'language_detected': language
            }
        except sr.RequestError as e:
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': f'Azure error: {str(e)}',
                'language_detected': language
            }
    
    def _transcribe_ibm(self, audio_data, language: str, include_timestamps: bool) -> Dict:
        """Transcribe using IBM Watson"""
        try:
            # Note: Requires IBM_USERNAME and IBM_PASSWORD
            ibm_username = os.getenv('IBM_USERNAME')
            ibm_password = os.getenv('IBM_PASSWORD')
            
            if not ibm_username or not ibm_password:
                raise Exception("IBM credentials not set")
            
            transcription = self.recognizer.recognize_ibm(
                audio_data,
                username=ibm_username,
                password=ibm_password,
                language=language
            )
            
            return {
                'transcription': transcription,
                'confidence': 0.8,
                'language_detected': language,
                'timestamps': [] if include_timestamps else None
            }
            
        except sr.UnknownValueError:
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': 'Could not understand audio',
                'language_detected': language
            }
        except sr.RequestError as e:
            return {
                'transcription': '',
                'confidence': 0.0,
                'error': f'IBM error: {str(e)}',
                'language_detected': language
            }
    
    def transcribe_segments(self, audio_data: np.ndarray, sample_rate: int,
                          segment_length: float = 30.0, language: str = 'en-US') -> List[Dict]:
        """
        Transcribe audio in segments for long recordings
        
        Args:
            audio_data: Audio signal array
            sample_rate: Sample rate of audio
            segment_length: Length of each segment in seconds
            language: Language code
            
        Returns:
            List of transcription results for each segment
        """
        try:
            segments = []
            samples_per_segment = int(segment_length * sample_rate)
            
            for start in range(0, len(audio_data), samples_per_segment):
                end = min(start + samples_per_segment, len(audio_data))
                segment_audio = audio_data[start:end]
                
                # Skip very short segments
                if len(segment_audio) < sample_rate * 0.5:  # Less than 0.5 seconds
                    continue
                
                start_time = start / sample_rate
                end_time = end / sample_rate
                
                result = self.transcribe_audio(segment_audio, sample_rate, language)
                result['start_time'] = start_time
                result['end_time'] = end_time
                result['segment_duration'] = end_time - start_time
                
                segments.append(result)
            
            return segments
            
        except Exception as e:
            logger.error(f"Error in segment transcription: {str(e)}")
            return []
    
    def detect_language(self, audio_data: np.ndarray, sample_rate: int) -> str:
        """
        Detect language of audio (basic implementation)
        
        Args:
            audio_data: Audio signal array
            sample_rate: Sample rate
            
        Returns:
            Detected language code
        """
        try:
            # This is a simplified implementation
            # In practice, you'd use a language detection model
            
            # Try transcribing with different languages and see which has highest confidence
            test_languages = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT']
            best_language = 'en-US'
            best_confidence = 0.0
            
            # Use a small sample for language detection
            sample_length = min(len(audio_data), sample_rate * 10)  # 10 seconds max
            sample_audio = audio_data[:sample_length]
            
            for lang in test_languages:
                try:
                    result = self.transcribe_audio(sample_audio, sample_rate, language=lang)
                    confidence = result.get('confidence', 0.0)
                    
                    if confidence > best_confidence and result.get('transcription', ''):
                        best_confidence = confidence
                        best_language = lang
                        
                except:
                    continue
            
            return best_language
            
        except Exception as e:
            logger.error(f"Error in language detection: {str(e)}")
            return 'en-US'  # Default fallback
    
    def get_word_timestamps(self, audio_data: np.ndarray, sample_rate: int, 
                           transcription: str, language: str = 'en-US') -> List[Dict]:
        """
        Get word-level timestamps (basic implementation)
        
        Args:
            audio_data: Audio signal array
            sample_rate: Sample rate
            transcription: Known transcription
            language: Language code
            
        Returns:
            List of word timestamps
        """
        try:
            # This is a simplified implementation
            # In practice, you'd use forced alignment tools like Montreal Forced Alignment
            
            words = transcription.split()
            if not words:
                return []
            
            # Voice activity detection to find speech segments
            frame_length = int(0.025 * sample_rate)
            hop_length = int(0.01 * sample_rate)
            
            frame_energies = []
            for i in range(0, len(audio_data) - frame_length, hop_length):
                frame = audio_data[i:i + frame_length]
                energy = np.sum(frame ** 2)
                frame_energies.append(energy)
            
            frame_energies = np.array(frame_energies)
            threshold = np.percentile(frame_energies, 30)
            voice_frames = frame_energies > threshold
            
            # Find voice segments
            voice_segments = []
            in_voice = False
            start_frame = 0
            
            for i, is_voice in enumerate(voice_frames):
                if is_voice and not in_voice:
                    start_frame = i
                    in_voice = True
                elif not is_voice and in_voice:
                    voice_segments.append((start_frame, i))
                    in_voice = False
            
            if in_voice:
                voice_segments.append((start_frame, len(voice_frames)))
            
            # Distribute words across voice segments
            word_timestamps = []
            frame_duration = hop_length / sample_rate
            
            if voice_segments:
                total_voice_duration = sum((end - start) * frame_duration for start, end in voice_segments)
                time_per_word = total_voice_duration / len(words) if len(words) > 0 else 0
                
                current_word = 0
                current_time = voice_segments[0][0] * frame_duration if voice_segments else 0
                
                for word in words:
                    start_time = current_time
                    end_time = current_time + time_per_word
                    
                    word_timestamps.append({
                        'word': word,
                        'start_time': float(start_time),
                        'end_time': float(end_time),
                        'confidence': 0.7  # Estimated confidence
                    })
                    
                    current_time = end_time
            
            return word_timestamps
            
        except Exception as e:
            logger.error(f"Error getting word timestamps: {str(e)}")
            return []
    
    def get_version(self) -> str:
        """Get processor version"""
        return self.version
    
    def get_supported_languages(self) -> List[str]:
        """Get list of supported languages"""
        return self.supported_languages.copy()
    
    def get_available_engines(self) -> List[str]:
        """Get list of available engines"""
        available = []
        
        # Check which engines are actually available
        for engine_name in self.engines.keys():
            try:
                if engine_name == 'google':
                    available.append(engine_name)  # Google is usually available
                elif engine_name == 'sphinx':
                    # Check if pocketsphinx is available
                    try:
                        import pocketsphinx
                        available.append(engine_name)
                    except ImportError:
                        pass
                elif engine_name == 'wit':
                    if os.getenv('WIT_AI_KEY'):
                        available.append(engine_name)
                elif engine_name == 'azure':
                    if os.getenv('AZURE_SPEECH_KEY') and os.getenv('AZURE_SPEECH_REGION'):
                        available.append(engine_name)
                elif engine_name == 'ibm':
                    if os.getenv('IBM_USERNAME') and os.getenv('IBM_PASSWORD'):
                        available.append(engine_name)
            except:
                pass
        
        return available
    
    def get_stats(self) -> Dict:
        """Get processor statistics"""
        return {
            'version': self.version,
            'supported_languages_count': len(self.supported_languages),
            'available_engines': self.get_available_engines(),
            'vad_available': self.vad is not None,
            'recognizer_settings': {
                'energy_threshold': self.recognizer.energy_threshold,
                'pause_threshold': self.recognizer.pause_threshold,
                'phrase_threshold': self.recognizer.phrase_threshold
            }
        }