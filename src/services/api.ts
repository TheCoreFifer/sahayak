// API Service for Sahayak - Genkit Integration
const API_BASE_URL = 'http://localhost:3001';

// Types for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Content Generation Types
interface ContentRequest {
  language: string;
  grade: string;
  subject: string;
  location: string;
  description: string;
}

interface ContentResponse {
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

// Question Generation Types
interface QuestionRequest {
  text: string;
  gradeLevel: string;
  numQuestions: number;
  questionTypes: string[];
  skills: string[];
  customSkills?: string[];
}

interface GeneratedQuestion {
  id: string;
  type: 'multipleChoice' | 'openEnded' | 'shortResponse' | 'extendedResponse';
  question: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  skill: string;
  difficulty: 'easy' | 'medium' | 'hard';
  culturalContext: string;
}

interface QuestionResponse {
  questions: GeneratedQuestion[];
  totalCount: number;
}

// Knowledge Base Types
interface KnowledgeRequest {
  question: string;
  grade: string;
  language: string;
  context?: string;
}

interface KnowledgeResponse {
  answer: string;
  examples: string[];
  analogy: string;
  keyPoints: string[];
  activity: string;
}

// Visual Aids Types
interface VisualAidsRequest {
  concept: string;
  gradeLevel: string;
  complexity: 'simple' | 'medium' | 'complex';
  medium: 'blackboard' | 'paper' | 'digital';
}

interface VisualAidsResponse {
  title: string;
  description: string;
  stepByStepInstructions: string[];
  materials: string[];
  teachingTips: string[];
}

// Smart Worksheets Types
interface WorksheetRequest {
  imageData: string;
  targetGrades: string[];
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface GeneratedWorksheet {
  gradeLevel: string;
  title: string;
  instructions: string;
  exercises: Array<{
    id: string;
    type: 'fillInBlank' | 'multipleChoice' | 'shortAnswer' | 'matching' | 'truefalse';
    question: string;
    options?: string[];
    correctAnswer: string;
    points: number;
  }>;
  answerKey: string[];
}

interface WorksheetResponse {
  worksheets: GeneratedWorksheet[];
}

// Generic API request function
async function apiRequest<T>(endpoint: string, data?: any): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<T> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }

    return result.data!;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Content Generation API
export async function generateContent(request: ContentRequest): Promise<ContentResponse> {
  return apiRequest<ContentResponse>('/api/generate-content', request);
}

// Question Generation API
export async function generateQuestions(request: QuestionRequest): Promise<QuestionResponse> {
  return apiRequest<QuestionResponse>('/api/generate-questions', request);
}

// Knowledge Base API
export async function askQuestion(request: KnowledgeRequest): Promise<KnowledgeResponse> {
  return apiRequest<KnowledgeResponse>('/api/ask-question', request);
}

// Visual Aids API
export async function generateVisualAid(request: VisualAidsRequest): Promise<VisualAidsResponse> {
  return apiRequest<VisualAidsResponse>('/api/generate-visual-aid', request);
}

// Smart Worksheets API
export async function generateWorksheets(request: WorksheetRequest): Promise<WorksheetResponse> {
  return apiRequest<WorksheetResponse>('/api/generate-worksheets', request);
}

// Generate Quick Examples API
export async function generateQuickExamples(request: {
  language: string;
  grade: string;
  subject: string;
  location: string;
}): Promise<{
  examples: Array<{
    title: string;
    prompt: string;
    rationale: string;
  }>;
}> {
  return apiRequest<{
    examples: Array<{
      title: string;
      prompt: string;
      rationale: string;
    }>;
  }>('/api/generate-examples', request);
}

// Health Check API
export async function healthCheck(): Promise<{
  status: string;
  timestamp: string;
  version: string;
  flows: string[];
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

// File upload for question generation
export const uploadFile = async (file: File): Promise<{
  success: boolean;
  data: {
    extractedText: string;
    fileName: string;
    fileSize: number;
    charactersExtracted: number;
  };
  duration: string;
  note?: string;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/api/process-file`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`File upload failed: ${response.statusText}`);
  }
  
  return await response.json();
};

// Download functions for questions
export const downloadQuestionsPDF = (questions: GeneratedQuestion[], metadata: { gradeLevel: string, subject?: string }) => {
  const htmlContent = generateCompletePDFHTML(questions, metadata);
  
  // Create a new window for PDF generation
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  }
};

export const downloadQuestionsWord = async (questions: GeneratedQuestion[], metadata: { gradeLevel: string, subject?: string }) => {
  try {
    console.log('📄 Starting Word document generation with RTF format...');
    
    // Generate RTF content (compatible with all Word processors)
    const rtfContent = generateRTFContent(questions, metadata);
    const blob = new Blob([rtfContent], { 
      type: 'application/rtf' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sahayak-questions-grade-${metadata.gradeLevel.replace(/\s+/g, '-').toLowerCase()}.rtf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ RTF document generated successfully - opens in Word/Office');
    
  } catch (error) {
    console.error('❌ Word document generation failed:', error);
    alert('Word document generation failed. Please try PDF download instead.');
  }
};

const generateQuestionHTML = (questions: GeneratedQuestion[], metadata: { gradeLevel: string, subject?: string }): string => {
  const currentDate = new Date().toLocaleDateString('en-IN');
  
  let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sahayak AI - Generated Questions</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 20px;
            background-color: #f9f9f9;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4f46e5;
            margin: 0;
            font-size: 28px;
        }
        .metadata {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .instructions {
            background: #e0f2fe;
            padding: 15px;
            border-left: 4px solid #0284c7;
            margin-bottom: 25px;
        }
        .question-block {
            background: #fafafa;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-left: 4px solid #059669;
        }
        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .question-number {
            font-weight: bold;
            color: #059669;
            font-size: 18px;
        }
        .question-points {
            background: #059669;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        .question-meta {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .question-text {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 15px;
            color: #1f2937;
        }
        .options {
            margin-left: 20px;
        }
        .option {
            margin-bottom: 8px;
            padding: 8px;
            background: white;
            border-radius: 4px;
        }
        .answer-space {
            margin-top: 15px;
            padding: 15px;
            background: white;
            border: 2px dashed #d1d5db;
            border-radius: 4px;
            min-height: 60px;
        }
        .answer-key {
            page-break-before: always;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 3px solid #dc2626;
        }
        .answer-key h2 {
            color: #dc2626;
            text-align: center;
            margin-bottom: 20px;
        }
        .answer-item {
            background: #fef2f2;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            border-left: 4px solid #dc2626;
        }
        .cultural-context {
            background: #fff7ed;
            padding: 10px;
            margin-top: 10px;
            border-radius: 4px;
            font-style: italic;
            color: #9a3412;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
        }
        @media print {
            body { background-color: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SAHAYAK AI - GENERATED QUESTIONS</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Empowering Indian Education</p>
        </div>
        
        <div class="metadata">
            <p><strong>Date:</strong> ${currentDate}</p>
            <p><strong>Grade Level:</strong> ${metadata.gradeLevel}</p>
            <p><strong>Subject:</strong> ${metadata.subject || 'General'}</p>
            <p><strong>Total Questions:</strong> ${questions.length}</p>
        </div>
        
        <div class="instructions">
            <h3>Instructions for Students:</h3>
            <ul>
                <li>Read each question carefully</li>
                <li>Choose the best answer for multiple choice questions</li>
                <li>Write complete sentences for open-ended questions</li>
                <li>Show your work where applicable</li>
            </ul>
        </div>
        
        <div class="questions-section">`;

  questions.forEach((question, index) => {
    htmlContent += `
            <div class="question-block">
                <div class="question-header">
                    <div class="question-number">Question ${index + 1}</div>
                    <div class="question-points">${question.points} ${question.points === 1 ? 'point' : 'points'}</div>
                </div>
                
                <div class="question-meta">
                    <strong>Skill:</strong> ${question.skill} | <strong>Difficulty:</strong> ${question.difficulty}
                </div>
                
                <div class="question-text">${question.question}</div>`;
    
    if (question.options && question.options.length > 0) {
      htmlContent += `<div class="options">`;
      question.options.forEach((option, optIndex) => {
        htmlContent += `<div class="option"><strong>${String.fromCharCode(65 + optIndex)}.</strong> ${option}</div>`;
      });
      htmlContent += `</div>`;
    }
    
    if (question.type === 'openEnded' || question.type === 'extendedResponse') {
      htmlContent += `<div class="answer-space">
                          <strong>Answer:</strong><br>
                          <div style="margin-top: 10px; min-height: 40px; border-bottom: 1px solid #d1d5db; margin-bottom: 10px;"></div>
                          <div style="min-height: 40px; border-bottom: 1px solid #d1d5db; margin-bottom: 10px;"></div>
                          <div style="min-height: 40px; border-bottom: 1px solid #d1d5db;"></div>
                      </div>`;
    }
    
    htmlContent += `</div>`;
  });

  htmlContent += `
        </div>
        
        <div class="answer-key">
            <h2>ANSWER KEY (For Teachers Only)</h2>`;

  questions.forEach((question, index) => {
    htmlContent += `<div class="answer-item">
                        <strong>${index + 1}.</strong> `;
    if (question.correctAnswer) {
      htmlContent += `${question.correctAnswer}`;
    } else {
      htmlContent += 'Open-ended response - check for understanding of key concepts';
    }
    
    if (question.culturalContext) {
      htmlContent += `<div class="cultural-context">
                          <strong>Cultural Context:</strong> ${question.culturalContext}
                      </div>`;
    }
    htmlContent += `</div>`;
  });
  
  htmlContent += `
        </div>
        
        <div class="footer">
            <p><strong>Generated by Sahayak AI - Empowering Indian Education</strong></p>
            <p>Visit: <a href="https://sahayak-ai.com" target="_blank">https://sahayak-ai.com</a> for more teaching resources</p>
        </div>
    </div>
</body>
</html>`;

  return htmlContent;
};

const generateCompletePDFHTML = (questions: GeneratedQuestion[], metadata: { gradeLevel: string, subject?: string }): string => {
  const currentDate = new Date().toLocaleDateString('en-IN');
  
  let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sahayak AI - Generated Questions & Answers</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 20px;
            background-color: white;
            color: #000;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 24pt;
            font-weight: bold;
        }
        .metadata {
            background: #f8f9fa;
            padding: 15px;
            border: 1px solid #dee2e6;
            margin-bottom: 25px;
        }
        .metadata p {
            margin: 5px 0;
            font-size: 12pt;
        }
        .instructions {
            background: #e3f2fd;
            padding: 15px;
            border-left: 4px solid #2196f3;
            margin-bottom: 25px;
        }
        .instructions h3 {
            margin-top: 0;
            color: #1565c0;
        }
        .question-block {
            background: #fafafa;
            padding: 20px;
            margin-bottom: 25px;
            border: 1px solid #e0e0e0;
            border-left: 4px solid #4caf50;
            page-break-inside: avoid;
        }
        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .question-number {
            font-weight: bold;
            color: #4caf50;
            font-size: 14pt;
        }
        .question-points {
            background: #4caf50;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10pt;
        }
        .question-meta {
            color: #666;
            font-size: 10pt;
            margin-bottom: 10px;
        }
        .question-text {
            font-size: 12pt;
            font-weight: 500;
            margin-bottom: 15px;
            color: #000;
        }
        .options {
            margin-left: 20px;
            margin-bottom: 15px;
        }
        .option {
            margin-bottom: 8px;
            padding: 5px;
            font-size: 11pt;
        }
        .correct-option {
            background: #e8f5e8;
            border: 1px solid #4caf50;
            border-radius: 4px;
            font-weight: bold;
            color: #2e7d32;
        }
        .answer-section {
            margin-top: 20px;
            padding: 15px;
            background: #fff3e0;
            border: 1px solid #ffb74d;
            border-radius: 4px;
        }
        .answer-label {
            font-weight: bold;
            color: #e65100;
            font-size: 12pt;
            margin-bottom: 8px;
        }
        .answer-text {
            color: #000;
            font-size: 11pt;
            margin-bottom: 10px;
        }
        .cultural-context {
            background: #fffbeb;
            padding: 10px;
            margin-top: 10px;
            border-radius: 4px;
            font-style: italic;
            color: #92400e;
            font-size: 10pt;
        }
        .answer-space {
            margin-top: 15px;
            padding: 15px;
            border: 2px dashed #ccc;
            min-height: 60px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            color: #666;
            font-size: 10pt;
        }
        @media print {
            body { 
                background-color: white !important; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .container { 
                box-shadow: none; 
                margin: 0;
                padding: 20px;
            }
            .question-block {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SAHAYAK AI - QUESTIONS & ANSWERS</h1>
            <p>Complete Question Paper with Integrated Answers</p>
        </div>
        
        <div class="metadata">
            <p><strong>Date:</strong> ${currentDate}</p>
            <p><strong>Grade Level:</strong> ${metadata.gradeLevel}</p>
            <p><strong>Subject:</strong> ${metadata.subject || 'General'}</p>
            <p><strong>Total Questions:</strong> ${questions.length}</p>
            <p><strong>Document Type:</strong> Questions with Integrated Answers</p>
        </div>
        
        <div class="instructions">
            <h3>Instructions for Teachers:</h3>
            <ul>
                <li>Each question includes the correct answer highlighted below</li>
                <li>For multiple choice: correct option is marked with green background</li>
                <li>Cultural context provided for enhanced teaching</li>
                <li>Use this as a teaching aid and assessment tool</li>
            </ul>
        </div>
        
        <div class="questions-section">`;

  questions.forEach((question, index) => {
    htmlContent += `
            <div class="question-block">
                <div class="question-header">
                    <div class="question-number">Question ${index + 1}</div>
                    <div class="question-points">${question.points} ${question.points === 1 ? 'point' : 'points'}</div>
                </div>
                
                <div class="question-meta">
                    <strong>Skill:</strong> ${question.skill} | <strong>Difficulty:</strong> ${question.difficulty}
                </div>
                
                <div class="question-text">${question.question}</div>`;
    
    if (question.options && question.options.length > 0) {
      htmlContent += `<div class="options">`;
      question.options.forEach((option, optIndex) => {
        const isCorrect = question.correctAnswer && option === question.correctAnswer;
        htmlContent += `<div class="option ${isCorrect ? 'correct-option' : ''}">
                          <strong>${String.fromCharCode(65 + optIndex)}.</strong> ${option}
                          ${isCorrect ? ' ✓ (CORRECT ANSWER)' : ''}
                        </div>`;
      });
      htmlContent += `</div>`;
    }
    
    // Add answer section for every question
    htmlContent += `<div class="answer-section">
                        <div class="answer-label">✓ CORRECT ANSWER:</div>
                        <div class="answer-text">`;
    
    if (question.correctAnswer) {
      htmlContent += `<strong>${question.correctAnswer}</strong>`;
    } else {
      htmlContent += '<strong>Open-ended response:</strong> Look for understanding of key concepts, proper reasoning, and clear explanation.';
    }
    
    htmlContent += `</div>`;
    
    if (question.culturalContext) {
      htmlContent += `<div class="cultural-context">
                          <strong>Cultural Context:</strong> ${question.culturalContext}
                      </div>`;
    }
    
    htmlContent += `</div>`;
    
    // Add answer space for open-ended questions
    if (question.type === 'openEnded' || question.type === 'extendedResponse') {
      htmlContent += `<div class="answer-space">
                          <strong>Student Answer Space:</strong><br>
                          <div style="margin-top: 10px; min-height: 40px; border-bottom: 1px solid #ccc; margin-bottom: 10px;"></div>
                          <div style="min-height: 40px; border-bottom: 1px solid #ccc; margin-bottom: 10px;"></div>
                          <div style="min-height: 40px; border-bottom: 1px solid #ccc;"></div>
                      </div>`;
    }
    
    htmlContent += `</div>`;
  });
  
  htmlContent += `
        </div>
        
        <div class="footer">
            <p><strong>Generated by Sahayak AI - Empowering Indian Education</strong></p>
            <p>Professional Teaching Resources for Multi-Grade Classrooms</p>
        </div>
    </div>
</body>
</html>`;

  return htmlContent;
};

const generateRTFContent = (questions: GeneratedQuestion[], metadata: { gradeLevel: string, subject?: string }): string => {
  const currentDate = new Date().toLocaleDateString('en-IN');
  
  let rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24
{\\b\\fs32 SAHAYAK AI - GENERATED QUESTIONS}\\par
{\\fs20 Complete Question Paper with Integrated Answers}\\par\\par

{\\b Date:} ${currentDate}\\par
{\\b Grade Level:} ${metadata.gradeLevel}\\par
{\\b Subject:} ${metadata.subject || 'General'}\\par
{\\b Total Questions:} ${questions.length}\\par\\par

{\\b\\fs24 Instructions for Teachers:}\\par
• Each question includes the correct answer highlighted below\\par
• For multiple choice: correct option is marked with indicators\\par
• Cultural context provided for enhanced teaching\\par
• Use this as a teaching aid and assessment tool\\par\\par
`;

  questions.forEach((question, index) => {
    rtfContent += `{\\b\\fs22 Question ${index + 1}} [{\\b ${question.points} ${question.points === 1 ? 'point' : 'points'}}]\\par
{\\i Skill: ${question.skill} | Difficulty: ${question.difficulty}}\\par\\par
${question.question}\\par\\par`;
    
    if (question.options && question.options.length > 0) {
      question.options.forEach((option, optIndex) => {
        const isCorrect = question.correctAnswer && option === question.correctAnswer;
        rtfContent += `{\\b ${String.fromCharCode(65 + optIndex)}.} ${option}${isCorrect ? ' {\\b ✓ (CORRECT ANSWER)}' : ''}\\par`;
      });
      rtfContent += '\\par';
    }
    
    // Add answer section
    rtfContent += `{\\b\\highlight2 ✓ CORRECT ANSWER:}\\par
{\\b ${question.correctAnswer || 'Open-ended response: Look for understanding of key concepts, proper reasoning, and clear explanation.'}}\\par`;
    
    if (question.culturalContext) {
      rtfContent += `{\\i Cultural Context: ${question.culturalContext}}\\par`;
    }
    
    // Add answer space for open-ended questions
    if (question.type === 'openEnded' || question.type === 'extendedResponse') {
      rtfContent += '\\par{\\b Student Answer Space:}\\par';
      rtfContent += '_'.repeat(60) + '\\par';
      rtfContent += '_'.repeat(60) + '\\par';
      rtfContent += '_'.repeat(60) + '\\par';
    }
    
    rtfContent += '\\par\\par';
  });
  
  rtfContent += `\\par\\par
{\\b Generated by Sahayak AI - Empowering Indian Education}\\par
Professional Teaching Resources for Multi-Grade Classrooms\\par
}`;

  return rtfContent;
};

// Export types for use in components
export type {
  ContentRequest,
  ContentResponse,
  QuestionRequest,
  QuestionResponse,
  GeneratedQuestion,
  KnowledgeRequest,
  KnowledgeResponse,
  VisualAidsRequest,
  VisualAidsResponse,
  WorksheetRequest,
  WorksheetResponse,
  GeneratedWorksheet
};

// API Service object for legacy compatibility
export const apiService = {
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await healthCheck();
      return { success: true, message: 'Connected to AI service' };
    } catch {
      return { success: false, message: 'Failed to connect to AI service' };
    }
  },
  generateContent,
  generateQuestions,
  askQuestion,
  generateVisualAid,
  generateWorksheets,
  generateQuickExamples,
  healthCheck
}; 