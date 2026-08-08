import React, { useState, useEffect, useRef } from 'react';

let globalZIndex = 1000;

export interface DraggableResizableWindowProps {
    id: string;
    title: string;
    icon?: string;
    defaultPosition?: { x: number; y: number };
    defaultSize?: { width: number; height: number };
    minSize?: { width: number; height: number };
    isOpen: boolean;
    onClose?: () => void;
    children: React.ReactNode;
}

export const DraggableResizableWindow: React.FC<DraggableResizableWindowProps> = ({
    id,
    title,
    icon = '🪟',
    defaultPosition = { x: 40, y: 100 },
    defaultSize = { width: 360, height: 420 },
    minSize = { width: 240, height: 160 },
    isOpen,
    onClose,
    children
}) => {
    const [pos, setPos] = useState<{ x: number; y: number }>(() => {
        try {
            const saved = localStorage.getItem(`myos_win_pos_${id}`);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return defaultPosition;
    });

    const [size, setSize] = useState<{ width: number; height: number }>(() => {
        try {
            const saved = localStorage.getItem(`myos_win_size_${id}`);
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return defaultSize;
    });

    const [zIndex, setZIndex] = useState<number>(() => ++globalZIndex);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

    const windowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            localStorage.setItem(`myos_win_pos_${id}`, JSON.stringify(pos));
        } catch (e) {}
    }, [id, pos]);

    useEffect(() => {
        try {
            localStorage.setItem(`myos_win_size_${id}`, JSON.stringify(size));
        } catch (e) {}
    }, [id, size]);

    const bringToFront = () => {
        setZIndex(++globalZIndex);
    };

    const handleHeaderPointerDown = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).tagName === 'BUTTON') return;
        bringToFront();
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleHeaderPointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const newX = Math.max(10, Math.min(window.innerWidth - 100, e.clientX - dragOffset.x));
        const newY = Math.max(10, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y));
        setPos({ x: newX, y: newY });
    };

    const handleHeaderPointerUp = (e: React.PointerEvent) => {
        if (isDragging) {
            setIsDragging(false);
            try {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            } catch (err) {}
        }
    };

    const handleResizePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        bringToFront();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            w: size.width,
            h: size.height
        });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleResizePointerMove = (e: React.PointerEvent) => {
        if (!isResizing) return;
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newW = Math.max(minSize.width, Math.min(window.innerWidth - pos.x - 20, resizeStart.w + deltaX));
        const newH = Math.max(minSize.height, Math.min(window.innerHeight - pos.y - 20, resizeStart.h + deltaY));
        setSize({ width: newW, height: newH });
    };

    const handleResizePointerUp = (e: React.PointerEvent) => {
        if (isResizing) {
            setIsResizing(false);
            try {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            } catch (err) {}
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={windowRef}
            onMouseDown={bringToFront}
            style={{
                position: 'fixed',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${size.width}px`,
                height: isMinimized ? 'auto' : `${size.height}px`,
                minWidth: `${minSize.width}px`,
                minHeight: isMinimized ? 'auto' : `${minSize.height}px`,
                zIndex: zIndex,
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.96) 100%)',
                backdropFilter: 'blur(20px)',
                border: isDragging ? '1.5px solid #38bdf8' : '1.5px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '14px',
                boxShadow: isDragging ? '0 25px 50px rgba(56, 189, 248, 0.4), 0 0 20px rgba(56, 189, 248, 0.2)' : '0 15px 35px rgba(0,0,0,0.75)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                pointerEvents: 'auto',
                transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease, border-color 0.2s ease'
            }}
        >
            <div
                onPointerDown={handleHeaderPointerDown}
                onPointerMove={handleHeaderPointerMove}
                onPointerUp={handleHeaderPointerUp}
                style={{
                    padding: '8px 12px',
                    background: isDragging ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.85)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    touchAction: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px', color: '#38bdf8' }}>
                    <span>{icon}</span>
                    <span>{title}</span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        title={isMinimized ? 'Expand' : 'Minimize'}
                        style={{
                            background: 'rgba(51, 65, 85, 0.8)',
                            color: '#94a3b8',
                            border: 'none',
                            borderRadius: '4px',
                            width: '20px',
                            height: '20px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {isMinimized ? '🗖' : '—'}
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            title="Close Window"
                            style={{
                                background: 'rgba(239, 68, 68, 0.8)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                width: '20px',
                                height: '20px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {!isMinimized && (
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}>
                    {children}
                </div>
            )}

            {!isMinimized && (
                <div
                    onPointerDown={handleResizePointerDown}
                    onPointerMove={handleResizePointerMove}
                    onPointerUp={handleResizePointerUp}
                    title="Drag corner to resize window"
                    style={{
                        position: 'absolute',
                        right: '2px',
                        bottom: '2px',
                        width: '16px',
                        height: '16px',
                        cursor: 'nwse-resize',
                        userSelect: 'none',
                        touchAction: 'none',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-end',
                        fontSize: '10px',
                        color: isResizing ? '#38bdf8' : '#64748b',
                        paddingRight: '2px',
                        paddingBottom: '2px',
                        zIndex: 100000
                    }}
                >
                    ◢
                </div>
            )}
        </div>
    );
};
