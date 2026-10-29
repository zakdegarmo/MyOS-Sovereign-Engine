import React, { useState, useRef } from 'react';
import { DraggableResizableWindow } from './DraggableResizableWindow';

export interface BatchItem {
    name: string;
    originalUrl: string;
    processedUrl: string;
}

export interface PixelArtInatorHudProps {
    isOpen?: boolean;
    onClose?: () => void;
    initialImage?: string | null;
    onPlace?: (url: string) => void;
}

export const PixelArtInatorHud: React.FC<PixelArtInatorHudProps> = ({
    isOpen = true,
    onClose,
    initialImage = null,
    onPlace
}) => {
    const [mode, setMode] = useState<'single' | 'batch'>('single');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [gridSize, setGridSize] = useState<number>(64);
    const [colorCount, setColorCount] = useState<number>(16);

    const singleFileInputId = 'pixel-inator-single-file';
    const folderInputId = 'pixel-inator-folder';

    // Auto-load image if provided by Orchestrator
    React.useEffect(() => {
        if (initialImage) {
            setMode('single');
            setOriginalImage(initialImage);
            processPixelArtSingle(initialImage, gridSize, colorCount);
        }
    }, [initialImage]);

    if (!isOpen) return null;

    // Single File Chooser Handler
    const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMode('single');
            const url = URL.createObjectURL(file);
            setOriginalImage(url);
            processPixelArtSingle(url, gridSize, colorCount);
        }
    };

    // Batch Folder Chooser Handler
    const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
        if (files.length === 0) return;

        setMode('batch');
        setIsProcessing(true);
        setBatchQueue([]);
        setBatchProgress({ current: 0, total: files.length });

        const results: BatchItem[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const origUrl = URL.createObjectURL(file);
            const procUrl = await processPixelArtAsync(origUrl, gridSize, colorCount);
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            results.push({
                name: `${baseName}_pixelart_${colorCount}bit_${gridSize}x${gridSize}.png`,
                originalUrl: origUrl,
                processedUrl: procUrl
            });
            setBatchQueue([...results]);
            setBatchProgress({ current: i + 1, total: files.length });
        }
        setIsProcessing(false);
    };

    // Helper: Async Canvas Processor
    const processPixelArtAsync = (imageSrc: string, targetSize: number, colors: number): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = imageSrc;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve('');

                canvas.width = targetSize;
                canvas.height = targetSize;
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, 0, 0, targetSize, targetSize);

                const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
                const data = imgData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    if (r > 240 && g > 240 && b > 240) {
                        data[i + 3] = 0;
                    } else {
                        const factor = 256 / Math.max(2, Math.floor(colors / 2));
                        data[i] = Math.floor(r / factor) * factor;
                        data[i + 1] = Math.floor(g / factor) * factor;
                        data[i + 2] = Math.floor(b / factor) * factor;
                    }
                }

                ctx.putImageData(imgData, 0, 0);

                const previewCanvas = document.createElement('canvas');
                previewCanvas.width = 512;
                previewCanvas.height = 512;
                const pCtx = previewCanvas.getContext('2d');
                if (pCtx) {
                    pCtx.imageSmoothingEnabled = false;
                    pCtx.drawImage(canvas, 0, 0, 512, 512);
                    resolve(previewCanvas.toDataURL('image/png'));
                } else {
                    resolve('');
                }
            };
        });
    };

    // Single Processor Wrapper
    const processPixelArtSingle = async (src: string, res: number, col: number) => {
        setIsProcessing(true);
        const output = await processPixelArtAsync(src, res, col);
        setProcessedImage(output);
        setIsProcessing(false);
    };

    const handleSettingChange = (newSize: number, newColors: number) => {
        setGridSize(newSize);
        setColorCount(newColors);
        if (mode === 'single' && originalImage) {
            processPixelArtSingle(originalImage, newSize, newColors);
        }
    };

    // Single Export
    const handleSingleExport = () => {
        if (!processedImage) return;
        const link = document.createElement('a');
        link.href = processedImage;
        link.download = `pixel_art_sprite_${gridSize}x${gridSize}.png`;
        link.click();
    };

    // Batch Export (Downloads batch files sequentially)
    const handleBatchExport = () => {
        batchQueue.forEach((item, idx) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = item.processedUrl;
                link.download = item.name;
                link.click();
            }, idx * 200);
        });
    };

    return (
        <DraggableResizableWindow
            id="pixel_art_inator_hud"
            title="🎨 Pixel Art -inator (Batch Engine)"
            icon="🎨"
            defaultPosition={{ x: 60, y: 120 }}
            defaultSize={{ width: 480, height: 520 }}
            minSize={{ width: 380, height: 400 }}
            isOpen={isOpen}
            onClose={onClose}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#f8fafc' }}>
                
                {/* 1. Mode Chooser Buttons: Single File vs Batch Folder */}
                {/* Using <label htmlFor> instead of .click() to avoid browser security blocks in draggable windows */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        id={singleFileInputId}
                        type="file"
                        accept="image/*"
                        onChange={handleSingleFileChange}
                        style={{ display: 'none' }}
                    />
                    <label
                        htmlFor={singleFileInputId}
                        style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            userSelect: 'none'
                        }}
                    >
                        📄 Pick Single File
                    </label>

                    <input
                        id={folderInputId}
                        type="file"
                        // @ts-ignore - HTML5 Directory attributes
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={handleFolderChange}
                        style={{ display: 'none' }}
                    />
                    <label
                        htmlFor={folderInputId}
                        style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            userSelect: 'none'
                        }}
                    >
                        📁 Batch Folder Process
                    </label>
                </div>

                {/* 2. Controls: Grid Size & Palette Colors */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>
                        <span>GRID RESOLUTION:</span>
                        <span style={{ color: '#10b981' }}>{gridSize} x {gridSize} px</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {[64, 128, 256].map(res => (
                            <button
                                key={res}
                                onClick={() => handleSettingChange(res, colorCount)}
                                style={{
                                    flex: 1,
                                    background: gridSize === res ? '#10b981' : '#1e293b',
                                    color: gridSize === res ? '#fff' : '#94a3b8',
                                    border: 'none',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                {res}x{res}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginTop: '4px' }}>
                        <span>PALETTE COLOR DEPTH:</span>
                        <span style={{ color: '#3b82f6' }}>{colorCount} Colors</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {[8, 16, 32].map(c => (
                            <button
                                key={c}
                                onClick={() => handleSettingChange(gridSize, c)}
                                style={{
                                    flex: 1,
                                    background: colorCount === c ? '#3b82f6' : '#1e293b',
                                    color: colorCount === c ? '#fff' : '#94a3b8',
                                    border: 'none',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                {c} Palette
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Display Mode: Single Preview vs Batch Queue Gallery */}
                {mode === 'single' ? (
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        height: '180px',
                        background: '#090d16',
                        borderRadius: '12px',
                        padding: '8px',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '6px', overflow: 'hidden' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>ORIGINAL INPUT</span>
                            {originalImage ? (
                                <img src={originalImage} alt="Original" style={{ maxWidth: '100%', maxHeight: '130px', objectFit: 'contain' }} />
                            ) : (
                                <span style={{ fontSize: '11px', color: '#475569' }}>No file selected</span>
                            )}
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: '6px', overflow: 'hidden', backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>PIXEL-ART-INATED PNG</span>
                            {isProcessing ? (
                                <span style={{ fontSize: '12px', color: '#10b981' }}>Processing...</span>
                            ) : processedImage ? (
                                <div style={{ textAlign: 'center' }}>
                                    <img src={processedImage} alt="Pixelated Output" style={{ maxWidth: '100%', maxHeight: '110px', objectFit: 'contain', imageRendering: 'pixelated' }} />
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', justifyContent: 'center' }}>
                                        <button onClick={handleSingleExport} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>💾 Export PNG</button>
                                        {onPlace && (
                                            <button onClick={() => onPlace(processedImage || '')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>✨ Place in World</button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <span style={{ fontSize: '11px', color: '#475569' }}>Output preview</span>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Batch Mode Queue & Thumbnail Gallery */
                    <div style={{
                        background: '#090d16',
                        borderRadius: '12px',
                        padding: '12px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#8b5cf6' }}>
                                📁 Batch Queue: {batchProgress.current} / {batchProgress.total} Files Processed
                            </span>
                            {batchQueue.length > 0 && !isProcessing && (
                                <button
                                    onClick={handleBatchExport}
                                    style={{
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    📦 Export All Batch PNGs
                                </button>
                            )}
                        </div>

                        {/* Progress Bar */}
                        {isProcessing && (
                            <div style={{ width: '100%', background: '#1e293b', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${(batchProgress.current / Math.max(1, batchProgress.total)) * 100}%`, background: '#8b5cf6', height: '100%', transition: 'width 0.2s ease' }} />
                            </div>
                        )}

                        {/* Thumbnail Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                            gap: '8px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            paddingRight: '4px'
                        }}>
                            {batchQueue.map((item, idx) => (
                                <div key={idx} style={{
                                    background: '#1e293b',
                                    borderRadius: '8px',
                                    padding: '6px',
                                    textAlign: 'center',
                                    border: '1px solid #334155',
                                    backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
                                    backgroundSize: '8px 8px'
                                }}>
                                    <img src={item.processedUrl} alt={item.name} style={{ width: '100%', height: '60px', objectFit: 'contain', imageRendering: 'pixelated' }} />
                                    <div style={{ fontSize: '9px', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{item.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DraggableResizableWindow>
    );
};
