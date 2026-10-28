import React, { useState, useEffect, useRef } from 'react';
import { DraggableResizableWindow } from './DraggableResizableWindow';
import { Flame, ShieldAlert, Sparkles, RefreshCw, Crosshair, Zap, Activity } from 'lucide-react';

interface MicrovoxelCombatLabProps {
    isOpen?: boolean;
    onClose?: () => void;
}

interface VoxelParticle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    size: number;
    color: string;
    alpha: number;
    life: number;
    maxLife: number;
}

interface SkinVoxel {
    baseX: number;
    baseY: number;
    baseZ: number;
    currentX: number;
    currentY: number;
    currentZ: number;
    size: number;
    color: string;
    isDamaged: boolean;
    health: number;
}

export const MicrovoxelCombatLab: React.FC<MicrovoxelCombatLabProps> = ({
    isOpen = true,
    onClose
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [dragonHealth, setDragonHealth] = useState<number>(100);
    const [totalDamageDealt, setTotalDamageDealt] = useState<number>(0);
    const [isBreathingFire, setIsBreathingFire] = useState<boolean>(false);
    const [rotY, setRotY] = useState<number>(0.45);
    const [rotX, setRotX] = useState<number>(0.2);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const skinVoxelsRef = useRef<SkinVoxel[]>([]);
    const flyingShardsRef = useRef<VoxelParticle[]>([]);
    const fireBillboardsRef = useRef<VoxelParticle[]>([]);
    const animFrameRef = useRef<number | null>(null);

    // Initialize Dragon Microvoxel Skin Matrix
    const initDragonSkin = () => {
        const voxels: SkinVoxel[] = [];
        const numBody = 650;

        // 1. Torso & Flank Grout
        for (let i = 0; i < numBody; i++) {
            const t = i / numBody;
            const y = (t * 2.8) - 1.4;
            const yNorm = (y + 1.4) / 2.8;
            const radX = (Math.sin(yNorm * Math.PI * 0.9 + 0.2) * 55) + 18;
            const radZ = (Math.sin(yNorm * Math.PI * 0.9 + 0.2) * 65) + 18;

            const theta = Math.random() * Math.PI * 2;
            const x = Math.cos(theta) * radX;
            const z = Math.sin(theta) * radZ;

            let color = '#8b1524';
            if (z > radZ * 0.65) {
                color = '#f59e0b';
            } else if (z < -radZ * 0.6) {
                color = '#1f2937';
            }

            voxels.push({
                baseX: x,
                baseY: y * 40,
                baseZ: z,
                currentX: x,
                currentY: y * 40,
                currentZ: z,
                size: Math.random() * 2 + 5,
                color,
                isDamaged: false,
                health: 100
            });
        }

        // 2. Serpentine Neck Voxels
        for (let n = 0; n < 9; n++) {
            const sFrac = n / 9;
            const ny = -60 - (n * 16);
            const nx = Math.sin(sFrac * Math.PI * 1.5) * 22;
            const nz = 10 + Math.sin(sFrac * Math.PI * 0.8) * 35;
            const nRad = 20 - (sFrac * 6);

            for (let j = 0; j < 16; j++) {
                const theta = Math.random() * Math.PI * 2;
                const x = nx + Math.cos(theta) * nRad;
                const z = nz + Math.sin(theta) * nRad;

                voxels.push({
                    baseX: x,
                    baseY: ny,
                    baseZ: z,
                    currentX: x,
                    currentY: ny,
                    currentZ: z,
                    size: 4.5,
                    color: z > nz + nRad * 0.5 ? '#f59e0b' : '#991b1b',
                    isDamaged: false,
                    health: 100
                });
            }
        }

        skinVoxelsRef.current = voxels;
        flyingShardsRef.current = [];
        setDragonHealth(100);
        setTotalDamageDealt(0);
    };

    useEffect(() => {
        initDragonSkin();
    }, []);

    const triggerSwordStrike = (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = clientX - rect.left - rect.width / 2;
        const clickY = clientY - rect.top - rect.height / 2;

        let hitCount = 0;
        const newShards: VoxelParticle[] = [];

        skinVoxelsRef.current.forEach((vox) => {
            if (vox.isDamaged) return;

            const cosY = Math.cos(rotY);
            const sinY = Math.sin(rotY);
            const rx = vox.currentX * cosY - vox.currentY * sinY;
            const ry = vox.currentX * sinY + vox.currentY * cosY;
            const cosX = Math.cos(rotX);
            const sinX = Math.sin(rotX);
            const rz = vox.currentZ * cosX - ry * sinX;
            const fov = 350 / (350 + (ry * cosX + vox.currentZ * sinX));

            const projX = rx * fov;
            const projY = -rz * fov;

            const dist2D = Math.hypot(projX - clickX, projY - clickY);

            if (dist2D < 32) {
                vox.isDamaged = true;
                hitCount++;

                const blastAngle = Math.random() * Math.PI * 2;
                const blastSpeed = Math.random() * 8 + 4;
                newShards.push({
                    x: vox.currentX,
                    y: vox.currentY,
                    z: vox.currentZ,
                    vx: Math.cos(blastAngle) * blastSpeed,
                    vy: Math.sin(blastAngle) * blastSpeed,
                    vz: (Math.random() * 6 + 4),
                    size: vox.size * 0.8,
                    color: Math.random() > 0.4 ? '#ef4444' : '#f87171',
                    alpha: 1.0,
                    life: 0,
                    maxLife: Math.random() * 30 + 35
                });
            }
        });

        if (hitCount > 0) {
            flyingShardsRef.current.push(...newShards);
            const damage = Math.min(dragonHealth, Math.floor(hitCount * 1.8));
            setDragonHealth(prev => Math.max(0, prev - damage));
            setTotalDamageDealt(prev => prev + damage);
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            if (isBreathingFire) {
                const mouthPos = { x: 12, y: -180, z: 25 };
                for (let f = 0; f < 4; f++) {
                    const fSpeed = Math.random() * 5 + 6;
                    const fAngle = Math.random() * Math.PI * 2;
                    const fSpread = Math.random() * 1.5;
                    fireBillboardsRef.current.push({
                        x: mouthPos.x,
                        y: mouthPos.y,
                        z: mouthPos.z,
                        vx: Math.cos(fAngle) * fSpread - 1.2,
                        vy: -fSpeed,
                        vz: Math.sin(fAngle) * fSpread - 0.8,
                        size: 2,
                        color: '#fbbf24',
                        alpha: 1.0,
                        life: 0,
                        maxLife: 42
                    });
                }
            }

            flyingShardsRef.current.forEach((shard) => {
                shard.x += shard.vx;
                shard.y += shard.vy;
                shard.z += shard.vz;
                shard.vz -= 0.35;
                shard.life++;
                shard.alpha = Math.max(0, 1.0 - (shard.life / shard.maxLife));
            });
            flyingShardsRef.current = flyingShardsRef.current.filter(s => s.life < s.maxLife && s.z > -100);

            fireBillboardsRef.current.forEach((fb) => {
                fb.x += fb.vx;
                fb.y += fb.vy;
                fb.z += fb.vz;
                fb.life++;
                const prog = fb.life / fb.maxLife;
                if (prog < 0.45) {
                    fb.size = (prog / 0.45) * 16 + 2;
                } else {
                    fb.size = (1.0 - ((prog - 0.45) / 0.55)) * 16;
                }
                fb.alpha = Math.max(0, 1.0 - (prog * 0.9));
                if (prog < 0.3) fb.color = '#ffffff';
                else if (prog < 0.6) fb.color = '#fbbf24';
                else if (prog < 0.85) fb.color = '#f97316';
                else fb.color = '#ec4899';
            });
            fireBillboardsRef.current = fireBillboardsRef.current.filter(f => f.life < f.maxLife);

            const cosY = Math.cos(rotY);
            const sinY = Math.sin(rotY);
            const cosX = Math.cos(rotX);
            const sinX = Math.sin(rotX);

            interface RenderItem {
                projX: number;
                projY: number;
                depth: number;
                size: number;
                color: string;
                alpha: number;
                isWound?: boolean;
                isFire?: boolean;
            }

            const items: RenderItem[] = [];

            skinVoxelsRef.current.forEach((vox) => {
                const rx = vox.currentX * cosY - vox.currentY * sinY;
                const ry = vox.currentX * sinY + vox.currentY * cosY;
                const rz = vox.currentZ * cosX - ry * sinX;
                const depth = ry * cosX + vox.currentZ * sinX;
                const fov = 400 / (400 + depth);

                items.push({
                    projX: centerX + rx * fov,
                    projY: centerY - rz * fov,
                    depth,
                    size: vox.size * fov,
                    color: vox.isDamaged ? '#ef4444' : vox.color,
                    alpha: vox.isDamaged ? 0.4 : 1.0,
                    isWound: vox.isDamaged
                });
            });

            flyingShardsRef.current.forEach((shard) => {
                const rx = shard.x * cosY - shard.y * sinY;
                const ry = shard.x * sinY + shard.y * cosY;
                const rz = shard.z * cosX - ry * sinX;
                const depth = ry * cosX + shard.z * sinX;
                const fov = 400 / (400 + depth);

                items.push({
                    projX: centerX + rx * fov,
                    projY: centerY - rz * fov,
                    depth,
                    size: shard.size * fov,
                    color: shard.color,
                    alpha: shard.alpha
                });
            });

            fireBillboardsRef.current.forEach((fb) => {
                const rx = fb.x * cosY - fb.y * sinY;
                const ry = fb.x * sinY + fb.y * cosY;
                const rz = fb.z * cosX - ry * sinX;
                const depth = ry * cosX + fb.z * sinX;
                const fov = 400 / (400 + depth);

                items.push({
                    projX: centerX + rx * fov,
                    projY: centerY - rz * fov,
                    depth,
                    size: fb.size * fov,
                    color: fb.color,
                    alpha: fb.alpha,
                    isFire: true
                });
            });

            items.sort((a, b) => b.depth - a.depth);

            items.forEach((item) => {
                ctx.save();
                ctx.globalAlpha = item.alpha;
                ctx.fillStyle = item.color;

                if (item.isFire) {
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = item.color;
                    ctx.beginPath();
                    ctx.arc(item.projX, item.projY, Math.max(1, item.size), 0, Math.PI * 2);
                    ctx.fill();
                } else if (item.isWound) {
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(item.projX - item.size / 2, item.projY - item.size / 2, item.size, item.size);
                } else {
                    ctx.fillRect(item.projX - item.size / 2, item.projY - item.size / 2, item.size, item.size);
                }
                ctx.restore();
            });

            animFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [rotX, rotY, isBreathingFire]);

    if (!isOpen) return null;

    return (
        <DraggableResizableWindow
            title="MICROVOXEL COMBAT & DESTRUCTION LAB"
            onClose={onClose}
            initialPosition={{ x: 80, y: 80 }}
            initialSize={{ width: 880, height: 640 }}
        >
            <div className="flex flex-col h-full bg-[#0d0d14] text-slate-100 font-sans p-4 gap-4 select-none">
                <div className="flex items-center justify-between px-4 py-2 bg-black/40 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-red-400 animate-pulse" />
                        <div>
                            <div className="text-sm font-bold text-slate-200 tracking-wide uppercase">Apex Wyrm Point Cloud Matrix</div>
                            <div className="text-[10px] text-slate-400 font-mono">Realtime Dynamic Surface Grout & Damage Physics</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end gap-1">
                            <div className="text-[11px] font-mono font-bold text-red-400 flex items-center gap-2">
                                <ShieldAlert size={14} />
                                WYRM INTEGRITY: {dragonHealth}%
                            </div>
                            <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden border border-red-500/30">
                                <div
                                    className="h-full bg-gradient-to-r from-red-600 to-amber-400 transition-all duration-300"
                                    style={{ width: `${dragonHealth}%` }}
                                />
                            </div>
                        </div>

                        <div className="text-center px-3 py-1 bg-red-950/40 border border-red-500/40 rounded-lg">
                            <div className="text-[9px] text-red-300 font-mono uppercase">Total Damage</div>
                            <div className="text-base font-mono font-black text-red-400">{totalDamageDealt}</div>
                        </div>
                    </div>
                </div>

                <div
                    className="relative flex-1 bg-black/60 border border-white/10 rounded-2xl overflow-hidden cursor-crosshair group shadow-inner"
                    onMouseDown={(e) => {
                        if (e.button === 0 && e.shiftKey) {
                            setIsDragging(true);
                            setLastMousePos({ x: e.clientX, y: e.clientY });
                        } else if (e.button === 0) {
                            triggerSwordStrike(e.clientX, e.clientY);
                        }
                    }}
                    onMouseMove={(e) => {
                        if (isDragging) {
                            const dx = e.clientX - lastMousePos.x;
                            const dy = e.clientY - lastMousePos.y;
                            setRotY(prev => prev + dx * 0.01);
                            setRotX(prev => Math.max(-1.0, Math.min(1.0, prev + dy * 0.01)));
                            setLastMousePos({ x: e.clientX, y: e.clientY });
                        }
                    }}
                    onMouseUp={() => setIsDragging(false)}
                >
                    <canvas
                        ref={canvasRef}
                        width={820}
                        height={460}
                        className="w-full h-full block"
                    />

                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                        <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-[10px] font-mono text-cyan-400 flex items-center gap-1.5">
                            <Crosshair size={12} /> Click on Dragon to Strike & Dislodge Microvoxels
                        </div>
                        <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-[10px] font-mono text-slate-400">
                            Hold Shift + Drag to Rotate 3D Camera
                        </div>
                    </div>

                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <button
                            onMouseDown={() => setIsBreathingFire(true)}
                            onMouseUp={() => setIsBreathingFire(false)}
                            onMouseLeave={() => setIsBreathingFire(false)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider flex items-center gap-2 transition-all shadow-lg ${
                                isBreathingFire
                                    ? 'bg-amber-500 text-black shadow-amber-500/50 scale-105'
                                    : 'bg-red-600/80 hover:bg-red-500 text-white border border-red-400/40'
                            }`}
                        >
                            <Flame size={16} className={isBreathingFire ? 'animate-bounce' : ''} />
                            HOLD TO BREATHE FIRE
                        </button>

                        <button
                            onClick={initDragonSkin}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all"
                            title="Regenerate Microvoxel Skin"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <div>
                            <div className="text-xs font-bold text-slate-200">Point Cloud Grout</div>
                            <div className="text-[10px] text-slate-400 font-mono">Conforms to skeletal volume with positional gravity</div>
                        </div>
                    </div>

                    <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl flex items-center gap-3">
                        <Zap className="w-5 h-5 text-red-400" />
                        <div>
                            <div className="text-xs font-bold text-slate-200">Ballistic Particle Physics</div>
                            <div className="text-[10px] text-slate-400 font-mono">Dislodged voxels inherit combat strike kinetic force</div>
                        </div>
                    </div>

                    <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-purple-400" />
                        <div>
                            <div className="text-xs font-bold text-slate-200">Sub-Dermal Gore Layer</div>
                            <div className="text-[10px] text-slate-400 font-mono">Dynamic wound exposure without texture swaps</div>
                        </div>
                    </div>
                </div>
            </div>
        </DraggableResizableWindow>
    );
};
