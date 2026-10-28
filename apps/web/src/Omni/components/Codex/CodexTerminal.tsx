
import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface CodexTerminalProps {
    nodeId: string;
    isActive: boolean;
    type?: 'text' | 'asset'; // New Prop
    assetUrl?: string;       // New Prop
}

export const CodexTerminal: React.FC<CodexTerminalProps> = ({ nodeId, isActive, type = 'text', assetUrl }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    // --- TEXT MODE LOGIC ---
    useEffect(() => {
        if (type !== 'text' || !terminalRef.current) return;

        // Initialize XTerm
        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#09090b', // Zinc-950
                foreground: '#a1a1aa',
                cursor: '#22d3ee', // Cyan
                selectionBackground: '#22d3ee40'
            },
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            lineHeight: 1.2
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Boot Sequence
        term.writeln(`\x1b[36m[BOOT]\x1b[0m Initializing Context Node: \x1b[1m${nodeId}\x1b[0m`);
        setTimeout(() => term.writeln(`\x1b[32m[OK]\x1b[0m File System Mounted: /apps/web/backend/${nodeId.replace('.', '/')}`), 300);
        setTimeout(() => term.writeln(`\x1b[32m[OK]\x1b[0m MCP Protocol: Listening on port 3000`), 600);
        setTimeout(() => {
            term.write(`\r\n\x1b[35mroot@${nodeId.toLowerCase()} ~ $\x1b[0m `);
        }, 900);

        // Input Handling
        term.onData(data => {
            const code = data.charCodeAt(0);
            if (code === 13) { // Enter
                term.write('\r\n');
                term.write(`\x1b[35mroot@${nodeId.toLowerCase()} ~ $\x1b[0m `);
            } else if (code < 32) { // Control
                return;
            } else {
                term.write(data);
            }
        });

        return () => {
            term.dispose();
        };
    }, [nodeId, type]);

    // Handle Resize/Visibility
    useEffect(() => {
        if (isActive && fitAddonRef.current && type === 'text') {
            // Small timeout to allow container to size itself
            setTimeout(() => fitAddonRef.current?.fit(), 100);
        }
    }, [isActive, type]);

    return (
        <div className="w-[400px] h-[300px] bg-zinc-950 border border-cyan-900/50 rounded overflow-hidden shadow-2xl opacity-90 backdrop-blur-sm flex flex-col">
            <div className="bg-zinc-900 px-2 py-1 flex items-center justify-between border-b border-white/10 handle cursor-move shrink-0">
                <div className="text-[10px] text-cyan-500 font-mono tracking-widest">{nodeId.toUpperCase()} :: {type === 'asset' ? 'IMG_VIEW' : 'TTY1'}</div>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
            </div>

            {/* Content Area */}
            <div className="relative flex-1 w-full overflow-hidden bg-black/50">
                {type === 'text' ? (
                    <div className="w-full h-full p-1" ref={terminalRef} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-4">
                        {/* Checkerboard Background for Transparency */}
                        <div className="absolute inset-0 opacity-20"
                            style={{ backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}
                        />

                        {assetUrl ? (
                            <img
                                src={assetUrl}
                                alt={nodeId}
                                className="max-w-full max-h-full object-contain relative z-10"
                                style={{ imageRendering: 'pixelated' }} // CRITICAL: Pixel Art Mode
                            />
                        ) : (
                            <div className="text-red-500 font-mono text-xs">ERR_FILE_NOT_FOUND</div>
                        )}

                        {/* Overlay Scanlines */}
                        <div className="absolute inset-0 pointer-events-none bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzF4eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5/o/giphy.gif')] opacity-[0.02]" />
                    </div>
                )}
            </div>
        </div>
    );
};
