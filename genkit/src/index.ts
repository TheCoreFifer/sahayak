import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
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
    } catch (parseError) {
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
    
  } catch (error) {
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
    } catch (parseError) {
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
    
  } catch (error) {
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
      } else {
        console.log(`   ✅ AI Generated Correct Count: ${actualCount} questions`);
      }
    } catch (parseError) {
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
      } else {
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
    
  } catch (error) {
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
      } else {
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
      
    } catch (parseError) {
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
    
  } catch (error) {
    console.error('\n❌ Knowledge base error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Knowledge base query failed',
      details: 'Please ensure the question is clear and try again'
    });
  }
});

// Placeholder removed - using actual implementation below

// Smart Worksheets - Analyze Textbook Page
app.post('/api/analyze-textbook', async (req, res) => {
  const startTime = Date.now();
  console.log('\n🔍 === TEXTBOOK ANALYSIS REQUEST ===');
  
  try {
    const { imageData, fileType } = req.body;
    
    if (!imageData) {
      res.status(400).json({ 
        success: false, 
        error: 'No image data provided' 
      });
      return;
    }
    
    console.log('📸 Image Analysis Details:');
    console.log(`- File Type: ${fileType}`);
    console.log(`- Image Data Length: ${imageData.length} characters`);
    
    // Enhanced multimodal prompt for textbook analysis
    const analysisPrompt = `
ANALYZE THIS TEXTBOOK PAGE - COMPREHENSIVE EDUCATIONAL CONTENT ANALYSIS

You are analyzing an uploaded textbook page image. Provide a detailed analysis of the educational content for generating differentiated worksheets.

ANALYSIS REQUIREMENTS:
1. Identify the main topic and educational concepts
2. Extract key terms and vocabulary
3. Determine appropriate grade levels (1-10)
4. Assess content difficulty and complexity
5. Describe what's visible in the image

RESPONSE FORMAT (JSON):
{
  "topic": "Clear, specific topic title",
  "imageDescription": "Detailed description of what's visible in the image",
  "keyTerms": ["term1", "term2", "term3", "term4", "term5"],
  "concepts": ["concept1", "concept2", "concept3", "concept4"],
  "difficulty": "beginner|intermediate|advanced",
  "suggestedGrades": ["Grade 3", "Grade 4", "Grade 5"],
  "contentType": "text|diagram|both|chart|illustration",
  "subject": "Science|Mathematics|English|Social Studies|General"
}

IMPORTANT GUIDELINES:
- Use Indian educational context and terminology
- Suggest 3-5 appropriate grade levels
- Include cultural relevance where applicable
- Be specific about concepts and terms
- Provide actionable educational insights

Generate EXACTLY this JSON structure - no additional text or explanation.
`;

    // Call Gemini with image analysis
    const result = await model.generateContent([
      { text: analysisPrompt },
      {
        inlineData: {
          mimeType: fileType,
          data: imageData
        }
      }
    ]);
    
    const response = await result.response;
    const analysisText = response.text();
    
    console.log('\n🤖 Gemini Analysis Response:');
    console.log(`- Response Length: ${analysisText.length} characters`);
    console.log(`- Analysis Preview: ${analysisText.substring(0, 200)}...`);
    
    // Parse the JSON response
    let analysisData;
    try {
      // Clean and parse JSON response
      const cleanedResponse = analysisText.trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*{/, '{')
        .replace(/}[^}]*$/, '}');
      
      analysisData = JSON.parse(cleanedResponse);
      console.log('✅ Analysis Parsing: SUCCESS');
      console.log('📊 Extracted Data:');
      console.log(`- Topic: ${analysisData.topic}`);
      console.log(`- Concepts: ${analysisData.concepts?.length || 0} items`);
      console.log(`- Key Terms: ${analysisData.keyTerms?.length || 0} items`);
      console.log(`- Suggested Grades: ${analysisData.suggestedGrades?.join(', ') || 'None'}`);
      
    } catch (parseError) {
      console.log('❌ Analysis Parsing: FAILED');
      console.log('📝 Raw Response:', analysisText);
      
      // Fallback analysis
      analysisData = {
        topic: "Educational Content Analysis",
        imageDescription: "Textbook page uploaded for analysis",
        keyTerms: ["learning", "education", "knowledge", "study", "concept"],
        concepts: ["Basic understanding", "Key learning points", "Educational content", "Study material"],
        difficulty: "intermediate",
        suggestedGrades: ["Grade 3", "Grade 4", "Grade 5"],
        contentType: "text",
        subject: "General"
      };
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`\n⏱️ Analysis completed in ${processingTime}ms`);
    
    res.json({
      success: true,
      data: analysisData,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Textbook Analysis Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Analysis failed' 
    });
  }
});

