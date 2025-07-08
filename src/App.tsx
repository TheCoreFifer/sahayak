import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import Dashboard from './components/dashboard/Dashboard';
import LocalContent from './components/features/LocalContent';
import SmartWorksheets from './components/features/SmartWorksheets';
import QuestionGenerator from './components/features/QuestionGenerator';
import KnowledgeBase from './components/features/KnowledgeBase';
import VisualAids from './components/features/VisualAids';

function App() {
  return (
    <Router>
              <div className="flex h-screen page-bg">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <TopNav />
          
          {/* Main Content */}
          <main className="flex-1 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/content" element={<LocalContent />} />
              <Route path="/worksheets" element={<SmartWorksheets />} />
              <Route path="/questions" element={<QuestionGenerator />} />
              <Route path="/knowledge" element={<KnowledgeBase />} />
              <Route path="/visual" element={<VisualAids />} />
              <Route path="/assessments" element={
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">Audio Assessments</h2>
                  <p className="text-slate-600 text-lg">Coming soon...</p>
                </div>
              } />
              <Route path="/games" element={
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">Educational Games</h2>
                  <p className="text-slate-600 text-lg">Coming soon...</p>
                </div>
              } />
              <Route path="/planner" element={
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">Lesson Planner</h2>
                  <p className="text-slate-600 text-lg">Coming soon...</p>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
