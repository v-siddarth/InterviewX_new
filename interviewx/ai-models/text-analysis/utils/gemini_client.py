#!/usr/bin/env python3
"""
Gemini Pro API Client for InterviewX
Handles integration with Google's Gemini Pro for intelligent text analysis
"""

import logging
import json
import time
from typing import Dict, List, Optional, Any
import traceback
import re

try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
except ImportError as e:
    logging.error(f"Google Generative AI not installed: {e}")
    raise

# Configure logging
logger = logging.getLogger(__name__)

class GeminiClient:
    """
    Client for Google Gemini Pro API integration
    """
    
    def __init__(self, api_key: str, model_name: str = "gemini-pro"):
        """
        Initialize Gemini client
        
        Args:
            api_key: Google API key for Gemini
            model_name: Model name to use
        """
        self.api_key = api_key
        self.model_name = model_name
        self.version = "1.0.0"
        
        # Configure the API
        try:
            genai.configure(api_key=api_key)
            
            # Initialize the model
            self.model = genai.GenerativeModel(
                model_name=model_name,
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                }
            )
            
            # Test the connection
            self._test_connection()
            
            logger.info(f"✅ Gemini client initialized with model: {model_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini client: {str(e)}")
            raise
    
    def _test_connection(self):
        """Test connection to Gemini API"""
        try:
            test_prompt = "Test connection. Respond with 'OK'."
            response = self.model.generate_content(test_prompt)
            
            if response and response.text:
                logger.info("✅ Gemini API connection successful")
            else:
                raise Exception("No response from Gemini API")
                
        except Exception as e:
            logger.error(f"❌ Gemini API connection test failed: {str(e)}")
            raise
    
    def analyze_interview_response(self, text: str, question: str = "", 
                                 analysis_type: str = "comprehensive") -> Dict:
        """
        Analyze interview response using Gemini Pro
        
        Args:
            text: The interview response text
            question: The interview question (optional)
            analysis_type: Type of analysis (comprehensive, quick, grammar_only)
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            logger.debug(f"Starting Gemini analysis: {analysis_type}")
            
            # Generate appropriate prompt based on analysis type
            prompt = self._generate_analysis_prompt(text, question, analysis_type)
            
            # Get response from Gemini
            response = self._get_gemini_response(prompt)
            
            # Parse the response
            analysis_result = self._parse_analysis_response(response, analysis_type)
            
            logger.debug("Gemini analysis completed successfully")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error in Gemini analysis: {str(e)}")
            logger.error(traceback.format_exc())
            return {'error': str(e)}
    
    def _generate_analysis_prompt(self, text: str, question: str, analysis_type: str) -> str:
        """Generate appropriate prompt for different analysis types"""
        
        base_context = """You are an expert interview evaluator for a professional assessment system. 
        Analyze the following interview response and provide detailed, objective feedback."""
        
        if analysis_type == "comprehensive":
            prompt = f"""{base_context}

INTERVIEW QUESTION: {question if question else "Not provided"}

CANDIDATE RESPONSE: "{text}"

Please provide a comprehensive analysis in the following JSON format:
{{
    "scores": {{
        "grammar_score": [0.0-1.0],
        "clarity_score": [0.0-1.0], 
        "relevance_score": [0.0-1.0],
        "completeness_score": [0.0-1.0],
        "professionalism_score": [0.0-1.0]
    }},
    "content_analysis": {{
        "main_points": ["point1", "point2", ...],
        "strengths": ["strength1", "strength2", ...],
        "weaknesses": ["weakness1", "weakness2", ...],
        "tone": "professional/casual/enthusiastic/etc",
        "structure": "well-organized/poorly-organized/etc"
    }},
    "insights": [
        "Specific insight 1",
        "Specific insight 2",
        "Specific insight 3"
    ],
    "improvement_suggestions": [
        "Suggestion 1",
        "Suggestion 2",
        "Suggestion 3"
    ],
    "overall_impression": "Brief overall assessment"
}}

SCORING CRITERIA:
- Grammar: Correct grammar, spelling, and sentence structure
- Clarity: Clear expression of ideas, easy to understand
- Relevance: How well the response addresses the question
- Completeness: Thoroughness and depth of the response
- Professionalism: Appropriate tone and language for interview setting

Provide only the JSON response, no additional text."""

        elif analysis_type == "quick":
            prompt = f"""{base_context}

CANDIDATE RESPONSE: "{text}"
QUESTION CONTEXT: {question if question else "General response"}

Provide a quick analysis in JSON format:
{{
    "scores": {{
        "grammar_score": [0.0-1.0],
        "clarity_score": [0.0-1.0],
        "relevance_score": [0.0-1.0],
        "professionalism_score": [0.0-1.0]
    }},
    "quick_feedback": "Brief feedback in 1-2 sentences",
    "top_issue": "Most important issue to address",
    "strength": "Main strength of the response"
}}

Provide only the JSON response."""

        elif analysis_type == "grammar_only":
            prompt = f"""You are a grammar and language expert. Analyze this text for grammatical correctness and language quality.

