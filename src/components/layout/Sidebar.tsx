import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiBook,
  FiFileText,
  FiHelpCircle,
  FiImage,
  FiTarget,
  FiMic,
  FiPlay,
  FiCalendar,
  FiUsers
} from 'react-icons/fi';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/',
      icon: FiHome
    },
    { 
      name: 'Generate Content', 
      href: '/content',
      icon: FiBook
    },
    { 
      name: 'Smart Worksheets', 
      href: '/worksheets',
      icon: FiFileText
    },
    { 
      name: 'Question Generator', 
      href: '/questions',
      icon: FiTarget
    },
    { 
      name: 'Knowledge Base', 
      href: '/knowledge',
      icon: FiHelpCircle
    },
    { 
      name: 'Visual Aids', 
      href: '/visual',
      icon: FiImage
    },
    { 
      name: 'Audio Assessments', 
      href: '/assessments',
      icon: FiMic,
      comingSoon: true
    },
    { 
      name: 'Educational Games', 
      href: '/games',
      icon: FiPlay,
      comingSoon: true
    },
    { 
      name: 'Lesson Planner', 
      href: '/planner',
      icon: FiCalendar,
      comingSoon: true
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  return (
    <div className="w-72 bg-white border-r border-gray-200 h-screen">
      <div className="p-6">
        {/* Brand - Google Style */}
        <div className="flex items-center space-x-3 mb-12">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FiUsers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-gray-900">Sahayak</h1>
            <p className="text-sm text-gray-500">AI Teaching Assistant</p>
          </div>
        </div>

        {/* Navigation - Google Style */}
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'}`} />
              <span className="text-sm font-medium flex-1">{item.name}</span>
              {item.comingSoon && (
                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">
                  Soon
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* AI Status - Google Style */}
        <div className="mt-12 p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">AI Status</h3>
              <p className="text-xs text-gray-600">
                <span className="text-green-600 font-medium">Connected to Gemini</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 