import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, BrainCircuit, Library as LibIcon, X, Maximize2, Minimize2 } from 'lucide-react';
import { initGemini, sendMessageToGemini } from './services/geminiService';
import { saveLibraryItem, getLibraryItems } from './services/libraryService';
import LibraryExplorer from './components/LibraryExplorer';
import PillarLens from './components/PillarLens';
import { ChatMessage, LibraryItem, APIKeyStatus } from './types';

// Extend window for the custom API key selector as per prompt instructions
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

export default function App() {
  const [keyStatus, setKeyStatus] = useState<APIKeyStatus>({ hasKey: false, isLoading: true });
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'intro',
    role: 'model',
    text: "Greetings. I am your Aetherial Tutor. I can assume many forms to aid your quest for knowledge. What subject shall we explore today? I am ready to guide you through the Pillars of Ontology.",
    timestamp: Date.now()
  }]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [isThinkingMode, setIsThinkingMode] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [viewingItem, setViewingItem] = useState<LibraryItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and check for API key
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setKeyStatus({ hasKey, isLoading: false });
        if (hasKey) {
            // In the mandated environment, process.env.API_KEY is injected after selection
            // But we need to handle the case where we might need to re-init.
            // For this specific prompt environment, we assume process.env.API_KEY works 
            // once hasSelectedApiKey is true.
            initGemini(process.env.API_KEY || ''); 
        }
      } else {
        // Fallback for local dev if window.aistudio doesn't exist
        const localKey = localStorage.getItem('GEMINI_API_KEY');
        if (localKey) {
            initGemini(localKey);
            setKeyStatus({ hasKey: true, isLoading: false });
        } else {
            setKeyStatus({ hasKey: false, isLoading: false });
        }
      }
    };
    checkKey();
    refreshLibrary();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setKeyStatus({ hasKey, isLoading: false });
        if(hasKey) initGemini(process.env.API_KEY || '');
    } else {
        // Fallback prompt for local dev
        const key = prompt("Enter Gemini API Key:");
        if (key) {
            localStorage.setItem('GEMINI_API_KEY', key);
            initGemini(key);
            setKeyStatus({ hasKey: true, isLoading: false });
        }
    }
  };

  const refreshLibrary = () => {
    setLibraryItems(getLibraryItems());
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: inputText,
      image: selectedImage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSelectedImage(undefined);
    setIsLoading(true);

    try {
      // Re-init Gemini to ensure fresh key use if recently selected
      if (process.env.API_KEY) initGemini(process.env.API_KEY);

      const response = await sendMessageToGemini(messages, userMsg.text, userMsg.image, isThinkingMode);

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        isThinking: isThinkingMode // Visual indicator
      };

      setMessages(prev => [...prev, aiMsg]);

      // Handle Library Entry
      if (response.libraryEntry) {
        const entry = response.libraryEntry;
        saveLibraryItem({
            title: entry.title,
            deweyCategory: entry.dewey_code.split('.')[0] + "00", // Rough mapping
            deweyCode: entry.dewey_code,
            content: entry.full_content || entry.content_summary,
            tags: entry.tags || [],
            pillarConnections: entry.pillar_connections || [],
            type: 'knowledge'
        });
        refreshLibrary();
        // Optional: Notify user
        setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'model',
            text: `*I have cataloged "${entry.title}" into the Library under index ${entry.dewey_code}.*`,
            timestamp: Date.now()
        }]);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        text: "I encountered a disturbance in the aether. Please ensure your API key is valid and try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!keyStatus.hasKey && !keyStatus.isLoading) {
    return (
      <div className="h-screen w-screen bg-void flex items-center justify-center text-aether-100 p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-3xl font-bold text-aether-400">MyOS Aetherial Tutor</h1>
          <p className="text-slate-400">To access the infinite archives and reasoning capabilities of Gemini 3, an API key is required.</p>
          <button 
            onClick={handleSelectKey}
            className="bg-aether-600 hover:bg-aether-500 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)]"
          >
            Authenticate with Google AI
          </button>
          <p className="text-xs text-slate-600 mt-4">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-aether-300">
              Billing Information
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-void flex overflow-hidden relative font-sans text-slate-200">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-aether-900/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Library Sidebar (Desktop: Toggleable / Mobile: Fullscreen Overlay) */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${isLibraryOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-0 ${isLibraryOpen ? 'md:!w-96' : ''}`}>
        <LibraryExplorer 
          items={libraryItems} 
          onSelectItem={(item) => {
            setViewingItem(item);
            // On mobile close library after select
            if (window.innerWidth < 768) setIsLibraryOpen(false);
          }} 
          onClose={() => setIsLibraryOpen(false)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10 h-full w-full max-w-5xl mx-auto border-x border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/90">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                    className={`p-2 rounded-lg hover:bg-slate-800 transition-colors ${isLibraryOpen ? 'text-aether-400' : 'text-slate-400'}`}
                >
                    <LibIcon className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="font-bold text-aether-100 flex items-center gap-2">
                        <span className="animate-float">✦</span> Aetherial Tutor
                    </h1>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsThinkingMode(!isThinkingMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isThinkingMode ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/50' : 'bg-slate-800 text-slate-500'}`}
                >
                    <BrainCircuit className="w-3 h-3" />
                    {isThinkingMode ? 'Deep Thought' : 'Quick Response'}
                </button>
            </div>
        </header>

        {/* Pillar Display */}
        <div className="border-b border-slate-800 bg-slate-950/50">
            <PillarLens />
        </div>

        {/* Viewing Library Item Overlay */}
        {viewingItem && (
            <div className="absolute inset-4 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 text-aether-400 font-mono text-xs mb-1">
                            <span>{viewingItem.deweyCode}</span>
                            <span>•</span>
                            <span>{new Date(viewingItem.timestamp).toLocaleDateString()}</span>
                        </div>
                        <h2 className="text-xl font-bold text-white">{viewingItem.title}</h2>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={() => setViewingItem(null)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-slate-300">{viewingItem.content}</pre>
                </div>
                <div className="bg-slate-950 p-3 border-t border-slate-800 flex gap-2 overflow-x-auto">
                    {viewingItem.tags.map(tag => (
                        <span key={tag} className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">#{tag}</span>
                    ))}
                </div>
            </div>
        )}

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-aether-900/40 border border-aether-700/50 text-aether-50 rounded-br-none' 
                  : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-bl-none'
              }`}>
                {msg.image && (
                    <img src={msg.image} alt="User upload" className="max-w-full h-auto rounded-lg mb-3 border border-slate-600" />
                )}
                {/* Visual Thinking Indicator for Model */}
                {msg.role === 'model' && msg.isThinking && (
                    <div className="mb-2 flex items-center gap-2 text-xs text-indigo-400 opacity-70">
                        <BrainCircuit className="w-3 h-3" />
                        <span>Thought Processed</span>
                    </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text.replace(/```json[\s\S]*```/, '')}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 rounded-2xl p-4 rounded-bl-none flex items-center gap-2">
                 <div className="w-2 h-2 bg-aether-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-aether-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                 <div className="w-2 h-2 bg-aether-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800">
          {selectedImage && (
            <div className="mb-2 relative inline-block">
                <img src={selectedImage} alt="Preview" className="h-20 w-auto rounded border border-aether-500/50" />
                <button 
                    onClick={() => setSelectedImage(undefined)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
          )}
          <div className="flex items-end gap-2 bg-slate-950 border border-slate-700 rounded-xl p-2 focus-within:border-aether-500/50 focus-within:ring-1 focus-within:ring-aether-500/50 transition-all">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-aether-400 transition-colors"
                title="Upload Image for Analysis"
            >
                <ImageIcon className="w-5 h-5" />
            </button>
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
            />
            
            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="Ask the Tutor..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 resize-none max-h-32 py-2"
                rows={1}
            />
            
            <button 
                onClick={handleSend}
                disabled={isLoading || (!inputText.trim() && !selectedImage)}
                className="p-2 bg-aether-600 hover:bg-aether-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-lg shadow-aether-500/20"
            >
                <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center mt-2 text-[10px] text-slate-600">
            Powered by Gemini 3 Pro • MyOS Ontology v1.0
          </div>
        </div>

      </div>
    </div>
  );
}
