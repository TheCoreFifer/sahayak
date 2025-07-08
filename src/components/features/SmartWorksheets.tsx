import React, { useState, useRef } from 'react';
import { FiUpload, FiImage, FiLayers, FiDownload, FiRefreshCw, FiCheck, FiX, FiTarget, FiBookOpen, FiUsers, FiEdit3, FiEye, FiChevronDown, FiFileText, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface WorksheetLevel {
  grade: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  exercises: Exercise[];
  instructions: string;
}

interface Exercise {
  id: string;
  type: 'fillInBlank' | 'multipleChoice' | 'shortAnswer' | 'matching' | 'truefalse';
  question: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  hint?: string;
}

interface AnalyzedContent {
  topic: string;
  keyTerms: string[];
  concepts: string[];
  difficulty: string;
  suggestedGrades: string[];
  imageDescription: string;
}

// Question type options
const questionTypes = [
  { id: 'mixed', label: 'Mixed Questions', description: 'Combination of all question types', icon: FiLayers },
  { id: 'mcq', label: 'Multiple Choice (MCQ)', description: 'Only multiple choice questions', icon: FiCheckCircle },
  { id: 'shortAnswer', label: 'Short Answer', description: 'Brief written responses', icon: FiEdit3 },
  { id: 'fillInBlank', label: 'Fill in the Blanks', description: 'Complete the sentences', icon: FiFileText },
  { id: 'truefalse', label: 'True/False', description: 'True or False questions', icon: FiXCircle },
  { id: 'matching', label: 'Matching', description: 'Match related items', icon: FiTarget }
];

const SmartWorksheets: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedContent, setAnalyzedContent] = useState<AnalyzedContent | null>(null);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(['mixed']);
  const [worksheets, setWorksheets] = useState<WorksheetLevel[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewWorksheet, setPreviewWorksheet] = useState<WorksheetLevel | null>(null);
  const [downloadDropdown, setDownloadDropdown] = useState<{[key: string]: boolean}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gradeOptions = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'
  ];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Please upload a valid image file (JPG, PNG, GIF, WebP, BMP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size must be less than 10MB');
      return;
    }

    console.log('📸 File upload details:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    });

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      console.log('✅ Image preview created successfully');
    };
    reader.readAsDataURL(file);

    await analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('🔍 Starting image analysis...');
      
      const base64 = await convertToBase64(file);
      console.log(`📊 Base64 data length: ${base64.length} characters`);
      
      const apiUrl = 'http://localhost:3001/api/analyze-textbook';
      console.log(`🌐 Calling API: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64,
          fileType: file.type
        })
      });

      console.log(`📡 API Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}. Please ensure the backend server is running.`);
      }

      const result = await response.json();
      console.log('📊 API Response:', result);
      
      if (result.success) {
        setAnalyzedContent(result.data);
        setSelectedGrades(result.data.suggestedGrades || ['Grade 3', 'Grade 4', 'Grade 5']);
        console.log('✅ Image analysis successful');
      } else {
        throw new Error(result.error || 'Analysis failed - please try again');
      }
    } catch (error) {
      console.error('❌ Image analysis error:', error);
      
      let errorMessage = 'Failed to analyze image';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (errorMessage.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://localhost:3001';
      }
      
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateWorksheets = async () => {
    if (!analyzedContent || selectedGrades.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      console.log('📝 Starting worksheet generation...');
      console.log('📊 Generation details:', {
        topic: analyzedContent.topic,
        targetGrades: selectedGrades,
        questionTypes: selectedQuestionTypes,
        keyTermsCount: analyzedContent.keyTerms?.length || 0,
        conceptsCount: analyzedContent.concepts?.length || 0
      });
      
      const apiUrl = 'http://localhost:3001/api/generate-worksheets';
      console.log(`🌐 Calling API: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analyzedContent,
          targetGrades: selectedGrades,
          questionTypes: selectedQuestionTypes,
          imageData: uploadedImage?.split(',')[1]
        })
      });

      console.log(`📡 API Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);
        throw new Error(`Worksheet generation failed: ${response.status} ${response.statusText}. Please ensure the backend server is running.`);
      }

      const result = await response.json();
      console.log('📊 Worksheet Generation Response:', result);
      
      if (result.success) {
        setWorksheets(result.data.worksheets);
        console.log(`✅ Successfully generated ${result.data.worksheets.length} worksheets`);
      } else {
        throw new Error(result.error || 'Worksheet generation failed - please try again');
      }
    } catch (error) {
      console.error('❌ Worksheet generation error:', error);
      
      let errorMessage = 'Failed to generate worksheets';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (errorMessage.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://localhost:3001';
      }
      
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleGrade = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) 
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    );
  };

  const toggleQuestionType = (questionType: string) => {
    setSelectedQuestionTypes(prev => {
      if (questionType === 'mixed') {
        return ['mixed'];
      }
      
      const newTypes = prev.includes(questionType)
        ? prev.filter(t => t !== questionType)
        : [...prev.filter(t => t !== 'mixed'), questionType];
      
      return newTypes.length === 0 ? ['mixed'] : newTypes;
    });
  };

  const clearAll = () => {
    setUploadedImage(null);
    setImageFile(null);
    setAnalyzedContent(null);
    setSelectedGrades([]);
    setSelectedQuestionTypes(['mixed']);
    setWorksheets([]);
    setError(null);
    setPreviewWorksheet(null);
    setDownloadDropdown({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleDownloadDropdown = (index: number) => {
    setDownloadDropdown(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const downloadWorksheet = (worksheet: WorksheetLevel, includeAnswers: boolean = false) => {
    const htmlContent = generateWorksheetHTML(worksheet, includeAnswers);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const answerSuffix = includeAnswers ? '-with-answers' : '';
    link.download = `sahayak-worksheet-${worksheet.grade.toLowerCase().replace(' ', '-')}-${worksheet.title.toLowerCase().replace(/\s+/g, '-')}${answerSuffix}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Close dropdown after download
    setDownloadDropdown({});
  };

  const previewWorksheetModal = (worksheet: WorksheetLevel) => {
    setPreviewWorksheet(worksheet);
  };

  const generateWorksheetHTML = (worksheet: WorksheetLevel, includeAnswers: boolean = false): string => {
    const currentDate = new Date().toLocaleDateString('en-IN');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${worksheet.title} - ${worksheet.grade}</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 20px; line-height: 1.6; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2563eb; margin: 0; font-size: 24pt; font-weight: bold; }
        .header h2 { color: #666; margin: 5px 0; font-size: 16pt; }
        .metadata { background: #f8f9fa; padding: 20px; margin-bottom: 25px; border: 1px solid #dee2e6; border-radius: 8px; }
        .metadata-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metadata p { margin: 5px 0; font-size: 11pt; }
        .instructions { background: #e3f2fd; padding: 20px; margin-bottom: 30px; border-left: 5px solid #2196f3; border-radius: 5px; }
        .instructions h3 { margin-top: 0; color: #1565c0; font-size: 14pt; }
        .exercise { margin-bottom: 30px; padding: 20px; border: 2px solid #e0e0e0; border-radius: 10px; background: #fafafa; }
        .exercise-header { display: flex; justify-content: between; align-items: center; margin-bottom: 15px; }
        .exercise-number { font-weight: bold; color: #4caf50; font-size: 14pt; }
        .exercise-points { background: #4caf50; color: white; padding: 4px 8px; border-radius: 5px; font-size: 10pt; font-weight: bold; }
        .exercise-type { color: #666; font-size: 10pt; font-style: italic; margin-left: 10px; }
        .question { font-weight: 500; margin-bottom: 15px; font-size: 12pt; }
        .options { margin-left: 20px; margin-bottom: 15px; }
        .option { margin-bottom: 8px; font-size: 11pt; }
        .answer-space { margin-top: 15px; border-bottom: 2px solid #ccc; min-height: 40px; }
        .answer-section { margin-top: 15px; padding: 15px; background: #fff3e0; border: 1px solid #ffb74d; border-radius: 5px; }
        .answer-label { font-weight: bold; color: #e65100; font-size: 11pt; margin-bottom: 8px; }
        .correct-answer { color: #2e7d32; font-weight: bold; }
        .hint { margin-top: 10px; padding: 10px; background: #f0f7ff; border-left: 3px solid #2196f3; font-style: italic; color: #1976d2; }
        .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #666; font-size: 10pt; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${worksheet.title}</h1>
        <h2>${worksheet.grade} • ${worksheet.difficulty.charAt(0).toUpperCase() + worksheet.difficulty.slice(1)} Level</h2>
        <p>Generated by Sahayak AI - Smart Worksheets</p>
    </div>
    
    <div class="metadata">
        <div class="metadata-grid">
            <p><strong>📅 Date:</strong> ${currentDate}</p>
            <p><strong>🎓 Grade Level:</strong> ${worksheet.grade}</p>
            <p><strong>📊 Total Exercises:</strong> ${worksheet.exercises.length}</p>
            <p><strong>⏰ Estimated Time:</strong> ${worksheet.exercises.length * 3} minutes</p>
        </div>
    </div>
    
    <div class="instructions">
        <h3>📋 Instructions for Students:</h3>
        <p>${worksheet.instructions}</p>
        <p><strong>💡 Tips:</strong> Read each question carefully and choose the best answer.</p>
    </div>
    
    ${worksheet.exercises.map((exercise, index) => `
        <div class="exercise">
            <div class="exercise-header">
                <div>
                    <span class="exercise-number">Question ${index + 1}</span>
                    <span class="exercise-type">[${exercise.type.replace(/([A-Z])/g, ' $1').trim()}]</span>
                </div>
                <span class="exercise-points">${exercise.points} ${exercise.points === 1 ? 'point' : 'points'}</span>
            </div>
            
            <div class="question">${exercise.question}</div>
            
            ${exercise.options && exercise.options.length > 0 ? `
                <div class="options">
                    ${exercise.options.map((option, optIndex) => 
                        `<div class="option">
                            <strong>${String.fromCharCode(65 + optIndex)}.</strong> ${option}
                        </div>`
                    ).join('')}
                </div>
            ` : '<div class="answer-space"></div>'}
            
            ${exercise.hint ? `
                <div class="hint">
                    <strong>💡 Hint:</strong> ${exercise.hint}
                </div>
            ` : ''}
            
            ${includeAnswers ? `
                <div class="answer-section">
                    <div class="answer-label">✅ Correct Answer:</div>
                    <div class="correct-answer">${exercise.correctAnswer}</div>
                </div>
            ` : ''}
        </div>
    `).join('')}
    
    <div class="footer">
        <p><strong>Generated by Sahayak AI - Empowering Indian Education</strong></p>
        <p>Professional Teaching Resources for Multi-Grade Classrooms</p>
        <p>🇮🇳 Made with ❤️ for Indian Teachers</p>
    </div>
</body>
</html>`;
  };

  return (
    <div className="min-h-screen page-bg">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            🎓 Smart Worksheets Generator
          </h1>
          <p className="text-gray-600 text-base leading-relaxed max-w-3xl">
            Upload a photo of any textbook page and instantly generate differentiated worksheets 
            tailored for multiple grade levels in your multi-grade classroom
          </p>
        </div>

        {/* Image Upload Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FiImage className="w-6 h-6 mr-3 text-blue-600" />
              Upload Textbook Page
            </h2>
            
            {!uploadedImage ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-all duration-300 hover:bg-blue-50">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FiUpload className="w-16 h-16 text-gray-400 mb-4" />
                  <span className="text-xl font-semibold text-gray-700 mb-2">
                    Upload textbook page image
                  </span>
                  <span className="text-sm text-gray-500 mb-2">
                    Supports: JPG, PNG, GIF, WebP, BMP • Max 10MB
                  </span>
                  <span className="text-xs text-gray-400 px-4 py-2 bg-blue-100 rounded-full">
                    📚 Take a photo of any textbook page or upload from gallery
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded textbook page"
                    className="max-w-full h-auto max-h-96 mx-auto rounded-lg shadow-md"
                  />
                  <button
                    onClick={clearAll}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                
                {isAnalyzing && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center gap-4">
                      <FiRefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                      <div>
                        <span className="text-lg font-semibold text-blue-700">Analyzing textbook content...</span>
                        <p className="text-sm text-blue-600 mt-1">Using Gemini AI to understand the page content and structure</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        {analyzedContent && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FiBookOpen className="w-6 h-6 mr-3 text-green-600" />
                Content Analysis Results
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">📚 Topic & Description</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 font-medium mb-2">{analyzedContent.topic}</p>
                      <p className="text-sm text-gray-600">{analyzedContent.imageDescription}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">🔑 Key Terms</h3>
                    <div className="flex flex-wrap gap-2">
                      {analyzedContent.keyTerms.map((term, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">💡 Key Concepts</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        {analyzedContent.concepts.map((concept, index) => (
                          <li key={index} className="text-sm">{concept}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">🎓 Recommended Grades</h3>
                    <div className="flex flex-wrap gap-2">
                      {analyzedContent.suggestedGrades.map((grade, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {grade}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Type Selection */}
        {analyzedContent && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FiEdit3 className="w-6 h-6 mr-3 text-indigo-600" />
                Select Question Types
              </h2>
              
              <p className="text-gray-600 mb-6">
                Choose the types of questions you want in your worksheets. Mixed provides the best learning experience.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {questionTypes.map((type) => {
                  const isSelected = selectedQuestionTypes.includes(type.id);
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => toggleQuestionType(type.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 shadow-md'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <IconComponent className={`w-5 h-5 mr-3 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                          {type.label}
                        </span>
                        {isSelected && (
                          <FiCheck className="w-4 h-4 text-indigo-600 ml-auto" />
                        )}
                      </div>
                      <p className={`text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-500'}`}>
                        {type.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Grade Selection */}
        {analyzedContent && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FiUsers className="w-6 h-6 mr-3 text-purple-600" />
                Select Target Grade Levels
              </h2>
              
              <p className="text-gray-600 mb-6">
                Choose the grade levels present in your multi-grade classroom to generate differentiated worksheets
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {gradeOptions.map((grade) => {
                  const isSelected = selectedGrades.includes(grade);
                  return (
                    <button
                      key={grade}
                      onClick={() => toggleGrade(grade)}
                      className={`p-4 rounded-lg border-2 text-center font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-md'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 mx-auto mb-2 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-purple-500 border-purple-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <FiCheck className="w-3 h-3 text-white" />
                        )}
                      </div>
                      {grade}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-8 flex justify-center">
                <button
                  onClick={generateWorksheets}
                  disabled={isGenerating || selectedGrades.length === 0}
                  className={`flex items-center space-x-3 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                    isGenerating || selectedGrades.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating worksheets...</span>
                    </>
                  ) : (
                    <>
                      <FiLayers className="w-5 h-5" />
                      <span>Generate Differentiated Worksheets ({selectedGrades.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generated Worksheets */}
        {worksheets.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FiTarget className="w-6 h-6 mr-3 text-orange-600" />
                Generated Worksheets ({worksheets.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {worksheets.map((worksheet, index) => (
                  <div key={index} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{worksheet.grade.slice(-1)}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{worksheet.grade}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        worksheet.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        worksheet.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {worksheet.difficulty}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold text-gray-800 mb-2">{worksheet.title}</h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{worksheet.instructions}</p>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">📝 Exercises ({worksheet.exercises.length}):</p>
                      <div className="space-y-1">
                        {worksheet.exercises.slice(0, 2).map((exercise, exIndex) => (
                          <p key={exIndex} className="text-xs text-gray-600 truncate">
                            {exIndex + 1}. {exercise.question}
                          </p>
                        ))}
                        {worksheet.exercises.length > 2 && (
                          <p className="text-xs text-gray-500 font-medium">+ {worksheet.exercises.length - 2} more exercises</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => previewWorksheetModal(worksheet)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                      >
                        <FiEye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={() => toggleDownloadDropdown(index)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          <FiDownload className="w-4 h-4" />
                          <span>Download</span>
                          <FiChevronDown className="w-4 h-4" />
                        </button>
                        
                        {downloadDropdown[index] && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={() => downloadWorksheet(worksheet, false)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 flex items-center space-x-2"
                            >
                              <FiFileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">Without Answers</span>
                            </button>
                            <button
                              onClick={() => downloadWorksheet(worksheet, true)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <FiCheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm">With Answers</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewWorksheet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-y-auto w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Preview: {previewWorksheet.title} - {previewWorksheet.grade}
                  </h3>
                  <button
                    onClick={() => setPreviewWorksheet(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2"><strong>Instructions:</strong></p>
                  <p className="text-gray-800">{previewWorksheet.instructions}</p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Exercises ({previewWorksheet.exercises.length}):</h4>
                  {previewWorksheet.exercises.slice(0, 5).map((exercise, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900">Question {index + 1}</span>
                        <span className="text-sm text-gray-500">{exercise.points} points</span>
                      </div>
                      <p className="text-gray-800 mb-2">{exercise.question}</p>
                      {exercise.options && (
                        <div className="ml-4 space-y-1">
                          {exercise.options.map((option, optIndex) => (
                            <p key={optIndex} className="text-sm text-gray-600">
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {previewWorksheet.exercises.length > 5 && (
                    <p className="text-center text-gray-500 text-sm">
                      ... and {previewWorksheet.exercises.length - 5} more exercises
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 flex items-center">
              <FiXCircle className="w-5 h-5 mr-2" />
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartWorksheets; 