# Sahayak Environment Setup Guide

## Required Environment Variables

### Frontend (.env in root directory)
```env
# API Base URL for backend connection
VITE_API_URL=http://localhost:3001

# Optional: Production API URL (uncomment when deploying)
# VITE_API_URL=https://your-production-api.com
```

### Backend (server/.env)
```env
# Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Configuration
SESSION_SECRET=your_session_secret_here
```

## Setup Instructions

### 1. Get Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key for use in the environment variables

### 2. Frontend Setup
1. Create a `.env` file in the root directory
2. Add the frontend environment variables shown above
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`

### 3. Backend Setup
1. Navigate to the server directory: `cd server`
2. Create a `.env` file in the server directory
3. Add the backend environment variables shown above
4. Replace `your_gemini_api_key_here` with your actual Gemini API key
5. Install dependencies: `npm install`
6. Start the server: `npm start`

## Verification Steps

### 1. Check Backend Health
- Visit: `http://localhost:3001/api/health`
- Should return: `{"status": "healthy", "timestamp": "..."}`

### 2. Test Gemini Connection
- Visit: `http://localhost:3001/api/gemini/test`
- Should return: `{"success": true, "message": "Gemini connection successful", "response": "Sahayak is ready!"}`

### 3. Check Frontend Connection
- Open the Local Content Generator page
- Look for the "AI Connected" status in the top-right corner
- Should show green dot with "AI Connected" text

## Local Content Generator Features

### What's Implemented:
✅ **Real AI Content Generation**: Uses Google Gemini API to create educational content
✅ **Professional UI**: Clean, enterprise-grade interface
✅ **Multi-language Support**: English, Hindi, Marathi, Tamil, Telugu, Bengali
✅ **Grade-appropriate Content**: Tailored for grades 1-5
✅ **Subject-specific**: Science, Math, English, Social Studies
✅ **Content Types**: Stories, Examples, Analogies
✅ **Copy to Clipboard**: Easy sharing of generated content
✅ **Download as Markdown**: Save content for offline use
✅ **Error Handling**: Comprehensive error messages and recovery
✅ **Connection Status**: Real-time API connection monitoring
✅ **Loading States**: Professional loading animations
✅ **Input Validation**: Prevents empty submissions
✅ **Quick Topic Suggestions**: Subject-specific topic recommendations

### Content Generation Process:
1. **Content Type Selection**: Choose between story, example, or analogy
2. **Configuration**: Set grade, subject, language, topic, and context
3. **AI Generation**: Real-time content creation using Gemini API
4. **Professional Output**: Formatted, educational content ready for classroom use

### Example Generated Content:
- **Input**: Grade 3, Science, English, "Water cycle"
- **Output**: Culturally relevant story about water cycle with local characters, examples, and teaching tips

## Production Deployment

### Frontend (Vercel/Netlify)
1. Set environment variable: `VITE_API_URL=https://your-backend-url.com`
2. Build and deploy: `npm run build`

### Backend (Railway/Heroku)
1. Set all environment variables in your hosting platform
2. Ensure CORS is configured for your frontend domain
3. Deploy the server directory

## Troubleshooting

### Common Issues:
1. **"AI Disconnected"**: Check if Gemini API key is correct and server is running
2. **CORS Error**: Ensure FRONTEND_URL matches your frontend domain
3. **Generation Fails**: Check API key quotas and network connectivity
4. **404 Errors**: Verify API endpoints match between frontend and backend

### Debug Steps:
1. Check browser console for error messages
2. Verify environment variables are loaded
3. Test API endpoints individually
4. Check server logs for detailed error information

## Next Steps

With Local Content Generator fully functional, you can:
1. Test with real classroom content
2. Generate content in different Indian languages
3. Create grade-specific variations
4. Collect teacher feedback for improvements
5. Implement the remaining features (Smart Worksheets, Knowledge Base, Visual Aids) 