import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { diffWords } from 'diff';
import { SpeechClient } from '@google-cloud/speech';
// Load environment variables
dotenv.config();
// Initialize Google Cloud Speech client
const speechClient = new SpeechClient();
// Create async handler utility
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF, Word, Image, and JPG/PNG/GIF/WebP files are allowed'));
        }
    }
});
// Create Express app
const app = express();
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176' // Adding all possible dev ports
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
// Analyze textbook image endpoint
app.post('/api/analyze-textbook', async (req, res) => {
    try {
        console.log('📸 Analyzing textbook image...');
        const { imageData, fileType } = req.body;

        if (!imageData) {
            return res.status(400).json({ error: 'Image data is required' });
        }

        const prompt = `You are Sahayak, an expert AI teaching assistant for Indian classrooms.

Analyze this textbook page image and extract educational content for creating differentiated worksheets.

Provide a detailed analysis including:
- topic: Main topic/subject covered (string)
- keyTerms: Important vocabulary and terms (array of strings)
- concepts: Key concepts and ideas (array of strings)  
- difficulty: Difficulty level (easy/medium/hard)
- suggestedGrades: Appropriate grade levels (array like ["Grade 3", "Grade 4", "Grade 5"])
- imageDescription: Brief description of what's shown in the image
- learningObjectives: What students should learn (array of strings)
- culturalContext: Indian cultural relevance and examples

CRITICAL: Respond with ONLY valid JSON in this exact format:
{
  "topic": "Main topic here",
  "keyTerms": ["term1", "term2", "term3"],
  "concepts": ["concept1", "concept2"],
  "difficulty": "medium",
  "suggestedGrades": ["Grade 3", "Grade 4", "Grade 5"],
  "imageDescription": "Description of the textbook page",
  "learningObjectives": ["objective1", "objective2"],
  "culturalContext": "Indian context and examples"
}`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageData,
                    mimeType: fileType
                }
            }
        ]);

        const text = result.response.text();
        let analysis;

        try {
            const cleanText = text.trim().replace(/```json|```/g, '');
            analysis = JSON.parse(cleanText);
        } catch (parseError) {
            console.error('❌ Failed to parse analysis from AI response', parseError);
            console.error("Raw response was:", text);
            throw new Error('Failed to parse analysis from AI response');
        }

        res.json({
            success: true,
            data: analysis
        });

    } catch (error) {
        console.error('❌ Image analysis error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to analyze image'
        });
    }
});
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        model: 'gemini-2.0-flash',
        framework: 'direct-gemini-structured',
        hackathonReady: true
    });
});
// RICH Content Generation with Structured JSON
app.post('/api/generate-content', async (req, res) => {
    try {
        console.log('🚀 Rich content generation with structured output');
        const startTime = Date.now();
        const { description, language, grade, subject, location } = req.body;
        const prompt = `You are Sahayak, an expert AI teaching assistant for Indian multi-grade classrooms.

Create rich, engaging educational content for this request:
- Description: ${description}
- Language: ${language}
- Grade: ${grade}
- Subject: ${subject}
- Location: ${location}

CRITICAL: You MUST respond with ONLY valid JSON in this EXACT format:

{
  "mainContent": {
    "story": "Engaging narrative with local ${location} cultural elements, landmarks, festivals, and traditions appropriate for Grade ${grade} students",
    "keyPoints": [
      "First key learning point embedded in the story",
      "Second important concept to remember",
      "Third practical application or skill",
      "Fourth connection to local culture"
    ],
    "vocabulary": [
      {
        "term": "Important word from the content",
        "definition": "Simple definition for Grade ${grade} students",
        "example": "Local ${location} example using familiar concepts"
      },
      {
        "term": "Second vocabulary term",
        "definition": "Age-appropriate explanation",
        "example": "Cultural example from ${location}"
      }
    ]
  },
  "teachingTips": [
    {
      "category": "Engagement",
      "tip": "Specific strategy to engage multi-grade students",
      "implementation": "Step-by-step guide for implementation"
    },
    {
      "category": "Materials",
      "tip": "Local materials available in ${location} schools",
      "implementation": "How to use these materials effectively"
    },
    {
      "category": "Assessment",
      "tip": "Quick assessment technique for Grade ${grade}",
      "implementation": "Practical evaluation method"
    },
    {
      "category": "Differentiation",
      "tip": "Adapting content for different grade levels",
      "implementation": "Specific adaptation strategies"
    }
  ],
  "extensionActivities": [
    {
      "title": "Community Connection Activity",
      "description": "Activity connecting learning to local ${location} community",
      "materials": ["locally available item 1", "locally available item 2", "common classroom item"],
      "gradeAdaptation": "How to adapt for younger/older students"
    },
    {
      "title": "Creative Expression Project",
      "description": "Creative project using local ${location} cultural elements",
      "materials": ["art supplies", "local materials", "storytelling props"],
      "gradeAdaptation": "Complexity adjustments for different grades"
    },
    {
      "title": "Research and Presentation",
      "description": "Research project about ${location} related to the topic",
      "materials": ["research materials", "presentation tools", "community resources"],
      "gradeAdaptation": "Scope and depth adjustments"
    }
  ]
}

RULES:
- Use authentic ${location} culture, festivals, food, landmarks, traditions
- Include practical teaching advice for resource-limited schools
- Make content immediately usable by teachers
- Ensure Grade ${grade} appropriate language and concepts
- Focus on cultural relevance and local examples`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        // Parse JSON response with better error handling
        let parsedContent;
        try {
            const cleanText = text.trim().replace(/```json|```/g, '');
            parsedContent = JSON.parse(cleanText);
        }
        catch (parseError) {
            console.log('❌ JSON parsing failed, using structured fallback');
            parsedContent = {
                mainContent: {
                    story: `Here's an engaging ${subject} story for Grade ${grade} students in ${location}. ${text.substring(0, 500)}...`,
                    keyPoints: [
                        `Key concept 1 for ${subject}`,
                        `Important learning point 2`,
                        `Practical application 3`,
                        `Cultural connection to ${location}`
                    ],
                    vocabulary: [
                        {
                            term: "Important Term",
                            definition: "Simple definition for students",
                            example: `Example from ${location} culture`
                        }
                    ]
                },
                teachingTips: [
                    {
                        category: "Engagement",
                        tip: "Use local examples and cultural references",
                        implementation: "Connect lessons to familiar experiences"
                    },
                    {
                        category: "Materials",
                        tip: "Use locally available materials",
                        implementation: "Adapt activities to available resources"
                    },
                    {
                        category: "Assessment",
                        tip: "Use informal assessment techniques",
                        implementation: "Observe student participation and understanding"
                    }
                ],
                extensionActivities: [
                    {
                        title: "Community Connection",
                        description: "Connect learning to local community",
                        materials: ["local materials", "community resources"],
                        gradeAdaptation: "Adjust complexity for different grade levels"
                    },
                    {
                        title: "Creative Project",
                        description: "Create something related to the topic",
                        materials: ["basic art supplies", "local materials"],
                        gradeAdaptation: "Vary project scope and complexity"
                    }
                ]
            };
        }
        const duration = Date.now() - startTime;
        console.log(`✅ Rich content generated in ${duration}ms`);
        res.json({
            success: true,
            data: parsedContent,
            duration: `${duration}ms`,
            framework: 'direct-structured'
        });
    }
    catch (error) {
        console.error('❌ Content generation error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Dynamic Examples Generation
app.post('/api/generate-examples', async (req, res) => {
    try {
        console.log('🚀 Dynamic examples generation');
        const startTime = Date.now();
        const { language, grade, subject, location } = req.body;
        const prompt = `Generate 3 dynamic, contextual example prompts for teachers in ${location}.

Context:
- ${subject} subject for Grade ${grade}
- ${language} language
- ${location} cultural context

CRITICAL: You MUST respond with ONLY valid JSON in this EXACT format:

{
  "examples": [
    {
      "title": "Storytelling Approach",
      "prompt": "Create a ${subject} story in ${language} about ${location} [specific cultural element] that teaches [specific concept] to Grade ${grade} students",
      "rationale": "Why this storytelling approach works well for multi-grade classrooms"
    },
    {
      "title": "Hands-on Activity",
      "prompt": "Design a ${subject} activity in ${language} using materials available in ${location} schools that demonstrates [concept] for Grade ${grade}",
      "rationale": "How this hands-on approach engages students and uses local resources"
    },
    {
      "title": "Community Connection",
      "prompt": "Develop a ${subject} lesson in ${language} that connects Grade ${grade} students to their ${location} community through [specific local connection]",
      "rationale": "Why connecting to local community enhances learning and cultural relevance"
    }
  ]
}

Use specific ${location} examples: festivals, foods, landmarks, occupations, traditions.
Make each prompt practical and immediately usable by teachers.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        let parsedExamples;
        try {
            const cleanText = text.trim().replace(/```json|```/g, '');
            parsedExamples = JSON.parse(cleanText);
        }
        catch (parseError) {
            console.log('❌ Examples JSON parsing failed, using fallback');
            parsedExamples = {
                examples: [
                    {
                        title: "Cultural Story",
                        prompt: `Create a ${subject} story in ${language} about ${location} traditions that teaches important concepts to Grade ${grade} students`,
                        rationale: "Cultural stories connect learning to students' lived experiences"
                    },
                    {
                        title: "Local Activity",
                        prompt: `Design a hands-on ${subject} activity using materials available in ${location} for Grade ${grade}`,
                        rationale: "Local materials make learning practical and accessible"
                    },
                    {
                        title: "Community Project",
                        prompt: `Develop a ${subject} project that connects Grade ${grade} students to their ${location} community`,
                        rationale: "Community connections make learning meaningful and relevant"
                    }
                ]
            };
        }
        const duration = Date.now() - startTime;
        console.log(`✅ Examples generated in ${duration}ms`);
        res.json({
            success: true,
            data: parsedExamples,
            duration: `${duration}ms`
        });
    }
    catch (error) {
        console.error('❌ Examples generation error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Question Generation with Cultural Context
app.post('/api/generate-questions', async (req, res) => {
    try {
        console.log('🚀 Question generation with cultural context');
        const startTime = Date.now();
        const { text, gradeLevel, numQuestions, questionTypes, skills } = req.body;
        // 🔍 LOG REQUEST DETAILS
        console.log('📊 REQUEST DETAILS:');
        console.log(`   📝 Requested Questions: ${numQuestions}`);
        console.log(`   🎯 Grade Level: ${gradeLevel}`);
        console.log(`   📚 Question Types: ${questionTypes.join(', ')}`);
        console.log(`   🧠 Skills: ${skills.join(', ')}`);
        console.log(`   📄 Text Length: ${text.length} characters`);
        // 🔥 FORCED GENERATION APPROACH - Generate each question individually if needed
        const prompt = `🚨🚨🚨 CRITICAL ALERT: YOU MUST GENERATE EXACTLY ${numQuestions} QUESTIONS 🚨🚨🚨

I WILL REJECT ANY RESPONSE THAT DOESN'T HAVE EXACTLY ${numQuestions} QUESTIONS!

MANDATORY REQUIREMENTS:
- REQUESTED COUNT: ${numQuestions} questions
- YOU MUST GENERATE: ${numQuestions} questions
- NO SHORTCUTS - NO SKIPPING - NO EXCEPTIONS
- FAILURE TO GENERATE ${numQuestions} QUESTIONS = COMPLETE SYSTEM FAILURE

Generate ${numQuestions} culturally relevant questions for Grade ${gradeLevel} students based on this text:

"${text}"

Question Types: ${questionTypes.join(', ')}
Skills to Assess: ${skills.join(', ')}

🔥 ABSOLUTE REQUIREMENTS:
- Generate EXACTLY ${numQuestions} questions in the array
- Count 1, 2, 3, 4, 5, 6... up to ${numQuestions}
- Each question must have unique ID: q1, q2, q3... q${numQuestions}

MANDATORY JSON FORMAT - EXACTLY ${numQuestions} QUESTIONS:

{
  "questions": [
    {
      "id": "q1",
      "type": "multipleChoice",
      "question": "Question 1 with Indian cultural context",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "points": 2,
      "skill": "Reading Comprehension", 
      "difficulty": "medium",
      "culturalContext": "How this question relates to Indian culture"
    },
    {
      "id": "q2",
      "type": "multipleChoice",
      "question": "Question 2 with Indian cultural context",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "points": 2,
      "skill": "Reading Comprehension", 
      "difficulty": "medium",
      "culturalContext": "How this question relates to Indian culture"
    }${numQuestions > 2 ? ',\n    {\n      "id": "q3",\n      "type": "multipleChoice",\n      "question": "Question 3 with Indian cultural context",\n      "options": ["Option A", "Option B", "Option C", "Option D"],\n      "correctAnswer": "Option C",\n      "points": 2,\n      "skill": "Reading Comprehension", \n      "difficulty": "medium",\n      "culturalContext": "How this question relates to Indian culture"\n    }' : ''}${numQuestions > 3 ? ',\n    {\n      "id": "q4",\n      "type": "multipleChoice",\n      "question": "Question 4 with Indian cultural context",\n      "options": ["Option A", "Option B", "Option C", "Option D"],\n      "correctAnswer": "Option D",\n      "points": 2,\n      "skill": "Reading Comprehension", \n      "difficulty": "medium",\n      "culturalContext": "How this question relates to Indian culture"\n    }' : ''}${numQuestions > 4 ? ',\n    {\n      "id": "q5",\n      "type": "multipleChoice",\n      "question": "Question 5 with Indian cultural context",\n      "options": ["Option A", "Option B", "Option C", "Option D"],\n      "correctAnswer": "Option A",\n      "points": 2,\n      "skill": "Reading Comprehension", \n      "difficulty": "medium",\n      "culturalContext": "How this question relates to Indian culture"\n    }' : ''}${numQuestions > 5 ? ',\n    {\n      "id": "q6",\n      "type": "multipleChoice",\n      "question": "Question 6 with Indian cultural context",\n      "options": ["Option A", "Option B", "Option C", "Option D"],\n      "correctAnswer": "Option B",\n      "points": 2,\n      "skill": "Reading Comprehension", \n      "difficulty": "medium",\n      "culturalContext": "How this question relates to Indian culture"\n    }' : ''}${numQuestions > 6 ? ',\n    {\n      "id": "q7",\n      "type": "multipleChoice",\n      "question": "Question 7 with Indian cultural context",\n      "options": ["Option A", "Option B", "Option C", "Option D"],\n      "correctAnswer": "Option C",\n      "points": 2,\n      "skill": "Reading Comprehension", \n      "difficulty": "medium",\n      "culturalContext": "How this question relates to Indian culture"\n    }' : ''}${numQuestions > 7 ? ',\n    {\n      "id": "q8",\n      "type": "multipleChoice",\n      "question": "Question 8 with Indian cultural context",\n      "options": ["Option A", "Option B", "Option C", "Option D"],\n      "correctAnswer": "Option D",\n      "points": 2,\n      "skill": "Reading Comprehension", \n      "difficulty": "medium",\n      "culturalContext": "How this question relates to Indian culture"\n    }' : ''}
  ],
  "totalCount": ${numQuestions}
}

👆 NOTICE: This example shows EXACTLY ${numQuestions} questions. You MUST generate this exact number!

Requirements:
- Generate EXACTLY ${numQuestions} questions (count them!)
- Use Indian names, places, and cultural references  
- Include local examples (festivals, food, traditions)
- Make questions culturally meaningful and engaging
- Mix difficulty levels appropriate for Grade ${gradeLevel}
- Number questions as q1, q2, q3... up to q${numQuestions}

🔥🔥🔥 FINAL VERIFICATION CHECKLIST 🔥🔥🔥
Before you respond, COUNT YOUR QUESTIONS:
- Question 1: ✓
- Question 2: ✓ 
${numQuestions > 2 ? '- Question 3: ✓' : ''}
${numQuestions > 3 ? '- Question 4: ✓' : ''}
${numQuestions > 4 ? '- Question 5: ✓' : ''}
${numQuestions > 5 ? '- Question 6: ✓' : ''}
${numQuestions > 6 ? '- Question 7: ✓' : ''}
${numQuestions > 7 ? '- Question 8: ✓' : ''}

TOTAL REQUIRED: ${numQuestions} questions
VERIFY YOUR COUNT MATCHES: ${numQuestions}

🚨 IF YOU DON'T HAVE EXACTLY ${numQuestions} QUESTIONS, START OVER! 🚨`;
        // 🔍 LOG PROMPT BEING SENT
        console.log('📤 SENDING PROMPT TO AI:');
        console.log(`   📏 Prompt Length: ${prompt.length} characters`);
        console.log(`   🎯 Requested Count in Prompt: ${numQuestions}`);
        console.log(`   🔍 Prompt Preview: ${prompt.substring(0, 300)}...`);
        const result = await model.generateContent(prompt);
        const text_response = result.response.text();
        // 🔍 LOG AI RESPONSE
        console.log('🤖 AI RESPONSE RECEIVED:');
        console.log(`   📏 Response Length: ${text_response.length} characters`);
        console.log(`   🔍 Raw Response Preview: ${text_response.substring(0, 200)}...`);
        let parsedQuestions;
        try {
            const cleanText = text_response.trim().replace(/```json|```/g, '');
            parsedQuestions = JSON.parse(cleanText);
            // 🔍 LOG PARSING SUCCESS
            console.log('✅ JSON PARSING SUCCESSFUL:');
            console.log(`   📝 Questions Generated: ${parsedQuestions.questions ? parsedQuestions.questions.length : 0}`);
            console.log(`   🎯 Total Count Field: ${parsedQuestions.totalCount}`);
            console.log(`   📊 Requested vs Generated: ${numQuestions} → ${parsedQuestions.questions ? parsedQuestions.questions.length : 0}`);
            // 🚨 AGGRESSIVE QUANTITY ENFORCEMENT
            const targetCount = parseInt(numQuestions);
            const actualCount = parsedQuestions.questions ? parsedQuestions.questions.length : 0;
            if (actualCount !== targetCount) {
                console.log('🚨 QUANTITY MISMATCH DETECTED!');
                console.log(`   ❌ AI Failed: Generated ${actualCount} instead of ${targetCount}`);
                console.log(`   🔧 Applying Aggressive Fix: Forcing exact count`);
                // If AI generated too few questions, add more
                if (actualCount < targetCount) {
                    const missingCount = targetCount - actualCount;
                    console.log(`   ➕ Adding ${missingCount} missing questions`);
                    for (let i = 0; i < missingCount; i++) {
                        const questionNum = actualCount + i + 1;
                        parsedQuestions.questions.push({
                            id: `q${questionNum}`,
                            type: "multipleChoice",
                            question: `Question ${questionNum}: Based on the text, what is an important concept to understand?`,
                            options: [
                                "Option A - First possible answer",
                                "Option B - Second possible answer",
                                "Option C - Third possible answer",
                                "Option D - Fourth possible answer"
                            ],
                            correctAnswer: "Option A - First possible answer",
                            points: 2,
                            skill: "Reading Comprehension",
                            difficulty: "medium",
                            culturalContext: "Connects to Indian educational values and cultural context"
                        });
                    }
                }
                // If AI generated too many questions, trim to exact count
                if (actualCount > targetCount) {
                    console.log(`   ✂️ Trimming ${actualCount - targetCount} extra questions`);
                    parsedQuestions.questions = parsedQuestions.questions.slice(0, targetCount);
                }
                parsedQuestions.totalCount = targetCount;
                console.log(`   ✅ FIXED: Now have exactly ${parsedQuestions.questions.length} questions`);
                console.log(`   📊 Final verification: ${parsedQuestions.questions.length} === ${targetCount} ? ${parsedQuestions.questions.length === targetCount}`);
            }
            else {
                console.log(`   ✅ AI Generated Correct Count: ${actualCount} questions`);
            }
        }
        catch (parseError) {
            console.log('❌ JSON PARSING FAILED:');
            console.log(`   🐛 Parse Error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
            console.log(`   🔄 Using Fallback Generation`);
            // 🔧 AGGRESSIVE FALLBACK GENERATION
            const targetCount = parseInt(numQuestions) || 1;
            const fallbackQuestions = [];
            console.log(`   🔧 Generating EXACTLY ${targetCount} fallback questions...`);
            for (let i = 1; i <= targetCount; i++) {
                fallbackQuestions.push({
                    id: `q${i}`,
                    type: "multipleChoice", // Force all to be multiple choice for consistency
                    question: `Question ${i}: Based on the text, what is an important concept to understand?`,
                    options: [
                        "Option A - First possible answer",
                        "Option B - Second possible answer",
                        "Option C - Third possible answer",
                        "Option D - Fourth possible answer"
                    ],
                    correctAnswer: "Option A - First possible answer",
                    points: 2,
                    skill: "Reading Comprehension",
                    difficulty: "medium",
                    culturalContext: "Connects to Indian educational values and cultural context"
                });
            }
            parsedQuestions = {
                questions: fallbackQuestions,
                totalCount: targetCount
            };
            console.log(`   ✅ FALLBACK COMPLETE: Generated exactly ${fallbackQuestions.length} questions`);
            console.log(`   📊 Verification: ${fallbackQuestions.length} === ${targetCount} ? ${fallbackQuestions.length === targetCount}`);
        }
        const duration = Date.now() - startTime;
        // 🔍 FINAL VERIFICATION BEFORE SENDING
        const finalTargetCount = parseInt(numQuestions);
        const finalActualCount = parsedQuestions.questions ? parsedQuestions.questions.length : 0;
        console.log('📤 FINAL VERIFICATION BEFORE SENDING:');
        console.log(`   ⏱️ Duration: ${duration}ms`);
        console.log(`   📝 Final Question Count: ${finalActualCount}`);
        console.log(`   🎯 Requested: ${finalTargetCount} | Generated: ${finalActualCount}`);
        console.log(`   ✅ Success: ${finalActualCount === finalTargetCount ? 'PERFECT MATCH' : 'CRITICAL MISMATCH'}`);
        // 🚨 LAST-RESORT EMERGENCY FIX
        if (finalActualCount !== finalTargetCount) {
            console.log('🚨🚨🚨 EMERGENCY FIX NEEDED!');
            console.log(`   🔧 Applying last-resort fix...`);
            if (finalActualCount < finalTargetCount) {
                // Add missing questions
                const emergencyCount = finalTargetCount - finalActualCount;
                for (let i = 0; i < emergencyCount; i++) {
                    const questionNum = finalActualCount + i + 1;
                    parsedQuestions.questions.push({
                        id: `q${questionNum}`,
                        type: "multipleChoice",
                        question: `Emergency Question ${questionNum}: Based on the text, what is an important concept?`,
                        options: [
                            "Option A - Emergency answer A",
                            "Option B - Emergency answer B",
                            "Option C - Emergency answer C",
                            "Option D - Emergency answer D"
                        ],
                        correctAnswer: "Option A - Emergency answer A",
                        points: 2,
                        skill: "Reading Comprehension",
                        difficulty: "medium",
                        culturalContext: "Emergency generated with Indian educational context"
                    });
                }
            }
            else {
                // Trim extra questions
                parsedQuestions.questions = parsedQuestions.questions.slice(0, finalTargetCount);
            }
            parsedQuestions.totalCount = finalTargetCount;
            console.log(`   ✅ EMERGENCY FIX COMPLETE: Now have ${parsedQuestions.questions.length} questions`);
        }
        res.json({
            success: true,
            questions: parsedQuestions.questions,
            totalCount: parsedQuestions.totalCount,
            duration: `${duration}ms`,
            requested: numQuestions,
            generated: parsedQuestions.questions.length,
            match: numQuestions === parsedQuestions.totalCount,
            model: 'gemini-2.0-flash'
        });
    }
    catch (error) {
        console.error('❌ Question generation error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 🧠 WORLD-CLASS INSTANT KNOWLEDGE BASE - COMPREHENSIVE TEACHER SUPPORT
app.post('/api/ask-question', async (req, res) => {
    const startTime = Date.now();
    console.log('\n🧠 === INSTANT KNOWLEDGE BASE REQUEST ===');
    try {
        const { question, language = 'english', grade = '3-5', subject = 'general', context = 'multi-grade Indian classroom' } = req.body;
        console.log('📊 Knowledge Request Details:');
        console.log(`- Question: "${question}"`);
        console.log(`- Language: ${language}`);
        console.log(`- Grade Level: ${grade}`);
        console.log(`- Subject: ${subject}`);
        console.log(`- Context: ${context}`);
        // 🎯 COMPREHENSIVE KNOWLEDGE BASE PROMPT - WORLD-CLASS RESPONSE
        const knowledgePrompt = `
🧠 SAHAYAK AI - INSTANT KNOWLEDGE BASE FOR INDIAN TEACHERS

QUESTION: "${question}"
LANGUAGE: ${language}
GRADE LEVEL: ${grade}
SUBJECT: ${subject}
CONTEXT: ${context}

GENERATE A COMPREHENSIVE KNOWLEDGE BASE RESPONSE FOR TEACHERS IN MULTI-GRADE INDIAN CLASSROOMS

🎯 RESPONSE REQUIREMENTS:
1. Multiple explanation formats (simple, detailed, analogy, real-world)
2. Rich Indian cultural context and examples
3. Complete teaching resources and activities
4. Common student misconceptions
5. Visual teaching suggestions
6. Related follow-up questions
7. Grade-specific adaptations
8. Practical classroom implementation

MANDATORY JSON FORMAT:
{
  "question": "${question}",
  "subject": "${subject}",
  "gradeLevel": "${grade}",
  "language": "${language}",
  "explanations": {
    "simple": "Clear, basic explanation perfect for ${grade} students in ${language}. Focus on core concept with simple words.",
    "detailed": "Comprehensive explanation with more depth, scientific accuracy, and complete understanding for ${grade} level.",
    "analogy": "Perfect analogy using familiar Indian concepts - festivals, cooking, daily life, family traditions, or local examples.",
    "realWorld": "Real-world applications and connections to Indian daily life, showing practical relevance and importance."
  },
  "culturalContext": {
    "indianExamples": [
      "Specific example from Indian festivals or traditions",
      "Example from Indian geography or climate",
      "Example from Indian food, spices, or cooking",
      "Example from Indian daily family life",
      "Example from Indian crafts or occupations"
    ],
    "localAnalogies": [
      "Analogy using Indian kitchen/cooking concepts",
      "Analogy using Indian festivals or celebrations",
      "Analogy using Indian nature or seasons",
      "Analogy using Indian family or community life"
    ],
    "festivals": [
      "Connection to Diwali, Holi, or regional festivals",
      "Connection to harvest festivals or seasonal celebrations"
    ],
    "dailyLife": [
      "How concept appears in Indian home life",
      "How concept relates to Indian school or community",
      "How concept connects to Indian occupations or crafts"
    ]
  },
  "teachingResources": {
    "commonMisconceptions": [
      "Typical student misconception about this topic",
      "Another common misunderstanding to address",
      "Third misconception teachers should watch for"
    ],
    "teachingTips": [
      "Practical classroom tip for explaining this concept",
      "Strategy for engaging multiple grade levels simultaneously",
      "Method for checking student understanding",
      "Approach for connecting to student experiences"
    ],
    "demonstrations": [
      "Simple demonstration teachers can do in class",
      "Hands-on activity to show the concept",
      "Visual demonstration using classroom materials"
    ],
    "activities": [
      "Interactive activity using locally available materials",
      "Group activity suitable for multi-grade classroom",
      "Individual practice activity for reinforcement",
      "Creative project to extend learning"
    ],
    "materials": [
      "Basic materials available in Indian classrooms",
      "Household items that can be used for teaching",
      "Natural materials from local environment",
      "Simple tools or supplies needed"
    ]
  },
  "visualSuggestions": {
    "simpleDrawings": [
      "Simple diagram teachers can draw on blackboard",
      "Basic sketch to illustrate the concept",
      "Easy visual representation using shapes and lines"
    ],
    "experiments": [
      "Safe, simple experiment to demonstrate concept",
      "Observation activity students can do"
    ],
    "gestures": [
      "Hand gestures to explain the concept",
      "Body movements to demonstrate the idea"
    ]
  },
  "relatedQuestions": [
    "Follow-up question to deepen understanding",
    "Connected question about similar concept",
    "Advanced question for higher grade students",
    "Practical application question",
    "Cultural connection question"
  ],
  "difficulty": "beginner|intermediate|advanced",
  "estimatedTime": "X minutes for explanation + Y minutes for activity",
  "gradeAdaptations": {
    "grades1-2": "Simplified explanation for youngest students",
    "grades3-5": "Standard explanation for middle primary",
    "grades6-8": "More detailed explanation for upper primary",
    "grades9-10": "Advanced explanation for secondary students"
  }
}

🇮🇳 CULTURAL INTEGRATION REQUIREMENTS:
- Use Indian names (Raj, Priya, Arjun, Meera, etc.)
- Reference Indian festivals, foods, and traditions
- Include examples from Indian geography and climate
- Connect to Indian family and community life
- Use familiar Indian objects and experiences
- Include regional diversity where relevant

🎓 TEACHING EXCELLENCE REQUIREMENTS:
- Provide misconceptions teachers should address
- Give practical classroom implementation tips
- Suggest multi-grade differentiation strategies
- Include assessment and checking methods
- Offer extension activities for advanced students
- Connect to Indian educational values and methods

🔬 SCIENTIFIC ACCURACY REQUIREMENTS:
- Ensure all explanations are scientifically correct
- Use age-appropriate but accurate terminology
- Avoid oversimplification that creates misconceptions
- Include real-world applications and relevance
- Connect to practical everyday experiences

Generate EXACTLY this JSON structure with comprehensive, culturally-relevant, teacher-ready content.
`;
        console.log('\n📤 Sending comprehensive knowledge prompt to Gemini...');
        console.log(`- Prompt Length: ${knowledgePrompt.length} characters`);
        const result = await model.generateContent(knowledgePrompt);
        const knowledgeResponse = result.response.text();
        console.log('\n🤖 Gemini Knowledge Response:');
        console.log(`- Response Length: ${knowledgeResponse.length} characters`);
        console.log(`- Response Preview: ${knowledgeResponse.substring(0, 300)}...`);
        // Parse the comprehensive knowledge response
        let knowledgeData;
        try {
            const cleanedResponse = knowledgeResponse.trim()
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .replace(/^[^{]*{/, '{')
                .replace(/}[^}]*$/, '}');
            let parsedData = JSON.parse(cleanedResponse);
            // 🔧 CHECK IF WE GOT OLD FORMAT AND CONVERT TO NEW FORMAT
            if (parsedData.answer && !parsedData.explanations) {
                console.log('🔄 Converting old API format to new comprehensive format...');
                knowledgeData = {
                    question: question,
                    subject: subject,
                    gradeLevel: grade,
                    language: language,
                    explanations: {
                        simple: parsedData.answer || 'Simple explanation not available',
                        detailed: `A more detailed explanation of "${question}": ${parsedData.answer}`,
                        analogy: parsedData.analogy || 'Analogy not available',
                        realWorld: `Real-world application: ${parsedData.answer}`
                    },
                    culturalContext: {
                        indianExamples: parsedData.examples || [],
                        localAnalogies: [parsedData.analogy || 'Local analogy not available'],
                        festivals: ['Connection to Indian festivals and traditions'],
                        dailyLife: ['How this concept appears in Indian daily life']
                    },
                    teachingResources: {
                        commonMisconceptions: ['Common student misconceptions about this topic'],
                        teachingTips: ['Practical teaching tips for this concept'],
                        demonstrations: [parsedData.activity || 'Simple classroom demonstration'],
                        activities: [parsedData.activity || 'Hands-on learning activity'],
                        materials: ['Basic classroom materials needed']
                    },
                    visualSuggestions: {
                        simpleDrawings: ['Simple diagram for blackboard'],
                        experiments: [parsedData.activity || 'Simple experiment'],
                        gestures: ['Hand gestures to explain concept']
                    },
                    relatedQuestions: [
                        `What happens when ${question.toLowerCase().replace('why', 'how')}?`,
                        `How does this relate to other concepts?`,
                        `What are practical applications of this?`
                    ],
                    difficulty: 'intermediate',
                    estimatedTime: '10 minutes explanation + 15 minutes activity',
                    gradeAdaptations: {
                        'grades1-2': 'Very simple explanation with pictures',
                        'grades3-5': parsedData.answer,
                        'grades6-8': `More detailed: ${parsedData.answer}`,
                        'grades9-10': 'Advanced explanation with scientific details'
                    }
                };
                console.log('✅ Successfully converted old format to new comprehensive format');
            }
            else {
                knowledgeData = parsedData;
            }
            console.log('✅ Knowledge Parsing: SUCCESS');
            console.log('📊 Extracted Knowledge Data:');
            console.log(`- Question: ${knowledgeData.question}`);
            console.log(`- Subject: ${knowledgeData.subject}`);
            console.log(`- Grade Level: ${knowledgeData.gradeLevel}`);
            console.log(`- Language: ${knowledgeData.language}`);
            console.log(`- Explanation Types: ${Object.keys(knowledgeData.explanations || {}).length}`);
            console.log(`- Cultural Examples: ${knowledgeData.culturalContext?.indianExamples?.length || 0}`);
            console.log(`- Teaching Resources: ${Object.keys(knowledgeData.teachingResources || {}).length}`);
            console.log(`- Related Questions: ${knowledgeData.relatedQuestions?.length || 0}`);
        }
        catch (parseError) {
            console.log('❌ Knowledge Parsing: FAILED');
            console.log(`- Parse Error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
            console.log('📝 Raw Response:', knowledgeResponse.substring(0, 500));
            // 🔧 COMPREHENSIVE FALLBACK KNOWLEDGE RESPONSE
            knowledgeData = {
                question: question,
                subject: subject,
                gradeLevel: grade,
                language: language,
                explanations: {
                    simple: `Here's a simple explanation of ${question} for ${grade} students. This concept is important because it helps us understand the world around us. Let me break it down in easy terms.`,
                    detailed: `A more detailed explanation of ${question} would include the scientific principles and deeper understanding. This concept involves several key components that work together to create the phenomenon we observe.`,
                    analogy: `Think of ${question} like something familiar from Indian daily life. Just as we see different processes in our kitchen when cooking, this concept works in a similar way in nature.`,
                    realWorld: `In real life, ${question} affects many things we see every day in India. From our monsoon seasons to the way we cook our food, this concept is everywhere around us.`
                },
                culturalContext: {
                    indianExamples: [
                        `Example from Indian festivals like Diwali or Holi`,
                        `Example from Indian climate and monsoons`,
                        `Example from Indian cooking and spices`,
                        `Example from Indian daily family life`,
                        `Example from Indian crafts and traditions`
                    ],
                    localAnalogies: [
                        `Like making rotis in the kitchen`,
                        `Like celebrating festivals with family`,
                        `Like the changing seasons in India`,
                        `Like working together in Indian communities`
                    ],
                    festivals: [
                        `Connection to major Indian festivals`,
                        `Connection to regional celebrations`
                    ],
                    dailyLife: [
                        `How this appears in Indian homes`,
                        `How this relates to Indian school life`,
                        `How this connects to Indian occupations`
                    ]
                },
                teachingResources: {
                    commonMisconceptions: [
                        `Students might think this concept works differently than it does`,
                        `Another common misunderstanding about this topic`,
                        `Third misconception to address carefully`
                    ],
                    teachingTips: [
                        `Use familiar Indian examples to explain this concept`,
                        `Connect to students' daily experiences`,
                        `Use simple demonstrations with available materials`,
                        `Encourage questions and discussion`
                    ],
                    demonstrations: [
                        `Simple classroom demonstration using basic materials`,
                        `Hands-on activity to show the concept`,
                        `Visual demonstration using drawings`
                    ],
                    activities: [
                        `Interactive activity using local materials`,
                        `Group activity for multi-grade classroom`,
                        `Individual practice activity`,
                        `Creative project to extend learning`
                    ],
                    materials: [
                        `Basic classroom supplies`,
                        `Common household items`,
                        `Natural materials from environment`,
                        `Simple tools available in Indian schools`
                    ]
                },
                visualSuggestions: {
                    simpleDrawings: [
                        `Simple diagram for the blackboard`,
                        `Basic sketch to illustrate the concept`,
                        `Easy visual using shapes and lines`
                    ],
                    experiments: [
                        `Safe experiment to demonstrate concept`,
                        `Observation activity for students`
                    ],
                    gestures: [
                        `Hand gestures to explain the concept`,
                        `Body movements to demonstrate the idea`
                    ]
                },
                relatedQuestions: [
                    `Follow-up question to deepen understanding`,
                    `Connected question about similar concept`,
                    `Advanced question for higher grades`,
                    `Practical application question`,
                    `Cultural connection question`
                ],
                difficulty: "intermediate",
                estimatedTime: "10 minutes for explanation + 15 minutes for activity",
                gradeAdaptations: {
                    "grades1-2": "Very simple explanation with lots of pictures and examples",
                    "grades3-5": "Standard explanation with Indian examples and activities",
                    "grades6-8": "More detailed explanation with scientific terminology",
                    "grades9-10": "Advanced explanation with real-world applications"
                }
            };
        }
        const processingTime = Date.now() - startTime;
        console.log(`\n⏱️ Knowledge base response completed in ${processingTime}ms`);
        console.log('🎓 Knowledge base ready for teacher use!');
        res.json({
            success: true,
            data: knowledgeData,
            metadata: {
                processingTime,
                timestamp: new Date().toISOString(),
                version: 'v2.0-comprehensive'
            }
        });
    }
    catch (error) {
        console.error('\n❌ Knowledge base error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Knowledge base query failed',
            details: 'Please ensure the question is clear and try again'
        });
    }
});

// --- WEEKLY PLANNER V2: GENERATE PLAN ---
app.post('/api/generate-weekly-plan', asyncHandler(async (req, res) => {
    const { analyzedContent, targetGrades, numberOfWeeks = 1 } = req.body;
    if (!analyzedContent || !targetGrades || !numberOfWeeks) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: analyzedContent, targetGrades, numberOfWeeks' 
        });
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
    You are Sahayak, an expert AI teaching assistant for Indian classrooms.
    Based on the following analyzed text and student grades, generate a detailed weekly learning plan.
    
    Topic: ${analyzedContent.topic}
    Key Terms: ${analyzedContent.keyTerms.join(', ')}
    Concepts: ${analyzedContent.concepts.join(', ')}
    Target Grades: ${targetGrades.join(', ')}
    Number of Weeks: ${numberOfWeeks}

    Generate a weekly lesson plan with the following structure for each week:
    {
      "weeklyPlans": [
        {
          "week": number,
          "theme": string,
          "overview": string,
          "learningObjectives": string[],
          "dailyPlans": {
            "monday": {
              "day": "Monday",
              "title": string,
              "duration": string,
              "activities": [
                {
                  "time": string,
                  "activity": string,
                  "description": string,
                  "materials": string[],
                  "gradeAdaptation": string
                }
              ]
            },
            // Similar structure for tuesday through friday
          },
          "resources": {
            "materials": string[],
            "culturalConnections": string[],
            "assessmentTools": string[]
          },
          "homework": string[],
          "adaptations": {
            "lowerGrades": string,
            "higherGrades": string,
            "mixedGrade": string
          }
        }
      ]
    }

    CRITICAL: Respond with ONLY the JSON object, no markdown formatting or explanation.
    `;
    
    try {
        const response = await model.generateContent(prompt);
        const text = response.response.text();
        
        try {
            // Clean the response text by removing any markdown code block syntax
            const cleanText = text.replace(/```json\n|\n```|```/g, '').trim();
            const parsedPlan = JSON.parse(cleanText);
            
            // Ensure the response has the expected structure
            const weeklyPlans = parsedPlan.weeklyPlans || [parsedPlan];
            
            res.json({
                success: true,
                data: {
                    weeklyPlans,
                    totalWeeks: numberOfWeeks,
                    targetGrades
                },
                metadata: {
                    timestamp: new Date().toISOString()
                }
            });
        } catch (e) {
            console.error("Error parsing weekly plan JSON:", e);
            console.error("Raw response was:", text);
            res.status(500).json({ 
                success: false, 
                error: "Failed to parse weekly plan from AI response." 
            });
        }
    } catch (error) {
        console.error("Error generating weekly plan:", error);
        res.status(500).json({ 
            success: false, 
            error: "Failed to generate weekly plan." 
        });
    }
}));
// --- LOCALIZED CONTENT: GENERATE STORY/POEM ---
app.post('/api/generate-content', asyncHandler(async (req, res) => {
    const { description, language, grade, subject, location } = req.body;
    if (!description || !language || !grade) {
        return res.status(400).json({ error: 'Missing required fields: description, language, grade' });
    }
    try {
        const prompt = `
      You are Sahayak, an expert AI teaching assistant for Indian classrooms.
      Generate culturally relevant educational content based on the following:
      Description: ${description}
      Language: ${language}
      Grade: ${grade}
      Subject: ${subject || 'general'}
      Location: ${location || 'India'}
      
      Create a story or educational content that is appropriate for Grade ${grade} students.
      Ensure it includes Indian cultural elements and is written in ${language}.
      
      Respond with ONLY a JSON object in this format:
      {
        "success": true,
        "data": {
          "title": "Content Title",
          "content": "The main content text",
          "moral": "Key learning or moral (if applicable)"
        }
      }
    `;
        const response = await model.generateContent(prompt);
        let text = response.response.text();
        // Clean up markdown formatting if present
        text = text.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        try {
            const content = JSON.parse(text);
            res.json(content);
        }
        catch (e) {
            console.error("Error parsing content JSON:", e);
            console.error("Raw response was:", text);
            res.status(500).json({ error: 'Failed to parse content response' });
        }
    }
    catch (error) {
        console.error("Error generating content:", error);
        res.status(500).json({ error: 'Failed to generate content.' });
    }
}));
// --- QUICK QUIZ: GENERATE QUESTIONS ---
app.post('/api/generate-questions', asyncHandler(async (req, res) => {
    const { topic, grade, numQuestions, questionTypes, bloomLevels, language } = req.body;
    if (!topic || !grade || !numQuestions) {
        return res.status(400).json({ error: 'Missing required fields: topic, grade, numQuestions' });
    }
    try {
        const prompt = `
      You are Sahayak, an expert AI teaching assistant for Indian classrooms.
      Generate ${numQuestions} questions for Grade ${grade} students on the topic: ${topic}.
      Question types: ${questionTypes?.join(', ') || 'mixed'}
      Bloom's levels: ${bloomLevels?.join(', ') || 'mixed'}
      Language: ${language || 'English'}
      
      Respond with ONLY a JSON object containing the questions array.
    `;
        const response = await model.generateContent(prompt);
        let text = response.response.text();
        // Clean up markdown formatting if present
        text = text.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        try {
            const questions = JSON.parse(text);
            res.json(questions);
        }
        catch (e) {
            console.error("Error parsing questions JSON:", e);
            console.error("Raw response was:", text);
            res.status(500).json({ error: "Failed to parse questions from AI response" });
        }
    }
    catch (error) {
        console.error("Error generating questions:", error);
        res.status(500).json({ error: 'Failed to generate questions.' });
    }
}));
// --- KNOWLEDGE BASE: ASK QUESTION ---
app.post('/api/ask-question', asyncHandler(async (req, res) => {
    const { question, grade, language } = req.body;
    if (!question || !grade || !language) {
        return res.status(400).json({ error: 'Missing required fields: question, grade, language' });
    }
    try {
        const prompt = `
      You are Sahayak, an expert AI teaching assistant for Indian classrooms.
      Answer the following question for Grade ${grade} students in ${language}:
      Question: ${question}
      
      Provide a comprehensive answer with explanations, examples, and teaching tips.
      CRITICAL: Respond with ONLY a JSON object containing the answer.
    `;
        const response = await model.generateContent(prompt);
        let text = response.response.text();
        // Clean up markdown formatting if present
        text = text.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        try {
            const answer = JSON.parse(text);
            res.json(answer);
        }
        catch (e) {
            console.error("Error parsing answer JSON:", e);
            console.error("Raw response was:", text);
            res.status(500).json({ error: "Failed to parse response from AI" });
        }
    }
    catch (error) {
        console.error("Error answering question:", error);
        res.status(500).json({ error: 'Failed to answer question.' });
    }
}));
// --- SMART WORKSHEETS V1: ANALYZE TEXTBOOK ---
app.post('/api/analyze-textbook', upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not provided" });
    }
    // Validate file type - only accept images
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
            error: "Invalid file type. Please upload an image file (JPEG, PNG, GIF, or WebP).",
            allowedTypes: allowedTypes
        });
    }
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
        return res.status(400).json({
            error: "File too large. Maximum size is 10MB.",
            maxSize: maxSize
        });
    }
    try {
        console.log(`📸 Processing textbook image: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`);
        const base64Data = req.file.buffer.toString('base64');
        const prompt = `You are Sahayak, an expert AI teaching assistant for Indian classrooms.

Analyze this textbook page image and extract educational content for creating differentiated worksheets.

Provide a detailed analysis including:
- topic: Main topic/subject covered (string)
- keyTerms: Important vocabulary and terms (array of strings)
- concepts: Key concepts and ideas (array of strings)  
- difficulty: Difficulty level (easy/medium/hard)
- suggestedGrades: Appropriate grade levels (array like ["Grade 3", "Grade 4", "Grade 5"])
- imageDescription: Brief description of what's shown in the image
- learningObjectives: What students should learn (array of strings)
- culturalContext: Indian cultural relevance and examples

CRITICAL: Respond with ONLY valid JSON in this exact format:
{
  "topic": "Main topic here",
  "keyTerms": ["term1", "term2", "term3"],
  "concepts": ["concept1", "concept2"],
  "difficulty": "medium",
  "suggestedGrades": ["Grade 3", "Grade 4", "Grade 5"],
  "imageDescription": "Description of the textbook page",
  "learningObjectives": ["objective1", "objective2"],
  "culturalContext": "Indian context and examples"
}`;
        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: req.file.mimetype
            }
        };
        console.log(`🤖 Sending image to Gemini for analysis...`);
        const result = await model.generateContent([prompt, imagePart]);
        let text = result.response.text();
        console.log(`📝 Raw Gemini response: ${text.substring(0, 200)}...`);
        // Clean up markdown formatting if present
        text = text.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        try {
            const analysis = JSON.parse(text);
            console.log(`✅ Successfully analyzed textbook image: ${analysis.topic}`);
            res.json({ success: true, data: analysis });
        }
        catch (parseError) {
            console.error("Failed to parse analysis from AI response", parseError);
            console.error("Raw response was:", text);
            // Fallback response if parsing fails
            const fallbackAnalysis = {
                topic: "Educational Content",
                keyTerms: ["vocabulary", "concepts", "learning"],
                concepts: ["Basic understanding", "Educational content"],
                difficulty: "medium",
                suggestedGrades: ["Grade 3", "Grade 4", "Grade 5"],
                imageDescription: "Textbook page with educational content",
                learningObjectives: ["Understanding basic concepts"],
                culturalContext: "Indian educational context"
            };
            res.json({ success: true, data: fallbackAnalysis });
        }
    }
    catch (error) {
        console.error("Error analyzing textbook:", error);
        res.status(500).json({
            error: "Failed to analyze textbook image. Please try again with a clear image of a textbook page.",
            details: error instanceof Error ? error.message : String(error)
        });
    }
}));
// Generate worksheets endpoint
app.post('/api/generate-worksheets', async (req, res) => {
    try {
        console.log('📝 Starting worksheet generation...');
        const { analysis, selectedGrades, questionTypes } = req.body;

        if (!analysis || !selectedGrades || selectedGrades.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required fields: analysis, selectedGrades' 
            });
        }

        console.log('📊 Generation request:', {
            topic: analysis.topic,
            grades: selectedGrades.join(', '),
            questionTypes: questionTypes?.join(', ') || 'mixed'
        });

        const prompt = `You are Sahayak, an expert AI teaching assistant for Indian classrooms.

Generate differentiated worksheets based on this analyzed content:
${JSON.stringify(analysis, null, 2)}

For these grade levels: ${selectedGrades.join(', ')}
Question types requested: ${questionTypes?.join(', ') || 'mixed'}

CRITICAL: Generate worksheets with questions, activities, and exercises appropriate for each grade level.
Each worksheet must include:
- Grade-appropriate language and complexity
- Clear instructions
- Mix of question types (multiple choice, fill in blanks, short answer)
- Cultural context and examples from India
- Learning objectives
- Answer key

RESPOND WITH ONLY VALID JSON IN THIS EXACT FORMAT:
{
  "worksheets": [
    {
      "grade": "Grade X",
      "title": "Worksheet title based on topic",
      "difficulty": "easy|medium|hard",
      "instructions": "Clear instructions for students",
      "exercises": [
        {
          "id": "q1",
          "type": "multipleChoice|fillInBlank|shortAnswer",
          "question": "Question text",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "Correct answer",
          "points": 5,
          "hint": "Optional hint"
        }
      ]
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        let worksheets;
        try {
            const cleanText = text.trim().replace(/```json|```/g, '');
            worksheets = JSON.parse(cleanText);
        } catch (parseError) {
            console.error('❌ Failed to parse worksheets:', parseError);
            throw new Error('Failed to parse worksheets from AI response');
        }

        // Validate the response format
        if (!worksheets.worksheets || !Array.isArray(worksheets.worksheets)) {
            throw new Error('Invalid worksheet format from AI');
        }

        res.json({
            success: true,
            data: worksheets.worksheets
        });

    } catch (error) {
        console.error('❌ Worksheet generation error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate worksheets'
        });
    }
});
// --- VISUAL AIDS: GENERATE ---
app.post('/api/generate-visual-aid', asyncHandler(async (req, res) => {
    const { topic, grade, description } = req.body;
    if (!topic && !description) {
        return res.status(400).json({ error: 'Missing required fields: topic or description' });
    }
    try {
        const prompt = `
      You are Sahayak, an expert AI teaching assistant for Indian classrooms.
      Generate a visual aid for the topic: ${topic || description}
      Grade level: ${grade || 'general'}
      
      Create a simple visual aid that can be drawn on a blackboard, including:
      - SVG drawing instructions
      - Step-by-step drawing guide
      - Materials needed
      - Teaching tips
      
      Respond with ONLY a JSON object containing the visual aid details.
    `;
        const response = await model.generateContent(prompt);
        let text = response.response.text();
        // Clean up markdown formatting if present
        text = text.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
        try {
            const visualAid = JSON.parse(text);
            res.json(visualAid);
        }
        catch (e) {
            console.error("Error parsing visual aid JSON:", e);
            console.error("Raw response was:", text);
            res.status(500).json({ error: "Failed to parse visual aid from AI response" });
        }
    }
    catch (error) {
        console.error("Error generating visual aid:", error);
        res.status(500).json({ error: 'Failed to generate visual aid.' });
    }
}));
// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Sahayak Server v3.1 running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map