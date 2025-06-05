// frontend/src/services/geminiAI.js - ENHANCED VERSION WITH QUESTION GENERATION
class GeminiAIService {
  constructor() {
    // You'll need to get this from Google AI Studio
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  // NEW: Generate interview questions based on type
  async generateQuestions(interviewType, difficulty = 'medium', duration = 30, count = null) {
    try {
      console.log(`🤖 Generating ${interviewType} questions with Gemini AI...`);
      
      const prompt = this.createQuestionGenerationPrompt(interviewType, difficulty, duration, count);
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 2000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const questionsText = data.candidates[0].content.parts[0].text;
      
      return this.parseGeneratedQuestions(questionsText, interviewType);
      
    } catch (error) {
      console.error('❌ Error generating questions:', error);
      
      // Fallback to mock questions if API fails
      return this.getFallbackQuestions(interviewType, difficulty, duration);
    }
  }

  createQuestionGenerationPrompt(interviewType, difficulty, duration, count) {
    const questionCount = count || Math.max(3, Math.floor(duration / (interviewType === 'coding' ? 15 : 5)));
    
    let typeSpecificGuidelines = '';
    
    switch (interviewType) {
      case 'technical':
        typeSpecificGuidelines = `
- Focus on programming concepts, algorithms, system design
- Include questions about specific technologies (JavaScript, React, Node.js, Python, etc.)
- Ask about debugging, optimization, and best practices
- Include scenario-based technical problems`;
        break;
        
      case 'behavioral':
        typeSpecificGuidelines = `
- Focus on past experiences, teamwork, leadership
- Include STAR method questions (Situation, Task, Action, Result)
- Ask about conflict resolution, decision-making
- Include questions about career goals and motivation`;
        break;
        
      case 'coding':
        typeSpecificGuidelines = `
- Focus on algorithmic problems and data structures
- Include array manipulation, string processing, tree/graph problems
- Ask about time/space complexity analysis
- Include practical coding scenarios`;
        break;
        
      case 'system-design':
        typeSpecificGuidelines = `
- Focus on scalable system architecture
- Include database design, API design, microservices
- Ask about load balancing, caching, security
- Include real-world system examples (social media, e-commerce, etc.)`;
        break;
        
      default:
        typeSpecificGuidelines = `
- Mix of technical and behavioral questions
- Focus on problem-solving and communication
- Include both theoretical and practical scenarios`;
    }

    return `
You are an expert interview question generator. Create ${questionCount} high-quality ${interviewType} interview questions.

REQUIREMENTS:
- Interview Type: ${interviewType}
- Difficulty Level: ${difficulty}
- Duration: ${duration} minutes
- Number of Questions: ${questionCount}

DIFFICULTY GUIDELINES:
- Easy: Basic concepts, entry-level questions
- Medium: Intermediate concepts, some complexity
- Hard: Advanced concepts, complex scenarios

TYPE-SPECIFIC GUIDELINES:
${typeSpecificGuidelines}

TIME ALLOCATION:
- ${interviewType === 'coding' ? '10-15 minutes' : interviewType === 'system-design' ? '15-20 minutes' : '3-5 minutes'} per question
- Include appropriate time limits for each question

OUTPUT FORMAT (JSON only, no other text):
{
  "questions": [
    {
      "id": 1,
      "text": "Question text here",
      "type": "${interviewType}",
      "timeLimit": 300,
      "difficulty": "${difficulty}",
      "category": "Specific category",
      "allowVideo": true,
      "allowAudio": true,
      "allowText": true,
      "hints": ["Optional hint 1", "Optional hint 2"],
      "expectedPoints": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ]
}

IMPORTANT: 
- Make questions diverse and avoid repetition
- Ensure questions are appropriate for ${difficulty} level
- Include realistic time limits (in seconds)
- Make questions engaging and practical
- Return only valid JSON, no markdown or other formatting
`;
  }

  parseGeneratedQuestions(questionsText, interviewType) {
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedText = questionsText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanedText);
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid questions format');
      }
      
