import React from 'react';
import { 
  FiSearch, 
  FiGlobe, 
  FiBell, 
  FiUser,
  FiSettings 
} from 'react-icons/fi';

const TopNav: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = React.useState('English');
  
  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for teaching resources..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4 ml-6">
          {/* Language Selector */}
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
            <FiGlobe className="w-5 h-5" />
            <span className="text-sm font-medium">{selectedLanguage}</span>
          </div>

          {/* Notifications */}
          <button className="p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <FiBell className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <FiSettings className="w-5 h-5" />
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <FiUser className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium">Teacher</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav; 