// frontend/src/pages/Admin/QuestionManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Copy, 
  Upload, 
  Download,
  Shuffle,
  Eye,
  MoreVertical
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import QuestionEditor from '../../components/admin/QuestionEditor';

const QuestionManagement = () => {
  const { 
    questions, 
    questionCategories, 
    loading, 
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    generateQuestionSet
  } = useAdminStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isGeneratingSet, setIsGeneratingSet] = useState(false);
  
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const questionTypes = ['Multiple Choice', 'Text Answer', 'Code', 'Behavioral'];

  useEffect(() => {
    fetchQuestions();
  }, []);

  const filteredQuestions = questions.filter(question => {
    return (
      question.text.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === '' || question.category === selectedCategory) &&
      (selectedDifficulty === '' || question.difficulty === selectedDifficulty)
    );
  });

  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setIsEditorOpen(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setIsEditorOpen(true);
  };

  const handleSaveQuestion = async (questionData) => {
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion._id, questionData);
      } else {
        await createQuestion(questionData);
      }
      setIsEditorOpen(false);
      await fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteQuestion(questionId);
        await fetchQuestions();
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  const handleGenerateQuestionSet = async () => {
    setIsGeneratingSet(true);
    try {
      const criteria = {
        count: 10,
        categories: selectedCategory ? [selectedCategory] : [],
        difficulty: selectedDifficulty || null,
        types: []
      };
      
      const generatedSet = await generateQuestionSet(criteria);
      console.log('Generated question set:', generatedSet);
      alert(`Generated ${generatedSet.length} questions for the interview set!`);
    } catch (error) {
      console.error('Error generating question set:', error);
      alert('Failed to generate question set');
    } finally {
      setIsGeneratingSet(false);
    }
  };

  const handleSelectQuestion = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedQuestions.length} questions?`)) {
      try {
        await Promise.all(selectedQuestions.map(id => deleteQuestion(id)));
        setSelectedQuestions([]);
        await fetchQuestions();
      } catch (error) {
        console.error('Error deleting questions:', error);
      }
    }
  };

  const QuestionCard = ({ question }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <input
            type="checkbox"
            checked={selectedQuestions.includes(question._id)}
            onChange={() => handleSelectQuestion(question._id)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {question.difficulty}
              </span>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {question.category}
              </span>
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                {question.type}
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{question.text}</h3>
            {question.options && (
              <ul className="text-sm text-gray-600 space-y-1">
                {question.options.map((option, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-2">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
              <span>Time Limit: {question.timeLimit}s</span>
              <span>Used {question.usageCount || 0} times</span>
              <span>Created: {new Date(question.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEditQuestion(question)}>
            <Edit2 size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteQuestion(question._id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Question Management</h1>
              <p className="text-gray-600 mt-1">Manage your interview question bank</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleGenerateQuestionSet} disabled={isGeneratingSet}>
                <Shuffle size={16} className={`mr-2 ${isGeneratingSet ? 'animate-spin' : ''}`} />
                Generate Set
              </Button>
              <Button onClick={handleCreateQuestion}>
                <Plus size={16} className="mr-2" />
                Add Question
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {questionCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Difficulties</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Upload size={16} className="mr-1" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download size={16} className="mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedQuestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">
                {selectedQuestions.length} question(s) selected
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                  <Trash2 size={16} className="mr-1" />
                  Delete Selected
                </Button>
                <Button variant="outline" size="sm">
                  <Copy size={16} className="mr-1" />
                  Duplicate
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                onChange={handleSelectAll}
              />
              <span className="text-gray-700">
                {filteredQuestions.length} question(s) found
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select className="px-2 py-1 border border-gray-300 rounded text-sm">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="difficulty">Difficulty</option>
                <option value="category">Category</option>
                <option value="usage">Most Used</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredQuestions.map(question => (
              <QuestionCard key={question._id} question={question} />
            ))}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory || selectedDifficulty 
                  ? 'Try adjusting your filters' 
                  : 'Get started by creating your first question'
                }
              </p>
              {!searchTerm && !selectedCategory && !selectedDifficulty && (
                <div className="mt-6">
                  <Button onClick={handleCreateQuestion}>
                    <Plus size={16} className="mr-2" />
                    Add Question
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Question Editor Modal */}
        <Modal 
          isOpen={isEditorOpen} 
          onClose={() => setIsEditorOpen(false)}
          title={editingQuestion ? 'Edit Question' : 'Create New Question'}
          size="lg"
        >
          <QuestionEditor
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onCancel={() => setIsEditorOpen(false)}
            categories={questionCategories}
            difficulties={difficulties}
            types={questionTypes}
          />
        </Modal>
      </div>
    </div>
  );
};

export default QuestionManagement;