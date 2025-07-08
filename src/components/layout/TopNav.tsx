import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  FiSearch, 
  FiGlobe, 
  FiBell, 
  FiUser,
  FiSettings,
  FiChevronRight,
  FiHome,
  FiHelpCircle,
  FiZap,
  FiChevronUp,
  FiChevronDown
} from 'react-icons/fi';

const TopNav: React.FC = () => {
  const location = useLocation();
  const [selectedLanguage, setSelectedLanguage] = React.useState('English');
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Auto-collapse when route changes and stay collapsed
  React.useEffect(() => {
    setIsCollapsed(true);
  }, [location.pathname]);
  
  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' }
  ];

  // Breadcrumb mapping
  type Breadcrumb = {
    name: string;
    href: string;
    icon?: any;
  };

  const getBreadcrumbs = (): Breadcrumb[] => {
    const path = location.pathname;
    const breadcrumbs: Breadcrumb[] = [
      { name: 'Home', href: '/', icon: FiHome }
    ];

    switch (path) {
      case '/':
      case '/dashboard':
        breadcrumbs.push({ name: 'Dashboard', href: '/' });
        break;
      case '/content':
        breadcrumbs.push({ name: 'Generate Content', href: '/content' });
        break;
      case '/worksheets':
        breadcrumbs.push({ name: 'Smart Worksheets', href: '/worksheets' });
        break;
      case '/questions':
        breadcrumbs.push({ name: 'Question Generator', href: '/questions' });
        break;
      case '/knowledge':
        breadcrumbs.push({ name: 'Knowledge Base', href: '/knowledge' });
        break;
      case '/visual':
        breadcrumbs.push({ name: 'Visual Aids', href: '/visual' });
        break;
      case '/assessments':
        breadcrumbs.push({ name: 'Audio Assessments', href: '/assessments' });
        break;
      case '/games':
        breadcrumbs.push({ name: 'Educational Games', href: '/games' });
        break;
      case '/planner':
        breadcrumbs.push({ name: 'Lesson Planner', href: '/planner' });
        break;
      default:
        breadcrumbs.push({ name: 'Page', href: path });
    }

    return breadcrumbs;
  };

  const getPageDescription = () => {
    const path = location.pathname;
    const descriptions: Record<string, string> = {
      '/': 'Overview and quick access to all teaching tools',
      '/dashboard': 'Overview and quick access to all teaching tools',
      '/content': 'Create culturally relevant stories and learning materials',
      '/worksheets': 'Generate differentiated worksheets from textbook images',
      '/questions': 'Create assessments with exact question counts',
      '/knowledge': 'Get instant explanations for any student question',
      '/visual': 'Generate simple blackboard drawings and teaching aids',
      '/assessments': 'Coming soon - Voice-based reading evaluations',
      '/games': 'Coming soon - Interactive educational experiences',
      '/planner': 'Coming soon - AI-powered weekly lesson planning'
    };
    return descriptions[path] || 'AI-powered teaching assistance';
  };

  const breadcrumbs = getBreadcrumbs();
  const pageDescription = getPageDescription();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 transition-all duration-300">
      {/* Collapse/Expand Button for TopNav */}
      <div className="absolute right-6 top-4 z-10">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 bg-white hover:bg-gray-50 rounded-lg shadow-sm border border-gray-200 transition-all duration-200"
          title={isCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {isCollapsed ? (
            <FiChevronDown className="w-4 h-4 text-gray-600" />
          ) : (
            <FiChevronUp className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Main Navigation Bar */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
        isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
      }`}>
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Breadcrumbs & Search Section */}
            <div className="flex-1 max-w-4xl">
              {/* Breadcrumbs - Google Style */}
              <nav className="flex items-center space-x-2 mb-4">
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.href}>
                    {index > 0 && (
                      <FiChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <Link
                      to={breadcrumb.href}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                        index === breadcrumbs.length - 1
                          ? 'text-gray-900 font-medium bg-gray-100'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}
                    >
                      {breadcrumb.icon && <breadcrumb.icon className="w-4 h-4" />}
                      <span className="text-sm">{breadcrumb.name}</span>
                    </Link>
                  </React.Fragment>
                ))}
              </nav>

              {/* Page Title and Description */}
              <div className="mb-6">
                <h1 className="text-2xl font-normal text-gray-900 tracking-tight mb-2" style={{ fontFamily: 'Product Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
                  {breadcrumbs[breadcrumbs.length - 1].name}
                </h1>
                <p className="text-sm text-gray-600 font-normal">{pageDescription}</p>
              </div>

              {/* Enhanced Search Bar */}
              <div className="relative max-w-2xl">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <FiSearch className="text-gray-400 w-4 h-4" />
                  <div className="w-px h-4 bg-gray-300"></div>
                </div>
                <input
                  type="text"
                  placeholder="Search for teaching resources, questions, or explanations..."
                  className="w-full pl-12 pr-16 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-gray-900 placeholder-gray-500 bg-white shadow-sm font-normal"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3 ml-6">
              {/* AI Status Indicator */}
              <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 font-medium">AI Ready</span>
              </div>

              {/* Language Selector */}
              <div className="relative">
                <button className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <FiGlobe className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:block">{selectedLanguage}</span>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-1">
                {/* Help */}
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors" title="Help & Support">
                  <FiHelpCircle className="w-4 h-4" />
                </button>

                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors" title="Notifications">
                  <FiBell className="w-4 h-4" />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </button>

                {/* Settings */}
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors" title="Settings">
                  <FiSettings className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer ml-2">
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">Teacher</div>
                  <div className="text-xs text-gray-500">Multi-grade Classroom</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access Bar */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Quick Access:</span>
              <div className="flex items-center space-x-3">
                <Link
                  to="/knowledge"
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-colors font-medium border border-gray-200"
                >
                  <FiHelpCircle className="w-3 h-3" />
                  <span>Ask Question</span>
                </Link>
                <Link
                  to="/questions"
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-colors font-medium border border-gray-200"
                >
                  <FiZap className="w-3 h-3" />
                  <span>Generate Questions</span>
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>Last updated:</span>
              <time>{new Date().toLocaleDateString()}</time>
            </div>
          </div>
        </div>
      </div>

      {/* Minimized State */}
      {isCollapsed && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Product Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
                {breadcrumbs[breadcrumbs.length - 1].name}
              </h2>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600 font-medium">AI Ready</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                to="/knowledge"
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Knowledge Base"
              >
                <FiHelpCircle className="w-4 h-4" />
              </Link>
              <Link
                to="/questions"
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Question Generator"
              >
                <FiZap className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopNav; 