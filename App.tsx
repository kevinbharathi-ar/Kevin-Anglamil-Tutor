import React, { useState, useEffect } from 'react';
import { MessageCircle, Languages, Book } from 'lucide-react';
import ChatTab from './components/ChatTab';
import TranslateTab from './components/TranslateTab';
import LearnTab from './components/LearnTab';
import { AppTab } from './types';

export interface ThemeProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.LEARN);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cameraRequestCount, setCameraRequestCount] = useState(0);

  useEffect(() => {
    // Check system preference on init
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleStartCamera = () => {
    setActiveTab(AppTab.TRANSLATE);
    setCameraRequestCount(prev => prev + 1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.LEARN:
        return <LearnTab isDarkMode={isDarkMode} toggleTheme={toggleTheme} onStartCamera={handleStartCamera} />;
      case AppTab.CHAT:
        return <ChatTab />;
      case AppTab.TRANSLATE:
        return <TranslateTab cameraRequestCount={cameraRequestCount} />;
      default:
        return <LearnTab isDarkMode={isDarkMode} toggleTheme={toggleTheme} onStartCamera={handleStartCamera} />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-dark-bg transition-colors duration-200">
      
      {/* Main Content Area - takes available space */}
      <main className="flex-1 overflow-hidden relative w-full">
        {renderContent()}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="flex-none h-20 bg-white dark:bg-dark-card border-t border-slate-200 dark:border-dark-border flex items-center justify-around px-2 pb-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-200">
        <button
          onClick={() => setActiveTab(AppTab.LEARN)}
          className={`flex flex-col items-center justify-center w-20 h-14 rounded-2xl transition-all duration-200 ${
            activeTab === AppTab.LEARN 
              ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' 
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Book className={`w-6 h-6 mb-1 ${activeTab === AppTab.LEARN ? 'fill-current' : ''}`} strokeWidth={activeTab === AppTab.LEARN ? 2 : 1.5} />
          <span className="text-[10px] font-medium">Learn</span>
        </button>

        <button
          onClick={() => setActiveTab(AppTab.CHAT)}
          className={`flex flex-col items-center justify-center w-20 h-14 rounded-2xl transition-all duration-200 ${
            activeTab === AppTab.CHAT 
              ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' 
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <MessageCircle className={`w-6 h-6 mb-1 ${activeTab === AppTab.CHAT ? 'fill-current' : ''}`} strokeWidth={activeTab === AppTab.CHAT ? 2 : 1.5} />
          <span className="text-[10px] font-medium">Chat</span>
        </button>

        <button
          onClick={() => setActiveTab(AppTab.TRANSLATE)}
          className={`flex flex-col items-center justify-center w-20 h-14 rounded-2xl transition-all duration-200 ${
            activeTab === AppTab.TRANSLATE 
              ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' 
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Languages className="w-6 h-6 mb-1" strokeWidth={activeTab === AppTab.TRANSLATE ? 2 : 1.5} />
          <span className="text-[10px] font-medium">Translate</span>
        </button>
      </nav>
    </div>
  );
};

export default App;