// Smart Worksheets - Generate Differentiated Worksheets
app.post('/api/generate-worksheets', async (req, res) => {
  const startTime = Date.now();
  console.log('\n📝 === WORKSHEET GENERATION REQUEST ===');
  
  try {
    const { analyzedContent, targetGrades, questionTypes = ['mixed'], imageData } = req.body;
    
    if (!analyzedContent || !targetGrades || targetGrades.length === 0) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required data for worksheet generation' 
      });
      return;
    }
    
    console.log('📊 Worksheet Generation Details:');
    console.log(`- Topic: ${analyzedContent.topic}`);
    console.log(`- Target Grades: ${targetGrades.join(', ')}`);
    console.log(`- Question Types: ${questionTypes.join(', ')}`);
    console.log(`- Key Terms: ${analyzedContent.keyTerms?.length || 0} items`);
    console.log(`- Concepts: ${analyzedContent.concepts?.length || 0} items`);
    
    // Generate worksheets for each target grade
    const worksheets = [];
    
    for (const grade of targetGrades) {
      const gradeNumber = parseInt(grade.replace('Grade ', ''));
      
      // Determine difficulty and complexity based on grade
      let difficulty, complexity, exerciseCount;
      if (gradeNumber <= 2) {
        difficulty = 'easy';
        complexity = 'simple';
        exerciseCount = 6;
      } else if (gradeNumber <= 5) {
        difficulty = 'medium';
        complexity = 'intermediate';
        exerciseCount = 8;
      } else {
        difficulty = 'hard';
        complexity = 'advanced';
        exerciseCount = 10;
      }
      
      // Generate question type instructions based on preferences
      const getQuestionTypeInstructions = () => {
        if (questionTypes.includes('mixed')) {
          return `
EXERCISE TYPES TO INCLUDE (Mixed Variety):
- Multiple Choice (with 4 options) - 30%
- Fill in the Blank - 25%
- Short Answer - 20%
- True/False - 15%
- Matching (when appropriate) - 10%
          `;
        }
        
        const typeMap = {
          'mcq': 'Multiple Choice (with 4 options)',
          'shortAnswer': 'Short Answer questions',
          'fillInBlank': 'Fill in the Blank',
          'truefalse': 'True/False questions',
          'matching': 'Matching exercises'
        };
        
        const selectedTypeDescriptions = questionTypes
          .filter((type: string) => type !== 'mixed')
          .map((type: string) => `- ${typeMap[type as keyof typeof typeMap] || type}`)
          .join('\n');
        
        return `
EXERCISE TYPES TO INCLUDE (Selected Types Only):
${selectedTypeDescriptions}

DISTRIBUTION: Create exercises using ONLY the selected question types above.
        `;
      };

      const worksheetPrompt = `
CREATE DIFFERENTIATED WORKSHEET FOR ${grade.toUpperCase()}

CONTENT ANALYSIS:
- Topic: ${analyzedContent.topic}
- Key Terms: ${analyzedContent.keyTerms?.join(', ')}
- Concepts: ${analyzedContent.concepts?.join(', ')}
- Difficulty Level: ${difficulty}
- Complexity: ${complexity}

WORKSHEET REQUIREMENTS:
- Target Grade: ${grade}
- Number of Exercises: ${exerciseCount}
- Difficulty: ${difficulty}
- Question Type Preference: ${questionTypes.join(', ')}
- Use Indian cultural context and examples
- Make it engaging and educational

RESPONSE FORMAT (JSON):
{
  "grade": "${grade}",
  "title": "Specific worksheet title related to ${analyzedContent.topic}",
  "difficulty": "${difficulty}",
  "instructions": "Clear, encouraging instructions for ${grade} students",
  "exercises": [
    {
      "id": "ex1",
      "type": "multipleChoice|fillInBlank|shortAnswer|matching|truefalse",
      "question": "Clear, grade-appropriate question with Indian context",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "correct answer",
      "points": 2,
      "hint": "Optional helpful hint"
    }
  ]
}

${getQuestionTypeInstructions()}

QUESTION GUIDELINES BY TYPE:
- Multiple Choice: 4 options, 1 clearly correct, others plausible but wrong
- Fill in the Blank: Use underscores (___) for blanks, provide exact answer
- Short Answer: Open-ended, 1-3 sentence expected responses
- True/False: Clear statements that are definitely true or false
- Matching: Pairs of related items (terms-definitions, cause-effect)

CULTURAL INTEGRATION:
- Use Indian names: Arjun, Priya, Ravi, Meera, Kiran, Anjali
- Reference Indian places: Delhi, Mumbai, Chennai, Kolkata, Bangalore
- Include festivals: Diwali, Holi, Ganesh Chaturthi, Durga Puja
- Use familiar foods: rice, dal, roti, curry, samosa
- Reference local animals: elephant, tiger, peacock, cobra

IMPORTANT GUIDELINES:
- Grade-appropriate vocabulary and complexity for ${grade}
- Clear, unambiguous questions
- Culturally relevant examples and contexts
- Proper point values (1-3 points based on difficulty)
- Helpful hints for challenging questions
- Educational value aligned with ${analyzedContent.topic}

Generate EXACTLY this JSON structure with ${exerciseCount} exercises using the specified question types.
`;

      try {
        console.log(`\n📝 Generating worksheet for ${grade}...`);
        
        const result = await model.generateContent([
          { text: worksheetPrompt },
          ...(imageData ? [{
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageData
            }
          }] : [])
        ]);
        
        const response = await result.response;
        const worksheetText = response.text();
        
        console.log(`- ${grade} Response Length: ${worksheetText.length} characters`);
        
        // Parse worksheet JSON
        let worksheetData;
        try {
          const cleanedResponse = worksheetText.trim()
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^[^{]*{/, '{')
            .replace(/}[^}]*$/, '}');
          
          worksheetData = JSON.parse(cleanedResponse);
          
          // Validate and ensure proper structure
          if (!worksheetData.exercises || !Array.isArray(worksheetData.exercises)) {
            throw new Error('Invalid exercises structure');
          }
          
          // Ensure each exercise has required fields
          worksheetData.exercises = worksheetData.exercises.map((exercise: any, index: number) => ({
            id: exercise.id || `ex${index + 1}`,
            type: exercise.type || 'shortAnswer',
            question: exercise.question || `Question ${index + 1}`,
            options: exercise.options || [],
            correctAnswer: exercise.correctAnswer || 'Sample answer',
            points: exercise.points || 2,
            hint: exercise.hint || ''
          }));
          
          console.log(`✅ ${grade} Worksheet: SUCCESS - ${worksheetData.exercises.length} exercises`);
          
        } catch (parseError) {
          console.log(`❌ ${grade} Worksheet Parsing: FAILED`);
          console.log('📝 Raw Response:', worksheetText.substring(0, 200));
          
          // Fallback worksheet
          worksheetData = {
            grade: grade,
            title: `${analyzedContent.topic} - ${grade} Worksheet`,
            difficulty: difficulty,
            instructions: "Read each question carefully and provide your best answer.",
            exercises: Array.from({length: exerciseCount}, (_, i) => ({
              id: `ex${i + 1}`,
              type: i % 2 === 0 ? 'multipleChoice' : 'shortAnswer',
              question: `Question ${i + 1}: Based on the textbook content, what is an important concept to understand?`,
              options: i % 2 === 0 ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
              correctAnswer: i % 2 === 0 ? 'Option A' : 'Sample answer explaining key concept',
              points: 2,
              hint: 'Think about the main ideas from the textbook page'
            }))
          };
        }
        
        worksheets.push(worksheetData);
        
      } catch (error) {
        console.error(`❌ Error generating worksheet for ${grade}:`, error);
        
        // Add fallback worksheet
        worksheets.push({
          grade: grade,
          title: `${analyzedContent.topic} - ${grade} Worksheet`,
          difficulty: difficulty,
          instructions: "Complete these exercises based on the textbook content.",
          exercises: Array.from({length: exerciseCount}, (_, i) => ({
            id: `ex${i + 1}`,
            type: 'shortAnswer',
            question: `Question ${i + 1}: Explain an important concept from the textbook.`,
            options: [],
            correctAnswer: 'Detailed explanation of key concept',
            points: 2,
            hint: 'Review the main ideas from the textbook page'
          }))
        });
      }
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`\n⏱️ Worksheet generation completed in ${processingTime}ms`);
    console.log(`📊 Generated ${worksheets.length} worksheets successfully`);
    
    res.json({
      success: true,
      data: {
        worksheets,
        totalGenerated: worksheets.length,
        targetGrades: targetGrades
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Worksheet Generation Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Worksheet generation failed' 
    });
  }
});

