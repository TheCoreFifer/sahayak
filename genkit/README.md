# Sahayak Genkit Server

## Overview

This is the AI-powered backend for Sahayak, built using Google AI Genkit. It provides structured AI flows for generating educational content tailored for multi-grade classrooms in India.

## Features

### ✅ Implemented AI Flows
- **Content Generation**: Create culturally relevant educational content with teaching tips and extension activities
- **Question Generation**: Generate text-dependent questions for various skill assessments
- **Knowledge Base**: Provide explanations for student questions with local context
- **Visual Aids**: Create step-by-step drawing instructions for educational concepts
- **Smart Worksheets**: Generate differentiated worksheets from textbook images

## Technology Stack

- **Framework**: Google AI Genkit
- **AI Model**: Gemini 2.0 Flash
- **Language**: TypeScript
- **Runtime**: Node.js
- **API**: Express.js REST endpoints
- **Development**: Genkit Developer UI

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the `genkit/` directory:

```bash
# Copy from .env.example
cp .env.example .env
```

Update the `.env` file with your API key:

```env
GOOGLE_AI_API_KEY=your-gemini-api-key-here
PORT=3001
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build TypeScript

```bash
npm run build
```

### 4. Start Development Server

```bash
# Start both API server and Genkit Developer UI
npm run dev
```

### 5. Start Production Server

```bash
npm start
```

## API Endpoints

All endpoints accept JSON and return structured responses.

### Content Generation
```http
POST /api/generate-content
Content-Type: application/json

{
  "language": "English",
  "grade": "Grade 5",
  "subject": "Science",
  "location": "Maharashtra",
  "description": "Create a story about water cycle"
}
```

### Question Generation
```http
POST /api/generate-questions
Content-Type: application/json

{
  "text": "Your text content here...",
  "gradeLevel": "Grade 6",
  "questionTypes": ["Multiple choice", "Short response"],
  "skills": ["Reading Comprehension", "Critical Thinking"]
}
```

### Knowledge Base
```http
POST /api/ask-question
Content-Type: application/json

{
  "question": "Why is the sky blue?",
  "grade": "Grade 4",
  "language": "English",
  "context": "Basic science explanation"
}
```

### Visual Aids
```http
POST /api/generate-visual-aid
Content-Type: application/json

{
  "concept": "Water cycle",
  "gradeLevel": "Grade 5",
  "complexity": "simple",
  "medium": "blackboard"
}
```

### Smart Worksheets
```http
POST /api/generate-worksheets
Content-Type: application/json

{
  "imageData": "base64-encoded-image",
  "targetGrades": ["Grade 3", "Grade 4", "Grade 5"],
  "subject": "Mathematics"
}
```

### Health Check
```http
GET /health
```

## Development

### Genkit Developer UI

Access the Genkit Developer UI at `http://localhost:3400` when running in development mode.

Features:
- Test flows individually
- View execution traces
- Debug AI responses
- Monitor performance

### Scripts

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Start Genkit Developer UI only
npm run genkit
```

### Project Structure

```
genkit/
├── src/
│   ├── flows/           # Genkit flow definitions
│   │   ├── contentGeneration.ts
│   │   ├── questionGeneration.ts
│   │   ├── knowledgeBase.ts
│   │   ├── visualAids.ts
│   │   └── smartWorksheets.ts
│   ├── prompts/         # AI prompt templates
│   │   └── index.ts
│   ├── types/           # TypeScript interfaces
│   │   └── index.ts
│   └── index.ts         # Main server entry point
├── lib/                 # Compiled JavaScript (auto-generated)
├── package.json
├── tsconfig.json
└── README.md
```

## AI Prompt Engineering

All prompts are designed for Indian educational context:

- **Cultural Relevance**: Uses local festivals, food, traditions
- **Multi-Grade Support**: Tips for managing different age groups
- **Local Examples**: References familiar objects and scenarios
- **Language Support**: Works with multiple Indian languages

## API Response Structure

All endpoints return consistent response format:

```json
{
  "success": true,
  "data": {
    // Endpoint-specific data
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_AI_API_KEY` | Your Gemini API key | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |
| `GENKIT_DEV_UI_PORT` | Developer UI port | 3400 |
| `TELEMETRY_ENABLED` | Enable telemetry | true |

## Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure `GOOGLE_AI_API_KEY` is set correctly
2. **Port Already in Use**: Change `PORT` in `.env` file
3. **Module Not Found**: Run `npm install` and `npm run build`

### Debug Mode

Enable debug logging:
```bash
DEBUG=genkit:* npm run dev
```

### Logs

- API requests: Console output
- Genkit traces: Available in Developer UI
- Errors: Detailed error messages in response

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Include input validation
4. Test with Genkit Developer UI
5. Update documentation

## License

MIT License - See LICENSE file for details. 