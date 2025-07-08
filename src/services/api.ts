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