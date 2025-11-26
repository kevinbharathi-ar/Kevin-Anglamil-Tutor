import React, { useState, useRef, useEffect } from 'react';
import { ArrowRightLeft, Volume2, Copy, Check, Loader2, Camera, X } from 'lucide-react';
import { translateText, translateImage, speakText, playAudioBuffer } from '../services/geminiService';
import { TranslationResult } from '../types';

interface TranslateTabProps {
  cameraRequestCount?: number;
}

const TranslateTab: React.FC<TranslateTabProps> = ({ cameraRequestCount = 0 }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<'en-ta' | 'ta-en'>('en-ta');
  const [copied, setCopied] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Listen for external trigger to open camera
  useEffect(() => {
    if (cameraRequestCount > 0) {
      startCamera();
    }
  }, [cameraRequestCount]);

  // Clean up camera stream when component unmounts or camera modal closes
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setShowCamera(false);
    }
  };

  const captureAndTranslate = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get base64 string
        const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
        
        stopCamera();
        setShowCamera(false);
        setLoading(true);
        setResult(null);

        try {
          const fromLang = direction === 'en-ta' ? 'en' : 'ta';
          const res = await translateImage(base64Image, fromLang);
          setResult(res);
        } catch (e) {
          console.error(e);
          alert("Could not translate image.");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const fromLang = direction === 'en-ta' ? 'en' : 'ta';
      const res = await translateText(text, fromLang);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'en-ta' ? 'ta-en' : 'en-ta');
    setText('');
    setResult(null);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.translated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeak = async (txt: string) => {
    try {
      const buffer = await speakText(txt);
      playAudioBuffer(buffer);
    } catch (e) {
      alert("Audio generation failed");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-dark-bg p-4 pb-6 overflow-y-auto transition-colors duration-200">
      <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Translator</h1>

      {/* Language Switcher */}
      <div className="flex items-center justify-between bg-white dark:bg-dark-card rounded-xl p-2 shadow-sm border border-slate-100 dark:border-dark-border mb-4">
        <span className={`flex-1 text-center font-medium ${direction === 'en-ta' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}>English</span>
        <button onClick={toggleDirection} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700">
          <ArrowRightLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
        <span className={`flex-1 text-center font-medium ${direction === 'ta-en' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}>Tamil</span>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden mb-4 relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={direction === 'en-ta' ? "Enter English text..." : "Enter Tamil text..."}
          className="w-full h-32 p-4 outline-none resize-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 bg-transparent"
        />
        <div className="flex justify-between items-center p-2 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20">
          <button
            onClick={startCamera}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            title="Scan text with camera"
          >
            <Camera className="w-5 h-5" />
            <span className="text-xs font-medium">Lens</span>
          </button>

          <button
            onClick={handleTranslate}
            disabled={loading || !text.trim()}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Translate
          </button>
        </div>
      </div>

      {/* Camera Overlay Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="absolute top-4 right-4 z-20">
             <button onClick={() => { stopCamera(); setShowCamera(false); }} className="p-3 bg-black/50 text-white rounded-full backdrop-blur-md">
               <X className="w-6 h-6" />
             </button>
          </div>
          
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-10 z-20 flex flex-col items-center gap-4">
             <div className="text-white/80 bg-black/40 px-4 py-1 rounded-full text-sm backdrop-blur-sm">
                Point at text to translate
             </div>
             <button 
               onClick={captureAndTranslate} 
               className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
             >
                <div className="w-16 h-16 bg-white rounded-full"></div>
             </button>
          </div>
        </div>
      )}

      {/* Result Area */}
      {result && (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-md border border-slate-100 dark:border-dark-border p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div>
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Translation</span>
              <div className="flex gap-2">
                <button onClick={() => handleSpeak(result.translated)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400">
                  <Volume2 className="w-4 h-4" />
                </button>
                <button onClick={handleCopy} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-lg text-slate-900 dark:text-slate-100 font-medium leading-relaxed">{result.translated}</p>
          </div>

          {result.pronunciation && (
            <div className="bg-slate-50 dark:bg-black/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Pronunciation</span>
              <p className="text-slate-700 dark:text-slate-300">{result.pronunciation}</p>
            </div>
          )}

          {result.grammarNotes && (
             <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
              <span className="text-xs font-semibold text-indigo-400 dark:text-indigo-300 uppercase tracking-wider block mb-1">Grammar Notes</span>
              <p className="text-indigo-800 dark:text-indigo-200 text-sm">{result.grammarNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranslateTab;