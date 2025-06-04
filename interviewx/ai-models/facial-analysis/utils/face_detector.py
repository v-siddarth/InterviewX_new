#!/usr/bin/env python3
"""
MTCNN-based Face Detection for InterviewX
Detects faces and extracts facial features using Multi-task CNN
"""

import logging
import numpy as np
import cv2
from typing import List, Dict, Optional, Tuple
import traceback

try:
    from mtcnn import MTCNN
    import tensorflow as tf
except ImportError as e:
    logging.error(f"Required packages not installed: {e}")
    raise

# Configure logging
logger = logging.getLogger(__name__)

class FaceDetector:
    """
    Face detection using MTCNN (Multi-task Cascaded Convolutional Networks)
    """
    
    def __init__(self, min_face_size: int = 40, scale_factor: float = 0.709):
        """
        Initialize MTCNN face detector
        
        Args:
            min_face_size: Minimum face size to detect
            scale_factor: Scale factor for pyramid
        """
        self.min_face_size = min_face_size
        self.scale_factor = scale_factor
        self.detector = None
        self.version = "1.0.0"
        
        self._initialize_detector()
    
    def _initialize_detector(self):
        """Initialize the MTCNN detector"""
        try:
            logger.info("Initializing MTCNN face detector...")
            
            # Configure TensorFlow to reduce verbosity
            tf.get_logger().setLevel('ERROR')
            
            # Initialize MTCNN
            self.detector = MTCNN(
                min_face_size=self.min_face_size,
                scale_factor=self.scale_factor,
                steps_threshold=[0.6, 0.7, 0.7],  # Thresholds for the three stages
                selection_method='probability'
            )
            
            logger.info("✅ MTCNN detector initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize MTCNN: {str(e)}")
            logger.error(traceback.format_exc())
            raise
    
    def detect_faces(self, image: np.ndarray) -> List[Dict]:
        """
        Detect faces in an image
        
        Args:
            image: Input image as numpy array (RGB format)
            
        Returns:
            List of dictionaries containing face data
        """
        try:
            if self.detector is None:
                raise RuntimeError("Face detector not initialized")
            
            # Validate input image
            if image is None or image.size == 0:
                logger.warning("Empty or invalid image provided")
                return []
            
            # Ensure image is in RGB format
            if len(image.shape) != 3 or image.shape[2] != 3:
                logger.warning(f"Invalid image shape: {image.shape}")
                return []
            
            # Convert to uint8 if needed
            if image.dtype != np.uint8:
                image = (image * 255).astype(np.uint8) if image.max() <= 1.0 else image.astype(np.uint8)
            
            # Detect faces
            logger.debug(f"Detecting faces in image of shape: {image.shape}")
            results = self.detector.detect_faces(image)
            
            if not results:
                logger.debug("No faces detected")
                return []
            
            # Process detection results
            faces = []
            for i, result in enumerate(results):
                try:
                    face_data = self._process_detection(image, result, i)
                    if face_data:
                        faces.append(face_data)
                except Exception as e:
                    logger.error(f"Error processing face detection {i}: {str(e)}")
                    continue
            
            logger.info(f"Detected {len(faces)} valid faces")
            return faces
            
        except Exception as e:
            logger.error(f"Error in face detection: {str(e)}")
            logger.error(traceback.format_exc())
            return []
    
    def _process_detection(self, image: np.ndarray, detection: Dict, face_id: int) -> Optional[Dict]:
        """
        Process a single face detection
        
        Args:
            image: Original image
            detection: MTCNN detection result
            face_id: Face identifier
            
        Returns:
            Processed face data or None if invalid
        """
        try:
            # Extract bounding box
            bbox = detection['box']
            x, y, w, h = bbox
            
            # Validate bounding box
            if w < self.min_face_size or h < self.min_face_size:
                logger.debug(f"Face {face_id} too small: {w}x{h}")
                return None
            
            # Extract confidence
            confidence = detection['confidence']
            
            # Extract keypoints/landmarks
            keypoints = detection['keypoints']
            landmarks = self._process_landmarks(keypoints)
            
            # Extract face region with padding
            face_image = self._extract_face_region(image, bbox)
            
            if face_image is None:
                logger.debug(f"Failed to extract face region for face {face_id}")
                return None
            
            # Calculate face quality metrics
            quality_metrics = self._calculate_face_quality(face_image, landmarks)
            
            return {
                'face_id': face_id,
                'bbox': [x, y, w, h],
                'confidence': confidence,
                'landmarks': landmarks,
                'face_image': face_image,
                'quality_metrics': quality_metrics,
                'face_size': (w, h),
                'face_area': w * h
            }
            
        except Exception as e:
            logger.error(f"Error processing detection: {str(e)}")
            return None
    
    def _extract_face_region(self, image: np.ndarray, bbox: List[int], padding: float = 0.1) -> Optional[np.ndarray]:
        """
        Extract face region from image with padding
        
        Args:
            image: Original image
            bbox: Bounding box [x, y, w, h]
            padding: Padding ratio
            
        Returns:
            Extracted face image or None
        """
        try:
            x, y, w, h = bbox
            img_h, img_w = image.shape[:2]
            
            # Add padding
            pad_w = int(w * padding)
            pad_h = int(h * padding)
            
            # Calculate padded coordinates
            x1 = max(0, x - pad_w)
            y1 = max(0, y - pad_h)
            x2 = min(img_w, x + w + pad_w)
            y2 = min(img_h, y + h + pad_h)
            
            # Extract face region
            face_image = image[y1:y2, x1:x2]
            
            # Validate extracted region
            if face_image.size == 0:
                return None
            
            # Resize to standard size for consistency
            face_image = cv2.resize(face_image, (224, 224))
            
            return face_image
            
        except Exception as e:
            logger.error(f"Error extracting face region: {str(e)}")
            return None
    
    def _process_landmarks(self, keypoints: Dict) -> List[Tuple[int, int]]:
        """
        Process facial landmarks/keypoints
        
        Args:
            keypoints: MTCNN keypoints dictionary
            
        Returns:
            List of landmark coordinates
        """
        try:
            landmarks = []
            
            # MTCNN provides 5 keypoints: left_eye, right_eye, nose, mouth_left, mouth_right
            keypoint_names = ['left_eye', 'right_eye', 'nose', 'mouth_left', 'mouth_right']
            
            for name in keypoint_names:
                if name in keypoints:
                    point = keypoints[name]
                    landmarks.append((int(point[0]), int(point[1])))
            
            return landmarks
            
        except Exception as e:
            logger.error(f"Error processing landmarks: {str(e)}")
            return []
    
    def _calculate_face_quality(self, face_image: np.ndarray, landmarks: List[Tuple[int, int]]) -> Dict:
        """
        Calculate face quality metrics
        
        Args:
            face_image: Extracted face image
            landmarks: Facial landmarks
            
        Returns:
            Dictionary of quality metrics
        """
        try:
            metrics = {}
            
            # Convert to grayscale for some calculations
            gray = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
            
            # Calculate blur metric (Laplacian variance)
            metrics['blur_score'] = cv2.Laplacian(gray, cv2.CV_64F).var()
            metrics['is_blurry'] = metrics['blur_score'] < 100
            
            # Calculate brightness
            metrics['brightness'] = np.mean(gray)
            metrics['is_dark'] = metrics['brightness'] < 50
            metrics['is_bright'] = metrics['brightness'] > 200
            
            # Calculate contrast
            metrics['contrast'] = gray.std()
            metrics['is_low_contrast'] = metrics['contrast'] < 30
            
            # Face symmetry (if we have eye landmarks)
            if len(landmarks) >= 2:
                left_eye, right_eye = landmarks[0], landmarks[1]
                eye_distance = np.sqrt((left_eye[0] - right_eye[0])**2 + (left_eye[1] - right_eye[1])**2)
                metrics['eye_distance'] = eye_distance
                
                # Calculate head pose (rough estimation)
                eye_center_x = (left_eye[0] + right_eye[0]) / 2
                face_center_x = face_image.shape[1] / 2
                metrics['head_pose_x'] = abs(eye_center_x - face_center_x) / face_center_x
                metrics['is_frontal'] = metrics['head_pose_x'] < 0.2
            
            # Overall quality score
            quality_score = 1.0
            if metrics['is_blurry']:
                quality_score *= 0.7
            if metrics['is_dark'] or metrics['is_bright']:
                quality_score *= 0.8
            if metrics['is_low_contrast']:
                quality_score *= 0.8
            if not metrics.get('is_frontal', True):
                quality_score *= 0.9
            
            metrics['overall_quality'] = quality_score
            metrics['is_good_quality'] = quality_score > 0.6
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating face quality: {str(e)}")
            return {'overall_quality': 0.5, 'is_good_quality': False}
    
    def detect_faces_batch(self, images: List[np.ndarray]) -> List[List[Dict]]:
        """
        Detect faces in a batch of images
        
        Args:
            images: List of input images
            
        Returns:
            List of face detection results for each image
        """
        try:
            results = []
            
            for i, image in enumerate(images):
                logger.debug(f"Processing image {i+1}/{len(images)}")
                faces = self.detect_faces(image)
                results.append(faces)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in batch face detection: {str(e)}")
            return []
    
    def get_face_count(self, image: np.ndarray) -> int:
        """
        Get the number of faces in an image
        
        Args:
            image: Input image
            
        Returns:
            Number of faces detected
        """
        faces = self.detect_faces(image)
        return len(faces)
    
    def get_largest_face(self, image: np.ndarray) -> Optional[Dict]:
        """
        Get the largest face in an image
        
        Args:
            image: Input image
            
        Returns:
            Largest face data or None
        """
        faces = self.detect_faces(image)
        
        if not faces:
            return None
        
        # Find face with largest area
        largest_face = max(faces, key=lambda f: f['face_area'])
        return largest_face
    
    def get_best_quality_face(self, image: np.ndarray) -> Optional[Dict]:
        """
        Get the best quality face in an image
        
        Args:
            image: Input image
            
        Returns:
            Best quality face data or None
        """
        faces = self.detect_faces(image)
        
        if not faces:
            return None
        
        # Find face with highest quality score
        best_face = max(faces, key=lambda f: f['quality_metrics']['overall_quality'])
        return best_face
    
    def get_version(self) -> str:
        """Get detector version"""
        return self.version
    
    def get_stats(self) -> Dict:
        """Get detector statistics"""
        return {
            'version': self.version,
            'min_face_size': self.min_face_size,
            'scale_factor': self.scale_factor,
            'is_initialized': self.detector is not None
        }