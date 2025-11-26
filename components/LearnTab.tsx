import React, { useEffect, useState } from 'react';
import { BookOpen, RefreshCw, Volume2, PlayCircle, Star, ChevronLeft, GraduationCap, ArrowRight, Sun, Moon, Camera } from 'lucide-react';
import { getDailyWord, getVocabularyByCategory, speakText, playAudioBuffer } from '../services/geminiService';
import { DailyWord, VocabularyItem } from '../types';

interface LearnTabProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onStartCamera: () => void;
}

const CATEGORIES = [
  { id: 'greetings', name: 'Greetings', icon: '👋' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'food', name: 'Food & Dining', icon: '🍔' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'emotions', name: 'Emotions', icon: '😊' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
];

const LearnTab: React.FC<LearnTabProps> = ({ isDarkMode, toggleTheme, onStartCamera }) => {
  // View State
  const [view, setView] = useState<'dashboard' | 'lesson'>('dashboard');
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[0] | null>(null);

  // Data State
  const [wordData, setWordData] = useState<DailyWord | null>(null);
  const [loadingWord, setLoadingWord] = useState(true);

  const [lessonWords, setLessonWords] = useState<VocabularyItem[]>([]);
  const [loadingLesson, setLoadingLesson] = useState(false);

  // Fetch Word of the Day
  const fetchWord = async () => {
    setLoadingWord(true);
    const data = await getDailyWord();
    setWordData(data);
    setLoadingWord(false);
  };

  useEffect(() => {
    fetchWord();
  }, []);

  // Handle Category Click
  const handleCategoryClick = async (category: typeof CATEGORIES[0]) => {
    setActiveCategory(category);
    setView('lesson');
    setLessonWords([]); // Reset previous
    setLoadingLesson(true);
    
    const words = await getVocabularyByCategory(category.name);
    setLessonWords(words);
    setLoadingLesson(false);
  };

  const handleBackToDash = () => {
    setView('dashboard');
    setActiveCategory(null);
  };

  const handleSpeak = async (txt: string) => {
    try {
      const buffer = await speakText(txt);
      playAudioBuffer(buffer);
    } catch (e) {
      // ignore
    }
  };

  // --- Render Dashboard ---
  if (view === 'dashboard') {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-dark-bg p-4 pb-6 overflow-y-auto no-scrollbar transition-colors duration-200">
        <header className="mb-6 pt-2 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              Anglamil Tutor
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Learn English from Tamil.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onStartCamera}
              className="p-2 rounded-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              aria-label="Open Camera Translator"
            >
              <Camera className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Word of the Day Card - Mobile Optimized */}
        <div className="bg-gradient-to-br from-primary-600 to-indigo-700 dark:from-indigo-900 dark:to-slate-900 rounded-2xl p-5 text-white shadow-lg shadow-primary-500/20 dark:shadow-none relative overflow-hidden mb-8 min-h-[220px]">
          {/* Decorative Background Element */}
          <div className="absolute -top-6 -right-6 opacity-10 pointer-events-none">
             <Star className="w-32 h-32 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border border-white/10 flex items-center gap-1.5 shadow-sm">
                      <Star className="w-3 h-3 fill-white text-white" />
                      <span>Word of the Day</span>
                  </div>
                  <button 
                    onClick={fetchWord} 
                    disabled={loadingWord} 
                    className="p-2 -mr-2 -mt-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
                    aria-label="Refresh word"
                  >
                      <RefreshCw className={`w-5 h-5 ${loadingWord ? 'animate-spin' : ''}`} />
                  </button>
              </div>
              
              {loadingWord ? (
                  <div className="py-4 flex flex-col items-center justify-center space-y-3 opacity-50">
                      <div className="animate-pulse bg-white/30 h-8 w-3/4 rounded-lg"></div>
                      <div className="animate-pulse bg-white/20 h-4 w-1/2 rounded-lg"></div>
                      <div className="animate-pulse bg-white/10 h-16 w-full rounded-xl mt-2"></div>
                  </div>
              ) : wordData ? (
                  <div className="flex flex-col gap-4">
                      <div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                              {/* Font size adjusted for mobile visibility */}
                              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug break-words">{wordData.word}</h2>
                              <button 
                                onClick={() => handleSpeak(wordData.word)} 
                                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all active:scale-95 flex-shrink-0"
                                aria-label="Listen to word"
                              >
                                  <Volume2 className="w-4 h-4" />
                              </button>
                          </div>
                          <p className="text-base sm:text-lg text-blue-50 font-medium leading-normal">{wordData.tamilMeaning}</p>
                      </div>

                      <div className="bg-black/20 rounded-xl p-3 sm:p-4 border border-white/10 backdrop-blur-sm">
                          <p className="text-sm sm:text-base mb-2 leading-relaxed font-serif text-white/95 italic">"{wordData.exampleSentence}"</p>
                          <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">{wordData.exampleTamil}</p>
                           <button 
                             onClick={() => handleSpeak(wordData.exampleSentence)} 
                             className="mt-2 flex items-center gap-2 text-[10px] font-bold text-blue-200 hover:text-white uppercase tracking-wide transition-colors py-1"
                           >
                              <PlayCircle className="w-3 h-3" /> Listen
                          </button>
                      </div>
                  </div>
              ) : (
                  <div className="py-8 text-center opacity-80">
                      <p>Tap refresh to load a word.</p>
                  </div>
              )}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="flex justify-between items-end mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Topic Dictionary</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">Oxford style</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {CATEGORIES.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => handleCategoryClick(cat)}
                className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all text-left group relative overflow-hidden active:scale-[0.98]"
              >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 pointer-events-none"></div>
                  
                  <div className="relative z-10">
                      <span className="text-2xl mb-3 block">{cat.icon}</span>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100">{cat.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                          <span>Explore</span>
                          <ArrowRight className="w-3 h-3" />
                      </div>
                  </div>
              </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Render Lesson View ---
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-dark-bg transition-colors duration-200">
      {/* Lesson Header */}
      <div className="flex-none bg-white dark:bg-dark-card px-4 py-3 border-b border-slate-200 dark:border-dark-border sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button 
          onClick={handleBackToDash}
          className="p-2 -ml-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors active:bg-slate-100 dark:active:bg-slate-700"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
           <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
             {activeCategory?.icon} {activeCategory?.name}
           </h1>
           <p className="text-xs text-slate-500 dark:text-slate-400">Vocabulary List</p>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-6 no-scrollbar">
        {loadingLesson ? (
           <div className="space-y-4">
             {[1,2,3].map(i => (
               <div key={i} className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-100 dark:border-dark-border shadow-sm animate-pulse">
                 <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded mb-2"></div>
                 <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded mb-4"></div>
                 <div className="h-16 w-full bg-slate-50 dark:bg-slate-900 rounded"></div>
               </div>
             ))}
           </div>
        ) : (
          <div className="space-y-4">
            {lessonWords.length > 0 ? (
                lessonWords.map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-100 dark:border-dark-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 mr-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white break-words">{item.word}</h3>
                            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-0.5">{item.tamilMeaning}</p>
                        </div>
                        <button 
                            onClick={() => handleSpeak(item.word)}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors flex-shrink-0"
                            aria-label="Listen"
                        >
                            <Volume2 className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="mb-3">
                        <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">"{item.definition}"</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-black/30 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                        <div className="flex gap-2 items-start">
                            <div className="mt-1.5 min-w-[3px] h-3 bg-primary-300 dark:bg-primary-600 rounded-full flex-shrink-0"></div>
                            <div>
                                <p className="text-sm text-slate-800 dark:text-slate-200 mb-1 leading-relaxed">{item.exampleSentence}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.exampleTamil}</p>
                            </div>
                        </div>
                    </div>
                  </div>
                ))
            ) : (
                <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No words found for this category.</p>
                    <button onClick={() => activeCategory && handleCategoryClick(activeCategory)} className="text-primary-600 dark:text-primary-400 text-sm mt-2 font-medium">Try Again</button>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnTab;