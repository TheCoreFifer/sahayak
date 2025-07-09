// API Service for Sahayak - Genkit Integration
export const API_BASE_URL = 'http://localhost:3001/api';

export interface ContentRequest {
    description: string;
    language: string;
    grade: string;
    subject: string;
    location: string;
}

export interface GeneratedQuestion {
    id: string;
    type: string;
    question: string;
    options?: string[];
    correctAnswer?: string;
    points: number;
    skill: string;
    difficulty: string;
    culturalContext?: string;
}

export interface QuestionRequest {
    text: string;
    gradeLevel: string;
    numQuestions: string;
    questionTypes: string[];
    skills: string[];
}

export interface ReadingPassageRequest {
    subject: string;
    grade: string;
    topic?: string;
    language?: string;
    culturalContext?: string;
    length?: 'short' | 'medium' | 'long';
}

export interface AudioAssessmentRequest {
    audioData: string;
    originalText: string;
    studentInfo: {
        name: string;
        grade: string;
        subject: string;
        topic: string;
    };
}

export interface AssessmentResult {
    accuracy: number;
    fluencyScore: number;
    wordsPerMinute: number;
    pronunciationHotspots: string[];
    positiveFeedback: string;
    actionableTip: string;
    detailedAnalysis: {
        hesitations: { word: string; count: number }[];
        mispronunciations: { word: string; correctSound: string }[];
        pacing: {
            overallPace: 'slow' | 'good' | 'fast';
            sectionsOfConcern: { text: string; issue: string }[];
        };
        expressiveness: {
            score: number;
            feedback: string;
        };
    };
    progress?: {
        previousScore?: number;
        improvement?: string;
        trend?: 'improving' | 'steady' | 'needs_attention';
    };
}

/**
 * Analyzes an uploaded textbook image.
 * @param imageData - The base64 encoded image data.
 * @param fileType - The MIME type of the image file.
 * @returns The analysis result from the API.
 */
export const analyzeTextbookImage = async (imageData: string, fileType?: string) => {
  const response = await fetch(`${API_BASE_URL}/analyze-textbook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      imageData: imageData.split(',')[1],
      fileType: fileType || 'image/png'
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
    throw new Error(errorData.error || 'Failed to analyze image');
  }
  return response.json();
};

/**
 * Generates culturally relevant content.
 * @param requestData - The content request data with description, language, grade, subject, location.
 * @returns The generated content.
 */
export const generateContent = async (requestData: ContentRequest) => {
    const response = await fetch(`${API_BASE_URL}/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            description: requestData.description,
            language: requestData.language,
            grade: requestData.grade,
            subject: requestData.subject,
            location: requestData.location
        }),
    });
    if (!response.ok) throw new Error('Failed to generate content');
    const result = await response.json();
    return result.data; // Return the actual content data, not the wrapper
};

/**
 * Generates differentiated worksheets.
 * @param analyzedContent - The content analysis from the textbook image.
 * @param grade - The target grade for the worksheet.
 * @returns The generated worksheet content.
 */
export const generateWorksheet = async (analyzedContent: any, grade: string) => {
    const response = await fetch(`${API_BASE_URL}/generate-worksheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            analyzedContent,
            targetGrades: [grade],
            questionTypes: ['mixed']
        }),
    });
    if (!response.ok) throw new Error(`Failed to generate worksheet for ${grade}`);
    return response.json();
};

/**
 * Generates a visual aid drawing.
 * @param analyzedContent - The content analysis from the textbook image.
 * @returns The generated visual aid content.
 */
export const generateVisualAid = async (analyzedContent: any) => {
    const response = await fetch(`${API_BASE_URL}/generate-visual-aid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            description: `A simple blackboard drawing to explain ${analyzedContent.topic}.`
        }),
    });
    if (!response.ok) throw new Error('Failed to generate visual aid');
    return response.json();
};

/**
 * Generates a list of dynamic example prompts.
 * @param params - The parameters for generating examples.
 * @returns A list of example prompts.
 */
export const generateQuickExamples = async (params: { language: string, grade: string, subject: string, location: string }) => {
    const response = await fetch(`${API_BASE_URL}/generate-examples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error('Failed to generate examples');
    return response.json();
}

/**
 * Checks the health of the API.
 * @returns The health status of the API.
 */
export const healthCheck = async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
}

/**
 * Generates questions based on provided text and criteria.
 * @param request - The question generation request parameters.
 * @returns A list of generated questions.
 */
export const generateQuestions = async (request: any) => {
    const response = await fetch(`${API_BASE_URL}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to generate questions');
    return response.json();
};

/**
 * Uploads a file for processing.
 * @param file - The file to upload.
 * @returns The result of the file processing.
 */
export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/process-file`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error('File upload failed');
    return response.json();
};

/**
 * Generates a weekly lesson plan based on analyzed content.
 * @param analyzedContent - The content analysis from the textbook image.
 * @param targetGrades - Array of target grades for the lesson plan.
 * @param numberOfWeeks - Number of weeks to generate the plan for.
 * @returns The generated weekly lesson plan.
 */
export const generateWeeklyPlan = async (analyzedContent: any, targetGrades: string[], numberOfWeeks: number = 1) => {
    const response = await fetch(`${API_BASE_URL}/generate-weekly-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            analyzedContent,
            targetGrades,
            numberOfWeeks
        }),
    });
    if (!response.ok) throw new Error('Failed to generate weekly plan');
    return response.json();
}; 

/**
 * Generates a reading passage based on subject, grade, and other parameters.
 * @param grade - The target grade level
 * @param subject - The subject area
 * @returns A generated passage suitable for reading assessment
 */
export const generateReadingPassage = async (grade: string, subject: string) => {
  try {
    console.log('📝 Sending passage request:', { grade, subject });
    const response = await fetch(`${API_BASE_URL}/generate-passage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grade,
        subject,
        language: 'English',
        culturalContext: 'Indian educational context'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ Server error:', errorData || response.statusText);
      throw new Error(errorData?.error || `Server error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Received passage:', data);
    
    if (!data.success || !data.passage) {
      console.error('❌ Invalid response format:', data);
      throw new Error('Invalid response from server');
    }

    return data.passage;
  } catch (error) {
    console.error('❌ Error in generateReadingPassage:', error);
    throw error;
  }
};

export const analyzeAudioRecording = async (audioBlob: Blob, originalText: string, readingTime: number) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('originalText', originalText);
    formData.append('studentInfo', JSON.stringify({
      name: 'Student', // Will be filled in by the component
      grade: '1', // Will be filled in by the component
      subject: 'English' // Will be filled in by the component
    }));

    const response = await fetch(`${API_BASE_URL}/api/analyze-audio`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to analyze audio recording');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing audio recording:', error);
    throw error;
  }
};

/**
 * Saves assessment results to Google Sheets for tracking progress
 * @param studentName - Name of the student
 * @param result - The assessment result to save
 * @returns Success status and sheet URL
 */
export const saveToGoogleSheets = async (studentName: string, result: AssessmentResult) => {
    const response = await fetch(`${API_BASE_URL}/save-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, result }),
    });
    if (!response.ok) throw new Error('Failed to save to Google Sheets');
    return response.json();
};

/**
 * Generates a detailed assessment report as a Google Doc
 * @param studentName - Name of the student
 * @param result - The assessment result to include in the report
 * @returns Success status and document URL
 */
export const generateGoogleDoc = async (studentName: string, result: AssessmentResult) => {
    const response = await fetch(`${API_BASE_URL}/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, result }),
    });
    if (!response.ok) throw new Error('Failed to generate Google Doc');
    return response.json();
}; 