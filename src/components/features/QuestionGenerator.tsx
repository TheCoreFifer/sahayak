import React, { useState, useRef, useEffect } from 'react';
import { FiEdit3, FiTarget, FiCheckCircle, FiDownload, FiCheck, FiFileText, FiRefreshCw, FiUpload, FiX, FiChevronDown } from 'react-icons/fi';
import { generateQuestions, uploadFile, downloadQuestionsPDF, downloadQuestionsWord } from '../../services/api';
import type { QuestionRequest, GeneratedQuestion } from '../../services/api';

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
    downloadQuestionsPDF(generatedQuestions, { gradeLevel: `Grade ${gradeLevel}` });
    setShowDownloadDropdown(false);
  };

  const handleDownloadWord = async () => {
    await downloadQuestionsWord(generatedQuestions, { gradeLevel: `Grade ${gradeLevel}` });
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
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const request: QuestionRequest = {
        text: textContent.trim(),
        gradeLevel: `Grade ${gradeLevel}`,
        numQuestions: parseInt(numQuestions),
        questionTypes: questionTypes.length > 0 ? questionTypes : ['Multiple choice', 'Short response'],
        skills: skills,
        customSkills: []
      };

      // 🔍 LOG REQUEST DETAILS
      console.log('🚀 FRONTEND REQUEST:');
      console.log(`   📝 Requested Questions: ${numQuestions}`);
      console.log(`   🎯 Grade Level: ${gradeLevel}`);
      console.log(`   📚 Question Types: ${questionTypes.length > 0 ? questionTypes : ['Multiple choice', 'Short response']}`);
      console.log(`   🧠 Skills: ${skills}`);
      
      const result = await generateQuestions(request);
      
      // 🔍 LOG BACKEND RESPONSE
      console.log('📨 BACKEND RESPONSE RECEIVED:');
      console.log(`   📦 Raw Response:`, result);
      console.log(`   📝 Questions Array Length: ${result.questions ? result.questions.length : 0}`);
      console.log(`   🎯 Total Count Field: ${result.totalCount}`);
      
      // Parse the AI response to extract proper questions
      const cleanedQuestions = parseAIResponse(result.questions);
      
      // 🔍 LOG PARSING RESULTS
      console.log('🔧 FRONTEND PARSING:');
      console.log(`   📝 Raw Questions Count: ${result.questions ? result.questions.length : 0}`);
      console.log(`   ✨ Parsed Questions Count: ${cleanedQuestions.length}`);
      console.log(`   📊 Request vs Raw vs Parsed: ${numQuestions} → ${result.questions ? result.questions.length : 0} → ${cleanedQuestions.length}`);
      console.log(`   ✅ Final Result: ${cleanedQuestions.length === parseInt(numQuestions) ? 'SUCCESS' : 'QUANTITY MISMATCH'}`);
      
      setGeneratedQuestions(cleanedQuestions);
      
      console.log('✅ Raw AI response:', result.questions);
      console.log('✅ Parsed questions:', cleanedQuestions);
    } catch (err) {
      console.error('Question generation error:', err);
      setError('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = gradeLevel.trim() && textContent.trim() && skills.length > 0;

  return (
    <div className="min-h-screen page-bg">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal text-gray-900 mb-3">
            Generate text-dependent questions
          </h1>
          <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
            Based on any text, generate questions as an exit ticket, formal assessment, or to support reading comprehension
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            {/* Grade Level and Number of Questions */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target grade level <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="E.g. 6"
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    gradeLevel.trim() ? 'border-gray-300' : 'border-red-300'
                  }`}
                />
                {!gradeLevel.trim() && (
                  <p className="text-red-500 text-sm mt-1">Required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of questions <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  min="1"
                  max="20"
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Question Types */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Choose question types (optional):
              </label>
              <div className="flex flex-wrap gap-3">
                {questionTypeOptions.map((type) => {
                  const isSelected = questionTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleQuestionType(type)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full border text-sm font-medium ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <FiCheck className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <span>{type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skills */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Describe the skills or knowledge that you want students to demonstrate <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-3 mb-4">
                {skillOptions.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full border text-sm font-medium ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <FiCheck className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Custom Skill Input */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <FiEdit3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      placeholder="Write your own"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                    />
                  </div>
                </div>
                <button
                  onClick={addCustomSkill}
                  disabled={!customSkill.trim()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Add
                </button>
              </div>
              {skills.length === 0 && (
                <p className="text-red-500 text-sm mt-2">At least one skill is required</p>
              )}
            </div>

            {/* Text Content */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Add your text <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isProcessingFile}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 cursor-pointer transition-colors shadow-sm ${
                      isProcessingFile ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <FiUpload className="w-4 h-4" />
                    <span>Upload from Local</span>
                  </label>
                  <button 
                    onClick={() => alert('Google Drive integration coming soon!')}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors shadow-sm"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Upload from Drive</span>
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Upload a PDF or Word document, or enter text below
              </p>
              
              {/* File Processing Indicator */}
              {(isProcessingFile || uploadedFileName) && (
                <div className={`mb-4 p-4 rounded-lg border ${
                  isProcessingFile 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isProcessingFile ? (
                        <>
                          <FiRefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                          <div>
                            <span className="text-sm font-medium text-blue-700">Processing file...</span>
                            <p className="text-xs text-blue-600 mt-1">Extracting text content with AI</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <FiCheck className="w-5 h-5 text-green-600" />
                          <div>
                            <span className="text-sm font-medium text-green-700">
                              File processed successfully
                            </span>
                            <p className="text-xs text-green-600 mt-1">
                              <span className="font-medium">{uploadedFileName}</span> • Content extracted and ready for question generation
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {uploadedFileName && !isProcessingFile && (
                      <button
                        onClick={handleRemoveFile}
                        className="flex items-center justify-center w-8 h-8 text-green-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove file and clear content"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="relative">
                <textarea
                  value={textContent}
                  onChange={(e) => !isFileUploaded && setTextContent(e.target.value)}
                  placeholder={
                    isFileUploaded 
                      ? "File content has been extracted and is ready for question generation..."
                      : "Enter text or upload a file above..."
                  }
                  rows={12}
                  className={`w-full px-4 py-3 text-base border rounded-lg resize-none transition-colors ${
                    isFileUploaded 
                      ? 'bg-gray-50 border-gray-300 text-gray-700 cursor-default'
                      : `focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          textContent.trim() ? 'border-gray-300' : 'border-red-300'
                        }`
                  }`}
                  disabled={isProcessingFile}
                  readOnly={isFileUploaded}
                />
                <div className="absolute bottom-3 right-3 text-sm text-gray-500">
                  {textContent.length}/130,000
                  {isFileUploaded && (
                    <span className="ml-2 text-green-600 font-medium">File Content</span>
                  )}
                </div>
                {isFileUploaded && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FiFileText className="w-3 h-3 mr-1" />
                      Extracted
                    </span>
                  </div>
                )}
              </div>
              {!textContent.trim() && !isFileUploaded && (
                <p className="text-red-500 text-sm mt-2">Text content is required</p>
              )}
              {isFileUploaded && (
                <p className="text-green-600 text-sm mt-2 flex items-center">
                  <FiCheck className="w-4 h-4 mr-1" />
                  Content extracted from file. Click the ✕ button above to remove and enter text manually.
                </p>
              )}
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !isFormValid}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-base ${
                  isGenerating || !isFormValid
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating questions...</span>
                  </>
                ) : (
                  <>
                    <FiTarget className="w-4 h-4" />
                    <span>Generate questions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Generated Questions */}
        {generatedQuestions.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <FiCheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Generated Questions ({generatedQuestions.length})
                  </h3>
                </div>
                
                {/* Download Button with Dropdown */}
                <div className="relative" ref={downloadDropdownRef}>
                  <button
                    onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Download</span>
                    <FiChevronDown className={`w-4 h-4 transition-transform ${
                      showDownloadDropdown ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showDownloadDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={handleDownloadPDF}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-green-50 transition-colors"
                        >
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <FiFileText className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Download as HTML/PDF</div>
                            <div className="text-xs text-gray-500">Formatted document (opens in browser)</div>
                          </div>
                        </button>
                        <button
                          onClick={handleDownloadWord}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-green-50 transition-colors"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FiFileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Download as Word</div>
                            <div className="text-xs text-gray-500">HTML format (opens in Word)</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                {generatedQuestions.map((question, index) => (
                  <div key={question.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          {index + 1}
                        </span>
                        <div className="flex space-x-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                            {question.type.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {question.skill}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            question.difficulty === 'easy' 
                              ? 'bg-green-100 text-green-700'
                              : question.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 font-medium">
                        {question.points} {question.points === 1 ? 'point' : 'points'}
                      </span>
                    </div>
                    
                    <div className="ml-9">
                      <p className="text-gray-900 font-medium mb-3">{question.question}</p>
                      
                      {question.options && question.options.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <span className="text-gray-500 font-medium">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              <span className="text-gray-700">{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.correctAnswer && (
                        <div className="text-sm">
                          <span className="text-gray-600">Answer: </span>
                          <span className="text-green-700 font-medium">{question.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Do not include content you do not own or have the relevant rights to use.{' '}
            <a href="#" className="text-blue-600 hover:underline font-medium">Learn more</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuestionGenerator; 