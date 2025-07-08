import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiBook, 
  FiStar, 
  FiUsers, 
  FiClock, 
  FiZap,
  FiEye,
  FiBookOpen,
  FiTarget,
  FiGlobe,
  FiLayers,
  FiHelpCircle,
  FiTrendingUp,
  FiSettings,
  FiPlay,
  FiDownload,
  FiCopy,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiActivity,
  FiMessageCircle,
  FiGrid,
  FiFilter
} from 'react-icons/fi';

// Enhanced interfaces for comprehensive knowledge base
interface KnowledgeResponse {
  question: string;
  subject: string;
  gradeLevel: string;
  language: string;
  explanations: {
    simple: string;
    detailed: string;
    analogy: string;
    realWorld: string;
  };
  culturalContext: {
    indianExamples: string[];
    localAnalogies: string[];
    festivals: string[];
    dailyLife: string[];
  };
  teachingResources: {
    commonMisconceptions: string[];
    teachingTips: string[];
    demonstrations: string[];
    activities: string[];
    materials: string[];
  };
  visualSuggestions: {
    simpleDrawings: string[];
    experiments: string[];
    gestures: string[];
  };
  relatedQuestions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  gradeAdaptations: {
    [key: string]: string;
  };
}

interface SearchHistory {
  id: string;
  question: string;
  timestamp: Date;
  subject: string;
  grade: string;
  language: string;
}

