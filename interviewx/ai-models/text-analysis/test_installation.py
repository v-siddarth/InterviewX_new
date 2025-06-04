#!/usr/bin/env python3
"""
Test script to verify text analysis dependencies are installed correctly
"""

import os

def test_imports():
    """Test all required imports"""
    try:
        print("Testing imports...")
        
        # Core dependencies
        import numpy as np
        print("✅ NumPy:", np.__version__)
        
        import scipy
        print("✅ SciPy:", scipy.__version__)
        
        # Flask
        import flask
        print("✅ Flask:", flask.__version__)
        
        from flask_cors import CORS
        print("✅ Flask-CORS: OK")
        
        # NLP libraries
        import nltk
        print("✅ NLTK:", nltk.__version__)
        
        import textblob
        print("✅ TextBlob:", textblob.__version__)
        
        try:
            import spacy
            print("✅ spaCy:", spacy.__version__)
        except ImportError:
            print("⚠️  spaCy: Not installed (optional)")
        
        # Text analysis
        import textstat
        print("✅ Textstat: OK")
        
        # Machine Learning
        import sklearn
        print("✅ Scikit-learn:", sklearn.__version__)
        
        # Google Generative AI
        try:
            import google.generativeai as genai
            print("✅ Google Generative AI: OK")
        except ImportError:
            print("⚠️  Google Generative AI: Not installed")
        
        print("\n🎉 All core dependencies are working!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_nltk():
    """Test NLTK functionality"""
    try:
        print("\nTesting NLTK...")
        
        import nltk
        from nltk.tokenize import word_tokenize, sent_tokenize
        
        # Download required data
        required_data = ['punkt', 'stopwords', 'wordnet', 'averaged_perceptron_tagger']
        
        for data in required_data:
            try:
                nltk.data.find(f'tokenizers/{data}')
                print(f"✅ NLTK {data}: Available")
            except LookupError:
                print(f"Downloading NLTK {data}...")
                nltk.download(data, quiet=True)
                print(f"✅ NLTK {data}: Downloaded")
        
        # Test tokenization
        test_text = "This is a test sentence. This is another sentence!"
        words = word_tokenize(test_text)
        sentences = sent_tokenize(test_text)
        
        print(f"✅ Word tokenization: {len(words)} words")
        print(f"✅ Sentence tokenization: {len(sentences)} sentences")
        
        # Test stopwords
        from nltk.corpus import stopwords
        stop_words = set(stopwords.words('english'))
        print(f"✅ English stopwords: {len(stop_words)} words")
        
        print("🎉 NLTK functionality working!")
        return True
        
    except Exception as e:
        print(f"❌ NLTK error: {e}")
        return False

def test_textblob():
    """Test TextBlob functionality"""
    try:
        print("\nTesting TextBlob...")
        
        from textblob import TextBlob
        
        # Download corpora if needed
        try:
            # Test basic functionality
            text = "I love this product. It's amazing and works great!"
            blob = TextBlob(text)
            
            # Test sentiment analysis
            sentiment = blob.sentiment
            print(f"✅ Sentiment analysis: polarity={sentiment.polarity:.3f}, subjectivity={sentiment.subjectivity:.3f}")
            
            # Test tokenization
            words = blob.words
            sentences = blob.sentences
            print(f"✅ TextBlob tokenization: {len(words)} words, {len(sentences)} sentences")
            
            # Test noun phrase extraction
            noun_phrases = blob.noun_phrases
            print(f"✅ Noun phrases: {len(noun_phrases)} phrases")
            
        except LookupError:
            print("Downloading TextBlob corpora...")
            import textblob
            textblob.download_corpora()
            print("✅ TextBlob corpora downloaded")
        
        print("🎉 TextBlob functionality working!")
        return True
        
    except Exception as e:
        print(f"❌ TextBlob error: {e}")
        return False

def test_spacy():
    """Test spaCy functionality"""
    try:
        print("\nTesting spaCy...")
        
        import spacy
        
        # Try to load English model
        try:
            nlp = spacy.load("en_core_web_sm")
            print("✅ spaCy English model loaded")
            
            # Test processing
            text = "Apple Inc. is planning to build a new factory in California."
            doc = nlp(text)
            
            # Test tokenization
            tokens = [token.text for token in doc]
            print(f"✅ spaCy tokenization: {len(tokens)} tokens")
            
            # Test named entity recognition
            entities = [(ent.text, ent.label_) for ent in doc.ents]
            print(f"✅ Named entities: {len(entities)} entities")
            
            # Test POS tagging
            pos_tags = [(token.text, token.pos_) for token in doc]
            print(f"✅ POS tagging: {len(pos_tags)} tags")
            
        except OSError:
            print("⚠️  spaCy English model not found. Install with:")
            print("    python -m spacy download en_core_web_sm")
            return True  # Don't fail the test for this
        
        print("🎉 spaCy functionality working!")
        return True
        
    except Exception as e:
        print(f"❌ spaCy error: {e}")
        return True  # Don't fail for optional dependency

def test_textstat():
    """Test textstat functionality"""
    try:
        print("\nTesting textstat...")
        
        import textstat
        
        test_text = """
        This is a sample text for testing readability analysis. 
        It contains multiple sentences with varying complexity. 
        Some sentences are short. Others are much longer and contain more complex vocabulary and sentence structures.
        """
        
        # Test readability metrics
        flesch_score = textstat.flesch_reading_ease(test_text)
        fk_grade = textstat.flesch_kincaid_grade(test_text)
        cli_index = textstat.coleman_liau_index(test_text)
        
        print(f"✅ Flesch Reading Ease: {flesch_score:.2f}")
        print(f"✅ Flesch-Kincaid Grade: {fk_grade:.2f}")
        print(f"✅ Coleman-Liau Index: {cli_index:.2f}")
        
        print("🎉 Textstat functionality working!")
        return True
        
    except Exception as e:
        print(f"❌ Textstat error: {e}")
        return False

def test_gemini_integration():
    """Test Gemini API integration"""
    try:
        print("\nTesting Gemini integration...")
        
        import google.generativeai as genai
        
        # Check if API key is set
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            print("⚠️  GEMINI_API_KEY not set. Gemini features will be limited.")
            print("   Set with: export GEMINI_API_KEY='your-api-key'")
            return True  # Don't fail the test
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        
        # Test model initialization
        model = genai.GenerativeModel('gemini-pro')
        print("✅ Gemini Pro model initialized")
        
        # Test a simple generation (optional, requires API key)
        try:
            response = model.generate_content("Say 'Hello from Gemini!'")
            if response.text:
                print("✅ Gemini API test successful")
            else:
                print("⚠️  Gemini API returned empty response")
        except Exception as e:
            print(f"⚠️  Gemini API test failed: {str(e)}")
            print("   This might be due to API quotas or network issues")
        
        print("🎉 Gemini integration ready!")
        return True
        
    except Exception as e:
        print(f"❌ Gemini integration error: {e}")
        return True  # Don't fail for optional feature

def test_text_processing():
    """Test complete text processing pipeline"""
    try:
        print("\nTesting text processing pipeline...")
        
        from textblob import TextBlob
        import textstat
        import re
        
        test_text = """
        I have extensive experience in software development, particularly in Python and JavaScript. 
        During my previous role at TechCorp, I led a team of 5 developers to build a customer management system. 
        The project was completed 2 weeks ahead of schedule and resulted in a 30% increase in customer satisfaction.
        """
        
        # Basic metrics
        word_count = len(test_text.split())
        sentence_count = len(re.split(r'[.!?]+', test_text.strip()))
        
        print(f"✅ Basic metrics: {word_count} words, {sentence_count} sentences")
        
        # Sentiment analysis
        blob = TextBlob(test_text)
        sentiment = blob.sentiment
        print(f"✅ Sentiment: {sentiment.polarity:.3f} polarity, {sentiment.subjectivity:.3f} subjectivity")
        
        # Readability
        flesch_score = textstat.flesch_reading_ease(test_text)
        print(f"✅ Readability: {flesch_score:.2f} Flesch score")
        
        # Professional vocabulary detection
        professional_words = ['experience', 'development', 'team', 'project', 'management', 'system']
        found_words = [word for word in professional_words if word.lower() in test_text.lower()]
        print(f"✅ Professional vocabulary: {len(found_words)} words found")
        
        print("🎉 Text processing pipeline working!")
        return True
        
    except Exception as e:
        print(f"❌ Text processing error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing InterviewX Text Analysis Dependencies\n")
    print("=" * 60)
    
    success = True
    
    success &= test_imports()
    success &= test_nltk()
    success &= test_textblob()
    success &= test_spacy()
    success &= test_textstat()
    success &= test_gemini_integration()
    success &= test_text_processing()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 ALL TESTS PASSED! Text analysis service is ready to run.")
        print("\nYou can now start the service with:")
        print("python text_analysis_service.py")
        print("\nTest the API at: http://localhost:5003/health")
        
        if not os.getenv('GEMINI_API_KEY'):
            print("\n💡 Pro tip: Set GEMINI_API_KEY for enhanced AI features:")
            print("export GEMINI_API_KEY='your-gemini-api-key'")
    else:
        print("❌ Some tests failed. Please check the errors above and install missing dependencies.")
        print("\nCommon fixes:")
        print("- Install spaCy model: python -m spacy download en_core_web_sm")
        print("- Update packages: pip install --upgrade textblob nltk textstat")
        print("- For Gemini: pip install google-generativeai")