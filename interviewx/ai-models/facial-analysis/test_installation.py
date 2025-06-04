#!/usr/bin/env python3
"""
Test script to verify facial analysis dependencies are installed correctly
"""

def test_imports():
    """Test all required imports"""
    try:
        print("Testing imports...")
        
        # Core dependencies
        import numpy as np
        print("✅ NumPy:", np.__version__)
        
        import scipy
        print("✅ SciPy:", scipy.__version__)
        
        import cv2
        print("✅ OpenCV:", cv2.__version__)
        
        from PIL import Image
        print("✅ Pillow: OK")
        
        # TensorFlow
        import tensorflow as tf
        print("✅ TensorFlow:", tf.__version__)
        
        # Flask
        import flask
        print("✅ Flask:", flask.__version__)
        
        from flask_cors import CORS
        print("✅ Flask-CORS: OK")
        
        # Machine Learning
        import sklearn
        print("✅ Scikit-learn:", sklearn.__version__)
        
        # MTCNN
        try:
            from mtcnn import MTCNN
            print("✅ MTCNN: OK")
        except ImportError:
            print("⚠️  MTCNN: Not installed")
            return False
        
        print("\n🎉 All dependencies are working!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_tensorflow():
    """Test TensorFlow functionality"""
    try:
        print("\nTesting TensorFlow...")
        
        import tensorflow as tf
        
        # Check TensorFlow configuration
        print(f"TensorFlow version: {tf.__version__}")
        print(f"GPU available: {tf.config.list_physical_devices('GPU')}")
        print(f"Built with CUDA: {tf.test.is_built_with_cuda()}")
        
        # Test basic operations
        a = tf.constant([[1.0, 2.0], [3.0, 4.0]])
        b = tf.constant([[1.0, 1.0], [0.0, 1.0]])
        c = tf.matmul(a, b)
        
        print("✅ Basic TensorFlow operations working")
        
        # Test Keras
        from tensorflow import keras
        print("✅ Keras available")
        
        print("🎉 TensorFlow functionality working!")
        return True
        
    except Exception as e:
        print(f"❌ TensorFlow error: {e}")
        return False

def test_opencv():
    """Test OpenCV functionality"""
    try:
        print("\nTesting OpenCV...")
        
        import cv2
        import numpy as np
        
        # Create test image
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        test_image[:] = (255, 0, 0)  # Blue image
        
        # Test basic operations
        gray = cv2.cvtColor(test_image, cv2.COLOR_BGR2GRAY)
        print(f"✅ Color conversion: {gray.shape}")
        
        # Test face detection (Haar cascades)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        print(f"✅ Haar cascade face detection: {len(faces)} faces")
        
        print("🎉 OpenCV functionality working!")
        return True
        
    except Exception as e:
        print(f"❌ OpenCV error: {e}")
        return False

def test_mtcnn():
    """Test MTCNN face detection"""
    try:
        print("\nTesting MTCNN face detection...")
        
        from mtcnn import MTCNN
        import numpy as np
        import cv2
        
        # Initialize MTCNN
        detector = MTCNN()
        print("✅ MTCNN detector initialized")
        
        # Create a simple test image with a face-like pattern
        test_image = np.ones((160, 160, 3), dtype=np.uint8) * 128
        
        # Add some face-like features (very basic)
        cv2.circle(test_image, (60, 60), 5, (0, 0, 0), -1)  # Left eye
        cv2.circle(test_image, (100, 60), 5, (0, 0, 0), -1)  # Right eye
        cv2.rectangle(test_image, (75, 80), (85, 100), (0, 0, 0), -1)  # Nose
        cv2.rectangle(test_image, (70, 110), (90, 120), (0, 0, 0), -1)  # Mouth
        
        # Test detection
        result = detector.detect_faces(test_image)
        print(f"✅ MTCNN detection test: {len(result)} faces detected")
        
        print("🎉 MTCNN functionality working!")
        return True
        
    except Exception as e:
        print(f"❌ MTCNN error: {e}")
        return False

def test_keras_models():
    """Test Keras model creation"""
    try:
        print("\nTesting Keras model creation...")
        
        from tensorflow import keras
        from tensorflow.keras import layers
        
        # Create a simple model
        model = keras.Sequential([
            layers.Dense(64, activation='relu', input_shape=(10,)),
            layers.Dense(32, activation='relu'),
            layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        print("✅ Simple model creation and compilation")
        
        # Test with dummy data
        import numpy as np
        dummy_x = np.random.random((32, 10))
        dummy_y = np.random.randint(2, size=(32, 1))
        
        # Test prediction (not training)
        predictions = model.predict(dummy_x, verbose=0)
        print(f"✅ Model prediction: {predictions.shape}")
        
        print("🎉 Keras model functionality working!")
        return True
        
    except Exception as e:
        print(f"❌ Keras model error: {e}")
        return False

def test_image_processing():
    """Test image processing pipeline"""
    try:
        print("\nTesting image processing pipeline...")
        
        import numpy as np
        import cv2
        from PIL import Image
        
        # Create test image
        test_image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        
        # Test PIL operations
        pil_image = Image.fromarray(test_image)
        resized_pil = pil_image.resize((160, 160))
        print("✅ PIL image operations")
        
        # Test OpenCV operations
        cv_image = cv2.cvtColor(test_image, cv2.COLOR_RGB2BGR)
        resized_cv = cv2.resize(cv_image, (160, 160))
        print("✅ OpenCV image operations")
        
        # Test normalization
        normalized = test_image.astype(np.float32) / 255.0
        print(f"✅ Image normalization: {normalized.min():.3f} to {normalized.max():.3f}")
        
        print("🎉 Image processing pipeline working!")
        return True
        
    except Exception as e:
        print(f"❌ Image processing error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing InterviewX Facial Analysis Dependencies\n")
    print("=" * 60)
    
    success = True
    
    success &= test_imports()
    success &= test_tensorflow()
    success &= test_opencv()
    success &= test_mtcnn()
    success &= test_keras_models()
    success &= test_image_processing()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 ALL TESTS PASSED! Facial analysis service is ready to run.")
        print("\nYou can now start the service with:")
        print("python face_analysis_service.py")
        print("\nTest the API at: http://localhost:5001/health")
    else:
        print("❌ Some tests failed. Please check the errors above and install missing dependencies.")
        print("\nCommon fixes:")
        print("- Update TensorFlow: pip install tensorflow==2.17.1")
        print("- Install MTCNN: pip install mtcnn")
        print("- Consider using Python 3.9 or 3.10 if using 3.12")
        print("- For GPU support: pip install tensorflow[and-cuda]")