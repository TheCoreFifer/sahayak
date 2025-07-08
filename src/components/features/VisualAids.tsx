import React, { useState, useRef } from 'react';
import { FiEdit3, FiImage, FiDownload, FiRefreshCw, FiCheck, FiX, FiTarget, FiBookOpen, FiUsers, FiPenTool, FiSquare, FiCircle, FiTriangle } from 'react-icons/fi';

interface VisualAid {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  materials: string[];
  complexity: 'simple' | 'medium' | 'detailed';
  subject: string;
  concepts: string[];
  svgContent: string;
  blackboardSteps: string[];
}

const VisualAids: React.FC = () => {
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Science');
  const [gradeLevel, setGradeLevel] = useState('Grade 5');
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'detailed'>('simple');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAids, setGeneratedAids] = useState<VisualAid[]>([]);
  const [error, setError] = useState<string | null>(null);

  const subjectOptions = ['Science', 'Mathematics', 'Social Studies', 'English', 'General Knowledge'];
  const gradeOptions = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];

  const examplePrompts = [
    "Water cycle showing evaporation, condensation, and precipitation",
    "Plant life cycle from seed to flower",
    "Solar system with planets in order",
    "Food chain in a forest ecosystem",
    "Human digestive system",
    "Parts of a flower with labels",
    "Rock cycle showing different types",
    "States of matter - solid, liquid, gas",
    "Animal cell structure with organelles",
    "Simple electrical circuit with battery and bulb"
  ];

  const generateVisualAid = async () => {
    if (!description.trim()) {
      setError('Please provide a description of what you want to visualize');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('🎨 Starting visual aid generation...');
      console.log('📊 Generation details:', {
        description,
        subject,
        gradeLevel,
        complexity
      });

      const response = await fetch('http://localhost:3001/api/generate-visual-aid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          subject,
          gradeLevel,
          complexity
        })
      });

      console.log(`📡 API Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);
        throw new Error(`Visual aid generation failed: ${response.status} ${response.statusText}. Please ensure the backend server is running.`);
      }

      const result = await response.json();
      console.log('📊 Visual Aid Response:', result);
      
      if (result.success) {
        setGeneratedAids(prev => [result.data, ...prev]);
        console.log('✅ Visual aid generated successfully');
        setDescription(''); // Clear the input
      } else {
        throw new Error(result.error || 'Visual aid generation failed - please try again');
      }
    } catch (error) {
      console.error('❌ Visual aid generation error:', error);
      
      let errorMessage = 'Failed to generate visual aid';
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

  const downloadSVG = (visualAid: VisualAid) => {
    const svgBlob = new Blob([visualAid.svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sahayak-visual-aid-${visualAid.title.toLowerCase().replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadInstructions = (visualAid: VisualAid) => {
    const instructionsHTML = generateInstructionsHTML(visualAid);
    const blob = new Blob([instructionsHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sahayak-blackboard-instructions-${visualAid.title.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateInstructionsHTML = (visualAid: VisualAid): string => {
    const currentDate = new Date().toLocaleDateString('en-IN');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${visualAid.title} - Blackboard Instructions</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2563eb; margin: 0; font-size: 24pt; }
        .metadata { background: #f8f9fa; padding: 15px; margin-bottom: 20px; border: 1px solid #dee2e6; }
        .section { margin-bottom: 25px; padding: 15px; border-left: 4px solid #4caf50; background: #fafafa; }
        .section h3 { margin-top: 0; color: #2e7d32; }
        .step { margin-bottom: 15px; padding: 10px; background: white; border: 1px solid #e0e0e0; border-radius: 4px; }
        .step-number { font-weight: bold; color: #1976d2; margin-right: 8px; }
        .materials { background: #fff3e0; padding: 12px; border-radius: 4px; margin-bottom: 15px; }
        .concepts { background: #e8f5e8; padding: 12px; border-radius: 4px; margin-bottom: 15px; }
        .footer { text-align: center; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 15px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${visualAid.title}</h1>
        <p>Blackboard Drawing Instructions for Teachers</p>
    </div>
    
    <div class="metadata">
        <p><strong>Date:</strong> ${currentDate}</p>
        <p><strong>Subject:</strong> ${visualAid.subject}</p>
        <p><strong>Complexity:</strong> ${visualAid.complexity}</p>
        <p><strong>Description:</strong> ${visualAid.description}</p>
    </div>
    
    <div class="section">
        <h3>📚 Key Concepts to Teach</h3>
        <div class="concepts">
            ${visualAid.concepts.map(concept => `<div>• ${concept}</div>`).join('')}
        </div>
    </div>
    
    <div class="section">
        <h3>🎨 Materials Needed</h3>
        <div class="materials">
            ${visualAid.materials.map(material => `<div>• ${material}</div>`).join('')}
        </div>
    </div>
    
    <div class="section">
        <h3>✏️ Step-by-Step Drawing Instructions</h3>
        ${visualAid.blackboardSteps.map((step, index) => `
            <div class="step">
                <span class="step-number">Step ${index + 1}:</span>
                ${step}
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h3>📝 Teaching Tips</h3>
        ${visualAid.instructions.map(instruction => `<div style="margin-bottom: 8px;">• ${instruction}</div>`).join('')}
    </div>
    
    <div class="footer">
        <p><strong>Generated by Sahayak AI - Empowering Indian Education</strong></p>
        <p>Visual Learning Tools for Multi-Grade Classrooms</p>
    </div>
</body>
</html>`;
  };

  const useExamplePrompt = (prompt: string) => {
    setDescription(prompt);
  };

  return (
    <div className="min-h-screen page-bg">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal text-gray-900 mb-3">
            Visual Aids Designer
          </h1>
          <p className="text-gray-600 text-base leading-relaxed max-w-3xl">
            Generate simple line drawings and charts that can be easily replicated on a blackboard. 
            Perfect for explaining complex concepts with visual clarity in multi-grade classrooms.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-8">
            <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center">
              <FiEdit3 className="w-5 h-5 mr-2 text-blue-600" />
              Describe Your Visual Aid
            </h2>
            
            <div className="space-y-6">
              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you want to visualize?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the concept you want to draw (e.g., 'Water cycle showing evaporation, condensation, and precipitation')"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Settings Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {subjectOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {gradeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
                  <select
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value as 'simple' | 'medium' | 'detailed')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="simple">Simple (Basic shapes)</option>
                    <option value="medium">Medium (Some details)</option>
                    <option value="detailed">Detailed (Rich diagram)</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <div>
                <button
                  onClick={generateVisualAid}
                  disabled={isGenerating || !description.trim()}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-base ${
                    isGenerating || !description.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating visual aid...</span>
                    </>
                  ) : (
                    <>
                      <FiPenTool className="w-4 h-4" />
                      <span>Generate Visual Aid</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Example Prompts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-8">
            <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center">
              <FiBookOpen className="w-5 h-5 mr-2 text-green-600" />
              Example Ideas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => useExamplePrompt(prompt)}
                  className="text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generated Visual Aids */}
        {generatedAids.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8">
              <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center">
                <FiTarget className="w-5 h-5 mr-2 text-orange-600" />
                Generated Visual Aids ({generatedAids.length})
              </h2>
              
              <div className="space-y-8">
                {generatedAids.map((aid) => (
                  <div key={aid.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900 text-lg">{aid.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{aid.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Subject: {aid.subject}</span>
                          <span>Complexity: {aid.complexity}</span>
                          <span>Concepts: {aid.concepts.length}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        aid.complexity === 'simple' ? 'bg-green-100 text-green-700' :
                        aid.complexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {aid.complexity}
                      </span>
                    </div>
                    
                    {/* SVG Display */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-4">
                      <div className="text-center">
                        <div dangerouslySetInnerHTML={{ __html: aid.svgContent }} />
                      </div>
                    </div>

                    {/* Key Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Key Concepts</h4>
                        <div className="space-y-1">
                          {aid.concepts.map((concept, index) => (
                            <div key={index} className="text-sm text-gray-600">• {concept}</div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Materials Needed</h4>
                        <div className="space-y-1">
                          {aid.materials.map((material, index) => (
                            <div key={index} className="text-sm text-gray-600">• {material}</div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Blackboard Steps Preview */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Drawing Steps (Preview)</h4>
                      <div className="space-y-2">
                        {aid.blackboardSteps.slice(0, 3).map((step, index) => (
                          <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <span className="font-medium text-blue-600">Step {index + 1}:</span> {step}
                          </div>
                        ))}
                        {aid.blackboardSteps.length > 3 && (
                          <div className="text-xs text-gray-500">+ {aid.blackboardSteps.length - 3} more steps</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Download Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => downloadSVG(aid)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiDownload className="w-4 h-4" />
                        <span>Download SVG</span>
                      </button>
                      
                      <button
                        onClick={() => downloadInstructions(aid)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FiDownload className="w-4 h-4" />
                        <span>Download Instructions</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualAids; 