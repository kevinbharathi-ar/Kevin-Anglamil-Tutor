import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Volume2, Loader2 } from 'lucide-react';
import { Message } from '../types';
import { sendMessageToGemini, speakText, playAudioBuffer } from '../services/geminiService';

const ChatTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Vanakkam! I'm your English tutor. We can speak in Tamil or English. How can I help you today?",
      timestamp: Date.now(),
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const responseText = await sendMessageToGemini(history, userMsg.text);

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I had trouble connecting. Please try again.",
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    try {
      const buffer = await speakText(text);
      playAudioBuffer(buffer);
    } catch (e) {
      alert("Could not play audio.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-dark-bg transition-colors duration-200">
      {/* Header - Static flex item */}
      <div className="flex-none bg-white dark:bg-dark-card px-4 py-3 border-b border-slate-200 dark:border-dark-border shadow-sm z-10 transition-colors duration-200">
        <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          AI Chat Tutor
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Practice conversations in English & Tamil</p>
      </div>

      {/* Messages - Takes remaining space and scrolls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-colors duration-200 ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-dark-card text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-dark-border rounded-tl-none'
              } ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : ''}`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
              {msg.role === 'model' && !msg.isError && (
                <div className="mt-2 flex justify-end">
                   <button 
                    onClick={() => handleSpeak(msg.text)}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    aria-label="Speak text"
                   >
                     <Volume2 className="w-4 h-4" />
                   </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
           <div className="flex justify-start">
             <div className="bg-white dark:bg-dark-card rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-100 dark:border-dark-border">
               <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Static flex item at bottom */}
      <div className="flex-none bg-white dark:bg-dark-card p-3 border-t border-slate-200 dark:border-dark-border transition-colors duration-200">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type in Tamil or English..."
            className="flex-1 bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`p-2 rounded-full transition-colors ${
              input.trim() && !loading
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;