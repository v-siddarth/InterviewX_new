#!/usr/bin/env python3
"""
Text Processing Utility for InterviewX
Handles traditional NLP analysis, grammar checking, and text metrics
"""

import logging
import re
import string
from typing import Dict, List, Tuple, Optional
import traceback
from collections import Counter
import math

try:
    import nltk
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    from nltk.tag import pos_tag
    from nltk.chunk import ne_chunk
    from textblob import TextBlob
    from textstat import flesch_reading_ease, flesch_kincaid_grade, coleman_liau_index
    import spacy
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError as e:
    logging.error(f"Required packages not installed: {e}")
    raise

# Configure logging
logger = logging.getLogger(__name__)

class TextProcessor:
    """
    Text processing and analysis for interview responses
    """
    
    def __init__(self):
        """Initialize text processor"""
        self.version = "1.0.0"
        
        # Download required NLTK data
        self._download_nltk_requirements()
        
        # Initialize components
        try:
            self.stop_words = set(stopwords.words('english'))
            self.lemmatizer = WordNetLemmatizer()
            
            # Try to load spaCy model
            try:
                self.nlp = spacy.load("en_core_web_sm")
                self.spacy_available = True
            except OSError:
                logger.warning("spaCy model 'en_core_web_sm' not found. Some features will be limited.")
                self.nlp = None
                self.spacy_available = False
            
            # Initialize TF-IDF vectorizer for similarity calculations
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=1000,
                stop_words='english',
                ngram_range=(1, 2)
            )
            
            # Professional vocabulary list (sample)
            self.professional_words = {
                'leadership', 'collaboration', 'innovation', 'strategic', 'analytical',
                'communication', 'problem-solving', 'teamwork', 'initiative', 'responsibility',
                'achievement', 'development', 'improvement', 'efficiency', 'quality',
                'project', 'management', 'experience', 'skills', 'expertise'
            }
            
            # Informal words to avoid in interviews
            self.informal_words = {
                'yeah', 'yep', 'nope', 'gonna', 'wanna', 'kinda', 'sorta',
                'dunno', 'ain\'t', 'can\'t', 'won\'t', 'shouldn\'t', 'wouldn\'t'
            }
            
            logger.info("✅ Text processor initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize text processor: {str(e)}")
            raise
    
    def _download_nltk_requirements(self):
        """Download required NLTK data"""
        try:
            required_data = [
                'punkt', 'stopwords', 'wordnet', 'averaged_perceptron_tagger',
                'maxent_ne_chunker', 'words', 'omw-1.4'
            ]
            
            for data in required_data:
                try:
                    nltk.data.find(f'tokenizers/{data}')
                except LookupError:
                    logger.info(f"Downloading NLTK data: {data}")
                    nltk.download(data, quiet=True)
                    
        except Exception as e:
            logger.warning(f"Error downloading NLTK data: {str(e)}")
    
    def analyze_text(self, text: str) -> Dict:
        """
        Comprehensive text analysis
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            logger.debug("Starting comprehensive text analysis...")
            
            analysis = {}
            
            # Basic metrics
            basic_metrics = self._get_basic_metrics(text)
            analysis.update(basic_metrics)
            
            # Grammar analysis
            grammar_analysis = self.check_grammar(text)
            analysis['grammar_score'] = grammar_analysis.get('overall_score', 0.5)
            analysis['grammar_details'] = grammar_analysis
            
            # Readability analysis
            readability_analysis = self.analyze_readability(text)
            analysis['readability_score'] = readability_analysis.get('overall_score', 0.5)
            analysis['readability_details'] = readability_analysis
            
            # Sentiment analysis
            sentiment_analysis = self.analyze_sentiment(text)
            analysis['sentiment'] = sentiment_analysis
            
            # Vocabulary analysis
            vocabulary_analysis = self._analyze_vocabulary(text)
            analysis['vocabulary_score'] = vocabulary_analysis.get('overall_score', 0.5)
            analysis['vocabulary_details'] = vocabulary_analysis
            
            # Structure analysis
            structure_analysis = self._analyze_structure(text)
            analysis['structure_score'] = structure_analysis.get('overall_score', 0.5)
            analysis['structure_details'] = structure_analysis
            
            # Content analysis
            content_analysis = self._analyze_content(text)
            analysis['content_score'] = content_analysis.get('overall_score', 0.5)
            analysis['content_details'] = content_analysis
            
            # Calculate composite scores
            analysis['clarity_score'] = self._calculate_clarity_score(analysis)
            analysis['completeness_score'] = self._calculate_completeness_score(analysis)
            analysis['formality_score'] = self._calculate_formality_score(analysis)
            
            logger.debug("Text analysis completed")
            return analysis
            
        except Exception as e:
            logger.error(f"Error in text analysis: {str(e)}")
            logger.error(traceback.format_exc())
            return {'error': str(e)}
    
    def _get_basic_metrics(self, text: str) -> Dict:
        """Get basic text metrics"""
        try:
            # Character counts
            char_count = len(text)
            char_count_no_spaces = len(text.replace(' ', ''))
            
            # Word analysis
            words = word_tokenize(text.lower())
            word_count = len([w for w in words if w.isalnum()])
            unique_words = len(set(words))
            
            # Sentence analysis
            sentences = sent_tokenize(text)
            sentence_count = len(sentences)
            
            # Calculate averages
            avg_words_per_sentence = word_count / sentence_count if sentence_count > 0 else 0
            avg_chars_per_word = char_count_no_spaces / word_count if word_count > 0 else 0
            
            # Lexical diversity
            lexical_diversity = unique_words / word_count if word_count > 0 else 0
            
            return {
                'char_count': char_count,
                'char_count_no_spaces': char_count_no_spaces,
                'word_count': word_count,
                'unique_word_count': unique_words,
                'sentence_count': sentence_count,
                'avg_words_per_sentence': round(avg_words_per_sentence, 2),
                'avg_chars_per_word': round(avg_chars_per_word, 2),
                'lexical_diversity': round(lexical_diversity, 4)
            }
            
        except Exception as e:
            logger.error(f"Error in basic metrics: {str(e)}")
            return {}
    
    def check_grammar(self, text: str) -> Dict:
        """
        Check grammar and language quality
        
        Args:
            text: Text to check
            
        Returns:
            Grammar analysis results
        """
        try:
            logger.debug("Checking grammar...")
            
            # Use TextBlob for basic grammar checking
            blob = TextBlob(text)
            
            # Check for common grammar issues
            grammar_issues = []
            
            # Check sentences
            sentences = sent_tokenize(text)
            total_sentences = len(sentences)
            
            # Issues tracking
            long_sentences = 0
            short_sentences = 0
            fragment_sentences = 0
            
            for sentence in sentences:
                words_in_sentence = len(word_tokenize(sentence))
                
                # Check sentence length
                if words_in_sentence > 30:
                    long_sentences += 1
                    grammar_issues.append({
                        'type': 'long_sentence',
                        'description': f'Sentence is too long ({words_in_sentence} words)',
                        'severity': 'medium'
                    })
                elif words_in_sentence < 4:
                    short_sentences += 1
                    grammar_issues.append({
                        'type': 'short_sentence',
                        'description': 'Sentence is very short, might be a fragment',
                        'severity': 'low'
                    })
                
                # Check for sentence fragments (basic check)
                if not re.search(r'\b(is|are|was|were|has|have|had|do|does|did|will|would|can|could|should|shall)\b', sentence.lower()):
                    if words_in_sentence < 6:
                        fragment_sentences += 1
                        grammar_issues.append({
                            'type': 'fragment',
                            'description': 'Possible sentence fragment',
                            'severity': 'high'
                        })
            
            # Check capitalization
            capitalization_errors = 0
            for sentence in sentences:
                if sentence and not sentence[0].isupper():
                    capitalization_errors += 1
                    grammar_issues.append({
                        'type': 'capitalization',
                        'description': 'Sentence should start with capital letter',
                        'severity': 'medium'
                    })
            
            # Check punctuation
            punctuation_errors = 0
            for sentence in sentences:
                if sentence and sentence[-1] not in '.!?':
                    punctuation_errors += 1
                    grammar_issues.append({
                        'type': 'punctuation',
                        'description': 'Sentence should end with proper punctuation',
                        'severity': 'medium'
                    })
            
            # Check for repeated words
            words = word_tokenize(text.lower())
            word_freq = Counter(words)
            repeated_words = 0
            for word, freq in word_freq.items():
                if freq > 3 and word not in self.stop_words and len(word) > 3:
                    repeated_words += 1
                    grammar_issues.append({
                        'type': 'repetition',
                        'description': f'Word "{word}" is repeated {freq} times',
                        'severity': 'low'
                    })
            
            # Calculate grammar score
            error_penalty = len(grammar_issues) * 0.05
            grammar_score = max(0.0, 1.0 - error_penalty)
            
            return {
                'overall_score': round(grammar_score, 4),
                'total_issues': len(grammar_issues),
                'issues': grammar_issues[:10],  # Limit to first 10 issues
                'sentence_analysis': {
                    'total_sentences': total_sentences,
                    'long_sentences': long_sentences,
                    'short_sentences': short_sentences,
                    'fragment_sentences': fragment_sentences,
                    'capitalization_errors': capitalization_errors,
                    'punctuation_errors': punctuation_errors
                },
                'word_analysis': {
                    'repeated_words': repeated_words,
                    'total_unique_words': len(set(words))
                }
            }
            
        except Exception as e:
            logger.error(f"Error in grammar check: {str(e)}")
            return {'overall_score': 0.5, 'error': str(e)}
    
    def analyze_readability(self, text: str) -> Dict:
        """
        Analyze text readability
        
        Args:
            text: Text to analyze
            
        Returns:
            Readability analysis results
        """
        try:
            logger.debug("Analyzing readability...")
            
            # Calculate readability scores
            try:
                flesch_score = flesch_reading_ease(text)
                fk_grade = flesch_kincaid_grade(text)
                cli_index = coleman_liau_index(text)
            except:
                # Fallback if textstat fails
                flesch_score = 50.0
                fk_grade = 8.0
                cli_index = 8.0
            
            # Interpret Flesch Reading Ease score
            if flesch_score >= 90:
                readability_level = "Very Easy"
            elif flesch_score >= 80:
                readability_level = "Easy"
            elif flesch_score >= 70:
                readability_level = "Fairly Easy"
            elif flesch_score >= 60:
                readability_level = "Standard"
            elif flesch_score >= 50:
                readability_level = "Fairly Difficult"
            elif flesch_score >= 30:
                readability_level = "Difficult"
            else:
                readability_level = "Very Difficult"
            
            # Calculate average word and sentence lengths
            words = word_tokenize(text)
            sentences = sent_tokenize(text)
            
            avg_word_length = sum(len(word) for word in words if word.isalnum()) / len([w for w in words if w.isalnum()]) if words else 0
            avg_sentence_length = len([w for w in words if w.isalnum()]) / len(sentences) if sentences else 0
            
            # Calculate readability score (0-1 scale)
            # Ideal for professional communication: Flesch score 60-70
            if 60 <= flesch_score <= 70:
                readability_score = 1.0
            elif 50 <= flesch_score < 60 or 70 < flesch_score <= 80:
                readability_score = 0.8
            elif 40 <= flesch_score < 50 or 80 < flesch_score <= 90:
                readability_score = 0.6
            else:
                readability_score = 0.4
            
            return {
                'overall_score': round(readability_score, 4),
                'flesch_reading_ease': round(flesch_score, 2),
                'flesch_kincaid_grade': round(fk_grade, 2),
                'coleman_liau_index': round(cli_index, 2),
                'readability_level': readability_level,
                'avg_word_length': round(avg_word_length, 2),
                'avg_sentence_length': round(avg_sentence_length, 2),
                'is_appropriate_level': 60 <= flesch_score <= 80
            }
            
        except Exception as e:
            logger.error(f"Error in readability analysis: {str(e)}")
            return {'overall_score': 0.5, 'error': str(e)}
    
    def analyze_sentiment(self, text: str) -> Dict:
        """
        Analyze text sentiment
        
        Args:
            text: Text to analyze
            
        Returns:
            Sentiment analysis results
        """
        try:
            blob = TextBlob(text)
            
            polarity = blob.sentiment.polarity
            subjectivity = blob.sentiment.subjectivity
            
            # Classify sentiment
            if polarity > 0.1:
                sentiment = 'positive'
            elif polarity < -0.1:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            
            # Classify subjectivity
            if subjectivity > 0.6:
                subjectivity_level = 'subjective'
            elif subjectivity < 0.4:
                subjectivity_level = 'objective'
            else:
                subjectivity_level = 'balanced'
            
            return {
                'sentiment': sentiment,
                'polarity': round(polarity, 4),
                'subjectivity': round(subjectivity, 4),
                'subjectivity_level': subjectivity_level,
                'confidence': round(abs(polarity), 4)
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return {
                'sentiment': 'neutral',
                'polarity': 0.0,
                'subjectivity': 0.5,
                'error': str(e)
            }
    
    def _analyze_vocabulary(self, text: str) -> Dict:
        """Analyze vocabulary complexity and appropriateness"""
        try:
            words = word_tokenize(text.lower())
            words = [w for w in words if w.isalnum()]
            
            # Vocabulary complexity
            complex_words = 0
            professional_words_used = 0
            informal_words_used = 0
            
            for word in words:
                # Count syllables (rough estimate)
                syllables = self._count_syllables(word)
                if syllables >= 3:
                    complex_words += 1
                
                # Check professional vocabulary
                if word in self.professional_words:
                    professional_words_used += 1
                
                # Check informal words
                if word in self.informal_words:
                    informal_words_used += 1
            
            total_words = len(words)
            
            # Calculate scores
            complexity_ratio = complex_words / total_words if total_words > 0 else 0
            professional_ratio = professional_words_used / total_words if total_words > 0 else 0
            informal_ratio = informal_words_used / total_words if total_words > 0 else 0
            
            # Vocabulary score
            vocab_score = 0.7  # Base score
            
            # Boost for professional vocabulary
            vocab_score += min(0.2, professional_ratio * 2)
            
            # Penalty for too much informal language
            vocab_score -= informal_ratio * 0.5
            
            # Penalty for too simple or too complex vocabulary
            if complexity_ratio < 0.1:
                vocab_score -= 0.1  # Too simple
            elif complexity_ratio > 0.4:
                vocab_score -= 0.1  # Too complex
            
            vocab_score = max(0.0, min(1.0, vocab_score))
            
            return {
                'overall_score': round(vocab_score, 4),
                'complexity_ratio': round(complexity_ratio, 4),
                'professional_words_ratio': round(professional_ratio, 4),
                'informal_words_ratio': round(informal_ratio, 4),
                'complex_words_count': complex_words,
                'professional_words_count': professional_words_used,
                'informal_words_count': informal_words_used,
                'is_appropriate_complexity': 0.15 <= complexity_ratio <= 0.35
            }
            
        except Exception as e:
            logger.error(f"Error in vocabulary analysis: {str(e)}")
            return {'overall_score': 0.5, 'error': str(e)}
    
    def _analyze_structure(self, text: str) -> Dict:
        """Analyze text structure and organization"""
        try:
            sentences = sent_tokenize(text)
            paragraphs = text.split('\n\n')
            
            # Structure metrics
            sentence_count = len(sentences)
            paragraph_count = len([p for p in paragraphs if p.strip()])
            
            # Check for transition words
            transition_words = {
                'first', 'second', 'third', 'finally', 'however', 'therefore',
                'furthermore', 'moreover', 'additionally', 'consequently',
                'in conclusion', 'to summarize', 'for example', 'for instance'
            }
            
            transition_count = 0
            words = word_tokenize(text.lower())
            for word in words:
                if word in transition_words:
                    transition_count += 1
            
            # Check for logical flow indicators
            flow_indicators = 0
            if 'first' in text.lower() or '1.' in text or 'firstly' in text.lower():
                flow_indicators += 1
            if 'second' in text.lower() or '2.' in text or 'secondly' in text.lower():
                flow_indicators += 1
            if 'conclusion' in text.lower() or 'finally' in text.lower() or 'summary' in text.lower():
                flow_indicators += 1
            
            # Structure score
            structure_score = 0.5  # Base score
            
            # Bonus for good sentence count (3-8 sentences ideal for interview responses)
            if 3 <= sentence_count <= 8:
                structure_score += 0.2
            elif sentence_count < 3:
                structure_score -= 0.1
            
            # Bonus for transitions
            transition_ratio = transition_count / sentence_count if sentence_count > 0 else 0
            structure_score += min(0.2, transition_ratio * 2)
            
            # Bonus for logical flow
            structure_score += flow_indicators * 0.1
            
            structure_score = max(0.0, min(1.0, structure_score))
            
            return {
                'overall_score': round(structure_score, 4),
                'sentence_count': sentence_count,
                'paragraph_count': paragraph_count,
                'transition_words_count': transition_count,
                'flow_indicators_count': flow_indicators,
                'has_good_length': 3 <= sentence_count <= 8,
                'has_transitions': transition_count > 0,
                'has_logical_flow': flow_indicators >= 2
            }
            
        except Exception as e:
            logger.error(f"Error in structure analysis: {str(e)}")
            return {'overall_score': 0.5, 'error': str(e)}
    
    def _analyze_content(self, text: str) -> Dict:
        """Analyze content quality and depth"""
        try:
            words = word_tokenize(text.lower())
            words = [w for w in words if w.isalnum() and w not in self.stop_words]
            
            # Content depth indicators
            depth_indicators = {
                'experience', 'project', 'team', 'challenge', 'solution', 'result',
                'learned', 'achieved', 'improved', 'developed', 'managed', 'led',
                'collaborated', 'implemented', 'created', 'designed', 'analyzed'
            }
            
            depth_words_found = sum(1 for word in words if word in depth_indicators)
            
            # Specific examples indicators
            example_indicators = {
                'example', 'instance', 'specifically', 'particular', 'case',
                'situation', 'time when', 'experience where', 'project where'
            }
            
            example_words_found = 0
            text_lower = text.lower()
            for indicator in example_indicators:
                if indicator in text_lower:
                    example_words_found += 1
            
            # Quantitative information
            numbers = re.findall(r'\b\d+(?:\.\d+)?(?:%|percent|million|thousand|years?|months?|weeks?|days?)?\b', text)
            quantitative_info = len(numbers)
            
            # Content score
            content_score = 0.4  # Base score
            
            # Bonus for depth indicators
            depth_ratio = depth_words_found / len(words) if len(words) > 0 else 0
            content_score += min(0.3, depth_ratio * 10)
            
            # Bonus for specific examples
            content_score += min(0.2, example_words_found * 0.1)
            
            # Bonus for quantitative information
            content_score += min(0.1, quantitative_info * 0.02)
            
            content_score = max(0.0, min(1.0, content_score))
            
            return {
                'overall_score': round(content_score, 4),
                'depth_words_count': depth_words_found,
                'example_indicators_count': example_words_found,
                'quantitative_info_count': quantitative_info,
                'has_specific_examples': example_words_found > 0,
                'has_quantitative_info': quantitative_info > 0,
                'content_depth_level': 'high' if depth_words_found >= 3 else 'medium' if depth_words_found >= 1 else 'low'
            }
            
        except Exception as e:
            logger.error(f"Error in content analysis: {str(e)}")
            return {'overall_score': 0.5, 'error': str(e)}
    
    def _calculate_clarity_score(self, analysis: Dict) -> float:
        """Calculate overall clarity score"""
        try:
            weights = {
                'grammar_score': 0.4,
                'readability_score': 0.3,
                'structure_score': 0.3
            }
            
            clarity_score = 0.0
            total_weight = 0.0
            
            for metric, weight in weights.items():
                if metric in analysis:
                    clarity_score += weight * analysis[metric]
                    total_weight += weight
            
            return clarity_score / total_weight if total_weight > 0 else 0.5
            
        except Exception as e:
            logger.error(f"Error calculating clarity score: {str(e)}")
            return 0.5
    
    def _calculate_completeness_score(self, analysis: Dict) -> float:
        """Calculate completeness score"""
        try:
            # Based on word count, content depth, and structure
            word_count = analysis.get('word_count', 0)
            content_score = analysis.get('content_score', 0.5)
            structure_score = analysis.get('structure_score', 0.5)
            
            # Word count score (ideal: 75-200 words for interview responses)
            if 75 <= word_count <= 200:
                length_score = 1.0
            elif 50 <= word_count < 75 or 200 < word_count <= 300:
                length_score = 0.8
            elif 25 <= word_count < 50 or 300 < word_count <= 400:
                length_score = 0.6
            else:
                length_score = 0.4
            
            # Weighted combination
            completeness_score = (length_score * 0.4 + content_score * 0.4 + structure_score * 0.2)
            
            return round(completeness_score, 4)
            
        except Exception as e:
            logger.error(f"Error calculating completeness score: {str(e)}")
            return 0.5
    
    def _calculate_formality_score(self, analysis: Dict) -> float:
        """Calculate formality/professionalism score"""
        try:
            vocabulary_details = analysis.get('vocabulary_details', {})
            
            professional_ratio = vocabulary_details.get('professional_words_ratio', 0)
            informal_ratio = vocabulary_details.get('informal_words_ratio', 0)
            
            # Base formality score
            formality_score = 0.7
            
            # Boost for professional vocabulary
            formality_score += professional_ratio * 2
            
            # Penalty for informal language
            formality_score -= informal_ratio * 3
            
            return max(0.0, min(1.0, round(formality_score, 4)))
            
        except Exception as e:
            logger.error(f"Error calculating formality score: {str(e)}")
            return 0.5
    
    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word (rough estimate)"""
        try:
            word = word.lower()
            vowels = 'aeiouy'
            syllable_count = 0
            prev_was_vowel = False
            
            for char in word:
                is_vowel = char in vowels
                if is_vowel and not prev_was_vowel:
                    syllable_count += 1
                prev_was_vowel = is_vowel
            
            # Handle silent e
            if word.endswith('e'):
                syllable_count -= 1
            
            # Every word has at least one syllable
            return max(1, syllable_count)
            
        except:
            return 1
    
    def quick_analyze(self, text: str) -> Dict:
        """Quick text analysis for batch processing"""
        try:
            # Basic metrics
            word_count = len(text.split())
            sentence_count = len(sent_tokenize(text))
            
            # Quick grammar check
            blob = TextBlob(text)
            
            # Simple scores
            grammar_score = 0.8 if len(blob.correct().raw) == len(text) else 0.6
            
            # Length-based completeness
            if 50 <= word_count <= 200:
                completeness_score = 1.0
            elif word_count < 50:
                completeness_score = word_count / 50
            else:
                completeness_score = max(0.5, 200 / word_count)
            
            # Simple readability
            try:
                flesch_score = flesch_reading_ease(text)
                readability_score = 1.0 if 60 <= flesch_score <= 80 else 0.7
            except:
                readability_score = 0.7
            
            # Overall clarity
            clarity_score = (grammar_score + readability_score) / 2
            
            return {
                'grammar_score': round(grammar_score, 4),
                'clarity_score': round(clarity_score, 4),
                'completeness_score': round(completeness_score, 4),
                'readability_score': round(readability_score, 4),
                'word_count': word_count,
                'sentence_count': sentence_count
            }
            
        except Exception as e:
            logger.error(f"Error in quick analysis: {str(e)}")
            return {
                'grammar_score': 0.5,
                'clarity_score': 0.5,
                'completeness_score': 0.5,
                'readability_score': 0.5
            }
    
    def compare_texts(self, text1: str, text2: str) -> Dict:
        """Compare two texts for similarity and quality"""
        try:
            # Analyze both texts
            analysis1 = self.quick_analyze(text1)
            analysis2 = self.quick_analyze(text2)
            
            # Calculate similarity using TF-IDF
            try:
                tfidf_matrix = self.tfidf_vectorizer.fit_transform([text1, text2])
                similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            except:
                # Fallback: simple word overlap
                words1 = set(word_tokenize(text1.lower()))
                words2 = set(word_tokenize(text2.lower()))
                similarity = len(words1.intersection(words2)) / len(words1.union(words2))
            
            # Quality comparison
            quality1 = (analysis1['grammar_score'] + analysis1['clarity_score'] + analysis1['completeness_score']) / 3
            quality2 = (analysis2['grammar_score'] + analysis2['clarity_score'] + analysis2['completeness_score']) / 3
            
            return {
                'similarity_score': round(similarity, 4),
                'text1_quality': round(quality1, 4),
                'text2_quality': round(quality2, 4),
                'quality_difference': round(abs(quality1 - quality2), 4),
                'better_text': 'text1' if quality1 > quality2 else 'text2' if quality2 > quality1 else 'tie',
                'analysis1': analysis1,
                'analysis2': analysis2
            }
            
        except Exception as e:
            logger.error(f"Error comparing texts: {str(e)}")
            return {'error': str(e)}
    
    def get_version(self) -> str:
        """Get processor version"""
        return self.version
    
    def get_features(self) -> List[str]:
        """Get list of available features"""
        features = [
            'grammar_checking',
            'readability_analysis',
            'sentiment_analysis',
            'vocabulary_analysis',
            'structure_analysis',
            'content_analysis',
            'text_comparison'
        ]
        
        if self.spacy_available:
            features.extend(['named_entity_recognition', 'advanced_pos_tagging'])
        
        return features
    
    def get_stats(self) -> Dict:
        """Get processor statistics"""
        return {
            'version': self.version,
            'spacy_available': self.spacy_available,
            'features_count': len(self.get_features()),
            'professional_words_count': len(self.professional_words),
            'informal_words_count': len(self.informal_words)
        }