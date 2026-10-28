with open('apps/web/src/components/MaxOverlay/SystemHud.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = 'label="Save / Load System State"\n                    />'
if target not in text:
    target = 'label="Save / Load System State"\r\n                    />'

replacement = target + '''

                    {/* PRISMOS BARE-METAL SWAP BUTTON */}
                    <button
                        onClick={() => {
                            window.location.href = 'http://localhost:3333/';
                        }}
                        className="pointer-events-auto flex items-center gap-1.5 px-3 h-11 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-400/50 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(56,189,248,0.25)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]"
                        title="Dimension Swap to PrismOS 4D File Explorer (Port 3333)"
                    >
                        <Box size={16} className="text-cyan-400 animate-pulse" />
                        <span>WARP TO PRISMOS [3333]</span>
                    </button>'''

if target in text:
    text = text.replace(target, replacement, 1)
    with open('apps/web/src/components/MaxOverlay/SystemHud.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("SUCCESS: SystemHud updated with Warp button to 3333!")
else:
    print("Target not found")
