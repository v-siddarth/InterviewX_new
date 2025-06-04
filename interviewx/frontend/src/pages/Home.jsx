// frontend/src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import Button from '../components/ui/Button';

const Home = () => {
  const { user } = useUserStore();

  const features = [
    {
      icon: '🎥',
      title: 'Facial Analysis',
      description: 'AI-powered facial expression analysis to evaluate confidence and professionalism during interviews.',
      details: 'Uses advanced CNN and MTCNN models to detect facial features and analyze confidence levels with 80%+ accuracy.'
    },
    {
      icon: '🎤',
      title: 'Voice Analysis',
      description: 'Convert speech to text and analyze answer quality using advanced natural language processing.',
      details: 'Powered by Gemini Pro LLM for comprehensive speech-to-text conversion and answer relevance scoring.'
    },
    {
      icon: '📝',
      title: 'Text Evaluation',
      description: 'Comprehensive text analysis for grammar, relevance, and overall answer quality assessment.',
      details: 'Real-time evaluation of written and spoken responses with detailed feedback and improvement suggestions.'
    },
    {
      icon: '📊',
      title: 'Detailed Reports',
      description: 'Get comprehensive performance reports with actionable insights and improvement recommendations.',
      details: 'Multi-dimensional analysis combining facial, audio, and text metrics for holistic interview evaluation.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer',
      avatar: 'https://ui-avatars.io/api/?name=Sarah+Johnson&background=3B82F6&color=fff',
      quote: 'InterviewX helped me identify and improve my interview weaknesses. I landed my dream job after practicing with their AI system!'
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager',
      avatar: 'https://ui-avatars.io/api/?name=Michael+Chen&background=10B981&color=fff',
      quote: 'The facial analysis feature was eye-opening. I never realized how my body language affected my interview performance.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'UX Designer',
      avatar: 'https://ui-avatars.io/api/?name=Emily+Rodriguez&background=F59E0B&color=fff',
      quote: 'The detailed feedback on my answers helped me structure better responses. Highly recommend for interview prep!'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Interviews Analyzed' },
    { number: '85%', label: 'Success Rate' },
    { number: '24/7', label: 'AI Availability' },
    { number: '95%', label: 'User Satisfaction' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Ace Your
                <span className="block text-blue-600">Next Interview</span>
                with AI
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Practice with our AI-powered interview system that analyzes your facial expressions, 
                voice quality, and answer relevance to help you succeed in real interviews.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  {user ? (
                    <Link to="/dashboard">
                      <Button size="lg" className="w-full sm:w-auto">
                        🚀 Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/register">
                        <Button size="lg" className="w-full sm:w-auto">
                          🎯 Start Free Trial
                        </Button>
                      </Link>
                      <Link to="/login">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                          📺 Watch Demo
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  No credit card required • Free forever plan available
                </p>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <img
                    className="w-full"
                    src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1626&q=80"
                    alt="Interview practice session"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 mix-blend-multiply opacity-20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-full p-4 shadow-lg">
                      <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 84 84">
                        <circle opacity="0.9" cx={42} cy={42} r={42} fill="white" />
                        <path d="M55.5039 40.3359L37.1094 28.0729C35.7803 27.1869 34 28.1396 34 29.737V54.263C34 55.8604 35.7803 56.8131 37.1094 55.9271L55.5038 43.6641C56.6913 42.8725 56.6913 41.1275 55.5039 40.3359Z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600">
                  {stat.number}
                </div>
                <div className="text-sm md:text-base text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Powered by Advanced AI Technology
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Our comprehensive AI analysis system evaluates multiple aspects of your interview performance
              to provide actionable insights and help you improve.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex items-center">
                    <div className="text-4xl mr-4">{feature.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-600">
                    {feature.description}
                  </p>
                  <p className="mt-3 text-sm text-gray-500">
                    {feature.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How InterviewX Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Simple, effective, and powered by cutting-edge AI technology
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎥</span>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">1. Start Your Interview</h3>
                <p className="mt-2 text-gray-600">
                  Choose your interview type and begin practicing with our AI system. 
                  Grant camera and microphone permissions for full analysis.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">2. AI Analysis</h3>
                <p className="mt-2 text-gray-600">
                  Our AI analyzes your facial expressions, voice quality, and answer content 
                  in real-time using advanced machine learning models.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">3. Get Insights</h3>
                <p className="mt-2 text-gray-600">
                  Receive detailed feedback with scores, strengths, and improvement areas 
                  to enhance your interview performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Success Stories
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              See how InterviewX has helped professionals ace their interviews
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="h-12 w-12 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.quote}"</p>
                  <div className="mt-4 flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            <span className="block">Ready to ace your next interview?</span>
            <span className="block text-blue-200">Start practicing with AI today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50">
                    🚀 Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50">
                    🎯 Get Started Free
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;