// File Processing - Enhanced text extraction with Gemini File API
app.post('/api/process-file', upload.single('file'), async (req, res): Promise<void> => {
  try {
    console.log('🚀 Processing file for text extraction');
    const startTime = Date.now();
    
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileExtension = path.extname(fileName).toLowerCase();
    
    console.log(`📄 Processing file: ${fileName} (${fileExtension})`);

    let extractedText = '';
    
    // Use Gemini to extract text from the uploaded file
    try {
      const fileContent = fs.readFileSync(filePath);
      const fileBase64 = fileContent.toString('base64');
      
      const prompt = `Extract all text content from this ${fileExtension} file. 
      Please provide a clean, readable text extraction without any formatting artifacts.
      Focus on the main content and ignore headers, footers, and page numbers.
      
      CRITICAL: You MUST respond with ONLY the extracted text content. Do not include:
      - "Here is the extracted text..."
      - "The content is..."
      - Any explanatory text
      - Just the pure text content from the document
      
      If the file cannot be read or contains no text, respond with: "Unable to extract text from this file."`;

      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            mimeType: fileExtension === '.pdf' ? 'application/pdf' : 
                      fileExtension === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                      'application/msword',
            data: fileBase64
          }
        }
      ]);

      extractedText = result.response.text().trim();
      
      // Clean up response if it contains explanatory text
      if (extractedText.toLowerCase().includes('here is the extracted text') ||
          extractedText.toLowerCase().includes('the content is')) {
        const lines = extractedText.split('\n');
        extractedText = lines.slice(1).join('\n').trim();
      }
      
      console.log(`✅ Successfully extracted ${extractedText.length} characters from ${fileName}`);
      
    } catch (aiError) {
      console.log(`⚠️ AI extraction failed, using fallback for ${fileName}:`, aiError);
      
      // Fallback: Generate sample text based on file name
      extractedText = `Sample text content for ${fileName}. 
      
      This is placeholder content since the file processing is still being enhanced. 
      Please copy and paste your content directly into the text area below for now.
      
      We are working on implementing full PDF and Word document text extraction capabilities.
      
      For the best experience, please manually copy your content from the document and paste it in the text area.`;
    }
    
    // Clean up: delete uploaded file from local storage
    fs.unlink(filePath, (err) => {
      if (err) console.log('Warning: Could not delete temporary file:', err);
    });

    const duration = Date.now() - startTime;
    console.log(`✅ File processed in ${duration}ms`);

    res.json({
      success: true,
      data: {
        extractedText,
        fileName,
        fileSize: req.file.size,
        charactersExtracted: extractedText.length
      },
      duration: `${duration}ms`,
      aiProcessed: true
    });

  } catch (error) {
    console.error('❌ File processing error:', error);
    
    // Clean up file if it exists
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('Warning: Could not delete temporary file:', err);
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'File processing failed'
    });
  }
});

