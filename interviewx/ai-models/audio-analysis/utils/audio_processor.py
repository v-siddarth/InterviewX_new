#!/usr/bin/env python3
"""
Audio Processing Utility for InterviewX
Handles audio quality analysis and speech characteristics
"""

import logging
import numpy as np
import librosa
from typing import Dict, List, Optional, Tuple
import traceback

try:
    from scipy import signal
    from scipy.stats import entropy
    import soundfile as sf
    from textblob import TextBlob
except ImportError as e:
    logging.error(f"Required packages not installed: {e}")
    raise

# Configure logging
logger = logging.getLogger(__name__)

class AudioProcessor:
    """
    Audio processing for quality analysis and speech characteristics
    """
    
    def __init__(self):
        """Initialize audio processor"""
        self.version = "1.0.0"
        self.sample_rate = 16000
        
        # Audio quality thresholds
        self.quality_thresholds = {
            'snr_threshold': 20,          # Signal-to-noise ratio (dB)
            'clarity_threshold': 0.7,     # Speech clarity score
            'volume_min': -40,            # Minimum volume (dB)
            'volume_max': -6,             # Maximum volume (dB)
            'silence_ratio_max': 0.3      # Maximum silence ratio
        }
        
        logger.info("✅ Audio processor initialized")
    
    def analyze_audio_quality(self, audio_data: np.ndarray, sample_rate: int) -> Dict:
        """
        Comprehensive audio quality analysis
        
        Args:
            audio_data: Audio signal array
            sample_rate: Sample rate of audio
            
        Returns:
            Dictionary containing quality metrics
        """
        try:
            logger.debug("Starting audio quality analysis...")
            
            # Normalize audio data
            if np.max(np.abs(audio_data)) > 0:
                audio_normalized = audio_data / np.max(np.abs(audio_data))
            else:
                audio_normalized = audio_data
            
            # Calculate various quality metrics
            quality_metrics = {}
            
            # 1. Volume/Amplitude Analysis
            volume_metrics = self._analyze_volume(audio_normalized)
            quality_metrics.update(volume_metrics)
            
            # 2. Noise Analysis
            noise_metrics = self._analyze_noise(audio_normalized, sample_rate)
            quality_metrics.update(noise_metrics)
            
            # 3. Frequency Analysis
            frequency_metrics = self._analyze_frequency_content(audio_normalized, sample_rate)
            quality_metrics.update(frequency_metrics)
            
            # 4. Silence Detection
            silence_metrics = self._analyze_silence(audio_normalized, sample_rate)
            quality_metrics.update(silence_metrics)
            
            # 5. Audio Distortion
            distortion_metrics = self._analyze_distortion(audio_normalized)
            quality_metrics.update(distortion_metrics)
            
            # 6. Overall Quality Score
            overall_score = self._calculate_quality_score(quality_metrics)
            quality_metrics['overall_score'] = overall_score
            quality_metrics['quality_level'] = self._get_quality_level(overall_score)
            
            logger.debug(f"Audio quality analysis complete: {overall_score:.4f}")
            return quality_metrics
            
        except Exception as e:
            logger.error(f"Error in audio quality analysis: {str(e)}")
            logger.error(traceback.format_exc())
            return {'overall_score': 0.5, 'error': str(e)}
    
    def _analyze_volume(self, audio_data: np.ndarray) -> Dict:
        """Analyze volume characteristics"""
        try:
            # RMS (Root Mean Square) energy
            rms_energy = np.sqrt(np.mean(audio_data ** 2))
            
            # Convert to dB
            rms_db = 20 * np.log10(rms_energy + 1e-10)
            
            # Peak amplitude
            peak_amplitude = np.max(np.abs(audio_data))
            peak_db = 20 * np.log10(peak_amplitude + 1e-10)
            
            # Dynamic range
            min_amplitude = np.min(np.abs(audio_data[audio_data != 0])) if np.any(audio_data != 0) else 1e-10
            dynamic_range = peak_db - 20 * np.log10(min_amplitude)
            
            # Volume consistency (standard deviation of RMS over time)
            frame_length = int(0.1 * len(audio_data))  # 100ms frames
            hop_length = frame_length // 2
            
            frame_rms = []
            for i in range(0, len(audio_data) - frame_length, hop_length):
                frame = audio_data[i:i + frame_length]
                frame_rms.append(np.sqrt(np.mean(frame ** 2)))
            
            volume_consistency = 1.0 - (np.std(frame_rms) / (np.mean(frame_rms) + 1e-10))
            
            # Volume quality assessment
            volume_quality = 1.0
            if rms_db < self.quality_thresholds['volume_min']:
                volume_quality *= 0.5  # Too quiet
            elif rms_db > self.quality_thresholds['volume_max']:
                volume_quality *= 0.7  # Too loud
            
            return {
                'rms_energy': float(rms_energy),
                'rms_db': float(rms_db),
                'peak_amplitude': float(peak_amplitude),
                'peak_db': float(peak_db),
                'dynamic_range': float(dynamic_range),
                'volume_consistency': float(volume_consistency),
                'volume_quality': float(volume_quality),
                'is_too_quiet': rms_db < self.quality_thresholds['volume_min'],
                'is_too_loud': rms_db > self.quality_thresholds['volume_max']
            }
            
        except Exception as e:
            logger.error(f"Error in volume analysis: {str(e)}")
            return {'volume_quality': 0.5}
    
    def _analyze_noise(self, audio_data: np.ndarray, sample_rate: int) -> Dict:
        """Analyze noise characteristics"""
        try:
            # Spectral noise estimation
            stft = librosa.stft(audio_data, n_fft=2048, hop_length=512)
            magnitude = np.abs(stft)
            
            # Estimate noise floor (bottom 10th percentile of spectral energy)
            noise_floor = np.percentile(magnitude, 10, axis=1, keepdims=True)
            
            # Signal-to-noise ratio estimation
            signal_power = np.mean(magnitude, axis=1, keepdims=True)
            snr_linear = signal_power / (noise_floor + 1e-10)
            snr_db = 20 * np.log10(snr_linear + 1e-10)
            avg_snr = np.mean(snr_db)
            
            # Spectral flatness (measure of noise-like vs tonal content)
            spectral_flatness = librosa.feature.spectral_flatness(y=audio_data, S=magnitude)[0]
            avg_spectral_flatness = np.mean(spectral_flatness)
            
            # Zero crossing rate (higher for noisy signals)
            zcr = librosa.feature.zero_crossing_rate(audio_data)[0]
            avg_zcr = np.mean(zcr)
            
            # Noise quality assessment
            noise_quality = 1.0
            if avg_snr < self.quality_thresholds['snr_threshold']:
                noise_quality *= max(0.1, avg_snr / self.quality_thresholds['snr_threshold'])
            
            return {
                'snr_db': float(avg_snr),
                'spectral_flatness': float(avg_spectral_flatness),
                'zero_crossing_rate': float(avg_zcr),
                'noise_floor_db': float(20 * np.log10(np.mean(noise_floor) + 1e-10)),
                'noise_quality': float(noise_quality),
                'is_noisy': avg_snr < self.quality_thresholds['snr_threshold']
            }
            
        except Exception as e:
            logger.error(f"Error in noise analysis: {str(e)}")
            return {'noise_quality': 0.5}
    
    def _analyze_frequency_content(self, audio_data: np.ndarray, sample_rate: int) -> Dict:
        """Analyze frequency characteristics"""
        try:
            # Compute power spectral density
            frequencies, psd = signal.welch(audio_data, sample_rate, nperseg=1024)
            
            # Define frequency bands
            bands = {
                'low': (0, 300),         # Low frequencies (0-300 Hz)
                'mid_low': (300, 1000),  # Mid-low frequencies (300-1000 Hz)
                'mid': (1000, 4000),     # Mid frequencies (1000-4000 Hz) - important for speech
                'high': (4000, 8000)     # High frequencies (4000-8000 Hz)
            }
            
            band_energies = {}
            for band_name, (f_min, f_max) in bands.items():
                mask = (frequencies >= f_min) & (frequencies <= f_max)
                band_energy = np.sum(psd[mask])
                band_energies[f'{band_name}_energy'] = float(band_energy)
            
            # Total energy
            total_energy = np.sum(psd)
            
            # Frequency distribution
            freq_distribution = {}
            for band_name in bands.keys():
                energy_key = f'{band_name}_energy'
                freq_distribution[f'{band_name}_ratio'] = float(
                    band_energies[energy_key] / (total_energy + 1e-10)
                )
            
            # Spectral centroid (brightness measure)
            spectral_centroid = librosa.feature.spectral_centroid(y=audio_data, sr=sample_rate)[0]
            avg_spectral_centroid = np.mean(spectral_centroid)
            
            # Spectral bandwidth
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=audio_data, sr=sample_rate)[0]
            avg_spectral_bandwidth = np.mean(spectral_bandwidth)
            
            # Frequency quality (good speech should have balanced mid frequencies)
            mid_ratio = freq_distribution['mid_ratio']
            frequency_quality = min(1.0, mid_ratio * 3)  # Boost if good mid-frequency content
            
            result = {
                'spectral_centroid': float(avg_spectral_centroid),
                'spectral_bandwidth': float(avg_spectral_bandwidth),
                'frequency_quality': float(frequency_quality),
                'total_energy': float(total_energy)
            }
            
            # Add band energies and ratios
            result.update(band_energies)
            result.update(freq_distribution)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in frequency analysis: {str(e)}")
            return {'frequency_quality': 0.5}
    
    def _analyze_silence(self, audio_data: np.ndarray, sample_rate: int) -> Dict:
        """Analyze silence characteristics"""
        try:
            # Voice Activity Detection using energy-based approach
            frame_length = int(0.025 * sample_rate)  # 25ms frames
            hop_length = int(0.01 * sample_rate)     # 10ms hop
            
            # Calculate frame energy
            frame_energies = []
            for i in range(0, len(audio_data) - frame_length, hop_length):
                frame = audio_data[i:i + frame_length]
                energy = np.sum(frame ** 2)
                frame_energies.append(energy)
            
            frame_energies = np.array(frame_energies)
            
            # Determine voice activity threshold (dynamic)
            energy_threshold = np.percentile(frame_energies, 30)  # Bottom 30th percentile
            
            # Voice activity detection
            voice_frames = frame_energies > energy_threshold
            silence_frames = ~voice_frames
            
            # Calculate ratios
            total_frames = len(frame_energies)
            silence_ratio = np.sum(silence_frames) / total_frames if total_frames > 0 else 1.0
            voice_ratio = 1.0 - silence_ratio
            
            # Silence quality (too much silence is bad)
            silence_quality = 1.0
            if silence_ratio > self.quality_thresholds['silence_ratio_max']:
                silence_quality = max(0.1, 1.0 - silence_ratio)
            
            return {
                'silence_ratio': float(silence_ratio),
                'voice_ratio': float(voice_ratio),
                'voice_activity_threshold': float(energy_threshold),
                'silence_quality': float(silence_quality),
                'too_much_silence': silence_ratio > self.quality_thresholds['silence_ratio_max']
            }
            
        except Exception as e:
            logger.error(f"Error in silence analysis: {str(e)}")
            return {'silence_quality': 0.5}
    
    def _analyze_distortion(self, audio_data: np.ndarray) -> Dict:
        """Analyze audio distortion"""
        try:
            # Clipping detection
            clipping_threshold = 0.95
            clipped_samples = np.sum(np.abs(audio_data) >= clipping_threshold)
            clipping_ratio = clipped_samples / len(audio_data)
            
            # Total Harmonic Distortion (THD) estimation
            # This is a simplified estimation
            fft = np.fft.fft(audio_data)
            magnitude = np.abs(fft)
            
            # Find fundamental frequency
            fundamental_idx = np.argmax(magnitude[:len(magnitude)//2])
            
            # Estimate harmonics energy vs fundamental
            harmonic_energy = 0
            fundamental_energy = magnitude[fundamental_idx] ** 2
            
            for harmonic in range(2, 6):  # Check 2nd to 5th harmonics
                harmonic_idx = fundamental_idx * harmonic
                if harmonic_idx < len(magnitude):
                    harmonic_energy += magnitude[harmonic_idx] ** 2
            
            thd = np.sqrt(harmonic_energy / (fundamental_energy + 1e-10))
            
            # Distortion quality
            distortion_quality = 1.0
            if clipping_ratio > 0.01:  # More than 1% clipping
                distortion_quality *= (1.0 - clipping_ratio)
            
            if thd > 0.1:  # High THD
                distortion_quality *= max(0.1, 1.0 - thd)
            
            return {
                'clipping_ratio': float(clipping_ratio),
                'thd_estimate': float(thd),
                'distortion_quality': float(distortion_quality),
                'has_clipping': clipping_ratio > 0.01,
                'high_distortion': thd > 0.1
            }
            
        except Exception as e:
            logger.error(f"Error in distortion analysis: {str(e)}")
            return {'distortion_quality': 0.5}
    
    def _calculate_quality_score(self, metrics: Dict) -> float:
        """Calculate overall quality score from individual metrics"""
        try:
            # Weight different quality components
            weights = {
                'volume_quality': 0.25,
                'noise_quality': 0.30,
                'frequency_quality': 0.20,
                'silence_quality': 0.15,
                'distortion_quality': 0.10
            }
            
            quality_score = 0.0
            total_weight = 0.0
            
            for metric, weight in weights.items():
                if metric in metrics:
                    quality_score += weight * metrics[metric]
                    total_weight += weight
            
            # Normalize by actual weights used
            if total_weight > 0:
                quality_score /= total_weight
            else:
                quality_score = 0.5
            
            return max(0.0, min(1.0, quality_score))
            
        except Exception as e:
            logger.error(f"Error calculating quality score: {str(e)}")
            return 0.5
    
    def _get_quality_level(self, score: float) -> str:
        """Convert quality score to descriptive level"""
        if score >= 0.9:
            return "Excellent"
        elif score >= 0.8:
            return "Good"
        elif score >= 0.6:
            return "Fair"
        elif score >= 0.4:
            return "Poor"
        else:
            return "Very Poor"
    
    def analyze_speech_characteristics(self, audio_data: np.ndarray, sample_rate: int) -> Dict:
        """
        Analyze speech-specific characteristics
        
        Args:
            audio_data: Audio signal array
            sample_rate: Sample rate of audio
            
        Returns:
            Dictionary containing speech characteristics
        """
        try:
            logger.debug("Analyzing speech characteristics...")
            
            speech_metrics = {}
            
            # 1. Speech rate analysis
            speech_rate_metrics = self._analyze_speech_rate(audio_data, sample_rate)
            speech_metrics.update(speech_rate_metrics)
            
            # 2. Pitch analysis
            pitch_metrics = self._analyze_pitch(audio_data, sample_rate)
            speech_metrics.update(pitch_metrics)
            
            # 3. Articulation analysis
            articulation_metrics = self._analyze_articulation(audio_data, sample_rate)
            speech_metrics.update(articulation_metrics)
            
            # 4. Fluency analysis
            fluency_metrics = self._analyze_fluency(audio_data, sample_rate)
            speech_metrics.update(fluency_metrics)
            
            # 5. Overall speech score
            overall_score = self._calculate_speech_score(speech_metrics)
            speech_metrics['overall_score'] = overall_score
            speech_metrics['speech_level'] = self._get_speech_level(overall_score)
            
            logger.debug(f"Speech analysis complete: {overall_score:.4f}")
            return speech_metrics
            
        except Exception as e:
            logger.error(f"Error in speech analysis: {str(e)}")
            logger.error(traceback.format_exc())
            return {'overall_score': 0.5, 'error': str(e)}
    
    def _analyze_speech_rate(self, audio_data: np.ndarray, sample_rate: int) -> Dict:
        """Analyze speech rate and timing"""
        try:
            # Voice activity detection for speech rate
            frame_length = int(0.025 * sample_rate)
            hop_length = int(0.01 * sample_rate)
            
            frame_energies = []
            for i in range(0, len(audio_data) - frame_length, hop_length):
                frame = audio_data[i:i + frame_length]
                energy = np.sum(frame ** 2)
                frame_energies.append(energy)
            
            frame_energies = np.array(frame_energies)
            
            # Voice activity detection
            energy_threshold = np.percentile(frame_energies, 40)
            voice_frames = frame_energies > energy_threshold
            
            # Calculate speech segments
            speech_segments = []
            in_speech = False
            start_frame = 0
            
            for i, is_voice in enumerate(voice_frames):
                if is_voice and not in_speech:
                    start_frame = i
                    in_speech = True
                elif not is_voice and in_speech:
                    speech_segments.append((start_frame, i))
                    in_speech = False
            
            if in_speech:
                speech_segments.append((start_frame, len(voice_frames)))
            
            # Calculate speech rate metrics
            total_speech_frames = np.sum(voice_frames)
            total_frames = len(voice_frames)
            frame_duration = hop_length / sample_rate
            
            speech_duration = total_speech_frames * frame_duration
            total_duration = total_frames * frame_duration
            
            # Speech rate (approximate syllables per second)
            # Estimate syllables from voice segments
            estimated_syllables = len(speech_segments) * 2  # Rough estimate
            speech_rate = estimated_syllables / (speech_duration + 1e-10)
            
            # Ideal speech rate is around 4-6 syllables per second
            rate_quality = 1.0
            if speech_rate < 2 or speech_rate > 8:
                rate_quality = max(0.1, 1.0 - abs(speech_rate - 5) / 5)
            
            return {
                'speech_duration': float(speech_duration),
                'total_duration': float(total_duration),
                'speech_ratio': float(speech_duration / total_duration if total_duration > 0 else 0),
                'estimated_syllables': int(estimated_syllables),
                'speech_rate_sps': float(speech_rate),
                'rate_quality': float(rate_quality),
                'speech_segments_count': len(speech_segments),
                'is_too_fast': speech_rate > 8,
                'is_too_slow': speech_rate < 2
            }
            
        except Exception as e:
            logger.error(f"Error in speech rate analysis: {str(e)}")
            return {'rate_quality': 0.5}
    
    def _analyze_pitch(self, audio_data: np.ndarray, sample_rate: int) -> Dict:
        """Analyze pitch characteristics"""
        try:
            # Extract pitch using librosa
            pitches, magnitudes = librosa.piptrack(y=audio_data, sr=sample_rate, 
                                                  threshold=0.1, fmin=50, fmax=400)
            
            # Get fundamental frequencies
            f0_sequence = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    f0_sequence.append(pitch)
            
            if not f0_sequence:
                return {'pitch_quality': 0.5, 'error': 'No pitch detected'}
            
            f0_sequence = np.array(f0_sequence)
            
            # Pitch statistics
            mean_f0 = np.mean(f0_sequence)
            std_f0 = np.std(f0_sequence)
            min_f0 = np.min(f0_sequence)
            max_f0 = np.max(f0_sequence)
            
            # Pitch range
            pitch_range = max_f0 - min_f0
            
            # Pitch variation (coefficient of variation)
            pitch_variation = std_f0 / (mean_f0 + 1e-10)
            
            # Pitch quality assessment
            pitch_quality = 1.0
            
            # Check if pitch is in reasonable range for human speech
            if mean_f0 < 75 or mean_f0 > 300:
                pitch_quality *= 0.7
            
            # Check pitch variation (too little = monotone, too much = unstable)
            if pitch_variation < 0.05:  # Too monotone
                pitch_quality *= 0.6
            elif pitch_variation > 0.3:  # Too variable
                pitch_quality *= 0.7
            
            return {
                'mean_pitch_hz': float(mean_f0),
                'pitch_std': float(std_f0),
                'min_pitch_hz': float(min_f0),
                'max_pitch_hz': float(max_f0),
                'pitch_range_hz': float(pitch_range),
                'pitch_variation': float(pitch_variation),
                'pitch_quality': float(pitch_quality),
                'is_monotone': pitch_variation < 0.05,
                'is_unstable_pitch': pitch_variation > 0.3
            }
            
        except Exception as e:
            logger.error(f"Error in pitch analysis: {str(e)}")
            return {'pitch_quality': 0.5}
    
    def _analyze_articulation(self, audio_data: np.ndarray, sample_rate: int) -> Dict:
        """Analyze articulation clarity"""
        try:
            # Spectral clarity metrics
            stft = librosa.stft(audio_data, n_fft=2048, hop_length=512)
            magnitude = np.abs(stft)
            
            # Spectral clarity (high frequency content indicates clear articulation)
            high_freq_start = int(2000 * magnitude.shape[0] / (sample_rate / 2))
            high_freq_energy = np.mean(magnitude[high_freq_start:, :])
            total_energy = np.mean(magnitude)
            
            spectral_clarity = high_freq_energy / (total_energy + 1e-10)
            
            # Spectral contrast (difference between peaks and valleys)
            spectral_contrast = librosa.feature.spectral_contrast(y=audio_data, sr=sample_rate)
            avg_contrast = np.mean(spectral_contrast)
            
            # Spectral rolloff (frequency below which 85% of energy is contained)
            spectral_rolloff = librosa.feature.spectral_rolloff(y=audio_data, sr=sample_rate, roll_percent=0.85)[0]
            avg_rolloff = np.mean(spectral_rolloff)
            
            # Articulation quality
            articulation_quality = min(1.0, (spectral_clarity * 2 + avg_contrast / 20) / 2)
            
            return {
                'spectral_clarity': float(spectral_clarity),
                'spectral_contrast': float(avg_contrast),
                'spectral_rolloff': float(avg_rolloff),
                'articulation_quality': float(articulation_quality),
                'is_clear_articulation': spectral_clarity > 0.1
            }
            
        except Exception as e:
            logger.error(f"Error in articulation analysis: {str(e)}")
            return {'articulation_quality': 0.5}
    
    def _analyze_fluency(self, audio_data: np.ndarray, sample_rate: int) -> Dict:
        """Analyze speech fluency"""
        try:
            # Pause detection and analysis
            frame_length = int(0.025 * sample_rate)
            hop_length = int(0.01 * sample_rate)
            
            # Calculate frame energies
            frame_energies = []
            for i in range(0, len(audio_data) - frame_length, hop_length):
                frame = audio_data[i:i + frame_length]
                energy = np.sum(frame ** 2)
                frame_energies.append(energy)
            
            frame_energies = np.array(frame_energies)
            
            # Voice activity detection
            energy_threshold = np.percentile(frame_energies, 35)
            voice_frames = frame_energies > energy_threshold
            
            # Find pauses (consecutive non-voice frames)
            pauses = []
            in_pause = False
            pause_start = 0
            
            for i, is_voice in enumerate(voice_frames):
                if not is_voice and not in_pause:
                    pause_start = i
                    in_pause = True
                elif is_voice and in_pause:
                    pause_length = i - pause_start
                    pauses.append(pause_length)
                    in_pause = False
            
            if in_pause:
                pauses.append(len(voice_frames) - pause_start)
            
            # Convert pause lengths to seconds
            frame_duration = hop_length / sample_rate
            pause_durations = [p * frame_duration for p in pauses]
            
            # Fluency metrics
            total_pauses = len(pause_durations)
            total_duration = len(voice_frames) * frame_duration
            
            if pause_durations:
                avg_pause_duration = np.mean(pause_durations)
                max_pause_duration = np.max(pause_durations)
                pause_frequency = total_pauses / (total_duration + 1e-10)  # Pauses per second
                
                # Count long pauses (> 1 second)
                long_pauses = sum(1 for p in pause_durations if p > 1.0)
            else:
                avg_pause_duration = 0
                max_pause_duration = 0
                pause_frequency = 0
                long_pauses = 0
            
            # Fluency quality (fewer and shorter pauses = better fluency)
            fluency_quality = 1.0
            
            # Penalize excessive pauses
            if pause_frequency > 0.5:  # More than 0.5 pauses per second
                fluency_quality *= max(0.3, 1.0 - pause_frequency)
            
            # Penalize very long pauses
            if max_pause_duration > 3.0:  # Pauses longer than 3 seconds
                fluency_quality *= 0.5
            
            return {
                'total_pauses': int(total_pauses),
                'avg_pause_duration': float(avg_pause_duration),
                'max_pause_duration': float(max_pause_duration),
                'pause_frequency': float(pause_frequency),
                'long_pauses_count': int(long_pauses),
                'fluency_quality': float(fluency_quality),
                'is_disfluent': pause_frequency > 0.5 or max_pause_duration > 3.0
            }
            
        except Exception as e:
            logger.error(f"Error in fluency analysis: {str(e)}")
            return {'fluency_quality': 0.5}
    
    def _calculate_speech_score(self, metrics: Dict) -> float:
        """Calculate overall speech quality score"""
        try:
            weights = {
                'rate_quality': 0.25,
                'pitch_quality': 0.25,
                'articulation_quality': 0.25,
                'fluency_quality': 0.25
            }
            
            speech_score = 0.0
            total_weight = 0.0
            
            for metric, weight in weights.items():
                if metric in metrics:
                    speech_score += weight * metrics[metric]
                    total_weight += weight
            
            if total_weight > 0:
                speech_score /= total_weight
            else:
                speech_score = 0.5
            
            return max(0.0, min(1.0, speech_score))
            
        except Exception as e:
            logger.error(f"Error calculating speech score: {str(e)}")
            return 0.5
    
    def _get_speech_level(self, score: float) -> str:
        """Convert speech score to descriptive level"""
        if score >= 0.9:
            return "Excellent"
        elif score >= 0.8:
            return "Good"
        elif score >= 0.6:
            return "Fair"
        elif score >= 0.4:
            return "Poor"
        else:
            return "Very Poor"
    
    def quick_quality_check(self, audio_data: np.ndarray, sample_rate: int) -> float:
        """Quick quality check for batch processing"""
        try:
            # Simplified quality check
            rms_energy = np.sqrt(np.mean(audio_data ** 2))
            rms_db = 20 * np.log10(rms_energy + 1e-10)
            
            # Basic volume check
            volume_ok = -40 <= rms_db <= -6
            
            # Basic SNR estimate
            stft = librosa.stft(audio_data, n_fft=1024, hop_length=256)
            magnitude = np.abs(stft)
            noise_floor = np.percentile(magnitude, 10)
            signal_level = np.mean(magnitude)
            snr = signal_level / (noise_floor + 1e-10)
            snr_ok = snr > 5
            
            # Combine checks
            quality = 0.5
            if volume_ok:
                quality += 0.25
            if snr_ok:
                quality += 0.25
            
            return min(1.0, quality)
            
        except Exception as e:
            logger.error(f"Error in quick quality check: {str(e)}")
            return 0.5
    
    def analyze_sentiment(self, text: str) -> Dict:
        """Analyze sentiment of transcribed text"""
        try:
            if not text.strip():
                return {'sentiment': 'neutral', 'polarity': 0.0, 'subjectivity': 0.0}
            
            blob = TextBlob(text)
            
            # Get polarity (-1 to 1) and subjectivity (0 to 1)
            polarity = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity
            
            # Classify sentiment
            if polarity > 0.1:
                sentiment = 'positive'
            elif polarity < -0.1:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            
            return {
                'sentiment': sentiment,
                'polarity': float(polarity),
                'subjectivity': float(subjectivity),
                'confidence': float(abs(polarity))
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return {'sentiment': 'neutral', 'polarity': 0.0, 'subjectivity': 0.0}
    
    def get_version(self) -> str:
        """Get processor version"""
        return self.version
    
    def get_stats(self) -> Dict:
        """Get processor statistics"""
        return {
            'version': self.version,
            'sample_rate': self.sample_rate,
            'quality_thresholds': self.quality_thresholds
        }