TEXT: "{text}"

Provide analysis in JSON format:
{{
    "grammar_score": [0.0-1.0],
    "grammar_errors": [
        {{"type": "error_type", "description": "error description", "severity": "high/medium/low"}},
        ...
    ],
    "language_quality": {{
        "vocabulary_level": "basic/intermediate/advanced",
        "sentence_variety": "poor/good/excellent",
        "word_choice": "poor/good/excellent"
    }},
    "corrections": [
        {{"original": "incorrect text", "corrected": "corrected text", "explanation": "why this is better"}},
        ...
    ]
}}

Provide only the JSON response."""

        else:
            # Default comprehensive analysis
            prompt = self._generate_analysis_prompt(text, question, "comprehensive")
        
        return prompt
    
    def _get_gemini_response(self, prompt: str, max_retries: int = 3) -> str:
        """Get response from Gemini with retry logic"""
        
        for attempt in range(max_retries):
            try:
                logger.debug(f"Attempting Gemini API call (attempt {attempt + 1})")
                
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.3,  # Lower temperature for more consistent responses
                        top_p=0.8,
                        top_k=40,
                        max_output_tokens=2048,
                    )
                )
                
                if response.text:
                    return response.text.strip()
                else:
                    raise Exception("Empty response from Gemini")
                    
            except Exception as e:
                logger.warning(f"Gemini API attempt {attempt + 1} failed: {str(e)}")
                
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2  # Exponential backoff
                    logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise Exception(f"Gemini API failed after {max_retries} attempts: {str(e)}")
    
    def _parse_analysis_response(self, response: str, analysis_type: str) -> Dict:
        """Parse Gemini response into structured format"""
        try:
            # Clean the response text
            cleaned_response = self._clean_json_response(response)
            
            # Try to parse as JSON
            try:
                parsed = json.loads(cleaned_response)
                
                # Validate and normalize the response
                normalized = self._normalize_analysis_result(parsed, analysis_type)
                return normalized
                
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse JSON response: {str(e)}")
                
                # Fallback: try to extract information manually
                return self._extract_fallback_analysis(response, analysis_type)
                
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            return {'error': f'Failed to parse response: {str(e)}'}
    
    def _clean_json_response(self, response: str) -> str:
        """Clean response text to extract JSON"""
        # Remove any markdown formatting
        response = re.sub(r'```json\s*', '', response)
        response = re.sub(r'```\s*$', '', response)
        
        # Find JSON-like content
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json_match.group(0)
        
        return response.strip()
    
    def _normalize_analysis_result(self, parsed: Dict, analysis_type: str) -> Dict:
        """Normalize and validate analysis result"""
        try:
            normalized = {}
            
            # Extract and validate scores
            scores = parsed.get('scores', {})
            normalized['scores'] = {}
            
            score_fields = ['grammar_score', 'clarity_score', 'relevance_score', 
                          'completeness_score', 'professionalism_score']
            
            for field in score_fields:
                if field in scores:
                    score = float(scores[field])
                    normalized['scores'][field] = max(0.0, min(1.0, score))
                else:
                    normalized['scores'][field] = 0.5  # Default neutral score
            
            # Extract other fields based on analysis type
            if analysis_type == "comprehensive":
                normalized['content_analysis'] = parsed.get('content_analysis', {})
                normalized['insights'] = parsed.get('insights', [])
                normalized['improvement_suggestions'] = parsed.get('improvement_suggestions', [])
                normalized['overall_impression'] = parsed.get('overall_impression', '')
                
            elif analysis_type == "quick":
                normalized['quick_feedback'] = parsed.get('quick_feedback', '')
                normalized['top_issue'] = parsed.get('top_issue', '')
                normalized['strength'] = parsed.get('strength', '')
                
            elif analysis_type == "grammar_only":
                normalized['grammar_errors'] = parsed.get('grammar_errors', [])
                normalized['language_quality'] = parsed.get('language_quality', {})
                normalized['corrections'] = parsed.get('corrections', [])
            
            normalized['analysis_type'] = analysis_type
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing analysis result: {str(e)}")
            return {'error': f'Failed to normalize result: {str(e)}'}
    
    def _extract_fallback_analysis(self, response: str, analysis_type: str) -> Dict:
        """Extract analysis information when JSON parsing fails"""
        try:
            logger.info("Using fallback analysis extraction")
            
            # Basic fallback analysis
            fallback = {
                'scores': {
                    'grammar_score': 0.7,  # Default scores
                    'clarity_score': 0.7,
                    'relevance_score': 0.7,
                    'completeness_score': 0.7,
                    'professionalism_score': 0.7
                },
                'fallback_response': response,
                'analysis_type': analysis_type,
                'warning': 'Fallback analysis used due to parsing issues'
            }
            
            # Try to extract numerical scores if present
            score_patterns = {
                'grammar_score': r'grammar[:\s]*([0-9.]+)',
                'clarity_score': r'clarity[:\s]*([0-9.]+)',
                'relevance_score': r'relevance[:\s]*([0-9.]+)',
                'professionalism_score': r'professional[:\s]*([0-9.]+)'
            }
            
            for score_name, pattern in score_patterns.items():
                match = re.search(pattern, response.lower())
                if match:
                    try:
                        score = float(match.group(1))
                        # Normalize score to 0-1 range
                        if score > 1:
                            score = score / 10 if score <= 10 else score / 100
                        fallback['scores'][score_name] = max(0.0, min(1.0, score))
                    except:
                        pass
            
            return fallback
            
        except Exception as e:
            logger.error(f"Error in fallback analysis: {str(e)}")
            return {'error': f'Fallback analysis failed: {str(e)}'}
    
    def evaluate_answer_quality(self, text: str, expected_keywords: List[str] = None,
                               question_type: str = "general") -> Dict:
        """
        Evaluate answer quality for specific question types
        
        Args:
            text: Answer text
            expected_keywords: Expected keywords in the answer
            question_type: Type of question (technical, behavioral, general)
            
        Returns:
            Quality evaluation result
        """
        try:
            keyword_context = ""
            if expected_keywords:
                keyword_context = f"Expected keywords: {', '.join(expected_keywords)}"
            
            prompt = f"""Evaluate this interview answer for quality and completeness.