const KnowledgeBase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [knowledgeResponse, setKnowledgeResponse] = useState<KnowledgeResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [activeExplanationType, setActiveExplanationType] = useState<'simple' | 'detailed' | 'analogy' | 'realWorld'>('simple');
  const [showTeachingResources, setShowTeachingResources] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced configuration options
  const languages = [
    { code: 'english', name: 'English' },
    { code: 'hindi', name: 'हिंदी' },
    { code: 'marathi', name: 'मराठी' },
    { code: 'tamil', name: 'தமிழ்' },
    { code: 'telugu', name: 'తెలుగు' },
    { code: 'bengali', name: 'বাংলা' },
    { code: 'gujarati', name: 'ગુજરાતી' },
    { code: 'kannada', name: 'ಕನ್ನಡ' }
  ];

  const subjects = [
    { id: 'all', name: 'All Subjects', icon: FiLayers },
    { id: 'science', name: 'Science', icon: FiZap },
    { id: 'mathematics', name: 'Mathematics', icon: FiTarget },
    { id: 'english', name: 'English', icon: FiBook },
    { id: 'socialstudies', name: 'Social Studies', icon: FiUsers },
    { id: 'hindi', name: 'Hindi', icon: FiGlobe },
    { id: 'general', name: 'General Knowledge', icon: FiInfo }
  ];

  const grades = [
    { id: 'all', name: 'All Grades' },
    { id: '1-2', name: 'Grades 1-2' },
    { id: '3-5', name: 'Grades 3-5' },
    { id: '6-8', name: 'Grades 6-8' },
    { id: '9-10', name: 'Grades 9-10' }
  ];

  // Popular questions with Indian context
  const popularQuestions = [
    { 
      question: "Why is the sky blue?", 
      subject: "science", 
      grade: "3-5", 
      views: 245,
      category: "Physics"
    },
    { 
      question: "How do plants make their own food?", 
      subject: "science", 
      grade: "2-4", 
      views: 198,
      category: "Biology"
    },
    { 
      question: "Why do we have different seasons in India?", 
      subject: "science", 
      grade: "4-6", 
      views: 176,
      category: "Geography"
    },
    { 
      question: "What makes the monsoon come to India?", 
      subject: "science", 
      grade: "5-7", 
      views: 143,
      category: "Weather"
    },
    { 
      question: "How do elephants remember things?", 
      subject: "science", 
      grade: "2-4", 
      views: 132,
      category: "Biology"
    },
    { 
      question: "Why do we celebrate Diwali?", 
      subject: "socialstudies", 
      grade: "1-3", 
      views: 198,
      category: "Culture"
    },
    { 
      question: "How are Indian spices good for health?", 
      subject: "science", 
      grade: "4-6", 
      views: 87,
      category: "Health"
    },
    { 
      question: "Why is Ganga considered sacred?", 
      subject: "socialstudies", 
      grade: "3-5", 
      views: 156,
      category: "Geography"
    }
  ];

  const quickSuggestions = [
    "Why do peacocks dance in the rain?",
    "How do Indian farmers know when to plant crops?",
    "What makes turmeric yellow?",
    "Why do we touch elders' feet?",
    "How do banyan trees grow so big?",
    "What makes Indian classical music special?",
    "Why do we use rangoli patterns?",
    "How do coconuts float on water?"
  ];

  // Enhanced search function with API integration
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setSearchQuery(query);
    
    try {
      console.log('Starting knowledge search...');
      console.log('Search details:', {
        question: query,
        language: selectedLanguage,
        grade: selectedGrade,
        subject: selectedSubject
      });
      
      const apiUrl = 'http://localhost:3001/api/ask-question';
      console.log(`Calling API: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: query,
          language: selectedLanguage,
          grade: selectedGrade === 'all' ? '3-5' : selectedGrade,
          subject: selectedSubject,
          context: 'multi-grade Indian classroom'
        })
      });

      console.log(`API Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Knowledge search failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Knowledge Response:', result);
      
      if (result.success) {
        // Convert old format to new format if needed
        let convertedData = result.data;
        
        if (result.data.answer && !result.data.explanations) {
          console.log('🔄 Converting old format to new format...');
          
          convertedData = {
            question: query,
            subject: selectedSubject,
            gradeLevel: selectedGrade,
            language: selectedLanguage,
            explanations: {
              simple: result.data.answer || 'Simple explanation not available',
              detailed: result.data.answer ? `Detailed explanation: ${result.data.answer}` : 'Detailed explanation not available',
              analogy: result.data.analogy || 'Analogy not available',
              realWorld: result.data.examples?.[0] || 'Real-world example not available'
            },
            culturalContext: {
              indianExamples: result.data.examples || [],
              localAnalogies: result.data.analogy ? [result.data.analogy] : [],
              festivals: ['Related to Indian festivals and celebrations'],
              dailyLife: ['Connection to Indian daily life and experiences']
            },
            teachingResources: {
              commonMisconceptions: ['Common student misconceptions about this topic'],
              teachingTips: ['Effective teaching strategies for this concept'],
              demonstrations: [result.data.activity || 'Simple classroom demonstration'],
              activities: [result.data.activity || 'Hands-on learning activity'],
              materials: ['Basic classroom materials needed']
            },
            visualSuggestions: {
              simpleDrawings: ['Simple blackboard diagram'],
              experiments: [result.data.activity || 'Simple experiment'],
              gestures: ['Hand gestures to explain concept']
            },
            relatedQuestions: [
              `How does this relate to ${selectedSubject}?`,
              `What are practical applications?`,
              `How can we demonstrate this in class?`
            ],
            difficulty: 'intermediate',
            estimatedTime: '15-20 minutes',
            gradeAdaptations: {
              'grades1-2': 'Very simple explanation with pictures',
              'grades3-5': result.data.answer,
              'grades6-8': `More detailed: ${result.data.answer}`,
              'grades9-10': 'Advanced explanation with scientific details'
            }
          };
          
          console.log('✅ Successfully converted to new format');
        }
        
        setKnowledgeResponse(convertedData);
        
        // Add to search history
        const historyEntry: SearchHistory = {
          id: Date.now().toString(),
          question: query,
          timestamp: new Date(),
          subject: selectedSubject,
          grade: selectedGrade,
          language: selectedLanguage
        };
        setSearchHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
        
        console.log('Knowledge search successful');
      } else {
        throw new Error(result.error || 'Knowledge search failed');
      }
    } catch (error) {
      console.error('Knowledge search error:', error);
      
      let errorMessage = 'Failed to get answer';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (errorMessage.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://localhost:3001';
      }
      
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuestionClick = (question: any) => {
    setSelectedSubject(question.subject);
    setSelectedGrade(question.grade);
    setSearchQuery(question.question);
    // Don't auto-generate - just fill the search bar
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResponse = () => {
    if (!knowledgeResponse) return;
    
    const content = `
SAHAYAK AI - KNOWLEDGE BASE RESPONSE
=====================================

Question: ${knowledgeResponse.question}
Subject: ${knowledgeResponse.subject}
Grade Level: ${knowledgeResponse.gradeLevel}
Language: ${knowledgeResponse.language}
Difficulty: ${knowledgeResponse.difficulty}

SIMPLE EXPLANATION:
${knowledgeResponse.explanations.simple}

DETAILED EXPLANATION:
${knowledgeResponse.explanations.detailed}

ANALOGY:
${knowledgeResponse.explanations.analogy}

REAL-WORLD CONNECTION:
${knowledgeResponse.explanations.realWorld}

TEACHING RESOURCES:
Common Misconceptions: ${knowledgeResponse.teachingResources.commonMisconceptions.join(', ')}
Teaching Tips: ${knowledgeResponse.teachingResources.teachingTips.join(', ')}
Activities: ${knowledgeResponse.teachingResources.activities.join(', ')}
Materials Needed: ${knowledgeResponse.teachingResources.materials.join(', ')}

RELATED QUESTIONS:
${knowledgeResponse.relatedQuestions.join('\n')}

Generated by Sahayak AI - Empowering Indian Education
====================================================
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sahayak-knowledge-${knowledgeResponse.question.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredQuestions = popularQuestions.filter(q => 
    (selectedSubject === 'all' || q.subject === selectedSubject) &&
    (selectedGrade === 'all' || q.grade === selectedGrade)
  );

  const getSubjectColor = (subject: string) => {
    const colors = {
      science: 'bg-blue-100 text-blue-800 border-blue-200',
      mathematics: 'bg-green-100 text-green-800 border-green-200',
      english: 'bg-purple-100 text-purple-800 border-purple-200',
      socialstudies: 'bg-orange-100 text-orange-800 border-orange-200',
      hindi: 'bg-red-100 text-red-800 border-red-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[subject as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Professional Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-normal text-gray-900 mb-3" style={{ fontFamily: 'Product Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
                  <span className="text-gray-900">Instant Knowledge Base</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-4xl font-normal leading-relaxed">
                  Get comprehensive, culturally-relevant explanations for any student question. 
                  Complete with teaching resources and grade-appropriate content.
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-full border border-gray-200">
                  <FiGlobe className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700 font-medium">8 Languages</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-full border border-gray-200">
                  <FiUsers className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700 font-medium">Multi-Grade</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-full border border-gray-200">
                  <FiStar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700 font-medium">Cultural Context</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Interface */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
            {/* Configuration Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Response Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-gray-300 focus:border-gray-300 bg-white text-gray-900 font-normal"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Target Grade Level
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-gray-300 focus:border-gray-300 bg-white text-gray-900 font-normal"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}
                >
                  {grades.map(grade => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Subject Context
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-gray-300 focus:border-gray-300 bg-white text-gray-900 font-normal"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}
                >
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Search Input */}
            <div className="relative mb-6">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <FiSearch className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Ask any question... (e.g., 'Why is the sky blue?', 'How do plants grow?')"
                className="w-full pl-12 pr-32 py-4 border border-gray-200 rounded-xl focus:ring-1 focus:ring-gray-300 focus:border-gray-300 bg-white text-gray-900 placeholder-gray-500 font-normal"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}
              />
              <button
                onClick={() => handleSearch(searchQuery)}
                disabled={!searchQuery.trim() || isSearching}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  !searchQuery.trim() || isSearching
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}
              >
                {isSearching ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <FiZap className="w-4 h-4" />
                    <span>Generate</span>
                  </div>
                )}
              </button>
            </div>
            
            {/* Quick Suggestions */}
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.slice(0, 6).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(suggestion)}
                    className="px-4 py-2 bg-gray-50 text-gray-700 rounded-full text-sm hover:bg-gray-100 transition-colors font-normal border border-gray-200"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {knowledgeResponse ? (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Answer Panel */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Answer Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <FiInfo className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                          {knowledgeResponse.question}
                        </h2>
                        <div className="flex items-center space-x-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubjectColor(knowledgeResponse.subject)}`}>
                            {knowledgeResponse.subject}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Grade {knowledgeResponse.gradeLevel}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            {knowledgeResponse.language}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(knowledgeResponse.difficulty)}`}>
                            {knowledgeResponse.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(knowledgeResponse?.explanations?.[activeExplanationType] || '')}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy explanation"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={downloadResponse}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download complete response"
                      >
                        <FiDownload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Explanation Type Selector */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'simple', label: 'Simple', desc: 'Easy to understand' },
                      { key: 'detailed', label: 'Detailed', desc: 'Comprehensive' },
                      { key: 'analogy', label: 'Analogy', desc: 'With comparisons' },
                      { key: 'realWorld', label: 'Real World', desc: 'Practical examples' }
                    ].map(type => (
                      <button
                        key={type.key}
                        onClick={() => setActiveExplanationType(type.key as any)}
                        className={`p-3 rounded-lg text-center transition-all duration-200 ${
                          activeExplanationType === type.key
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs opacity-75">{type.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Explanation */}
                <div className="p-6">
                  <div className="prose prose-lg max-w-none">
                    <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                      {knowledgeResponse?.explanations?.[activeExplanationType] || 'Loading explanation...'}
                    </div>
                  </div>
                </div>

                {/* Cultural Context Section */}
                {knowledgeResponse?.culturalContext && (
                  <div className="p-6 bg-orange-50 border-t border-orange-200">
                    <h3 className="text-lg font-semibold text-orange-900 mb-4">
                      Indian Cultural Context
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {knowledgeResponse.culturalContext.indianExamples?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-orange-800 mb-2">Indian Examples:</h4>
                          <ul className="text-sm text-orange-700 space-y-1">
                            {knowledgeResponse.culturalContext.indianExamples.map((example, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-orange-600 mr-2">•</span>
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {knowledgeResponse.culturalContext.localAnalogies?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-orange-800 mb-2">Local Analogies:</h4>
                          <ul className="text-sm text-orange-700 space-y-1">
                            {knowledgeResponse.culturalContext.localAnalogies.map((analogy, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-orange-600 mr-2">•</span>
                                {analogy}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Teaching Resources Panel */}
              {showTeachingResources && knowledgeResponse?.teachingResources && (
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 bg-green-50 border-b border-green-200">
                    <h3 className="text-xl font-semibold text-green-900">
                      Teaching Resources
                    </h3>
                    <p className="text-green-700 mt-1">Complete classroom support materials</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Common Misconceptions */}
                      {knowledgeResponse.teachingResources.commonMisconceptions?.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                            <FiAlertCircle className="w-4 h-4 mr-2" />
                            Common Misconceptions
                          </h4>
                          <ul className="text-sm text-red-800 space-y-2">
                            {knowledgeResponse.teachingResources.commonMisconceptions.map((misconception, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-red-600 mr-2">•</span>
                                {misconception}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Teaching Tips */}
                      {knowledgeResponse.teachingResources.teachingTips?.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                            <FiInfo className="w-4 h-4 mr-2" />
                            Teaching Tips
                          </h4>
                          <ul className="text-sm text-blue-800 space-y-2">
                            {knowledgeResponse.teachingResources.teachingTips.map((tip, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Activities */}
                      {knowledgeResponse.teachingResources.activities?.length > 0 && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                            <FiPlay className="w-4 h-4 mr-2" />
                            Classroom Activities
                          </h4>
                          <ul className="text-sm text-purple-800 space-y-2">
                            {knowledgeResponse.teachingResources.activities.map((activity, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-purple-600 mr-2">•</span>
                                {activity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Materials Needed */}
                      {knowledgeResponse.teachingResources.materials?.length > 0 && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                            <FiSettings className="w-4 h-4 mr-2" />
                            Materials Needed
                          </h4>
                          <ul className="text-sm text-yellow-800 space-y-2">
                            {knowledgeResponse.teachingResources.materials.map((material, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-yellow-600 mr-2">•</span>
                                {material}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              {/* Related Questions */}
              {knowledgeResponse?.relatedQuestions?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <FiBookOpen className="w-5 h-5 mr-2 text-blue-600" />
                      Related Questions
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {knowledgeResponse.relatedQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearch(question)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-sm text-gray-700 hover:text-blue-700"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual Suggestions */}
              {knowledgeResponse?.visualSuggestions && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <FiEye className="w-5 h-5 mr-2 text-purple-600" />
                      Visual Teaching Aids
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {knowledgeResponse.visualSuggestions.simpleDrawings?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Simple Drawings:</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {knowledgeResponse.visualSuggestions.simpleDrawings.map((drawing, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-gray-400 mr-2">•</span>
                              {drawing}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {knowledgeResponse.visualSuggestions.experiments?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Experiments:</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {knowledgeResponse.visualSuggestions.experiments.map((experiment, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-gray-400 mr-2">•</span>
                              {experiment}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <FiClock className="w-5 h-5 mr-2 text-gray-600" />
                      Recent Searches
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {searchHistory.slice(0, 5).map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => handleSearch(entry.question)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {entry.question}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {entry.subject} • {entry.grade} • {entry.language}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Default view with popular questions
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Popular Questions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FiTrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                    Popular Questions from Indian Classrooms
                  </h2>
                  <p className="text-gray-600 mt-2">Click any question to see a comprehensive explanation</p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4">
                    {filteredQuestions.map((question, index) => (
                      <button
                        key={question.question}
                        onClick={() => handleQuestionClick(question)}
                        className="text-left p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubjectColor(question.subject)}`}>
                            {question.subject}
                          </span>
                          <div className="flex items-center text-xs text-gray-500">
                            <FiEye className="w-3 h-3 mr-1" />
                            {question.views}
                          </div>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2">
                          {question.question}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Grade {question.grade}</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {question.category}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Filter Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <FiFilter className="w-5 h-5 mr-2 text-gray-600" />
                    Browse by Subject
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  {subjects.map((subject) => {
                    const IconComponent = subject.icon;
                    const isSelected = selectedSubject === subject.id;
                    return (
                      <button
                        key={subject.id}
                        onClick={() => setSelectedSubject(subject.id)}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                        <span className="font-medium">{subject.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    Knowledge Base Stats
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Languages Supported</span>
                    <span className="font-semibold text-blue-600">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Grade Levels</span>
                    <span className="font-semibold text-green-600">1-10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subjects Covered</span>
                    <span className="font-semibold text-purple-600">6+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cultural Context</span>
                    <span className="font-semibold text-orange-600">Indian</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;