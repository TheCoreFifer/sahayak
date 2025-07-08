import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiBook, 
  FiFileText, 
  FiHelpCircle, 
  FiImage, 
  FiMic,
  FiPlay,
  FiCalendar,
  FiUsers,
  FiTarget,
  FiZap,
  FiCheck,
  FiClock,
  FiMenu,
  FiGrid,
  FiBookOpen
} from 'react-icons/fi';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/',
      icon: FiHome,
      description: 'Overview & Quick Actions'
    },
    { 
      name: 'Generate Content', 
      href: '/content',
      icon: FiBook,
      description: 'Create Stories & Materials'
    },
    { 
      name: 'Smart Worksheets', 
      href: '/worksheets',
      icon: FiFileText,
      description: 'AI-Powered Worksheets'
    },
    { 
      name: 'Quick Quiz Generator', 
      href: '/questions',
      icon: FiTarget,
      description: 'Create Assessments'
    },
    { 
      name: 'Knowledge Base', 
      href: '/knowledge',
      icon: FiHelpCircle,
      description: 'Instant Explanations'
    },
    { 
      name: 'Visual Aids', 
      href: '/visual',
      icon: FiImage,
      description: 'Teaching Diagrams'
    },
    { 
      name: 'Audio Assessments', 
      href: '/assessments',
      icon: FiMic,
      description: 'Voice Evaluations',
      comingSoon: true
    },
    { 
      name: 'Educational Games', 
      href: '/games',
      icon: FiPlay,
      description: 'Interactive Learning',
      comingSoon: true
    },
    { 
      name: 'Weekly Planner', 
      href: '/planner',
      icon: FiCalendar,
      description: 'One-Click Prep Kit'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  const completedFeatures = navigationItems.filter(item => !item.comingSoon).length;
  const totalFeatures = navigationItems.length;

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-80'} h-screen bg-white border-r border-gray-200 transition-all duration-300`}>
      <div className="flex flex-col h-full">
        {/* Brand Header - Google Style */}
        <div className={`${isCollapsed ? 'px-2 py-4' : 'px-6 py-6'} border-b border-gray-200 relative`}>
          {isCollapsed ? (
            /* Collapsed State - Only Hamburger Menu */
            <div className="flex justify-center">
              <button
                onClick={onToggle}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Expand sidebar"
              >
                <FiMenu className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Expanded State - Brand + Hamburger */
            <>
              {/* Hamburger Menu Button */}
              <button
                onClick={onToggle}
                className="absolute top-6 right-6 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Collapse sidebar"
              >
                <FiMenu className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                    <FiUsers className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-normal tracking-tight" style={{ fontFamily: 'Product Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
                    <span className="text-blue-500" style={{ fontWeight: 400 }}>S</span>
                    <span className="text-red-500" style={{ fontWeight: 400 }}>a</span>
                    <span className="text-yellow-500" style={{ fontWeight: 400 }}>h</span>
                    <span className="text-blue-500" style={{ fontWeight: 400 }}>a</span>
                    <span className="text-green-500" style={{ fontWeight: 400 }}>y</span>
                    <span className="text-red-500" style={{ fontWeight: 400 }}>a</span>
                    <span className="text-blue-500" style={{ fontWeight: 400 }}>k</span>
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5 font-normal">AI Teaching Assistant</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Progress Overview */}
        {!isCollapsed && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Feature Progress</h3>
                <span className="text-xs text-gray-500">{completedFeatures}/{totalFeatures}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedFeatures / totalFeatures) * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <FiCheck className="w-3 h-3 text-green-600 mr-1" />
                {completedFeatures} features ready
                <FiClock className="w-3 h-3 text-gray-400 ml-3 mr-1" />
                {totalFeatures - completedFeatures} coming soon
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-4 overflow-y-auto`}>
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-3 py-3'} rounded-lg transition-all duration-200 relative ${
                  isActive(item.href)
                    ? 'bg-gray-100 text-gray-900'
                    : item.comingSoon
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={(e) => item.comingSoon && e.preventDefault()}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}
                title={isCollapsed ? item.name : undefined}
              >
                {/* Active Indicator */}
                {isActive(item.href) && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gray-900 rounded-r"></div>
                )}
                
                <div className={`p-2 rounded-lg ${isCollapsed ? '' : 'mr-3'} ${
                  isActive(item.href)
                    ? 'bg-white shadow-sm'
                    : item.comingSoon
                    ? 'bg-gray-100'
                    : 'bg-gray-50 group-hover:bg-white group-hover:shadow-sm'
                }`}>
                  <item.icon className={`w-4 h-4 ${
                    isActive(item.href)
                      ? 'text-gray-900'
                      : item.comingSoon
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`} />
                </div>
                
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${
                        isActive(item.href)
                          ? 'text-gray-900'
                          : item.comingSoon
                          ? 'text-gray-400'
                          : 'text-gray-900'
                      }`}>
                        {item.name}
                      </div>
                      <div className={`text-xs mt-0.5 ${
                        isActive(item.href)
                          ? 'text-gray-600'
                          : item.comingSoon
                          ? 'text-gray-400'
                          : 'text-gray-500'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                    
                    {item.comingSoon && (
                      <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                        Soon
                      </span>
                    )}
                    
                    {!item.comingSoon && !isActive(item.href) && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>
        </nav>


      </div>
    </aside>
  );
};

export default Sidebar; 