QUESTION TYPE: {question_type}
{keyword_context}

ANSWER: "{text}"

Evaluate based on:
1. Content quality and depth
2. Relevance to question type
3. Use of expected keywords (if provided)
4. Professional communication
5. Specific examples or details

Provide evaluation in JSON format:
{{
    "quality_score": [0.0-1.0],
    "keyword_coverage": [0.0-1.0],
    "content_depth": [0.0-1.0],
    "specificity": [0.0-1.0],
    "missing_elements": ["element1", "element2"],
    "strengths": ["strength1", "strength2"],
    "recommendation": "Brief improvement recommendation"
}}

Provide only the JSON response."""

            response = self._get_gemini_response(prompt)
            return self._parse_analysis_response(response, "quality_evaluation")
            
        except Exception as e:
            logger.error(f"Error in answer quality evaluation: {str(e)}")
            return {'error': str(e)}
    
    def compare_responses(self, response1: str, response2: str, question: str = "") -> Dict:
        """
        Compare two interview responses
        
        Args:
            response1: First response
            response2: Second response  
            question: The interview question
            
        Returns:
            Comparison result
        """
        try:
            prompt = f"""Compare these two interview responses to the same question.

QUESTION: {question if question else "Not provided"}

RESPONSE 1: "{response1}"

RESPONSE 2: "{response2}"

Provide comparison in JSON format:
{{
    "comparison": {{
        "response1_score": [0.0-1.0],
        "response2_score": [0.0-1.0],
        "winner": "response1/response2/tie",
        "difference_level": "significant/moderate/minimal"
    }},
    "analysis": {{
        "response1_strengths": ["strength1", "strength2"],
        "response1_weaknesses": ["weakness1", "weakness2"],
        "response2_strengths": ["strength1", "strength2"],
        "response2_weaknesses": ["weakness1", "weakness2"]
    }},
    "recommendation": "Which response is better and why"
}}

Provide only the JSON response."""

            response = self._get_gemini_response(prompt)
            return self._parse_analysis_response(response, "comparison")
            
        except Exception as e:
            logger.error(f"Error in response comparison: {str(e)}")
            return {'error': str(e)}
    
    def generate_follow_up_questions(self, response: str, question: str = "") -> List[str]:
        """
        Generate follow-up questions based on the response
        
        Args:
            response: Interview response
            question: Original question
            
        Returns:
            List of follow-up questions
        """
        try:
            prompt = f"""Based on this interview response, generate 3-5 relevant follow-up questions.

ORIGINAL QUESTION: {question if question else "Not provided"}
CANDIDATE RESPONSE: "{response}"

Generate questions that:
1. Dig deeper into mentioned topics
2. Clarify vague statements
3. Explore specific examples
4. Test understanding

Provide questions in JSON format:
{{
    "follow_up_questions": [
        "Question 1",
        "Question 2", 
        "Question 3",
        "Question 4",
        "Question 5"
    ]
}}

Provide only the JSON response."""

            response_text = self._get_gemini_response(prompt)
            parsed = self._parse_analysis_response(response_text, "follow_up")
            
            return parsed.get('follow_up_questions', [])
            
        except Exception as e:
            logger.error(f"Error generating follow-up questions: {str(e)}")
            return []
    
    def get_version(self) -> str:
        """Get client version"""
        return self.version
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        try:
            return {
                'model_name': self.model_name,
                'version': self.version,
                'api_configured': bool(self.api_key),
                'connection_status': 'connected' if self.model else 'disconnected'
            }
        except:
            return {
                'model_name': self.model_name,
                'version': self.version,
                'api_configured': bool(self.api_key),
                'connection_status': 'error'
            }
    
    def test_api_key(self) -> bool:
        """Test if API key is working"""
        try:
            self._test_connection()
            return True
        except:
            return False