      // Validate and format questions
      const questions = parsed.questions.map((q, index) => ({
        id: q.id || (index + 1),
        text: q.text || 'Sample question',
        type: q.type || interviewType,
        timeLimit: Math.max(120, Math.min(1800, q.timeLimit || 300)), // 2min to 30min
        difficulty: q.difficulty || 'medium',
        category: q.category || 'General',
        allowVideo: q.allowVideo !== false,
        allowAudio: q.allowAudio !== false,
        allowText: q.allowText !== false,
        hints: q.hints || [],
        expectedPoints: q.expectedPoints || []
      }));
      
      console.log(`✅ Generated ${questions.length} questions for ${interviewType} interview`);
      return questions;
      
    } catch (error) {
      console.error('❌ Error parsing generated questions:', error);
      
      // Return fallback questions if parsing fails
      return this.getFallbackQuestions(interviewType, 'medium', 30);
    }
  }

  getFallbackQuestions(interviewType, difficulty = 'medium', duration = 30) {
    console.log(`🔄 Using fallback questions for ${interviewType}`);
    
    const questionBanks = {
      technical: [
        {
          id: 1,
          text: "Tell me about yourself and your background in technology.",
          type: "technical",
          timeLimit: 300,
          difficulty: "easy",
          category: "Introduction",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: [],
          expectedPoints: ["Background", "Experience", "Skills"]
        },
        {
          id: 2,
          text: "Explain the difference between let, const, and var in JavaScript.",
          type: "technical",
          timeLimit: 240,
          difficulty: "medium",
          category: "JavaScript",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: ["Think about scope", "Consider hoisting"],
          expectedPoints: ["Scope differences", "Hoisting behavior", "Reassignment rules"]
        },
        {
          id: 3,
          text: "What is closure and how does it work in JavaScript?",
          type: "technical",
          timeLimit: 300,
          difficulty: "medium",
          category: "JavaScript",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: ["Inner function accessing outer variables"],
          expectedPoints: ["Definition", "Lexical scoping", "Practical example"]
        }
      ],
      behavioral: [
        {
          id: 1,
          text: "Tell me about yourself and your professional background.",
          type: "behavioral",
          timeLimit: 300,
          difficulty: "easy",
          category: "Introduction",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: [],
          expectedPoints: ["Background", "Experience", "Goals"]
        },
        {
          id: 2,
          text: "Describe a challenging project you worked on and how you overcame obstacles.",
          type: "behavioral",
          timeLimit: 360,
          difficulty: "medium",
          category: "Problem Solving",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: ["Use STAR method"],
          expectedPoints: ["Situation", "Task", "Action", "Result"]
        },
        {
          id: 3,
          text: "How do you handle conflicts with team members?",
          type: "behavioral",
          timeLimit: 300,
          difficulty: "medium",
          category: "Teamwork",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: ["Focus on communication"],
          expectedPoints: ["Communication", "Resolution strategy", "Example"]
        }
      ],
      coding: [
        {
          id: 1,
          text: "Implement a function to reverse a string without using built-in methods.",
          type: "coding",
          timeLimit: 600,
          difficulty: "easy",
          category: "String Manipulation",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: ["Use two pointers", "Consider character swapping"],
          expectedPoints: ["Algorithm approach", "Time complexity", "Working code"]
        },
        {
          id: 2,
          text: "Write a function to find the maximum element in an array.",
          type: "coding",
          timeLimit: 480,
          difficulty: "easy",
          category: "Array Operations",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: ["Iterate through array"],
          expectedPoints: ["Algorithm", "Edge cases", "Efficiency"]
        }
      ],
      'system-design': [
        {
          id: 1,
          text: "Design a URL shortener service like bit.ly.",
          type: "system-design",
          timeLimit: 1200,
          difficulty: "medium",
          category: "Web Services",
          allowVideo: true,
          allowAudio: true,
          allowText: true,
          hints: ["Think about URL encoding", "Consider database design"],
          expectedPoints: ["System architecture", "Database design", "Scalability"]
        }
      ]
    };
    
    const selectedQuestions = questionBanks[interviewType] || questionBanks.technical;
    const questionCount = Math.min(selectedQuestions.length, Math.max(1, Math.floor(duration / 5)));
    
    return selectedQuestions.slice(0, questionCount);
  }

  // Existing methods for answer evaluation...
  async evaluateAnswer(question, answer, questionType = 'general') {
    try {
      console.log('🤖 Evaluating answer with Gemini AI...');
      
      const prompt = this.createEvaluationPrompt(question, answer, questionType);
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 1,
            topP: 1,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const evaluation = data.candidates[0].content.parts[0].text;
      
      return this.parseEvaluation(evaluation);
      
    } catch (error) {
      console.error('❌ Error evaluating answer:', error);
      
      // Fallback to mock evaluation if API fails
      return this.getMockEvaluation(question, answer, questionType);
    }
  }

  createEvaluationPrompt(question, answer, questionType) {
    return `
You are an expert interview evaluator. Please evaluate this candidate's answer and provide a JSON response.

QUESTION: "${question}"
QUESTION TYPE: ${questionType}
CANDIDATE'S ANSWER: "${answer}"

Please evaluate the answer based on these criteria:
1. Relevance to the question (25%)
2. Technical accuracy (25%)
3. Clarity and communication (25%)
4. Depth and examples (25%)

Provide your evaluation in this EXACT JSON format:
{
  "score": [score from 0-100],
  "relevance": [score from 0-100],
  "technical_accuracy": [score from 0-100],
  "clarity": [score from 0-100],
  "depth": [score from 0-100],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "feedback": "Detailed feedback about the answer",
  "keywords_covered": ["keyword1", "keyword2"],
  "missing_points": ["missing point 1", "missing point 2"]
}

Make sure the response is valid JSON only, no other text.
`;
  }

  parseEvaluation(evaluationText) {
    try {
      const cleanedText = evaluationText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      const evaluation = JSON.parse(cleanedText);
      
      return {
        score: Math.min(100, Math.max(0, evaluation.score || 0)),
        relevance: Math.min(100, Math.max(0, evaluation.relevance || 0)),
        technical_accuracy: Math.min(100, Math.max(0, evaluation.technical_accuracy || 0)),
        clarity: Math.min(100, Math.max(0, evaluation.clarity || 0)),
        depth: Math.min(100, Math.max(0, evaluation.depth || 0)),
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        feedback: evaluation.feedback || 'No detailed feedback available',
        keywords_covered: evaluation.keywords_covered || [],
        missing_points: evaluation.missing_points || []
      };
      
    } catch (error) {
      console.error('❌ Error parsing evaluation:', error);
      return this.getMockEvaluation('', '', 'general');
    }
  }

  getMockEvaluation(question, answer, questionType) {
    const answerLength = answer.length;
    const hasExamples = answer.toLowerCase().includes('example') || 
                       answer.toLowerCase().includes('experience') ||
                       answer.toLowerCase().includes('project');
    
    const baseScore = Math.min(85, Math.max(40, answerLength / 10));
    const exampleBonus = hasExamples ? 10 : 0;
    const score = Math.min(100, baseScore + exampleBonus);
    
    return {
      score: Math.round(score),
      relevance: Math.round(score + Math.random() * 10 - 5),
      technical_accuracy: Math.round(score + Math.random() * 10 - 5),
      clarity: Math.round(score + Math.random() * 10 - 5),
      depth: Math.round(score + Math.random() * 10 - 5),
      strengths: [
        "Clear communication",
        "Good structure in response",
        "Relevant to the question"
      ],
      improvements: [
        "Could provide more specific examples",
        "Consider adding technical details",
        "Expand on practical applications"
      ],
      feedback: `Your answer demonstrates a good understanding of the topic. The response is ${answerLength > 100 ? 'comprehensive' : 'brief but relevant'}. ${hasExamples ? 'Good use of examples.' : 'Consider adding specific examples to strengthen your answer.'}`,
      keywords_covered: ["technical", "experience", "knowledge"],
      missing_points: ["specific examples", "industry best practices"]
    };
  }

  async evaluateAllAnswers(answersData) {
    console.log('🎯 Evaluating all answers...');
    
    const evaluations = [];
    let totalScore = 0;
    
    for (const answerData of answersData) {
      const evaluation = await this.evaluateAnswer(
        answerData.questionText,
        answerData.textAnswer || 'No answer provided',
        answerData.questionType || 'general'
      );
      
      evaluations.push({
        ...answerData,
        evaluation
      });
      
      totalScore += evaluation.score;
      
      // Add delay to avoid rate limiting
      await this.delay(500);
    }
    
    const averageScore = answersData.length > 0 ? totalScore / answersData.length : 0;
    
    return {
      evaluations,
      averageScore: Math.round(averageScore),
      totalQuestions: answersData.length,
      recommendation: this.getHiringRecommendation(averageScore, evaluations)
    };
  }

  getHiringRecommendation(averageScore, evaluations) {
    const passThreshold = 70;
    const strongThreshold = 85;
    
    if (averageScore >= strongThreshold) {
      return {
        decision: 'strong_hire',
        confidence: 'high',
        reasoning: `Excellent performance with ${averageScore}% average score. Candidate demonstrates strong technical knowledge and communication skills.`,
        nextSteps: [
          'Proceed to technical round',
          'Consider for senior-level positions',
          'Schedule manager interview'
        ]
      };
    } else if (averageScore >= passThreshold) {
      return {
        decision: 'hire',
        confidence: 'medium',
        reasoning: `Good performance with ${averageScore}% average score. Candidate meets the requirements with room for growth.`,
        nextSteps: [
          'Proceed to next interview round',
          'Consider for junior-mid level positions',
          'Schedule technical assessment'
        ]
      };
    } else if (averageScore >= 50) {
      return {
        decision: 'maybe',
        confidence: 'low',
        reasoning: `Below threshold performance with ${averageScore}% average score. Candidate shows potential but needs improvement.`,
        nextSteps: [
          'Consider for junior positions with training',
          'Provide feedback and re-interview later',
          'Assess cultural fit separately'
        ]
      };
    } else {
      return {
        decision: 'reject',
        confidence: 'high',
        reasoning: `Poor performance with ${averageScore}% average score. Candidate does not meet minimum requirements.`,
        nextSteps: [
          'Provide constructive feedback',
          'Suggest areas for improvement',
          'Encourage reapplication after skill development'
        ]
      };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to get overall interview insights
  getInterviewInsights(evaluations) {
    const scores = evaluations.map(e => e.evaluation.score);
    const allStrengths = evaluations.flatMap(e => e.evaluation.strengths);
    const allImprovements = evaluations.flatMap(e => e.evaluation.improvements);
    
    // Count frequency of strengths and improvements
    const strengthCounts = {};
    const improvementCounts = {};
    
    allStrengths.forEach(strength => {
      strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
    });
    
    allImprovements.forEach(improvement => {
      improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
    });
    
    return {
      consistency: this.calculateConsistency(scores),
      topStrengths: Object.entries(strengthCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([strength]) => strength),
      keyImprovements: Object.entries(improvementCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([improvement]) => improvement),
      scoreDistribution: {
        excellent: scores.filter(s => s >= 90).length,
        good: scores.filter(s => s >= 70 && s < 90).length,
        average: scores.filter(s => s >= 50 && s < 70).length,
        poor: scores.filter(s => s < 50).length
      }
    };
  }

  calculateConsistency(scores) {
    if (scores.length < 2) return 100;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to consistency score (lower deviation = higher consistency)
    return Math.max(0, 100 - (standardDeviation * 2));
  }
}

export default new GeminiAIService();