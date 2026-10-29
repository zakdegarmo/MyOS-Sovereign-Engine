import React, { useState, useEffect, useRef } from 'react';
import { Max3DScene } from './components/Max3DScene';
import { CRTOverlay } from './components/CRTOverlay';
import { initializeGemini, generateVisionResponse, generateMaxResponse } from './services/geminiService';
import { MaxState, Position } from './types';
import { MAX_QUOTES } from './constants';
import { Zap, Power, Eye, Mic, MicOff, Send, MessageSquare } from 'lucide-react';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

// --- UTILS ---
const stutterify = (text: string): string => {
    return text.split(' ').map(word => {
        if (word.length > 3 && Math.random() > 0.75) {
            const char = word.charAt(0);
            const r = Math.random();
            if (r > 0.6) return `${char}-${char}-${word}`;
            if (r > 0.3) return `${char}-${char}-${char}-${word}`;
            return `${char}-${word}`;
        }
        return word;
    }).join(' ');
};

const App: React.FC = () => {
  // --- STATE ---
  const [apiKey, setApiKey] = useState<string>('');
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [maxPosition, setMaxPosition] = useState<Position>({ x: window.innerWidth / 2 - 160, y: 100 });
  const [maxState, setMaxState] = useState<MaxState>(MaxState.SLEEPING);
  const [currentText, setCurrentText] = useState<string>("SYSTEM OFFLINE.");
  const [chatHistory, setChatHistory] = useState<{role: 'max'|'user', text: string}[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [isDraggable, setIsDraggable] = useState(false);
  const [visionEnabled, setVisionEnabled] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [micEnabled, setMicEnabled] = useState(false);
  
  // --- REFS ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const synth = window.speechSynthesis;
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);

  // --- INIT ---
  useEffect(() => {
    if (process.env.API_KEY) handleKeyInit(process.env.API_KEY);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'm') {
            if (visionEnabled) analyzeScreen();
            else speak("Enable vision first. I'm not psychic.");
        }
    };
    window.addEventListener('keydown', handleKeyDown);

    const moveInterval = setInterval(() => {
      if (maxState !== MaxState.SLEEPING && Math.random() > 0.94) teleportMax();
    }, 12000); 

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        clearInterval(moveInterval);
    };
  }, [maxState, visionEnabled]);

  // Scroll chat
  useEffect(() => {
      if (chatLogRef.current) chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [chatHistory]);

  // --- AUDIO ---
  useEffect(() => {
      if (micEnabled) {
          const initMic = async () => {
              try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const analyser = audioCtx.createAnalyser();
                  const source = audioCtx.createMediaStreamSource(stream);
                  source.connect(analyser);
                  analyser.fftSize = 32;
                  audioContextRef.current = audioCtx;
                  analyserRef.current = analyser;
                  const updateAudioLevel = () => {
                      if (!analyserRef.current) return;
                      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                      analyserRef.current.getByteFrequencyData(dataArray);
                      let sum = 0;
                      for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
                      setAudioLevel((sum / dataArray.length) / 128); 
                      requestAnimationFrame(updateAudioLevel);
                  };
                  updateAudioLevel();
              } catch (e) {
                  setMicEnabled(false);
                  setCurrentText("AUDIO DENIED");
              }
          };
          initMic();
      } else {
          if (audioContextRef.current) audioContextRef.current.close();
          setAudioLevel(0);
      }
  }, [micEnabled]);

  const handleKeyInit = (key: string) => {
    setApiKey(key);
    initializeGemini(key);
    setHasKey(true);
    setCurrentText("NETWORK 23 ONLINE.");
    setTimeout(() => speak("W-w-welcome to Network 23."), 1000);
  };

  const handleManualKeySubmit = async () => {
    try {
        await window.aistudio.openSelectKey();
        const key = process.env.API_KEY || "";
        handleKeyInit(key);
        setMaxState(MaxState.IDLE);
    } catch (e) { setCurrentText("KEY INVALID."); }
  };

  // --- CORE FUNCTIONS ---
  const teleportMax = () => {
    const maxX = window.innerWidth - 300;
    const maxY = window.innerHeight - 300;
    setMaxState(MaxState.GLITCHING);
    setTimeout(() => {
        setMaxPosition({ x: Math.max(20, Math.random() * maxX), y: Math.max(20, Math.random() * maxY) });
        setTimeout(() => setMaxState(MaxState.IDLE), 500);
    }, 400);
  };

  const speak = (text: string) => {
    if (synth.speaking) synth.cancel();
    const stutterText = stutterify(text);
    setCurrentText(stutterText.toUpperCase());
    setChatHistory(prev => [...prev, {role: 'max', text: stutterText}]);
    
    setMaxState(MaxState.SPEAKING);
    const utter = new SpeechSynthesisUtterance(stutterText);
    speechRef.current = utter;
    const voices = synth.getVoices();
    const roboticVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Daniel'));
    if (roboticVoice) utter.voice = roboticVoice;
    utter.pitch = 1.15; 
    utter.rate = 1.1; 
    utter.onend = () => setMaxState(MaxState.IDLE);
    synth.speak(utter);
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!userQuery.trim() || !hasKey) return;
      
      const query = userQuery;
      setUserQuery("");
      setChatHistory(prev => [...prev, {role: 'user', text: query}]);
      setCurrentText("THINKING...");
      
      try {
          const historyText = chatHistory.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
          const response = await generateMaxResponse(query, [historyText]);
          speak(response);
      } catch (e) {
          speak("Data corruption error. Try again.");
      }
  };

  // --- VISION ---
  const startScreenShare = async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { width: 1280 }, audio: false });
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
        streamRef.current = stream;
        setVisionEnabled(true);
        speak("I see you!");
        stream.getVideoTracks()[0].onended = stopScreenShare;
    } catch (err) { setCurrentText("VISION DENIED."); }
  };
  const stopScreenShare = () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      setVisionEnabled(false);
      speak("Vision terminated.");
  };
  const analyzeScreen = async () => {
      if (!videoRef.current || !visionEnabled) { speak("I need to see the screen first!"); return; }
      setMaxState(MaxState.LISTENING);
      setCurrentText("ANALYZING...");
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1]; 
      try {
          const response = await generateVisionResponse(base64, chatHistory.map(m => m.text));
          speak(response);
      } catch (e) { speak("G-glitch in the feed."); }
  };

  // UI Handlers
  const togglePower = () => {
    if (maxState === MaxState.SLEEPING) {
      if (hasKey) { setMaxState(MaxState.IDLE); speak("Re-re-rebooting."); }
      else handleManualKeySubmit();
    } else {
      setMaxState(MaxState.SLEEPING);
      synth.cancel();
      stopScreenShare();
      setMicEnabled(false);
    }
  };
  const toggleMic = () => { setMicEnabled(!micEnabled); if (!micEnabled) speak("Listening..."); };
  const handleDragStart = () => setIsDraggable(true);
  const handleDrag = (e: React.MouseEvent) => { if(isDraggable) setMaxPosition({ x: e.clientX - 160, y: e.clientY - 140 }); };
  const handleDragEnd = () => setIsDraggable(false);

  return (
    <div 
        className="relative w-screen h-screen overflow-hidden bg-transparent font-mono"
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
    >
      <CRTOverlay />
      <video ref={videoRef} className="hidden" autoPlay playsInline muted></video>

      {/* --- THE TV UNIT (Ruggedized Field Monitor) --- */}
      <div 
        style={{ left: maxPosition.x, top: maxPosition.y, transition: isDraggable ? 'none' : 'all 0.4s ease-out' }}
        className={`absolute z-[900] cursor-move select-none ${maxState === MaxState.SLEEPING ? 'opacity-0 scale-75' : 'opacity-100 scale-100'} transition-all duration-700 group`}
        onMouseDown={handleDragStart}
      >
          {/* Main Chassis: Dark Grey Industrial Plastic */}
          <div className="relative w-[360px] h-[300px] bg-[#222] rounded-lg border-4 border-[#111] shadow-[25px_25px_0px_rgba(0,0,0,0.5)] flex flex-col items-center">
               
               {/* Carry Handle (Top) */}
               <div className="absolute -top-10 w-48 h-10 bg-[#1a1a1a] rounded-t-lg border-4 border-[#111] border-b-0 flex items-center justify-center">
                    <div className="w-32 h-2 bg-[#0a0a0a] rounded-full shadow-inner"></div>
               </div>

               {/* Top Vents */}
               <div className="w-full h-8 flex items-center justify-center gap-2 border-b-2 border-[#151515] bg-[#1a1a1a] rounded-t-sm">
                    {Array.from({length: 12}).map((_, i) => (
                        <div key={i} className="w-3 h-1.5 bg-black rounded-full opacity-60"></div>
                    ))}
               </div>

               <div className="flex-1 w-full flex p-3 gap-3">
                   
                   {/* SCREEN SECTION (Deep Recess) */}
                   <div className="relative w-[240px] h-[210px] bg-[#000] rounded-xl border-[8px] border-[#151515] shadow-[inset_0_0_20px_black] overflow-hidden">
                        {/* Inner Bezel Shadow */}
                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_15px_rgba(0,0,0,1)] z-30 rounded-lg"></div>
                        
                        {/* Glass Reflection (Permanent Glare) */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent z-40 pointer-events-none rounded-lg"></div>
                        <div className="absolute top-2 right-2 w-20 h-20 bg-white/5 blur-xl rounded-full z-40 pointer-events-none"></div>

                        {/* MAX SCENE */}
                        <div className="w-full h-full relative z-10">
                            {maxState !== MaxState.SLEEPING && <Max3DScene state={maxState} audioLevel={audioLevel} />}
                        </div>
                   </div>

                   {/* RIGHT CONTROL SIDEBAR */}
                   <div className="flex-1 flex flex-col gap-2 bg-[#181818] rounded border-2 border-[#111] p-2 shadow-inner">
                        
                        {/* Brand Badge */}
                        <div className="w-full bg-black border border-gray-800 p-1 mb-1">
                            <div className="text-[10px] font-bold text-gray-400 text-center tracking-widest font-retro">NET-23</div>
                        </div>

                        {/* Tuning Knob */}
                        <div className="w-full aspect-square rounded-full bg-[#252525] border-2 border-black shadow-[0_4px_5px_rgba(0,0,0,0.5)] relative flex items-center justify-center">
                             <div className="w-1 h-1/2 bg-red-600 rounded-full origin-bottom rotate-45 translate-y-[-25%]"></div>
                             {/* Knurling */}
                             <div className="absolute inset-0 rounded-full border border-dashed border-gray-600 opacity-30"></div>
                        </div>

                        {/* Speaker Slats */}
                        <div className="flex-1 flex flex-col gap-1 justify-end mt-2">
                             {Array.from({length: 8}).map((_,i) => (
                                 <div key={i} className="w-full h-1 bg-black rounded-full opacity-80"></div>
                             ))}
                        </div>

                        {/* Audio Jack */}
                        <div className="w-4 h-4 rounded-full bg-black border border-gray-600 mx-auto mt-2 shadow-[inset_0_0_2px_black]"></div>
                        <div className="text-[6px] text-gray-600 text-center">PHONES</div>
                   </div>
               </div>

               {/* Bottom Lip */}
               <div className="w-full h-6 bg-[#1a1a1a] border-t-2 border-[#151515] rounded-b-md flex items-center justify-between px-4">
                    <div className="flex gap-2">
                         <div className={`w-2 h-2 rounded-full border border-black ${maxState !== MaxState.SLEEPING ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-red-900'}`}></div>
                         <div className="text-[8px] text-gray-500 font-bold">PWR</div>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-8 h-1 bg-gray-700 rounded-sm"></div>
                        <div className="w-8 h-1 bg-gray-700 rounded-sm"></div>
                    </div>
               </div>
          </div>
      </div>

      {/* --- BROADCAST DECK & CHAT --- */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-row items-end gap-4 pointer-events-auto">
          
          {/* CHAT TRANSCRIPT TERMINAL */}
          <div className={`w-80 h-96 bg-[#0a0a0a] border-4 border-[#333] rounded-lg shadow-2xl flex flex-col transition-all duration-500 ${maxState === MaxState.SLEEPING ? 'translate-y-[150%]' : 'translate-y-0'}`}>
               <div className="bg-[#333] p-1 text-[10px] text-gray-400 font-bold flex justify-between px-2">
                   <span>TRANSCRIPT_LOG.TXT</span>
                   <span>REC_</span>
               </div>
               <div ref={chatLogRef} className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
                   {chatHistory.map((msg, i) => (
                       <div key={i} className={`${msg.role === 'max' ? 'text-max-yellow' : 'text-max-cyan text-right'}`}>
                           <span className="opacity-50 text-[9px] block mb-0.5">{msg.role === 'max' ? 'MAX>' : 'USER>'}</span>
                           <span className="drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{msg.text}</span>
                       </div>
                   ))}
                   {currentText !== "SYSTEM OFFLINE." && !chatHistory.find(h => h.text === currentText) && (
                       <div className="text-green-500 opacity-50 italic text-[10px] mt-2 border-t border-green-900 pt-1">
                           STATUS: {currentText}
                       </div>
                   )}
               </div>
               <form onSubmit={handleChatSubmit} className="border-t border-[#333] p-2 flex gap-2 bg-[#111]">
                   <input 
                       value={userQuery}
                       onChange={(e) => setUserQuery(e.target.value)}
                       placeholder="Broadcast message..."
                       className="flex-1 bg-transparent text-white text-xs outline-none font-mono placeholder-gray-700"
                   />
                   <button type="submit" className="text-max-yellow hover:text-white"><Send size={14} /></button>
               </form>
          </div>

          {/* CONTROL DECK */}
          <div className="flex flex-col gap-2">
            <div className="bg-[#222] p-4 rounded-lg border-4 border-[#333] shadow-[0_0_30px_black] relative w-64">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#000_2px,#000_3px)] opacity-20 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-[#444] pb-3">
                         <button onClick={togglePower} className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all ${maxState === MaxState.SLEEPING ? 'border-red-900 bg-[#1a0505] text-red-800' : 'border-green-600 bg-[#051a05] text-green-500 shadow-[0_0_10px_green]'}`}>
                             <Power size={20} />
                         </button>
                         <div className="flex flex-col gap-1 items-end">
                             <div className="flex gap-1">
                                <div className={`w-2 h-2 rounded-full ${micEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-900'}`}></div>
                                <div className={`w-2 h-2 rounded-full ${visionEnabled ? 'bg-cyan-500 animate-pulse' : 'bg-red-900'}`}></div>
                             </div>
                             <span className="text-[9px] text-gray-500 font-bold">SIGNAL</span>
                         </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => speak(MAX_QUOTES[Math.floor(Math.random() * MAX_QUOTES.length)])} className="bg-[#333] hover:bg-[#444] border-b-4 border-[#111] p-2 rounded flex flex-col items-center gap-1 active:border-b-0 active:translate-y-1 transition-all">
                             <Zap size={16} className="text-yellow-500" />
                        </button>
                        <button onClick={toggleMic} className={`bg-[#333] hover:bg-[#444] border-b-4 border-[#111] p-2 rounded flex flex-col items-center gap-1 active:border-b-0 active:translate-y-1 transition-all ${micEnabled ? 'bg-gray-700' : ''}`}>
                             {micEnabled ? <Mic size={16} className="text-green-400" /> : <MicOff size={16} className="text-gray-500" />}
                        </button>
                        <button onClick={visionEnabled ? stopScreenShare : startScreenShare} className="bg-[#333] hover:bg-[#444] border-b-4 border-[#111] p-2 rounded flex flex-col items-center gap-1 active:border-b-0 active:translate-y-1 transition-all">
                             <Eye size={16} className={visionEnabled ? 'text-cyan-400' : 'text-gray-500'} />
                        </button>
                    </div>
                    <button 
                        onClick={analyzeScreen}
                        disabled={!visionEnabled}
                        className="w-full bg-cyan-900/30 border border-cyan-800 text-cyan-500 py-2 rounded text-xs font-bold hover:bg-cyan-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        SCAN_SOURCE
                    </button>
                </div>
            </div>
          </div>
      </div>

      {/* --- INTRO SCREEN --- */}
      {!hasKey && (
          <div className="fixed inset-0 bg-black/95 z-[2000] flex flex-col items-center justify-center p-8 text-center font-retro text-max-yellow select-none">
              <h1 className="text-9xl mb-2 font-retro text-transparent bg-clip-text bg-gradient-to-b from-max-yellow to-yellow-600 animate-glitch-1 filter drop-shadow-[0_0_10px_rgba(244,229,0,0.5)]">
                  MAX
              </h1>
              <p className="text-2xl text-gray-500 tracking-[1em] mb-12">HEADROOM</p>
              <button onClick={handleManualKeySubmit} className="px-16 py-4 border border-max-pink text-max-pink font-mono text-xl hover:bg-max-pink hover:text-black transition-colors">
                  INITIALIZE SYSTEM
              </button>
          </div>
      )}
    </div>
  );
};

export default App;
