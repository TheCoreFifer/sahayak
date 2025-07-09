import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import Dashboard from './components/dashboard/Dashboard';
import LocalContent from './components/features/LocalContent';
import SmartWorksheets from './components/features/SmartWorksheets';
import QuestionGenerator from './components/features/QuestionGenerator';
import KnowledgeBase from './components/features/KnowledgeBase';
import VisualAids from './components/features/VisualAids';
import WeeklyPlanner from './components/features/WeeklyPlanner';
import AudioAssessment from './components/features/AudioAssessment'; 

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <TopNav />
          
          {/* Main Content */}
          <main className="flex-1 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/content" element={<LocalContent />} />
              <Route path="/worksheets" element={<SmartWorksheets />} />
              <Route path="/questions" element={<QuestionGenerator />} />
              <Route path="/knowledge" element={<KnowledgeBase />} />
              <Route path="/visual" element={<VisualAids />} />
              <Route path="/planner" element={<WeeklyPlanner />} />
              <Route path="/assessments" element={<AudioAssessment />} />
              <Route path="/games" element={
                <div className="p-8">
                  <h2 className="text-3xl font-normal text-gray-900 mb-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>Educational Games</h2>
                  <p className="text-gray-600 text-lg font-normal">Coming soon...</p>
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
