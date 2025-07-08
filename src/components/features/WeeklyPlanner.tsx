import React, { useState, useRef, type KeyboardEvent } from 'react';
import { 
  FiUploadCloud, FiFileText, FiClipboard, FiZap, FiCheckCircle, FiLoader, FiXCircle, FiEye, 
  FiX, FiDownload, FiPlus, FiStar, FiCalendar, FiArrowRight, FiSave, FiSettings, FiClock,
  FiUsers, FiBookOpen, FiTarget, FiChevronDown, FiChevronUp, FiPlay
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { analyzeTextbookImage, generateWeeklyPlan, API_BASE_URL } from '../../services/api';

// --- TYPE DEFINITIONS ---
interface AnalyzedContent {
  topic: string;
  keyTerms: string[];
  concepts: string[];
  suggestedGrades: string[];
}

interface Activity {
  time: string;
  activity: string;
  description: string;
  materials: string[];
  gradeAdaptation: string;
}

interface DailyPlan {
  day: string;
  title: string;
  duration: string;
  activities: Activity[];
}

interface WeeklyPlan {
  week: number;
  theme: string;
  overview: string;
  learningObjectives: string[];
  dailyPlans: {
    monday: DailyPlan;
    tuesday: DailyPlan;
    wednesday: DailyPlan;
    thursday: DailyPlan;
    friday: DailyPlan;
  };
  resources: {
    materials: string[];
    culturalConnections: string[];
    assessmentTools: string[];
  };
  homework: string[];
  adaptations: {
    lowerGrades: string;
    higherGrades: string;
    mixedGrade: string;
  };
}

// --- MAIN COMPONENT ---
const WeeklyPlanner: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedContent, setAnalyzedContent] = useState<AnalyzedContent | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [editableGrades, setEditableGrades] = useState<string[]>([]);
  const [newGrade, setNewGrade] = useState('');
  const [numberOfWeeks, setNumberOfWeeks] = useState(1);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [previewDay, setPreviewDay] = useState<{ week: number; day: string; plan: DailyPlan } | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- API & DATA HANDLING ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(null);
      setAnalyzedContent(null);
      setAnalysisError(null);
      setEditableGrades([]);
      setWeeklyPlans([]);
      setGenerationError(null);
      setPreviewDay(null);

      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

  const handleAnalyze = async () => {
    if (!fileInputRef.current?.files?.[0]) return;
    const file = fileInputRef.current.files[0];

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalyzedContent(null);

    try {
      const base64 = await toBase64(file);
      const result = await analyzeTextbookImage(base64, file.type);
      if (result.success) {
        setAnalyzedContent(result.data);
        setEditableGrades(result.data.suggestedGrades || []);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to analyze the image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!analyzedContent) return;

    setIsGenerating(true);
    setGenerationError(null);
    setWeeklyPlans([]);

    try {
      const result = await generateWeeklyPlan(analyzedContent, editableGrades, numberOfWeeks);
      if (result.success) {
        setWeeklyPlans(result.data.weeklyPlans);
        setExpandedWeeks(new Set([1])); // Expand first week by default
      } else {
        throw new Error(result.error || 'Failed to generate weekly plan');
      }
    } catch (err: any) {
      setGenerationError(err.message || 'Failed to generate weekly plan');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // --- UI HANDLERS ---
  const handleAddGrade = () => {
    const gradeVal = newGrade.trim();
    if (gradeVal && !editableGrades.includes(`Grade ${gradeVal}`)) {
      setEditableGrades([...editableGrades, `Grade ${gradeVal}`].sort());
      setNewGrade('');
    }
  };

  const handleRemoveGrade = (gradeToRemove: string) => {
    setEditableGrades(editableGrades.filter(grade => grade !== gradeToRemove));
  };

  const toggleWeekExpansion = (week: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(week)) {
      newExpanded.delete(week);
    } else {
      newExpanded.add(week);
    }
    setExpandedWeeks(newExpanded);
  };

  const getDayIcon = (day: string) => {
    const dayIcons: { [key: string]: React.ReactNode } = {
      'Monday': <FiPlay className="w-4 h-4" />,
      'Tuesday': <FiBookOpen className="w-4 h-4" />,
      'Wednesday': <FiUsers className="w-4 h-4" />,
      'Thursday': <FiStar className="w-4 h-4" />,
      'Friday': <FiTarget className="w-4 h-4" />
    };
    return dayIcons[day] || <FiCalendar className="w-4 h-4" />;
  };

  const getDayColor = (day: string) => {
    const dayColors: { [key: string]: string } = {
      'Monday': 'bg-blue-100 text-blue-700',
      'Tuesday': 'bg-green-100 text-green-700',
      'Wednesday': 'bg-purple-100 text-purple-700',
      'Thursday': 'bg-orange-100 text-orange-700',
      'Friday': 'bg-red-100 text-red-700'
    };
    return dayColors[day] || 'bg-gray-100 text-gray-700';
  };
  
  // --- RENDER ---
  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>Weekly Lesson Planner</h1>
          <p className="text-lg text-gray-600 mt-2">Generate a complete weekly lesson plan with daily schedules from any textbook page.</p>
        </div>

        {/* --- ROW 1: Upload & Analyze --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Upload Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-3 font-bold text-lg">1</span>
                Upload Textbook Page
            </h2>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => fileInputRef.current?.click()}>
              {uploadedImage ? <img src={uploadedImage} alt="Uploaded textbook" className="max-h-40 mx-auto rounded-md shadow-md" />
              : <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400" />}
              <p className="mt-4 text-sm font-medium text-gray-600">{uploadedImage ? 'Click to change image' : 'Click to upload image'}</p>
              <p className="text-xs text-gray-500 mt-1">PNG or JPG accepted</p>
            </div>
            {uploadedImage && (
              <button onClick={handleAnalyze} disabled={isAnalyzing || !!analyzedContent} className="w-full mt-4 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:opacity-75 flex items-center justify-center">
                {isAnalyzing ? <><FiLoader className="animate-spin mr-2" /> Analyzing...</> : (analyzedContent ? <><FiCheckCircle className="mr-2" /> Analysis Complete</> : <><FiZap className="mr-2" /> Analyze Content</>)}
              </button>
            )}
            {analysisError && <p className="text-red-600 text-sm mt-2">{analysisError}</p>}
          </div>
          
          {/* Analysis Result Card */}
          <AnimatePresence>
          {analyzedContent && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-9 h-9 bg-green-100 text-green-700 rounded-full flex items-center justify-center mr-3 font-bold text-lg">2</span>
                Analysis Results
              </h2>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-800">Topic:</p>
                  <p className="text-gray-600">{analyzedContent.topic}</p>
                </div>
                 <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-800">Key Concepts:</p>
                  <p className="text-gray-600">{analyzedContent.concepts.join(', ')}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-800">AI Suggested Grades:</p>
                  <p className="text-gray-600">{analyzedContent.suggestedGrades.join(', ')}</p>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* --- ROW 2: Configure & Generate --- */}
        <AnimatePresence>
        {analyzedContent && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Configuration */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mr-3 font-bold text-lg">3</span>
                Configure Your Plan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Grades (Editable)</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                      {editableGrades.map(grade => (
                          <span key={grade} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium pl-3 pr-2 py-1 rounded-full">
                              {grade}
                              <button onClick={() => handleRemoveGrade(grade)} className="ml-2 -mr-1 p-0.5 rounded-full hover:bg-blue-200">
                                  <FiX className="w-3.5 h-3.5"/>
                              </button>
                          </span>
                      ))}
                  </div>
                  <div className="flex gap-2">
                      <input type="number" value={newGrade} onChange={e => setNewGrade(e.target.value)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddGrade()} placeholder="Add grade level (e.g., 6)" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"/>
                      <button onClick={handleAddGrade} className="h-10 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium flex items-center"><FiPlus className="mr-1"/> Add</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Weeks</label>
                  <input 
                    type="number" 
                    value={numberOfWeeks} 
                    onChange={e => setNumberOfWeeks(Math.max(1, parseInt(e.target.value) || 1))} 
                    min="1" 
                    max="4"
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Generate plans for 1-4 weeks</p>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center mb-8">
              <button onClick={handleGeneratePlan} disabled={isGenerating || editableGrades.length === 0} className="bg-gray-900 text-white font-semibold py-4 px-8 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 flex items-center justify-center mx-auto text-lg shadow-md">
                {isGenerating ? <><FiLoader className="animate-spin mr-3" /> Generating Your Plan...</> : <><FiStar className="mr-3" /> Generate Weekly Plan</>}
              </button>
              {generationError && <p className="text-red-600 text-sm mt-3">{generationError}</p>}
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* --- ROW 3: Weekly Plans --- */}
        <AnimatePresence>
        {weeklyPlans.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center"><FiCalendar className="mr-3 text-blue-600"/>Your Weekly Lesson Plans</h2>
              <div className="flex items-center space-x-2">
                 <button className="flex items-center text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg" title="Save to Google Drive (Coming Soon!)" disabled>
                    <FiSave className="w-4 h-4 mr-2"/> Save
                  </button>
                  <button className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg">
                    <FiDownload className="w-4 h-4 mr-2"/> Download All
                  </button>
              </div>
            </div>
            
            {weeklyPlans.map(plan => (
              <div key={plan.week} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Week Header */}
                <div 
                  className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
                  onClick={() => toggleWeekExpansion(plan.week)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">Week {plan.week}: {plan.theme}</h3>
                      <p className="text-gray-600 text-sm">{plan.overview}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">
                        {expandedWeeks.has(plan.week) ? 'Collapse' : 'Expand'}
                      </span>
                      {expandedWeeks.has(plan.week) ? 
                        <FiChevronUp className="w-5 h-5 text-gray-500" /> : 
                        <FiChevronDown className="w-5 h-5 text-gray-500" />
                      }
                    </div>
                  </div>
                </div>

                {/* Week Content */}
                <AnimatePresence>
                {expandedWeeks.has(plan.week) && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="p-6">
                      {/* Learning Objectives */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                          <FiTarget className="mr-2 text-blue-600" />
                          Learning Objectives
                        </h4>
                        <ul className="space-y-2">
                          {plan.learningObjectives.map((objective, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              <span className="text-gray-700">{objective}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Daily Plans */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <FiCalendar className="mr-2 text-blue-600" />
                          Daily Schedule
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                          {Object.entries(plan.dailyPlans).map(([dayKey, dayPlan]) => (
                            <div key={dayKey} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className={`p-2 rounded-lg ${getDayColor(dayPlan.day)}`}>
                                    {getDayIcon(dayPlan.day)}
                                  </div>
                                  <div>
                                    <h5 className="font-semibold text-gray-800">{dayPlan.day}</h5>
                                    <p className="text-xs text-gray-500">{dayPlan.duration}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setPreviewDay({ week: plan.week, day: dayPlan.day, plan: dayPlan })}
                                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full"
                                  title="View detailed schedule"
                                >
                                  <FiEye className="w-4 h-4" />
                                </button>
                              </div>
                              <h6 className="font-medium text-gray-700 mb-2">{dayPlan.title}</h6>
                              <div className="space-y-1">
                                {dayPlan.activities.slice(0, 2).map((activity, idx) => (
                                  <div key={idx} className="text-xs text-gray-600">
                                    <span className="font-medium">{activity.time}:</span> {activity.activity}
                                  </div>
                                ))}
                                {dayPlan.activities.length > 2 && (
                                  <div className="text-xs text-gray-500 italic">
                                    +{dayPlan.activities.length - 2} more activities
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Resources & Homework */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <FiBookOpen className="mr-2 text-blue-600" />
                            Resources & Materials
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Materials:</p>
                              <p className="text-sm text-gray-600">{plan.resources.materials.join(', ')}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Cultural Connections:</p>
                              <p className="text-sm text-gray-600">{plan.resources.culturalConnections.join(', ')}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <FiClipboard className="mr-2 text-blue-600" />
                            Weekly Homework
                          </h4>
                          <ul className="space-y-2">
                            {plan.homework.map((hw, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start">
                                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                {hw}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Daily Plan Preview Modal */}
      <AnimatePresence>
        {previewDay && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                    <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-800">Week {previewDay.week} - {previewDay.plan.day}</h2>
                          <p className="text-gray-600 text-sm">{previewDay.plan.title} • {previewDay.plan.duration}</p>
                        </div>
                        <button onClick={() => setPreviewDay(null)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full"><FiX className="w-6 h-6"/></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <div className="space-y-6">
                          {previewDay.plan.activities.map((activity, idx) => (
                            <div key={idx} className="border-l-4 border-blue-500 pl-6 py-4 bg-gray-50 rounded-r-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                    {activity.time}
                                  </div>
                                  <h3 className="font-semibold text-gray-800">{activity.activity}</h3>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <FiClock className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-500">{activity.time.split('-')[1]?.replace('min', '') || '15'} min</span>
                                </div>
                              </div>
                              <p className="text-gray-700 mb-3">{activity.description}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">Materials:</p>
                                  <p className="text-gray-600">{activity.materials.join(', ')}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-700 mb-1">Grade Adaptation:</p>
                                  <p className="text-gray-600">{activity.gradeAdaptation}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeeklyPlanner; 