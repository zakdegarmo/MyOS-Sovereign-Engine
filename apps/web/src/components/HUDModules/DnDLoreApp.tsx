import React, { useState } from 'react';
import { BookOpen, Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const DnDLoreApp: React.FC = () => {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<{ role: 'user' | 'oracle', text: string }[]>([
        { role: 'oracle', text: 'Welcome to the Library of Intrigue. What knowledge do you seek?' }
    ]);
    const [loading, setLoading] = useState(false);

    const handleAsk = async () => {
        if (!query.trim()) return;
        const currentQuery = query.trim();
        setQuery('');
        setHistory(prev => [...prev, { role: 'user', text: currentQuery }]);
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8085/api/lore/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: currentQuery })
            });
            const data = await res.json();
            setHistory(prev => [...prev, { role: 'oracle', text: data.response }]);
        } catch (e: any) {
            setHistory(prev => [...prev, { role: 'oracle', text: `[Connection Error: The oracle is unreachable. Ensure the dnd_server.py is running on port 8085. Error: ${e.message}]` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-300 font-serif overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 bg-slate-900 border-b border-slate-800 shadow-md">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-amber-100 tracking-tight">Lore Oracle</h1>
                    <p className="text-amber-500/60 uppercase tracking-widest text-xs mt-1 font-sans">Powered by Mistral & Lands of Intrigue</p>
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
                {history.map((msg, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                        <div className={`px-5 py-4 rounded-2xl ${
                            msg.role === 'user' 
                            ? 'bg-slate-800 text-slate-200 rounded-br-sm' 
                            : 'bg-amber-950/40 border border-amber-900/50 text-amber-100 rounded-bl-sm leading-relaxed whitespace-pre-wrap'
                        }`}>
                            {msg.text}
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="self-start px-5 py-4 bg-amber-950/40 border border-amber-900/50 text-amber-500 rounded-2xl flex items-center gap-2"
                    >
                        <Sparkles size={16} className="animate-spin" /> Divining...
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-slate-900 border-t border-slate-800">
                <div className="relative flex items-center max-w-4xl mx-auto">
                    <input 
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAsk()}
                        disabled={loading}
                        placeholder="Ask about the Lands of Intrigue..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-full py-4 pl-6 pr-16 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors font-sans"
                    />
                    <button 
                        onClick={handleAsk}
                        disabled={loading || !query.trim()}
                        className="absolute right-2 p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-full transition-all disabled:opacity-50 disabled:hover:bg-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.3)]"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
