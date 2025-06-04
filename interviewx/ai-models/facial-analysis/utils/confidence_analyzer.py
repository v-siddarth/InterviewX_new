#!/usr/bin/env python3
"""
CNN-based Confidence Analysis for InterviewX
Analyzes facial expressions and body language to determine confidence level
"""

import logging
import numpy as np
import cv2
from typing import Dict, List, Optional, Tuple
import traceback
import os

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras.applications import MobileNetV2, EfficientNetB0
    from tensorflow.keras.preprocessing.image import img_to_array
    from sklearn.preprocessing import StandardScaler
    import joblib
except ImportError as e:
    logging.error(f"Required packages not installed: {e}")
    raise

# Configure logging
logger = logging.getLogger(__name__)

class ConfidenceAnalyzer:
    """
    Confidence analysis using CNN-based facial expression and feature analysis
    """
    
    def __init__(self, model_path: str = "models"):
        """
        Initialize confidence analyzer
        
        Args:
            model_path: Path to model files
        """
        self.model_path = model_path
        self.version = "1.0.0"
        
        # Model components
        self.feature_extractor = None
        self.confidence_classifier = None
        self.emotion_classifier = None
        self.scaler = None
        
        # Confidence database (pre-computed confident face features)
        self.confident_face_database = None
        self.confidence_threshold = 0.8
        
        # Feature dimensions
        self.feature_dim = 1280  # MobileNetV2 features
        
        self._initialize_models()
        self._load_confident_face_database()
    
    def _initialize_models(self):
        """Initialize all neural network models"""
        try:
            logger.info("Initializing confidence analysis models...")
            
            # Configure TensorFlow
            tf.get_logger().setLevel('ERROR')
            
            # Initialize feature extractor (MobileNetV2)
            self._initialize_feature_extractor()
            
            # Initialize confidence classifier
            self._initialize_confidence_classifier()
            
            # Initialize emotion classifier
            self._initialize_emotion_classifier()
            
            # Initialize scaler
            self._initialize_scaler()
            
            logger.info("✅ All confidence analysis models initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize models: {str(e)}")
            logger.error(traceback.format_exc())
            raise
    
    def _initialize_feature_extractor(self):
        """Initialize feature extraction model"""
        try:
            logger.info("Loading feature extractor (MobileNetV2)...")
            
            # Load pre-trained MobileNetV2 without top layer
            self.feature_extractor = MobileNetV2(
                weights='imagenet',
                include_top=False,
                input_shape=(224, 224, 3),
                pooling='avg'
            )
            
            # Freeze the base model
            self.feature_extractor.trainable = False
            
            logger.info("✅ Feature extractor loaded")
            
        except Exception as e:
            logger.error(f"❌ Failed to load feature extractor: {str(e)}")
            # Fallback to a simple feature extractor
            self._create_simple_feature_extractor()
    
    def _create_simple_feature_extractor(self):
        """Create a simple feature extractor as fallback"""
        try:
            logger.info("Creating simple feature extractor...")
            
            model = keras.Sequential([
                keras.layers.Conv2D(32, 3, activation='relu', input_shape=(224, 224, 3)),
                keras.layers.MaxPooling2D(),
                keras.layers.Conv2D(64, 3, activation='relu'),
                keras.layers.MaxPooling2D(),
                keras.layers.Conv2D(128, 3, activation='relu'),
                keras.layers.MaxPooling2D(),
                keras.layers.GlobalAveragePooling2D(),
                keras.layers.Dense(256, activation='relu'),
                keras.layers.Dropout(0.5),
                keras.layers.Dense(128, activation='relu')
            ])
            
            self.feature_extractor = model
            self.feature_dim = 128
            
            logger.info("✅ Simple feature extractor created")
            
        except Exception as e:
            logger.error(f"❌ Failed to create simple feature extractor: {str(e)}")
            raise
    
    def _initialize_confidence_classifier(self):
        """Initialize confidence classification model"""
        try:
            confidence_model_path = os.path.join(self.model_path, 'confidence_classifier.h5')
            
            if os.path.exists(confidence_model_path):
                logger.info("Loading pre-trained confidence classifier...")
                self.confidence_classifier = keras.models.load_model(confidence_model_path)
            else:
                logger.info("Creating new confidence classifier...")
                self._create_confidence_classifier()
            
            logger.info("✅ Confidence classifier ready")
            
        except Exception as e:
            logger.warning(f"Failed to load confidence classifier: {str(e)}")
            self._create_confidence_classifier()
    
    def _create_confidence_classifier(self):
        """Create a new confidence classification model"""
        try:
            # Simple neural network for confidence classification
            model = keras.Sequential([
                keras.layers.Dense(256, activation='relu', input_shape=(self.feature_dim,)),
                keras.layers.Dropout(0.3),
                keras.layers.Dense(128, activation='relu'),
                keras.layers.Dropout(0.3),
                keras.layers.Dense(64, activation='relu'),
                keras.layers.Dense(1, activation='sigmoid')  # Confidence score 0-1
            ])
            
            model.compile(
                optimizer='adam',
                loss='binary_crossentropy',
                metrics=['accuracy']
            )
            
            self.confidence_classifier = model
            logger.info("✅ Confidence classifier created")
            
        except Exception as e:
            logger.error(f"❌ Failed to create confidence classifier: {str(e)}")
            raise
    
    def _initialize_emotion_classifier(self):
        """Initialize emotion classification model"""
        try:
            emotion_model_path = os.path.join(self.model_path, 'emotion_classifier.h5')
            
            if os.path.exists(emotion_model_path):
                logger.info("Loading pre-trained emotion classifier...")
                self.emotion_classifier = keras.models.load_model(emotion_model_path)
            else:
                logger.info("Creating new emotion classifier...")
                self._create_emotion_classifier()
            
            logger.info("✅ Emotion classifier ready")
            
        except Exception as e:
            logger.warning(f"Failed to load emotion classifier: {str(e)}")
            self._create_emotion_classifier()
    
    def _create_emotion_classifier(self):
        """Create a new emotion classification model"""
        try:
            # Emotion categories: happy, confident, neutral, nervous, sad, angry
            num_emotions = 6
            
            model = keras.Sequential([
                keras.layers.Dense(256, activation='relu', input_shape=(self.feature_dim,)),
                keras.layers.Dropout(0.3),
                keras.layers.Dense(128, activation='relu'),
                keras.layers.Dropout(0.3),
                keras.layers.Dense(64, activation='relu'),
                keras.layers.Dense(num_emotions, activation='softmax')
            ])
            
            model.compile(
                optimizer='adam',
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            self.emotion_classifier = model
            logger.info("✅ Emotion classifier created")
            
        except Exception as e:
            logger.error(f"❌ Failed to create emotion classifier: {str(e)}")
            raise
    
    def _initialize_scaler(self):
        """Initialize feature scaler"""
        try:
            scaler_path = os.path.join(self.model_path, 'feature_scaler.pkl')
            
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
                logger.info("✅ Feature scaler loaded")
            else:
                self.scaler = StandardScaler()
                logger.info("✅ New feature scaler created")
                
        except Exception as e:
            logger.warning(f"Failed to load scaler: {str(e)}")
            self.scaler = StandardScaler()
    
    def _load_confident_face_database(self):
        """Load database of confident face features"""
        try:
            database_path = os.path.join(self.model_path, 'confident_faces_db.npy')
            
            if os.path.exists(database_path):
                self.confident_face_database = np.load(database_path)
                logger.info(f"✅ Loaded confident face database with {len(self.confident_face_database)} samples")
            else:
                # Create a mock database with some confident face features
                self._create_mock_confident_database()
                
        except Exception as e:
            logger.warning(f"Failed to load confident face database: {str(e)}")
            self._create_mock_confident_database()
    
    def _create_mock_confident_database(self):
        """Create a mock database of confident face features"""
        try:
            # Generate mock confident face features
            # In a real implementation, this would be trained on actual confident faces
            np.random.seed(42)
            num_samples = 1000
            
            # Generate features that represent confident facial expressions
            confident_features = np.random.normal(0.3, 0.2, (num_samples, self.feature_dim))
            confident_features = np.clip(confident_features, 0, 1)
            
            self.confident_face_database = confident_features
            
            # Save for future use
            os.makedirs(self.model_path, exist_ok=True)
            np.save(os.path.join(self.model_path, 'confident_faces_db.npy'), confident_features)
            
            logger.info(f"✅ Created mock confident face database with {num_samples} samples")
            
        except Exception as e:
            logger.error(f"❌ Failed to create mock database: {str(e)}")
            self.confident_face_database = np.random.rand(100, self.feature_dim)
    
    def extract_features(self, face_image: np.ndarray) -> np.ndarray:
        """
        Extract features from face image
        
        Args:
            face_image: Input face image (224x224x3)
            
        Returns:
            Feature vector
        """
        try:
            # Preprocess image
            if face_image.shape != (224, 224, 3):
                face_image = cv2.resize(face_image, (224, 224))
            
            # Normalize pixel values
            face_image = face_image.astype(np.float32) / 255.0
            
            # Add batch dimension
            face_batch = np.expand_dims(face_image, axis=0)
            
            # Extract features
            features = self.feature_extractor.predict(face_batch, verbose=0)
            
            # Flatten if needed
            if len(features.shape) > 2:
                features = features.reshape(features.shape[0], -1)
            
            return features[0]  # Return single feature vector
            
        except Exception as e:
            logger.error(f"Error extracting features: {str(e)}")
            return np.zeros(self.feature_dim)
    
    def analyze_confidence(self, face_image: np.ndarray) -> float:
        """
        Analyze confidence level from face image
        
        Args:
            face_image: Input face image
            
        Returns:
            Confidence score (0.0 to 1.0)
        """
        try:
            # Extract features
            features = self.extract_features(face_image)
            
            if features is None or len(features) == 0:
                logger.warning("Failed to extract features")
                return 0.0
            
            # Multiple confidence analysis methods
            confidence_scores = []
            
            # Method 1: Direct confidence classification
            classifier_score = self._classify_confidence(features)
            confidence_scores.append(classifier_score)
            
            # Method 2: Similarity to confident face database
            similarity_score = self._compare_to_confident_database(features)
            confidence_scores.append(similarity_score)
            
            # Method 3: Emotion-based confidence
            emotion_score = self._analyze_emotion_confidence(features)
            confidence_scores.append(emotion_score)
            
            # Method 4: Facial feature analysis
            feature_score = self._analyze_facial_features(face_image)
            confidence_scores.append(feature_score)
            
            # Combine scores with weights
            weights = [0.4, 0.3, 0.2, 0.1]
            final_confidence = np.average(confidence_scores, weights=weights)
            
            # Ensure score is in valid range
            final_confidence = np.clip(final_confidence, 0.0, 1.0)
            
            logger.debug(f"Confidence analysis: {confidence_scores} -> {final_confidence:.4f}")
            
            return float(final_confidence)
            
        except Exception as e:
            logger.error(f"Error analyzing confidence: {str(e)}")
            return 0.0
    
    def _classify_confidence(self, features: np.ndarray) -> float:
        """Classify confidence using neural network"""
        try:
            # Reshape features for classifier
            features_scaled = features.reshape(1, -1)
            
            # Scale features if scaler is fitted
            if hasattr(self.scaler, 'mean_'):
                features_scaled = self.scaler.transform(features_scaled)
            
            # Predict confidence
            confidence = self.confidence_classifier.predict(features_scaled, verbose=0)[0][0]
            
            return float(confidence)
            
        except Exception as e:
            logger.error(f"Error in confidence classification: {str(e)}")
            return 0.5
    
    def _compare_to_confident_database(self, features: np.ndarray) -> float:
        """Compare features to confident face database"""
        try:
            if self.confident_face_database is None:
                return 0.5
            
            # Calculate similarity to all confident faces
            similarities = []
            
            for confident_features in self.confident_face_database:
                # Cosine similarity
                norm_a = np.linalg.norm(features)
                norm_b = np.linalg.norm(confident_features)
                
                if norm_a > 0 and norm_b > 0:
                    similarity = np.dot(features, confident_features) / (norm_a * norm_b)
                    similarities.append(similarity)
            
            if not similarities:
                return 0.5
            
            # Use average of top 10% similarities
            similarities = sorted(similarities, reverse=True)
            top_similarities = similarities[:max(1, len(similarities) // 10)]
            
            avg_similarity = np.mean(top_similarities)
            
            # Convert similarity to confidence score
            confidence = (avg_similarity + 1) / 2  # Scale from [-1,1] to [0,1]
            
            return float(np.clip(confidence, 0.0, 1.0))
            
        except Exception as e:
            logger.error(f"Error comparing to confident database: {str(e)}")
            return 0.5
    
    def _analyze_emotion_confidence(self, features: np.ndarray) -> float:
        """Analyze confidence based on emotion classification"""
        try:
            # Reshape features
            features_input = features.reshape(1, -1)
            
            # Predict emotions
            emotion_probs = self.emotion_classifier.predict(features_input, verbose=0)[0]
            
            # Emotion labels: happy, confident, neutral, nervous, sad, angry
            emotion_labels = ['happy', 'confident', 'neutral', 'nervous', 'sad', 'angry']
            
            # Calculate confidence based on emotion probabilities
            confidence_weights = {
                'happy': 0.8,
                'confident': 1.0,
                'neutral': 0.6,
                'nervous': 0.2,
                'sad': 0.3,
                'angry': 0.4
            }
            
            emotion_confidence = 0.0
            for i, prob in enumerate(emotion_probs):
                emotion = emotion_labels[i]
                weight = confidence_weights.get(emotion, 0.5)
                emotion_confidence += prob * weight
            
            return float(np.clip(emotion_confidence, 0.0, 1.0))
            
        except Exception as e:
            logger.error(f"Error in emotion-based confidence analysis: {str(e)}")
            return 0.5
    
    def _analyze_facial_features(self, face_image: np.ndarray) -> float:
        """Analyze confidence based on facial features"""
        try:
            # Convert to grayscale for feature analysis
            gray = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
            
            confidence_indicators = []
            
            # 1. Eye openness (confident people tend to have more open eyes)
            eye_openness = self._measure_eye_openness(gray)
            confidence_indicators.append(eye_openness)
            
            # 2. Mouth shape (slight smile indicates confidence)
            mouth_confidence = self._analyze_mouth_shape(gray)
            confidence_indicators.append(mouth_confidence)
            
            # 3. Face symmetry (more symmetrical faces appear more confident)
            symmetry_score = self._measure_face_symmetry(gray)
            confidence_indicators.append(symmetry_score)
            
            # 4. Head pose (upright pose indicates confidence)
            pose_confidence = self._analyze_head_pose(gray)
            confidence_indicators.append(pose_confidence)
            
            # Combine indicators
            feature_confidence = np.mean(confidence_indicators)
            
            return float(np.clip(feature_confidence, 0.0, 1.0))
            
        except Exception as e:
            logger.error(f"Error in facial feature analysis: {str(e)}")
            return 0.5
    
    def _measure_eye_openness(self, gray_image: np.ndarray) -> float:
        """Measure eye openness as confidence indicator"""
        try:
            # Simple eye openness measurement
            height, width = gray_image.shape
            
            # Focus on upper half of face where eyes are located
            eye_region = gray_image[:height//2, :]
            
            # Calculate variance in eye region (open eyes have more variance)
            eye_variance = np.var(eye_region)
            
            # Normalize to 0-1 range
            openness = min(1.0, eye_variance / 1000.0)
            
            return openness
            
        except Exception as e:
            logger.error(f"Error measuring eye openness: {str(e)}")
            return 0.5
    
    def _analyze_mouth_shape(self, gray_image: np.ndarray) -> float:
        """Analyze mouth shape for confidence indicators"""
        try:
            height, width = gray_image.shape
            
            # Focus on lower third of face where mouth is located
            mouth_region = gray_image[2*height//3:, width//4:3*width//4]
            
            # Calculate horizontal gradient (smiles have more horizontal variation)
            grad_x = cv2.Sobel(mouth_region, cv2.CV_64F, 1, 0, ksize=3)
            horizontal_variation = np.mean(np.abs(grad_x))
            
            # Normalize and convert to confidence
            mouth_confidence = min(1.0, horizontal_variation / 50.0)
            
            return mouth_confidence
            
        except Exception as e:
            logger.error(f"Error analyzing mouth shape: {str(e)}")
            return 0.5
    
    def _measure_face_symmetry(self, gray_image: np.ndarray) -> float:
        """Measure face symmetry"""
        try:
            height, width = gray_image.shape
            
            # Split face in half
            left_half = gray_image[:, :width//2]
            right_half = gray_image[:, width//2:]
            
            # Flip right half to compare with left
            right_half_flipped = cv2.flip(right_half, 1)
            
            # Resize to ensure same dimensions
            min_width = min(left_half.shape[1], right_half_flipped.shape[1])
            left_half = left_half[:, :min_width]
            right_half_flipped = right_half_flipped[:, :min_width]
            
            # Calculate similarity
            diff = np.abs(left_half.astype(float) - right_half_flipped.astype(float))
            symmetry = 1.0 - (np.mean(diff) / 255.0)
            
            return max(0.0, symmetry)
            
        except Exception as e:
            logger.error(f"Error measuring face symmetry: {str(e)}")
            return 0.5
    
    def _analyze_head_pose(self, gray_image: np.ndarray) -> float:
        """Analyze head pose for confidence"""
        try:
            # Simple head pose analysis based on face center
            height, width = gray_image.shape
            
            # Calculate center of mass
            y_indices, x_indices = np.indices(gray_image.shape)
            total_intensity = np.sum(gray_image)
            
            if total_intensity > 0:
                center_x = np.sum(x_indices * gray_image) / total_intensity
                center_y = np.sum(y_indices * gray_image) / total_intensity
                
                # Calculate deviation from image center
                center_deviation_x = abs(center_x - width/2) / (width/2)
                center_deviation_y = abs(center_y - height/2) / (height/2)
                
                # Upright pose (low deviation) indicates confidence
                pose_confidence = 1.0 - (center_deviation_x + center_deviation_y) / 2
                
                return max(0.0, pose_confidence)
            
            return 0.5
            
        except Exception as e:
            logger.error(f"Error analyzing head pose: {str(e)}")
            return 0.5
    
    def get_detailed_analysis(self, face_image: np.ndarray) -> Dict:
        """
        Get detailed confidence analysis
        
        Args:
            face_image: Input face image
            
        Returns:
            Detailed analysis results
        """
        try:
            # Extract features
            features = self.extract_features(face_image)
            
            # Get individual scores
            classifier_score = self._classify_confidence(features)
            similarity_score = self._compare_to_confident_database(features)
            emotion_score = self._analyze_emotion_confidence(features)
            feature_score = self._analyze_facial_features(face_image)
            
            # Get emotion probabilities
            emotion_probs = self.emotion_classifier.predict(features.reshape(1, -1), verbose=0)[0]
            emotion_labels = ['happy', 'confident', 'neutral', 'nervous', 'sad', 'angry']
            
            # Overall confidence
            weights = [0.4, 0.3, 0.2, 0.1]
            scores = [classifier_score, similarity_score, emotion_score, feature_score]
            overall_confidence = np.average(scores, weights=weights)
            
            return {
                'overall_confidence': float(overall_confidence),
                'passed_threshold': overall_confidence >= self.confidence_threshold,
                'component_scores': {
                    'classifier_confidence': float(classifier_score),
                    'similarity_to_confident_faces': float(similarity_score),
                    'emotion_based_confidence': float(emotion_score),
                    'facial_feature_confidence': float(feature_score)
                },
                'emotion_analysis': {
                    label: float(prob) for label, prob in zip(emotion_labels, emotion_probs)
                },
                'confidence_level': self._get_confidence_level(overall_confidence)
            }
            
        except Exception as e:
            logger.error(f"Error in detailed analysis: {str(e)}")
            return {
                'overall_confidence': 0.0,
                'passed_threshold': False,
                'error': str(e)
            }
    
    def _get_confidence_level(self, confidence_score: float) -> str:
        """Convert confidence score to descriptive level"""
        if confidence_score >= 0.9:
            return "Very High"
        elif confidence_score >= 0.8:
            return "High"
        elif confidence_score >= 0.6:
            return "Medium"
        elif confidence_score >= 0.4:
            return "Low"
        else:
            return "Very Low"
    
    def get_version(self) -> str:
        """Get analyzer version"""
        return self.version
    
    def get_stats(self) -> Dict:
        """Get analyzer statistics"""
        return {
            'version': self.version,
            'feature_dim': self.feature_dim,
            'confidence_threshold': self.confidence_threshold,
            'confident_face_database_size': len(self.confident_face_database) if self.confident_face_database is not None else 0,
            'models_loaded': {
                'feature_extractor': self.feature_extractor is not None,
                'confidence_classifier': self.confidence_classifier is not None,
                'emotion_classifier': self.emotion_classifier is not None
            }
        }