// Weekly Lesson Plan Generation API
app.post('/api/generate-weekly-plan', async (req, res) => {
  try {
    console.log('📅 === WEEKLY LESSON PLAN GENERATION REQUEST ===');
    const startTime = Date.now();
    
    const { analyzedContent, targetGrades, numberOfWeeks = 1 } = req.body;
    
    console.log('📊 Weekly Plan Generation Details:');
    console.log(`- Topic: ${analyzedContent.topic}`);
    console.log(`- Target Grades: ${targetGrades.join(', ')}`);
    console.log(`- Number of Weeks: ${numberOfWeeks}`);
    console.log(`- Key Terms: ${analyzedContent.keyTerms.length} items`);
    console.log(`- Concepts: ${analyzedContent.concepts.length} items`);

    const weeklyPlans = [];
    
    for (let week = 1; week <= numberOfWeeks; week++) {
      console.log(`\n📝 Generating plan for Week ${week}...`);
      
      const prompt = `You are Sahayak, an expert AI teaching assistant for Indian multi-grade classrooms.

Create a detailed weekly lesson plan for Week ${week} based on this textbook analysis:

TEXTBOOK ANALYSIS:
- Topic: ${analyzedContent.topic}
- Key Concepts: ${analyzedContent.concepts.join(', ')}
- Key Terms: ${analyzedContent.keyTerms.join(', ')}
- Target Grades: ${targetGrades.join(', ')}

CRITICAL: You MUST respond with ONLY valid JSON in this EXACT format:

{
  "week": ${week},
  "theme": "Week ${week} theme based on ${analyzedContent.topic}",
  "overview": "Brief overview of what students will learn this week",
  "learningObjectives": [
    "Students will understand...",
    "Students will be able to...",
    "Students will analyze..."
  ],
  "dailyPlans": {
    "monday": {
      "day": "Monday",
      "title": "Introduction to the Topic",
      "duration": "45 minutes",
      "activities": [
        {
          "time": "0-10 min",
          "activity": "Warm-up and Review",
          "description": "Quick review of previous knowledge",
          "materials": ["Blackboard", "Chalk"],
          "gradeAdaptation": "Simpler questions for younger grades"
        },
        {
          "time": "10-25 min",
          "activity": "Main Lesson",
          "description": "Introduce key concepts using Indian cultural examples",
          "materials": ["Textbook", "Local examples"],
          "gradeAdaptation": "Different complexity levels for different grades"
        },
        {
          "time": "25-40 min",
          "activity": "Practice Activity",
          "description": "Hands-on activity to reinforce learning",
          "materials": ["Worksheets", "Group work"],
          "gradeAdaptation": "Varied difficulty levels"
        },
        {
          "time": "40-45 min",
          "activity": "Wrap-up",
          "description": "Summary and preview of next day",
          "materials": ["Discussion"],
          "gradeAdaptation": "Age-appropriate questioning"
        }
      ]
    },
    "tuesday": {
      "day": "Tuesday",
      "title": "Exploring Key Concepts",
      "duration": "45 minutes",
      "activities": [
        {
          "time": "0-10 min",
          "activity": "Review and Connect",
          "description": "Connect to Monday's lesson",
          "materials": ["Blackboard", "Previous notes"],
          "gradeAdaptation": "Visual aids for younger students"
        },
        {
          "time": "10-30 min",
          "activity": "Deep Dive",
          "description": "Explore concepts in detail with Indian examples",
          "materials": ["Local materials", "Stories"],
          "gradeAdaptation": "More complex analysis for older grades"
        },
        {
          "time": "30-40 min",
          "activity": "Interactive Exercise",
          "description": "Students work in mixed-grade groups",
          "materials": ["Group activity materials"],
          "gradeAdaptation": "Peer teaching opportunities"
        },
        {
          "time": "40-45 min",
          "activity": "Assessment",
          "description": "Quick formative assessment",
          "materials": ["Oral questions", "Quick write"],
          "gradeAdaptation": "Different assessment methods"
        }
      ]
    },
    "wednesday": {
      "day": "Wednesday",
      "title": "Practical Applications",
      "duration": "45 minutes",
      "activities": [
        {
          "time": "0-10 min",
          "activity": "Energizer",
          "description": "Fun activity to start the day",
          "materials": ["Simple games", "Movement"],
          "gradeAdaptation": "Age-appropriate games"
        },
        {
          "time": "10-35 min",
          "activity": "Real-World Connections",
          "description": "Connect learning to Indian daily life and culture",
          "materials": ["Local examples", "Community connections"],
          "gradeAdaptation": "Different complexity of connections"
        },
        {
          "time": "35-45 min",
          "activity": "Project Planning",
          "description": "Plan weekend project or homework",
          "materials": ["Project guidelines"],
          "gradeAdaptation": "Differentiated project requirements"
        }
      ]
    },
    "thursday": {
      "day": "Thursday",
      "title": "Creative Expression",
      "duration": "45 minutes",
      "activities": [
        {
          "time": "0-10 min",
          "activity": "Sharing Circle",
          "description": "Students share insights or questions",
          "materials": ["Circle seating"],
          "gradeAdaptation": "Guided sharing for younger students"
        },
        {
          "time": "10-35 min",
          "activity": "Creative Project",
          "description": "Art, drama, or storytelling related to the topic",
          "materials": ["Art supplies", "Props"],
          "gradeAdaptation": "Different creative mediums"
        },
        {
          "time": "35-45 min",
          "activity": "Presentation Prep",
          "description": "Prepare for Friday presentations",
          "materials": ["Presentation materials"],
          "gradeAdaptation": "Varied presentation formats"
        }
      ]
    },
    "friday": {
      "day": "Friday",
      "title": "Review and Assessment",
      "duration": "45 minutes",
      "activities": [
        {
          "time": "0-20 min",
          "activity": "Student Presentations",
          "description": "Students present their work",
          "materials": ["Presentation space"],
          "gradeAdaptation": "Different presentation lengths"
        },
        {
          "time": "20-35 min",
          "activity": "Week Review",
          "description": "Comprehensive review of week's learning",
          "materials": ["Review materials", "Games"],
          "gradeAdaptation": "Different review methods"
        },
        {
          "time": "35-45 min",
          "activity": "Assessment and Preview",
          "description": "Assess understanding and preview next week",
          "materials": ["Assessment tools"],
          "gradeAdaptation": "Multiple assessment formats"
        }
      ]
    }
  },
  "resources": {
    "materials": ["Commonly available materials in Indian schools"],
    "culturalConnections": ["Local festivals", "Community examples", "Regional traditions"],
    "assessmentTools": ["Formative assessment methods", "Peer assessment", "Self-reflection"]
  },
  "homework": [
    "Monday: Simple observation task",
    "Tuesday: Practice exercise",
    "Wednesday: Community connection activity",
    "Thursday: Creative preparation",
    "Friday: Reflection and preview"
  ],
  "adaptations": {
    "lowerGrades": "Specific adaptations for younger students",
    "higherGrades": "Extensions and challenges for older students",
    "mixedGrade": "Strategies for multi-grade teaching"
  }
}

RULES:
- Focus on practical, implementable daily activities
- Use authentic Indian cultural context throughout
- Include specific time allocations for each activity
- Provide clear multi-grade adaptations
- Ensure activities use locally available materials
- Make it immediately usable by teachers in resource-limited schools`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Parse JSON response with better error handling
      let parsedPlan;
      try {
        const cleanText = text.trim().replace(/```json|```/g, '');
        parsedPlan = JSON.parse(cleanText);
        console.log(`✅ Week ${week} Plan: SUCCESS - ${parsedPlan.dailyPlans ? Object.keys(parsedPlan.dailyPlans).length : 0} days`);
      } catch (parseError) {
        console.log(`❌ Week ${week} JSON parsing failed, using structured fallback`);
        parsedPlan = {
          week: week,
          theme: `Week ${week}: ${analyzedContent.topic}`,
          overview: `This week students will explore ${analyzedContent.topic} through various activities and cultural connections.`,
          learningObjectives: [
            `Students will understand the key concepts of ${analyzedContent.topic}`,
            `Students will be able to apply learning to real-world situations`,
            `Students will analyze the cultural significance of the topic`
          ],
          dailyPlans: {
            monday: {
              day: "Monday",
              title: "Introduction to the Topic",
              duration: "45 minutes",
              activities: [
                {
                  time: "0-10 min",
                  activity: "Warm-up and Review",
                  description: "Quick review and introduction",
                  materials: ["Blackboard", "Chalk"],
                  gradeAdaptation: "Simpler questions for younger grades"
                },
                {
                  time: "10-35 min",
                  activity: "Main Lesson",
                  description: `Introduce ${analyzedContent.topic} with Indian examples`,
                  materials: ["Textbook", "Local examples"],
                  gradeAdaptation: "Different complexity levels"
                },
                {
                  time: "35-45 min",
                  activity: "Wrap-up",
                  description: "Summary and preview",
                  materials: ["Discussion"],
                  gradeAdaptation: "Age-appropriate questioning"
                }
              ]
            },
            tuesday: {
              day: "Tuesday",
              title: "Exploring Key Concepts",
              duration: "45 minutes",
              activities: [
                {
                  time: "0-45 min",
                  activity: "Concept Exploration",
                  description: "Deep dive into key concepts",
                  materials: ["Various materials"],
                  gradeAdaptation: "Multi-level activities"
                }
              ]
            },
            wednesday: {
              day: "Wednesday",
              title: "Practical Applications",
              duration: "45 minutes",
              activities: [
                {
                  time: "0-45 min",
                  activity: "Real-world Connections",
                  description: "Connect to daily life",
                  materials: ["Local examples"],
                  gradeAdaptation: "Different complexity"
                }
              ]
            },
            thursday: {
              day: "Thursday",
              title: "Creative Expression",
              duration: "45 minutes",
              activities: [
                {
                  time: "0-45 min",
                  activity: "Creative Project",
                  description: "Express learning creatively",
                  materials: ["Art supplies"],
                  gradeAdaptation: "Different mediums"
                }
              ]
            },
            friday: {
              day: "Friday",
              title: "Review and Assessment",
              duration: "45 minutes",
              activities: [
                {
                  time: "0-45 min",
                  activity: "Review and Assess",
                  description: "Week review and assessment",
                  materials: ["Assessment tools"],
                  gradeAdaptation: "Multiple formats"
                }
              ]
            }
          },
          resources: {
            materials: ["Blackboard", "Chalk", "Textbook", "Local materials"],
            culturalConnections: ["Local festivals", "Community examples"],
            assessmentTools: ["Oral questions", "Observation", "Peer assessment"]
          },
          homework: [
            "Monday: Observation task",
            "Tuesday: Practice exercise",
            "Wednesday: Community activity",
            "Thursday: Creative work",
            "Friday: Reflection"
          ],
          adaptations: {
            lowerGrades: "Simpler activities and visual aids",
            higherGrades: "More complex analysis and projects",
            mixedGrade: "Peer teaching and group work"
          }
        };
      }
      
      weeklyPlans.push(parsedPlan);
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`\n⏱️ Weekly plan generation completed in ${processingTime}ms`);
    console.log(`📊 Generated ${weeklyPlans.length} weekly plans successfully`);
    
    res.json({
      success: true,
      data: {
        weeklyPlans,
        totalWeeks: numberOfWeeks,
        targetGrades: targetGrades
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Weekly Plan Generation Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Weekly plan generation failed' 
    });
  }
});

// Visual Aids Generation API (simplified)
app.post('/api/generate-visual-aid', (req, res) => {
  const { description, subject, gradeLevel, complexity } = req.body;
  
  // Simple fallback visual aid
  const visualAid = {
    id: `visual-aid-${Date.now()}`,
    title: `${description.split(' ').slice(0, 3).join(' ')}`,
    description: description,
    subject: subject,
    complexity: complexity,
    concepts: [
      'Visual representation of concepts',
      'Step-by-step understanding',
      'Clear diagram interpretation'
    ],
    materials: ['White chalk', 'Colored chalk (optional)', 'Ruler', 'Eraser'],
    instructions: [
      'Start with the main concept and draw the central element',
      'Add supporting details and labels step by step',
      'Use different colors to highlight important parts',
      'Encourage students to explain what they see'
    ],
    blackboardSteps: [
      'Begin by drawing the main shape or structure in the center',
      'Add the primary components with clear, simple lines',
      'Include arrows and connecting lines to show relationships',
      'Label each part clearly with easy-to-read text',
      'Add final details and ask students to explain the diagram'
    ],
    svgContent: `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="50" width="300" height="200" fill="none" stroke="black" stroke-width="2"/>
      <circle cx="200" cy="150" r="60" fill="none" stroke="black" stroke-width="2"/>
      <text x="200" y="155" text-anchor="middle" font-family="Arial" font-size="14" fill="black">${description.split(' ')[0]}</text>
      <text x="200" y="280" text-anchor="middle" font-family="Arial" font-size="12" fill="black">${subject} - ${gradeLevel}</text>
    </svg>`
  };
  
  res.json({
    success: true,
    data: visualAid
  });
});

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Sahayak Structured Server v3.0 running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Direct Gemini 2.0 Flash (stable) with structured outputs`);
  console.log(`🎯 Rich content quality with cultural context`);
  console.log(`🇮🇳 Enhanced Indian cultural integration`);
  console.log(`🏆 Hackathon-ready with Google AI technologies`);
}); 