import React, { useState, useRef, useEffect } from 'react';
import { FiEdit3, FiTarget, FiCheckCircle, FiDownload, FiCheck, FiFileText, FiRefreshCw, FiUpload, FiX, FiChevronDown } from 'react-icons/fi';
import { generateQuestions, uploadFile } from '../../services/api';
import { downloadQuestionsPDF, downloadQuestionsWord } from '../../services/fileDownloader';
import type { GeneratedQuestion, QuestionRequest } from '../../services/api';

// Helper function to parse the AI response into proper questions
function parseAIResponse(questions: GeneratedQuestion[]): GeneratedQuestion[] {
  console.log('🔍 PARSE AI RESPONSE STARTED:');
  console.log(`   📥 Input: ${questions ? questions.length : 0} items`);
  console.log(`   📦 Input Type: ${Array.isArray(questions) ? 'Array' : typeof questions}`);
  
  const cleanedQuestions: GeneratedQuestion[] = [];
  
  // Find actual questions by looking for meaningful content
  for (let i = 0; i < questions.length; i++) {
    const item = questions[i];
    const text = item.question;
    
    console.log(`   🔍 Processing item ${i + 1}/${questions.length}:`);
    console.log(`       📝 Question Text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
    console.log(`       🏷️ Type: ${item.type}`);
    console.log(`       📊 Options: ${item.options ? item.options.length : 0} items`);
    
    // Skip metadata fields
    if (text.includes('**Question ID**:') || 
        text.includes('**Type**:') || 
        text.includes('**Options**:') || 
        text.includes('**Correct Answer**:') || 
        text.includes('**Points**:') || 
        text.includes('**Skill**:') || 
        text.includes('**Difficulty**:')) {
      console.log(`       ❌ Skipped: Metadata field`);
      continue;
    }
    
    // Look for actual question text
    if (text.includes('**Question**:')) {
      const questionText = text.replace('**Question**:', '').trim();
      if (questionText.length > 10) {
        console.log(`       ✅ Added: Found **Question**: format`);
        cleanedQuestions.push({
          id: `q${cleanedQuestions.length + 1}`,
          type: item.type || 'openEnded',
          question: questionText,
          options: item.options,
          correctAnswer: item.correctAnswer,
          points: item.points || 2,
          skill: item.skill || 'Reading Comprehension',
          difficulty: item.difficulty || 'medium',
          culturalContext: item.culturalContext || ''
        });
      } else {
        console.log(`       ❌ Skipped: Question text too short (${questionText.length} chars)`);
      }
    }
    // Look for standalone questions (without **Question**: prefix)
    else if (item.type === 'extendedResponse' && text.length > 50 && !text.includes('**')) {
      console.log(`       ✅ Added: Extended response format`);
      cleanedQuestions.push({
        id: `q${cleanedQuestions.length + 1}`,
        type: 'extendedResponse',
        question: text,
        points: item.points || 3,
        skill: item.skill || 'Critical Thinking',
        difficulty: item.difficulty || 'hard',
        culturalContext: item.culturalContext || ''
      });
    }
    // Look for multiple choice questions with options
    else if (item.type === 'multipleChoice' && item.options && item.options.length > 0) {
      console.log(`       ✅ Added: Multiple choice with ${item.options.length} options`);
      cleanedQuestions.push({
        id: `q${cleanedQuestions.length + 1}`,
        type: 'multipleChoice',
        question: text,
        options: item.options,
        correctAnswer: item.correctAnswer,
        points: item.points || 2,
        skill: item.skill || 'Reading Comprehension',
        difficulty: item.difficulty || 'medium',
        culturalContext: item.culturalContext || ''
      });
    }
    else {
      console.log(`       ❌ Skipped: No matching parsing pattern`);
      console.log(`           🔍 Type: ${item.type}, Text Length: ${text.length}, Has **: ${text.includes('**')}, Has Options: ${item.options ? item.options.length : 0}`);
    }
  }
  
  // If we still have no good questions, create sample ones
  if (cleanedQuestions.length === 0) {
    console.log('   ⚠️ No valid questions found, creating sample question');
    cleanedQuestions.push({
      id: 'q1',
      type: 'multipleChoice',
      question: 'Based on the text, which of the following is correct?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      points: 2,
      skill: 'Reading Comprehension',
      difficulty: 'medium',
      culturalContext: ''
    });
  }
  
  console.log('🔍 PARSE AI RESPONSE COMPLETED:');
  console.log(`   📤 Output: ${cleanedQuestions.length} questions`);
  console.log(`   📊 Parsing Success Rate: ${questions ? (cleanedQuestions.length / questions.length * 100).toFixed(1) : 0}%`);
  
  return cleanedQuestions;
}

const QuestionGenerator: React.FC = () => {
  const [gradeLevel, setGradeLevel] = useState('');
  const [numQuestions, setNumQuestions] = useState('3');
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [textContent, setTextContent] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);

  const questionTypeOptions = [
    'Multiple choice',
    'Open-ended',
    'Short response',
    'Extended response'
  ];

  const skillOptions = [
    'Craft and structure',
    'Making inferences',
    'Point of view',
    'Author\'s purpose',
    'Figurative language',
    'Evaluating arguments'
  ];

  const toggleQuestionType = (type: string) => {
    setQuestionTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleSkill = (skill: string) => {
    setSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills([...skills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
        setShowDownloadDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDownloadPDF = () => {
    if (generatedQuestions.length > 0) {
        downloadQuestionsPDF(generatedQuestions, { gradeLevel: `Grade ${gradeLevel}` });
    }
    setShowDownloadDropdown(false);
  };

  const handleDownloadWord = async () => {
    if (generatedQuestions.length > 0) {
        await downloadQuestionsWord(generatedQuestions, { gradeLevel: `Grade ${gradeLevel}` });
    }
    setShowDownloadDropdown(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Please upload only PDF or Word documents (.pdf, .doc, .docx)');
      return;
    }

    setIsProcessingFile(true);
    setError(null);
    setUploadedFileName(file.name);
    setIsFileUploaded(false);

    try {
      const result = await uploadFile(file);
      if (result.success) {
        setTextContent(result.data.extractedText);
        setUploadedFileName(file.name);
        setIsFileUploaded(true);
        console.log('File processed successfully:', result);
        
        // Clear the file input to allow re-upload of the same file
        event.target.value = '';
      } else {
        throw new Error('File processing failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError(error instanceof Error ? error.message : 'File upload failed');
      setUploadedFileName(null);
      setIsFileUploaded(false);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFileName(null);
    setIsFileUploaded(false);
    setTextContent('');
    setError(null);
  };

  const handleGenerate = async () => {
    if (!gradeLevel || !textContent.trim() || skills.length === 0) {
      setError('Please set a grade level, provide text content, and select at least one skill.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const request: QuestionRequest = {
        text: textContent.trim(),
        gradeLevel: `Grade ${gradeLevel}`,
        numQuestions: numQuestions,
        questionTypes: questionTypes,
        skills: skills,
      };

      console.log('🚀 Generating Questions with Request:', request);
      const result = await generateQuestions(request);
      console.log('✅ Received Questions:', result);

      if (result && Array.isArray(result.questions)) {
        const parsed = parseAIResponse(result.questions);
        setGeneratedQuestions(parsed);
        setError(null);
      } else {
        console.error('Invalid response structure:', result);
        setError('Failed to generate questions. The response from the server was not in the expected format.');
      }
    } catch (error) {
      console.error('Question generation error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred during question generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditQuestion = (index: number, newText: string) => {
    const updatedQuestions = [...generatedQuestions];
    updatedQuestions[index].question = newText;
    setGeneratedQuestions(updatedQuestions);
  };
    
  const handleEditOption = (qIndex: number, oIndex: number, newText: string) => {
    const updatedQuestions = [...generatedQuestions];
    if(updatedQuestions[qIndex].options) {
        updatedQuestions[qIndex].options[oIndex] = newText;
        setGeneratedQuestions(updatedQuestions);
    }
  };
  
  const handleSetCorrectAnswer = (qIndex: number, oIndex: number) => {
    const updatedQuestions = [...generatedQuestions];
    if(updatedQuestions[qIndex].options) {
        updatedQuestions[qIndex].correctAnswer = updatedQuestions[qIndex].options[oIndex];
        setGeneratedQuestions(updatedQuestions);
    }
  };

  const clearResults = () => {
    setGeneratedQuestions([]);
    setError(null);
  };

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">Quick Quiz Generator</h1>
            <p className="mt-2 text-lg text-gray-600">
                Instantly create standards-aligned questions from any text or document.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Controls */}
          <div className="space-y-8">
            
            {/* Step 1: Configuration */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 font-bold text-sm">1</span>
                    Configuration
                </h3>
              
                <div className="space-y-5">
                    <div>
                        <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                        <input
                            type="number"
                            id="gradeLevel"
                            value={gradeLevel}
                            onChange={(e) => setGradeLevel(e.target.value)}
                            placeholder="e.g., 5"
                            className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isGenerating}
                        />
                    </div>

                    <div>
                        <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
                        <input
                            type="number"
                            id="numQuestions"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(e.target.value)}
                            className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isGenerating}
                        />
                    </div>
                </div>
            </div>

            {/* Step 2: Skills & Question Types */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 font-bold text-sm">2</span>
                    Skills & Question Types
                </h3>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Question Types</label>
                        <div className="flex flex-wrap gap-2">
                            {questionTypeOptions.map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleQuestionType(type)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                                        questionTypes.includes(type)
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    disabled={isGenerating}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Skills</label>
                        <div className="flex flex-wrap gap-2">
                            {skillOptions.map(skill => (
                                <button
                                    key={skill}
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                                        skills.includes(skill)
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    disabled={isGenerating}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="pt-2">
                        <label htmlFor="customSkill" className="block text-sm font-medium text-gray-700 mb-1">Add a Custom Skill</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                id="customSkill"
                                value={customSkill}
                                onChange={(e) => setCustomSkill(e.target.value)}
                                placeholder="e.g., Identifying Main Idea"
                                className="flex-grow h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isGenerating}
                            />
                            <button
                                onClick={addCustomSkill}
                                className="h-10 px-4 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300"
                                disabled={!customSkill.trim() || isGenerating}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 3: Content Input */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 font-bold text-sm">3</span>
                    Provide Content
                </h3>

                <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste your text here, or upload a document below."
                    className="w-full p-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] resize-y"
                    disabled={isGenerating}
                />
                
                <div className="mt-4 flex items-center justify-between">
                    {!uploadedFileName ? (
                        <label htmlFor="file-upload" className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 ${isProcessingFile ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                            <FiUpload className="w-5 h-5 mr-2 text-gray-500" />
                            <span>{isProcessingFile ? 'Processing...' : 'Upload Document'}</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileUpload} disabled={isProcessingFile} />
                        </label>
                    ) : (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm font-medium px-3 py-2 rounded-lg">
                            <FiCheckCircle className="w-5 h-5"/>
                            <span>{uploadedFileName}</span>
                            <button onClick={handleRemoveFile} className="ml-2 p-1 hover:bg-green-100 rounded-full">
                                <FiX className="w-4 h-4"/>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !textContent.trim() || !gradeLevel || skills.length === 0}
                className="w-full flex items-center justify-center h-14 px-6 bg-blue-600 text-white font-semibold rounded-lg text-lg shadow-md hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isGenerating ? (
                    <>
                        <FiRefreshCw className="animate-spin w-5 h-5 mr-3" />
                        Generating Questions...
                    </>
                ) : (
                    <>
                        <FiTarget className="w-6 h-6 mr-3" />
                        Generate Questions
                    </>
                )}
            </button>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
                    <p className="font-semibold">Error</p>
                    <p>{error}</p>
                </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="space-y-8">
            {/* Results */}
            {generatedQuestions.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-semibold text-gray-800">Generated Questions</h3>
                        <div className="relative" ref={downloadDropdownRef}>
                            <button
                                onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                            >
                                <FiDownload className="w-5 h-5 mr-2" />
                                Download
                                <FiChevronDown className="w-4 h-4 ml-2" />
                            </button>
                            {showDownloadDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Download as PDF
                                    </button>
                                    <button
                                        onClick={handleDownloadWord}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Download as Word
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        {generatedQuestions.map((question, index) => (
                            <div key={question.id} className="p-4 border rounded-lg bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-baseline mb-2">
                                            <span className="font-bold text-blue-600 mr-2">{index + 1}.</span>
                                            <p className="text-gray-800 font-medium">{question.question}</p>
                                        </div>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500 pl-5">
                                            <span>Type: <span className="font-semibold text-gray-600">{question.type}</span></span>
                                            <span className="w-px h-3 bg-gray-300"></span>
                                            <span>Skill: <span className="font-semibold text-gray-600">{question.skill}</span></span>
                                            <span className="w-px h-3 bg-gray-300"></span>
                                            <span>Points: <span className="font-semibold text-gray-600">{question.points}</span></span>
                                        </div>
                                    </div>
                                </div>

                                {question.options && question.options.length > 0 && (
                                    <div className="mt-4 pl-5 space-y-2">
                                        {question.options.map((option, optIndex) => (
                                            <div key={optIndex} className="flex items-center space-x-3">
                                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${
                                                    option === question.correctAnswer
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                    {String.fromCharCode(65 + optIndex)}
                                                </span>
                                                <span className={`text-sm ${
                                                    option === question.correctAnswer
                                                        ? 'text-gray-800 font-semibold'
                                                        : 'text-gray-700'
                                                }`}>{option}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={clearResults}
                            className="text-sm font-medium text-gray-600 hover:text-red-600 flex items-center"
                        >
                            <FiX className="w-4 h-4 mr-1" />
                            Clear Results
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionGenerator; 