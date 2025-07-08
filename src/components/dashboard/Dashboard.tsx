import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiBook, 
  FiFileText, 
  FiTarget,
  FiHelpCircle, 
  FiImage,
  FiTrendingUp,
  FiUsers,
  FiGlobe
} from 'react-icons/fi';

const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Check API connection
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/health');
        setIsConnected(response.ok);
      } catch {
        setIsConnected(false);
      }
    };

    checkConnection();
    return () => clearInterval(timer);
  }, []);

  const aiTools = [
    {
      title: 'Generate Content',
      description: 'Create culturally relevant stories, lessons, and educational content in local languages',
      icon: FiBook,
      href: '/content',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      title: 'Smart Worksheets',
      description: 'Transform textbook pages into multi-grade worksheets instantly',
      icon: FiFileText,
      href: '/worksheets',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    {
      title: 'Question Generator',
      description: 'Generate text-dependent questions for assessments and comprehension',
      icon: FiTarget,
      href: '/questions',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      title: 'Knowledge Base',
      description: 'Get instant explanations for complex student questions with local context',
      icon: FiHelpCircle,
      href: '/knowledge',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200'
    },
    {
      title: 'Visual Aids',
      description: 'Create simple drawings and charts for blackboard demonstrations',
      icon: FiImage,
      href: '/visual',
      color: 'bg-pink-50 hover:bg-pink-100 border-pink-200'
    }
  ];

  const stats = [
    { 
      number: '2.5M+', 
      label: 'Schools in India',
      icon: FiUsers,
      description: 'Educational institutions across the country'
    },
    { 
      number: '60%', 
      label: 'Multi-grade classrooms',
      icon: FiTrendingUp,
      description: 'Classrooms with multiple grade levels'
    },
    { 
      number: '22', 
      label: 'Official languages',
      icon: FiGlobe,
      description: 'Languages supported for content generation'
    },
    { 
      number: '5+', 
      label: 'Grade levels',
      icon: FiBook,
      description: 'Grades managed simultaneously'
    }
  ];

  return (
    <div className="min-h-screen page-bg">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* AI-Powered Teaching Tools Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-normal text-gray-900 mb-4">
              AI-Powered Teaching Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Empower your multi-grade classroom with intelligent tools designed for Indian educators
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiTools.map((tool, index) => (
              <Link
                key={index}
                to={tool.href}
                className={`group block p-8 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${tool.color}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <tool.icon className="w-8 h-8 text-gray-700 group-hover:text-gray-900" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-gray-900">
                      {tool.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sahayak Title */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg border shadow-sm">
              <div className={`w-3 h-3 rounded-full ${
                isConnected === null ? 'bg-yellow-400' : 
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">
                {isConnected === null ? 'Connecting...' : 
                 isConnected ? 'AI Service Online' : 'AI Service Offline'}
              </span>
            </div>
            <div className="text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border">
              {currentTime.toLocaleTimeString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                hour12: true,
                hour: '2-digit',
                minute: '2-digit'
              })} IST
            </div>
          </div>
          <h1 className="text-6xl font-normal text-blue-600 mb-4">
            Sahayak
          </h1>
          <p className="text-2xl text-gray-600 font-light">
            AI Teaching Assistant for Multi-Grade Classrooms
          </p>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
              <div className="text-lg font-semibold text-gray-700 mb-2">{stat.label}</div>
              <div className="text-sm text-gray-500">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Challenge Section */}
        <div className="bg-indigo-600 rounded-2xl p-12 text-white text-center">
          <h2 className="text-3xl font-normal mb-6">
            Addressing the Multi-Grade Challenge
          </h2>
          <p className="text-xl text-indigo-100 max-w-4xl mx-auto leading-relaxed mb-8">
            In countless under-resourced schools across India, a single teacher often manages multiple grades 
            in one classroom. Sahayak empowers these educators with AI tools to create localized content, 
            address diverse learning levels, and personalize education for every child.
          </p>
          <div className="flex justify-center">
            <Link
              to="/content"
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-50 transition-colors text-lg"
            >
              Start Creating Content
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-gray-600 text-lg">Powered by</span>
            <div className="flex items-center space-x-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" fill="#4285F4"/>
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" fill="#34A853"/>
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" fill="#FBBC05"/>
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" fill="#EA4335"/>
              </svg>
              <span className="text-xl font-medium text-gray-900">Gemini</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 