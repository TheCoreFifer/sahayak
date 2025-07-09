import React, { useState, useRef, useEffect } from 'react';
import { generateReadingPassage, analyzeAudioRecording } from '../../services/api';

interface StudentInfo {
  name: string;
  grade: string;
  subject: string;
}

interface ReadingPassage {
    title: string;
    text: string;
  targetWords: string[];
  estimatedReadingTime: string;
  gradeLevel: string;
  culturalElements: string[];
  teachingTips: string[];
}

interface AssessmentResult {
    accuracy: number;
  wordsPerMinute: number;
    fluencyScore: number;
    pronunciationHotspots: string[];
    positiveFeedback: string;
    actionableTip: string;
  detailedAnalysis: {
    hesitations: { word: string; count: number }[];
    mispronunciations: { word: string; correctSound: string }[];
    pacing: {
      overallPace: string;
      sectionsOfConcern: { text: string; issue: string }[];
    };
    expressiveness: {
      score: number;
      feedback: string;
    };
  };
}

const AudioAssessment: React.FC = () => {
  // State Management
  const [step, setStep] = useState<'setup' | 'recording' | 'analysis' | 'results'>('setup');
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({ name: '', grade: '', subject: '' });
  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Generate Reading Passage
  const handleGeneratePassage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!studentInfo.grade || !studentInfo.subject) {
        setError('Please select both grade and subject');
        return;
      }

      const passage = await generateReadingPassage(studentInfo.grade, studentInfo.subject);
      
      setPassage({
        title: passage.title,
        text: passage.content,
        targetWords: passage.vocabulary || [],
        estimatedReadingTime: "2-3 minutes",
        gradeLevel: passage.gradeLevel,
        culturalElements: passage.keyPoints || [],
        teachingTips: passage.discussionQuestions || []
      });
      
      setStep('recording');
    } catch (err) {
      console.error('❌ Error generating passage:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate passage');
    } finally {
      setIsLoading(false);
    }
  };

  // Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Failed to start recording. Please check your microphone permissions.');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Analyze Recording
  const handleAnalyzeRecording = async () => {
    if (!audioBlob || !passage) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await analyzeAudioRecording(audioBlob, passage.text, recordingTime);
      if (response.success && response.data) {
        setResult(response.data);
        setStep('results');
      } else {
        throw new Error('Failed to analyze recording');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze recording');
    } finally {
      setIsLoading(false);
    }
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

    return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-normal text-gray-900 mb-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
        Reading Assessment
      </h2>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {['Setup', 'Recording', 'Analysis', 'Results'].map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index <= ['setup', 'recording', 'analysis', 'results'].indexOf(step) 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </div>
            <div className="ml-2 text-sm font-medium text-gray-600">{stepName}</div>
            {index < 3 && (
              <div className="mx-4 h-0.5 w-16 bg-gray-200"></div>
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Setup Step */}
      {step === 'setup' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-medium text-gray-900 mb-4">Student Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name
              </label>
              <input
                type="text"
                value={studentInfo.name}
                onChange={(e) => setStudentInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter student name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Level
              </label>
              <select
                value={studentInfo.grade}
                onChange={(e) => setStudentInfo(prev => ({ ...prev, grade: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select grade</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={studentInfo.subject}
                onChange={(e) => setStudentInfo(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select subject</option>
                <option value="English">English</option>
                <option value="Science">Science</option>
                <option value="Social Studies">Social Studies</option>
                <option value="Mathematics">Mathematics</option>
              </select>
            </div>
            <button
              onClick={handleGeneratePassage}
              disabled={!studentInfo.name || !studentInfo.grade || !studentInfo.subject || isLoading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                !studentInfo.name || !studentInfo.grade || !studentInfo.subject || isLoading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isLoading ? 'Generating...' : 'Generate Reading Passage'}
            </button>
            </div>
        </div>
      )}

      {/* Recording Step */}
      {step === 'recording' && passage && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-medium text-gray-900 mb-4">{passage.title}</h3>
            <p className="text-gray-600 mb-4">
              Estimated reading time: {passage.estimatedReadingTime}
            </p>
            <div className="prose max-w-none">
              {passage.text}
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-900">Target Words:</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {passage.targetWords.map((word, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-sm">
                    {word}
                  </span>
                ))}
              </div>
            </div>
        </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-medium text-gray-900">Recording</h3>
              <div className="text-2xl font-mono">{formatTime(recordingTime)}</div>
   </div>
            
            <div className="flex justify-center gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="py-2 px-6 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                >
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="py-2 px-6 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                >
                  Stop Recording
                </button>
                    )}
                </div>

            {audioBlob && !isRecording && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleAnalyzeRecording}
                  disabled={isLoading}
                  className={`py-2 px-6 rounded-md text-white font-medium ${
                    isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Recording'}
                </button>
                                            </div>
                                       )}
                                    </div>
                                </div>
      )}

      {/* Results Step */}
      {step === 'results' && result && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-medium text-gray-900 mb-4">Assessment Results</h3>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Accuracy</div>
                <div className="text-2xl font-bold text-purple-900">{result.accuracy}%</div>
                                        </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Words per Minute</div>
                <div className="text-2xl font-bold text-purple-900">{result.wordsPerMinute}</div>
                                        </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Fluency Score</div>
                <div className="text-2xl font-bold text-purple-900">{result.fluencyScore}/10</div>
                            </div>
                        </div>
                        
            {/* Detailed Analysis */}
            <div className="space-y-4">
              {/* Pronunciation Hotspots */}
                                    <div>
                <h4 className="font-medium text-gray-900 mb-2">Words to Practice:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.pronunciationHotspots.map((word, index) => (
                    <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                      {word}
                    </span>
                  ))}
                                    </div>
                                </div>

              {/* Positive Feedback */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Positive Feedback:</h4>
                <p className="text-green-700">{result.positiveFeedback}</p>
                            </div>

              {/* Actionable Tip */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
                <p className="text-blue-700">{result.actionableTip}</p>
                            </div>

              {/* Detailed Analysis Sections */}
              <div className="mt-6 space-y-4">
                {/* Hesitations */}
                {result.detailedAnalysis.hesitations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Hesitations:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {result.detailedAnalysis.hesitations.map((item, index) => (
                        <li key={index} className="text-gray-600">
                          "{item.word}" - {item.count} time(s)
                        </li>
                      ))}
                    </ul>
                    </div>
                )}

                {/* Pacing */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Pacing:</h4>
                  <p className="text-gray-600 mb-2">Overall: {result.detailedAnalysis.pacing.overallPace}</p>
                  {result.detailedAnalysis.pacing.sectionsOfConcern.length > 0 && (
                    <ul className="list-disc list-inside space-y-1">
                      {result.detailedAnalysis.pacing.sectionsOfConcern.map((section, index) => (
                        <li key={index} className="text-gray-600">
                          "{section.text}" - {section.issue}
                        </li>
                      ))}
                    </ul>
                  )}
                        </div>

                {/* Expressiveness */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Expressiveness:</h4>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {result.detailedAnalysis.expressiveness.score}/10
                    </div>
                    <p className="text-gray-600">
                      {result.detailedAnalysis.expressiveness.feedback}
                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={() => {
                  setStep('setup');
                  setAudioBlob(null);
                  setResult(null);
                  setRecordingTime(0);
                }}
                className="py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                New Assessment
              </button>
                            <button
                onClick={() => {
                  setStep('recording');
                  setAudioBlob(null);
                  setResult(null);
                  setRecordingTime(0);
                }}
                className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Try Again
                            </button>
                        </div>
            </div>
        </div>
      )}
        </div>
    );
};

export default AudioAssessment; 