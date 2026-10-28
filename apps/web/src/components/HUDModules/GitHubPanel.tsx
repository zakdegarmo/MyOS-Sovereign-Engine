
import React, { useState, useEffect } from "react";
import { GitBranch, RefreshCw, Download, ExternalLink, Shield, Zap, Info, Loader2, Plus, X } from "lucide-react";
import { getGitHubData, createIssue, downloadRepo, type GitHubConfig, type GitHubIssue } from "../../engine/githubService";

interface GitHubPanelProps {
    repoName?: string;
    activeRepoName?: string; 
    onClose: () => void;
    onConnectionStatus?: (connected: boolean) => void;
    onCreateFile?: (repoName: string, path: string, content: string) => Promise<void>;
}

export const GitHubPanel: React.FC<GitHubPanelProps> = ({ repoName = "antigravity-swarm", activeRepoName = "MyOS", onClose, onConnectionStatus, onCreateFile }) => {
    // Tabs: 'connect' | 'clone'
    const [mode, setMode] = useState<'connect' | 'clone'>('connect');

    // Auth State
    const [config, setConfig] = useState<GitHubConfig>({ owner: '', repo: '', token: '' });
    const [isConnected, setIsConnected] = useState(false);

    // Clone State
    const [cloneUrl, setCloneUrl] = useState("");
    const [cloneStatus, setCloneStatus] = useState("");

    // Data State
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Issue Creation State
    const [newIssueMode, setNewIssueMode] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    useEffect(() => {
        const savedToken = localStorage.getItem("github_token");
        const parts = repoName?.split('/');

        setConfig(prev => ({
            ...prev,
            owner: parts?.length === 2 ? parts[0] : (prev.owner || 'google-deepmind'),
            repo: parts?.length === 2 ? parts[1] : (repoName || prev.repo || 'antigravity-swarm'),
            token: savedToken || ''
        }));
    }, [repoName]);

    const handleConnect = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getGitHubData(config);
            setData(res);
            setIsConnected(true);
            onConnectionStatus?.(true);
            if (config.token) localStorage.setItem("github_token", config.token);
            
            // Log to system history
            window.dispatchEvent(new CustomEvent('myos_system_log', {
                detail: {
                    event: `Established GitHub Uplink: ${res.details.full_name}`,
                    agent: 'NexusBridge',
                    type: 'milestone'
                }
            }));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClone = async () => {
        const match = cloneUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
        if (!match) {
            setError("TARGET_MALFORMED: EXPECTING_GITHUB_URL");
            return;
        }
        const [_, owner, repo] = match;

        if (!onCreateFile) {
            setError("DISK_UPLINK_OFFLINE: UNABLE_TO_WRITE_SUBSTRATE");
            return;
        }

        setLoading(true);
        setCloneStatus("INITIALIZING_ALCHEMICAL_EXTRACTION...");

        try {
            const cloneConfig = { owner, repo, token: config.token };
            const files = await downloadRepo(cloneConfig, (msg) => setCloneStatus(msg));

            setCloneStatus("WRITING_TO_SUBSTRATE...");

            for (const file of files) {
                await onCreateFile(activeRepoName, `integrations/${repo}/${file.path}`, file.content);
            }

            setCloneStatus("EXTRACTION_COMPLETE!");
            setTimeout(() => {
                setCloneStatus("");
                setCloneUrl("");
            }, 2000);

            window.dispatchEvent(new CustomEvent('myos_system_log', {
                detail: {
                    event: `Synthesized external repository: ${repo}`,
                    agent: 'NexusBridge',
                    type: 'milestone'
                }
            }));

        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateIssue = async () => {
        if (!title) return;
        setLoading(true);
        try {
            await createIssue(config, title, body);
            await handleConnect();
            setNewIssueMode(false);
            setTitle("");
            setBody("");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="w-full h-full bg-slate-950/90 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-slate-300 relative rounded-[40px] border border-white/10 shadow-3xl pointer-events-auto">
                <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full transition-all text-slate-500 hover:text-white border border-transparent hover:border-white/10">
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center w-full max-w-md">
                    <div className="mb-10 p-6 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] animate-pulse">
                        {mode === 'connect' ? <GitBranch size={48} className="text-cyan-400" /> : <Download size={48} className="text-cyan-400" />}
                    </div>

                    <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em] mb-2">{mode === 'connect' ? 'Substrate Uplink' : 'Alchemical Clone'}</h2>
                    <p className="text-[10px] text-cyan-500/50 font-mono tracking-widest uppercase mb-10">GitHub Integration Node // {mode.toUpperCase()}_MODE</p>

                    <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 mb-8 w-full">
                        <button
                            onClick={() => setMode('connect')}
                            className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all ${mode === 'connect' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            Connect
                        </button>
                        <button
                            onClick={() => setMode('clone')}
                            className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all ${mode === 'clone' ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            Clone
                        </button>
                    </div>

                    <div className="w-full space-y-4">
                        {mode === 'connect' ? (
                            <>
                                <div className="flex gap-2">
                                    <input
                                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs flex-1 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                                        placeholder="OWNER"
                                        value={config.owner}
                                        onChange={e => setConfig({ ...config, owner: e.target.value })}
                                    />
                                    <span className="flex items-center text-slate-700 font-mono">/</span>
                                    <input
                                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs flex-1 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                                        placeholder="REPONAME"
                                        value={config.repo}
                                        onChange={e => setConfig({ ...config, repo: e.target.value })}
                                    />
                                </div>
                                <input
                                    type="password"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-cyan-500 transition-all font-mono"
                                    placeholder="GITHUB_ACCESS_TOKEN (OPTIONAL)"
                                    value={config.token}
                                    onChange={e => setConfig({ ...config, token: e.target.value })}
                                />
                                <button
                                    onClick={handleConnect}
                                    disabled={loading}
                                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <span>INITIATE UPLINK</span>}
                                </button>
                            </>
                        ) : (
                            <>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 transition-all font-mono"
                                    placeholder="https://github.com/owner/repo.git"
                                    value={cloneUrl}
                                    onChange={e => setCloneUrl(e.target.value)}
                                />
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex gap-4 items-center">
                                    <Info size={16} className="text-emerald-500/50" />
                                    <p className="text-[9px] text-slate-500 font-mono leading-relaxed uppercase tracking-wider">
                                        EXTRACTION TARGET: <span className="text-emerald-400">/integrations/*</span>
                                    </p>
                                </div>
                                <button
                                    onClick={handleClone}
                                    disabled={loading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <span>MANIFEST EXTERNAL REPO</span>}
                                </button>
                                {cloneStatus && (
                                    <div className="text-[9px] font-mono text-cyan-400 animate-pulse text-center">{cloneStatus}</div>
                                )}
                            </>
                        )}

                        {error && <div className="text-rose-400 text-[10px] font-mono mt-4 bg-rose-500/10 p-3 rounded-xl border border-rose-500/30 uppercase tracking-widest">{error}</div>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-[850px] h-[650px] bg-slate-950/95 backdrop-blur-3xl flex flex-col text-slate-300 relative rounded-[40px] border border-white/10 shadow-3xl pointer-events-auto overflow-hidden">
            {/* Header */}
            <div className="h-20 flex-shrink-0 flex items-center justify-between px-10 bg-gradient-to-b from-cyan-500/10 to-transparent border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                         <GitBranch size={24} className="text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-white uppercase tracking-[0.4em] leading-tight">Substrate_Node: {data.details.name.toUpperCase()}</h2>
                        <div className="flex items-center gap-3 mt-1">
                             <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-500/60 uppercase tracking-widest">
                                <Shield size={10} />
                                Link_Established
                            </div>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <a href={data.details.html_url} target="_blank" rel="noreferrer" className="text-[9px] font-mono text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest flex items-center gap-1">
                                View Origin <ExternalLink size={8} />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleConnect} 
                        disabled={loading}
                        className="p-3 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/5"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin text-cyan-400" : ""} />
                    </button>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/5">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 bg-black/40 border-b border-white/5 divide-x divide-white/5 shrink-0">
                <div className="px-8 py-4 text-center group">
                    <div className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-1 group-hover:text-cyan-500 transition-colors">Open_Leaks</div>
                    <div className="text-lg font-black text-white">{data.details.open_issues_count}</div>
                </div>
                <div className="px-8 py-4 text-center group">
                    <div className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-1 group-hover:text-amber-500 transition-colors">Resonance</div>
                    <div className="text-lg font-black text-white">{data.details.stargazers_count}</div>
                </div>
                <div className="px-8 py-4 text-center group">
                    <div className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-1 group-hover:text-blue-500 transition-colors">Fractals</div>
                    <div className="text-lg font-black text-white">{data.details.forks_count}</div>
                </div>
                <div className="px-8 py-4 text-center group">
                    <div className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-1 group-hover:text-emerald-500 transition-colors">Uptime</div>
                    <div className="text-[10px] font-mono text-emerald-500 uppercase mt-1">99.99%_OS</div>
                </div>
            </div>

            {/* Main Content: Issues / Activity */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Details / Description */}
                <div className="w-1/3 border-r border-white/5 p-8 flex flex-col gap-6 bg-black/20 overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                         <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Substrate_Summary</h3>
                         <p className="text-xs text-slate-400 font-mono italic leading-relaxed">
                            "{data.details.description || 'No descriptor found for this substrate segment.'}"
                         </p>
                    </div>

                    <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-3xl space-y-4">
                         <div className="flex items-center gap-2 text-cyan-400">
                             <Zap size={14} />
                             <span className="text-[10px] font-bold uppercase tracking-widest">Active_Protocols</span>
                         </div>
                         <div className="flex flex-wrap gap-2">
                             {['Git_Uplink', 'SSE_Burst', 'Node_Lock'].map(p => (
                                 <span key={p} className="px-2 py-1 bg-black/40 border border-white/5 rounded text-[8px] font-mono text-cyan-500/60 uppercase">
                                     {p}
                                 </span>
                             ))}
                         </div>
                    </div>
                    
                    <button className="mt-auto w-full py-4 bg-transparent border border-white/10 hover:border-cyan-500/50 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">
                        Deep_Scan_Repo
                    </button>
                </div>

                {/* Right Panel: Scrollable Activity / Issues */}
                <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                     <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Pending_Synchronizations</h3>
                        <button 
                            onClick={() => setNewIssueMode(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all active:scale-95"
                        >
                            <Plus size={14} />
                            Log_Issue
                        </button>
                     </div>

                    {newIssueMode && (
                        <div className="bg-slate-900/80 backdrop-blur-3xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                             <input
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-cyan-500 transition-all font-mono"
                                placeholder="ISSUE_TITLE"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                            <textarea
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs h-32 resize-none focus:outline-none focus:border-cyan-500 transition-all font-mono"
                                placeholder="LOG_DESCRIPTION..."
                                value={body}
                                onChange={e => setBody(e.target.value)}
                            />
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setNewIssueMode(false)} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white px-4">Abort</button>
                                <button
                                    onClick={handleCreateIssue}
                                    disabled={loading || !title}
                                    className="bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-emerald-400 transition-all shadow-lg active:scale-95"
                                >
                                    Push_To_Substrate
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {data.issues.map((issue: GitHubIssue) => (
                            <a
                                key={issue.number}
                                href={issue.html_url}
                                target="_blank"
                                rel="noreferrer"
                                className="block p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/[0.08] hover:border-cyan-500/30 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors pr-10 line-clamp-1">{issue.title}</div>
                                    <div className="px-2 py-0.5 bg-black/40 rounded border border-white/5 font-mono text-[9px] text-cyan-500/60">#{issue.number}</div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                         <img src={issue.user.avatar_url} className="w-5 h-5 rounded-full border border-white/20" />
                                         <span className="text-[10px] font-mono text-slate-500">OPERATIVE: {issue.user.login}</span>
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-600 uppercase">TIMESTAMP_{new Date(issue.created_at).toLocaleDateString()}</div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
