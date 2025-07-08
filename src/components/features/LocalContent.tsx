import React, { useState, useEffect } from 'react';
import { generateContent, generateQuickExamples, healthCheck } from '../../services/api';
import type { ContentRequest } from '../../services/api';
import { 
  FiFileText, 
  FiStar, 
  FiCopy, 
  FiTrash2, 
  FiInfo,
  FiTarget,
  FiRefreshCw,
  FiCheck,
  FiBookOpen,
  FiUsers,
  FiPlay,
  FiChevronDown,
  FiZap
} from 'react-icons/fi';

// New interfaces for rich structured content
interface RichContent {
  mainContent: {
    story: string;
    keyPoints: string[];
    vocabulary: Array<{
      term: string;
      definition: string;
      example: string;
    }>;
  };
  teachingTips: Array<{
    category: string;
    tip: string;
    implementation: string;
  }>;
  extensionActivities: Array<{
    title: string;
    description: string;
    materials: string[];
    gradeAdaptation: string;
  }>;
}

interface DynamicExample {
  title: string;
  prompt: string;
  rationale: string;
}

const LocalContent: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  
  // Rich content sections
  const [richContent, setRichContent] = useState<RichContent | null>(null);
  
  // Form data
  const [request, setRequest] = useState('');
  const [language, setLanguage] = useState('english');
  const [gradeLevel, setGradeLevel] = useState('3');
  const [subject, setSubject] = useState('science');
  const [location, setLocation] = useState('Maharashtra');

  // On-demand examples
  const [dynamicExamples, setDynamicExamples] = useState<DynamicExample[]>([]);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  // Test API connection
  useEffect(() => {
    const checkConnection = async (retries = 3) => {
      try {
        const result = await healthCheck();
        setIsConnected(result.status === 'ok');
        console.log('✅ Connected to server v3.0:', result);
      } catch (error) {
        console.log(`❌ Connection attempt failed. Retries left: ${retries - 1}`);
        if (retries > 1) {
          setTimeout(() => checkConnection(retries - 1), 2000);
        } else {
          setIsConnected(false);
        }
      }
    };
    
    setTimeout(() => checkConnection(), 1000);
  }, []);

  // Generate examples on-demand only
  const handleGenerateExamples = async () => {
    if (!isConnected) return;
    
    setIsLoadingExamples(true);
    setSelectedExample(null);
    try {
      const examplesRequest = { language, grade: gradeLevel, subject, location };
      const result = await generateQuickExamples(examplesRequest);
      
      if (result.examples) {
        setDynamicExamples(result.examples);
        setShowExamples(true);
        console.log('✅ Generated examples on-demand:', result.examples);
      }
    } catch {
      setError('Failed to generate examples. Please try again.');
    } finally {
      setIsLoadingExamples(false);
    }
  };

  const handleExampleSelect = (example: DynamicExample, index: number) => {
    setRequest(example.prompt);
    setSelectedExample(index);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!request.trim()) {
      setError('Please describe what content you need');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const requestData: ContentRequest = {
        description: request.trim(),
        language,
        grade: gradeLevel,
        subject,
        location
      };

      console.log('🚀 Generating rich content');
      const result = await generateContent(requestData);
      console.log('✅ Received structured content:', result);
      
      setRichContent(result);
      
      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('generated-results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Generation failed:', error);
      setError('Content generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!richContent) return;
    
    try {
      const formattedContent = `STORY:\n${richContent.mainContent.story}\n\nKEY POINTS:\n${richContent.mainContent.keyPoints.map(point => `• ${point}`).join('\n')}\n\nTEACHING TIPS:\n${richContent.teachingTips.map(tip => `${tip.category}: ${tip.tip}`).join('\n')}\n\nEXTENSION ACTIVITIES:\n${richContent.extensionActivities.map(activity => `${activity.title}: ${activity.description}`).join('\n')}`;
      
      await navigator.clipboard.writeText(formattedContent);
      const button = document.querySelector('[data-copy]') as HTMLButtonElement;
      if (button) {
        const original = button.textContent;
        button.textContent = 'Copied!';
        button.disabled = true;
        setTimeout(() => {
          button.textContent = original;
          button.disabled = false;
        }, 2000);
      }
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const clearContent = () => {
    setRichContent(null);
    setError(null);
    setRequest('');
    setSelectedExample(null);
    setShowExamples(false);
    setDynamicExamples([]);
  };

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Google-Style Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-medium text-gray-900 mb-1">
                Content Generator
              </h1>
              <p className="text-base text-gray-600">
                Create culturally relevant educational content for multi-grade classrooms
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
              <div className={`w-2 h-2 rounded-full ${
                isConnected === null ? 'bg-yellow-400' : 
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-700">
                {isConnected === null ? 'Connecting...' : isConnected ? 'AI Ready' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Google-Style Configuration Panel */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="p-6">
            {/* Configuration Grid */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-10 px-3 pr-8 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    disabled={isGenerating}
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="marathi">Marathi</option>
                    <option value="tamil">Tamil</option>
                    <option value="telugu">Telugu</option>
                    <option value="bengali">Bengali</option>
                  </select>
                  <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                <div className="relative">
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full h-10 px-3 pr-8 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    disabled={isGenerating}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                      <option key={grade} value={grade.toString()}>Grade {grade}</option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <div className="relative">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-10 px-3 pr-8 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    disabled={isGenerating}
                  >
                    <option value="science">Science</option>
                    <option value="math">Mathematics</option>
                    <option value="english">English</option>
                    <option value="social">Social Studies</option>
                    <option value="general">General</option>
                  </select>
                  <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-10 px-3 pr-8 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    disabled={isGenerating}
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Kerala">Kerala</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Punjab">Punjab</option>
                  </select>
                  <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Request Input */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Describe your content needs
                </label>
                <button
                  onClick={handleGenerateExamples}
                  disabled={isLoadingExamples || !isConnected}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isLoadingExamples || !isConnected
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  {isLoadingExamples ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FiZap className="w-4 h-4" />
                      <span>Generate Examples</span>
                    </>
                  )}
                </button>
              </div>
              
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="Describe what educational content you need..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isGenerating}
              />
              <div className="mt-1 text-right">
                <span className="text-xs text-gray-500">{request.length} characters</span>
              </div>
            </div>

            {/* On-Demand Examples */}
            {showExamples && dynamicExamples.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Smart Examples
                  </label>
                  <span className="text-xs text-gray-500">Click to use</span>
                </div>
                
                <div className="grid gap-3">
                  {dynamicExamples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleSelect(example, index)}
                      className={`text-left p-4 rounded-lg border transition-all ${
                        selectedExample === index 
                          ? 'border-blue-200 bg-blue-50 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      disabled={isGenerating}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedExample === index 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {selectedExample === index ? (
                            <FiCheck className="w-3 h-3" />
                          ) : (
                            <FiPlay className="w-3 h-3" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{example.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 leading-relaxed">{example.prompt}</p>
                          <p className="text-xs text-gray-500">{example.rationale}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !isConnected || !request.trim()}
              className={`w-full h-12 rounded-md text-sm font-medium transition-all ${
                isGenerating || !isConnected || !request.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
              }`}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Rich Content...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <FiFileText className="w-4 h-4" />
                  <span>Generate Content</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Rich Content Display */}
        {richContent && (
          <div id="generated-results" className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-gray-900">Generated Content</h2>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    data-copy
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <FiCopy className="w-4 h-4" />
                    Copy All
                  </button>
                  <button
                    onClick={clearContent}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {/* Story Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FiBookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">Story</h3>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed">{richContent.mainContent.story}</p>
                  </div>
                </div>

                {/* Key Points */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FiTarget className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-medium text-gray-900">Key Learning Points</h3>
                  </div>
                  <ul className="space-y-2">
                    {richContent.mainContent.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Vocabulary */}
                {richContent.mainContent.vocabulary.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FiInfo className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-medium text-gray-900">Key Vocabulary</h3>
                    </div>
                    <div className="grid gap-3">
                      {richContent.mainContent.vocabulary.map((vocab, index) => (
                        <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="font-medium text-purple-900 mb-1">{vocab.term}</div>
                          <div className="text-sm text-purple-700 mb-1">{vocab.definition}</div>
                          <div className="text-sm text-purple-600 italic">Example: {vocab.example}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teaching Tips */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FiUsers className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-medium text-gray-900">Teaching Tips</h3>
                  </div>
                  <div className="grid gap-4">
                    {richContent.teachingTips.map((tip, index) => (
                      <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="font-medium text-orange-900 mb-2">{tip.category}</div>
                        <div className="text-orange-800 mb-2 leading-relaxed">{tip.tip}</div>
                        <div className="text-sm text-orange-700">
                          <strong>Implementation:</strong> {tip.implementation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extension Activities */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FiStar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">Extension Activities</h3>
                  </div>
                  <div className="grid gap-4">
                    {richContent.extensionActivities.map((activity, index) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="font-medium text-blue-900 mb-2">{activity.title}</div>
                        <div className="text-blue-800 mb-3 leading-relaxed">{activity.description}</div>
                        <div className="grid gap-2">
                          <div className="text-sm">
                            <strong className="text-blue-900">Materials:</strong> 
                            <span className="text-blue-700"> {activity.materials.join(', ')}</span>
                          </div>
                          <div className="text-sm">
                            <strong className="text-blue-900">Grade Adaptation:</strong> 
                            <span className="text-blue-700"> {activity.gradeAdaptation}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalContent; 