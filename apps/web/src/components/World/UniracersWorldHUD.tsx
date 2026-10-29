// apps/web/src/components/World/UniracersWorldHUD.tsx
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Eye, MapPin, X, Trophy, Navigation } from 'lucide-react';
import { HUB_RADIUS, CITY_DISTANCE, PILLAR_NAMES, PILLAR_COLORS } from './UniracersHighwayGraph';
import { useUniracersWorldStore } from './UniracersWorldStore';

const PILLAR_GLYPHS = ['◉', '✧', '∴', '⚭', '⬡', '⇈', '❂', '∿', '⍟', '۞'];

export interface UniracersHUDProps {
    speed?: number;
    score?: number;
    currentBranchName?: string;
    currentPillarName?: string;
    cameraMode?: 'NORMAL' | 'WIDE' | 'REAR' | 'SIDE_2D' | 'TOP_DOWN';
    upcomingJunctionLabel?: string;
    lastTrickText?: string;
    playerWorldPos?: [number, number, number];
    playerHeading?: number;
    onToggleCamera?: () => void;
}

export const UniracersWorldHUD: React.FC<UniracersHUDProps> = (props) => {
    const store = useUniracersWorldStore();

    const speed = props.speed !== undefined ? props.speed : store.speed;
    const score = props.score !== undefined ? props.score : store.score;
    const currentBranchName = props.currentBranchName || store.currentBranchName;
    const currentPillarName = props.currentPillarName || store.currentPillarName;
    const cameraMode = props.cameraMode || store.cameraMode;
    const upcomingJunctionLabel = props.upcomingJunctionLabel || store.upcomingJunctionLabel;
    const lastTrickText = props.lastTrickText !== undefined ? props.lastTrickText : store.lastTrickText;
    const playerWorldPos = props.playerWorldPos || store.playerWorldPos;
    const playerHeading = props.playerHeading !== undefined ? props.playerHeading : store.playerHeading;
    const onToggleCamera = props.onToggleCamera || store.toggleCamera;
    const isTacticalMapOpen = store.isTacticalMapOpen;
    const toggleTacticalMap = store.toggleTacticalMap;

    const mph = Math.max(0, Math.floor(speed * 0.16));
    const [px, , pz] = playerWorldPos;

    // Mini-map radar normalized coordinates (-1..1 within world radius 5500)
    const mapScale = 1 / 5500;
    const radarX = Math.max(-1, Math.min(1, px * mapScale));
    const radarZ = Math.max(-1, Math.min(1, pz * mapScale));
    const playerAngleDeg = (playerHeading * 180) / Math.PI;

    const cameraModeLabels: Record<string, string> = {
        NORMAL: 'CHASE (3D)',
        WIDE: 'CINEMATIC WIDE',
        REAR: 'LOW PURSUIT',
        SIDE_2D: '2.5D RETRO PROFILE (1994)',
        TOP_DOWN: 'PLANETARY SATELLITE'
    };

    return (
        <div className="fixed inset-0 pointer-events-none select-none overflow-hidden font-mono z-[20000]">
            {/* --- TOP LOCATION BANNER --- */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                <div className="px-6 py-2 rounded-xl bg-black/85 border-2 border-white/20 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center gap-3">
                    <MapPin size={16} className="text-amber-400 animate-pulse" />
                    <span className="text-white text-xs font-bold tracking-widest uppercase">
                        {currentBranchName}
                    </span>
                    {currentPillarName && (
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-bold">
                            {currentPillarName}
                        </span>
                    )}
                </div>

                {upcomingJunctionLabel && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="px-4 py-1.5 rounded-lg bg-amber-500/90 text-black text-[11px] font-black tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce"
                    >
                        {upcomingJunctionLabel}
                    </motion.div>
                )}
            </div>

            {/* --- STUNT TRICK SPLASH --- */}
            <AnimatePresence>
                {lastTrickText && (
                    <motion.div
                        key={lastTrickText}
                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                        animate={{ scale: 1.15, opacity: 1, y: 0 }}
                        exit={{ scale: 1.35, opacity: 0 }}
                        transition={{ type: 'spring', damping: 14 }}
                        className="absolute top-1/4 left-1/2 -translate-x-1/2 px-8 py-3.5 bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-500 text-black font-black text-2xl tracking-widest italic rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.9)] border-2 border-white uppercase flex items-center gap-3"
                    >
                        <span>⚡ {lastTrickText} ⚡</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- TOP-RIGHT CONTROLS & CAMERA --- */}
            <div className="absolute top-6 right-6 pointer-events-auto flex items-center gap-2">
                <button
                    onClick={toggleTacticalMap}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-black/80 border border-white/20 hover:border-amber-400 backdrop-blur-md transition-all text-xs font-bold text-white shadow-xl hover:scale-105"
                    title="Toggle Fullscreen Tactical Map (Key: M)"
                >
                    <Navigation size={14} className="text-amber-400" />
                    <span>MAP</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-amber-400">KEY: M</span>
                </button>

                <button
                    onClick={onToggleCamera}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/80 border border-white/20 hover:border-cyan-400/80 backdrop-blur-md transition-all text-xs font-bold text-white shadow-xl hover:scale-105"
                    title="Press C to toggle camera angle"
                >
                    <Eye size={15} className="text-cyan-400" />
                    <span>{cameraModeLabels[cameraMode]}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-amber-400">KEY: C</span>
                </button>
            </div>

            {/* --- BOTTOM-LEFT GTA-STYLE MINI-MAP RADAR --- */}
            <div className="absolute bottom-20 left-6 flex items-end gap-3 pointer-events-auto">
                <div
                    onClick={toggleTacticalMap}
                    className="w-48 h-48 rounded-full bg-black/90 border-2 border-white/30 backdrop-blur-md relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.9)] cursor-pointer hover:border-cyan-400 transition-colors group"
                    title="Click or press M to expand full tactical map"
                >
                    {/* Compass North Indicator */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] text-cyan-400 font-bold tracking-widest z-10">
                        N
                    </div>

                    <svg className="w-full h-full" viewBox="-1.2 -1.2 2.4 2.4">
                        {/* Outer Perimeter */}
                        <circle cx="0" cy="0" r="1.0" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.015" />
                        
                        {/* Central Roundabout Highway */}
                        <circle 
                            cx="0" 
                            cy="0" 
                            r={HUB_RADIUS / 5500} 
                            fill="none" 
                            stroke="#FFE500" 
                            strokeWidth="0.04" 
                        />

                        {/* 10 Spoke Highways radiating out */}
                        {Array.from({ length: 10 }).map((_, k) => {
                            const angle = (k / 10) * Math.PI * 2;
                            const x1 = Math.cos(angle) * (HUB_RADIUS / 5500);
                            const z1 = Math.sin(angle) * (HUB_RADIUS / 5500);
                            const x2 = Math.cos(angle) * (CITY_DISTANCE / 5500);
                            const z2 = Math.sin(angle) * (CITY_DISTANCE / 5500);
                            return (
                                <g key={k}>
                                    <line
                                        x1={x1}
                                        y1={z1}
                                        x2={x2}
                                        y2={z2}
                                        stroke={PILLAR_COLORS[k]}
                                        strokeWidth="0.03"
                                        opacity="0.85"
                                    />
                                    {/* City Blip */}
                                    <circle
                                        cx={x2}
                                        cy={z2}
                                        r="0.05"
                                        fill={PILLAR_COLORS[k]}
                                        stroke="#ffffff"
                                        strokeWidth="0.01"
                                    />
                                    <text
                                        x={x2}
                                        y={z2 + 0.02}
                                        fontSize="0.055"
                                        fill="#ffffff"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontWeight="bold"
                                    >
                                        {PILLAR_GLYPHS[k]}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Player Blip with Directional Pointer Arrow */}
                        <g transform={`translate(${radarX}, ${radarZ}) rotate(${playerAngleDeg})`}>
                            {/* Radar Ping Animation */}
                            <circle
                                cx="0"
                                cy="0"
                                r="0.07"
                                fill="none"
                                stroke="#00F0FF"
                                strokeWidth="0.015"
                                className="animate-ping"
                            />
                            {/* Direction Arrow */}
                            <polygon
                                points="0,-0.07 -0.045,0.045 0,0.02 0.045,0.045"
                                fill="#00F0FF"
                                stroke="#FFFFFF"
                                strokeWidth="0.01"
                            />
                        </g>
                    </svg>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-white/50 font-bold group-hover:text-amber-400 transition-colors">
                        [M] FULL MAP
                    </div>
                </div>
            </div>

            {/* --- BOTTOM-RIGHT SPEEDOMETER, SCORE & CONTROLS --- */}
            <div className="absolute bottom-20 right-6 flex items-end gap-3 pointer-events-auto">
                <div className="px-6 py-4 rounded-2xl bg-black/85 border-2 border-white/20 backdrop-blur-md shadow-2xl flex flex-col items-end">
                    {/* Score Readout */}
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs mb-1">
                        <Trophy size={14} className="text-yellow-400" />
                        <span>SCORE:</span>
                        <span className="text-white text-sm font-black">{score.toLocaleString()}</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-amber-400 font-mono tracking-tighter">
                            {mph}
                        </span>
                        <span className="text-xs font-bold text-white/60">MPH</span>
                    </div>

                    {/* Speed Tier Bar */}
                    <div className="w-44 h-2 rounded-full bg-white/10 overflow-hidden mt-2 p-0.5 border border-white/20">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 rounded-full transition-all duration-75"
                            style={{ width: `${Math.min(100, (mph / 140) * 100)}%` }}
                        />
                    </div>

                    <div className="text-[9px] text-white/50 mt-2 font-mono text-right leading-tight">
                        [W] ACCEL | [S] BRAKE/DRIFT | [SPACE] JUMP<br/>
                        [ARROWS] FLIPS/ROLLS | [Q/E] TWIST | [M] MAP
                    </div>
                </div>
            </div>

            {/* --- FULLSCREEN TACTICAL PLANETARY MAP MODAL (KEY: M) --- */}
            <AnimatePresence>
                {isTacticalMapOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[30000] bg-black/90 backdrop-blur-xl pointer-events-auto flex flex-col items-center justify-center p-8"
                    >
                        {/* Map Header */}
                        <div className="w-full max-w-5xl flex items-center justify-between pb-4 border-b border-white/20 mb-4">
                            <div className="flex items-center gap-3">
                                <Navigation size={22} className="text-amber-400 animate-spin" />
                                <div>
                                    <h2 className="text-lg font-black text-white tracking-widest uppercase">
                                        Planetary Transit Grid — 10 Topological Pillars
                                    </h2>
                                    <p className="text-xs text-white/50">
                                        GTA Sandbox Highway & Arterial Topology
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={toggleTacticalMap}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-rose-500/80 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                            >
                                <X size={16} />
                                <span>CLOSE (M / ESC)</span>
                            </button>
                        </div>

                        {/* Interactive Vector Transit Map */}
                        <div className="w-full max-w-5xl h-[70vh] bg-black/60 rounded-2xl border-2 border-white/20 relative overflow-hidden flex items-center justify-center shadow-2xl">
                            <svg className="w-full h-full p-4" viewBox="-1.3 -1.3 2.6 2.6">
                                {/* Background Grid Rings */}
                                <circle cx="0" cy="0" r="1.15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.008" />
                                <circle cx="0" cy="0" r="0.8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.008" />
                                <circle cx="0" cy="0" r="0.45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.008" />

                                {/* Central Sovereign Spire & Roundabout */}
                                <circle 
                                    cx="0" 
                                    cy="0" 
                                    r={HUB_RADIUS / 5500} 
                                    fill="rgba(255, 229, 0, 0.08)" 
                                    stroke="#FFE500" 
                                    strokeWidth="0.035" 
                                />
                                <circle cx="0" cy="0" r="0.035" fill="#FFE500" />
                                <text x="0" y="0.06" fill="#FFE500" fontSize="0.035" textAnchor="middle" fontWeight="black">
                                    THE NEXUS
                                </text>

                                {/* 10 Spoke Highways radiating out */}
                                {Array.from({ length: 10 }).map((_, k) => {
                                    const angle = (k / 10) * Math.PI * 2;
                                    const startAngle = angle - 0.28;
                                    const x0 = Math.cos(startAngle) * (HUB_RADIUS / 5500);
                                    const z0 = Math.sin(startAngle) * (HUB_RADIUS / 5500);
                                    const x1 = Math.cos(angle) * (HUB_RADIUS / 5500);
                                    const z1 = Math.sin(angle) * (HUB_RADIUS / 5500);
                                    const x2 = Math.cos(angle) * (CITY_DISTANCE / 5500);
                                    const z2 = Math.sin(angle) * (CITY_DISTANCE / 5500);

                                    // Compute distance from player to city
                                    const cityWorldX = Math.cos(angle) * CITY_DISTANCE;
                                    const cityWorldZ = Math.sin(angle) * CITY_DISTANCE;
                                    const distToPlayer = Math.hypot(px - cityWorldX, pz - cityWorldZ);

                                    return (
                                        <g key={k}>
                                            {/* Tangential Off-Ramp Slipway */}
                                            <path
                                                d={`M ${x0} ${z0} Q ${x1 * 1.15} ${z1 * 1.15} ${x1 * 1.3} ${z1 * 1.3}`}
                                                fill="none"
                                                stroke={PILLAR_COLORS[k]}
                                                strokeWidth="0.02"
                                                strokeDasharray="0.02 0.01"
                                                opacity="0.8"
                                            />

                                            {/* Spoke Superhighway Arterial */}
                                            <line
                                                x1={x1}
                                                y1={z1}
                                                x2={x2}
                                                y2={z2}
                                                stroke={PILLAR_COLORS[k]}
                                                strokeWidth="0.032"
                                                opacity="0.9"
                                            />

                                            {/* Pillar City Metropolitan Node */}
                                            <circle
                                                cx={x2}
                                                cy={z2}
                                                r="0.075"
                                                fill={PILLAR_COLORS[k]}
                                                stroke="#FFFFFF"
                                                strokeWidth="0.015"
                                            />
                                            <text
                                                x={x2}
                                                y={z2 + 0.025}
                                                fontSize="0.075"
                                                fill="#000000"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                fontWeight="black"
                                            >
                                                {PILLAR_GLYPHS[k]}
                                            </text>

                                            {/* City Label */}
                                            <text
                                                x={x2 * 1.18}
                                                y={z2 * 1.18}
                                                fontSize="0.042"
                                                fill={PILLAR_COLORS[k]}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                fontWeight="bold"
                                            >
                                                {PILLAR_NAMES[k]} ({Math.round(distToPlayer)}m)
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Active Player Beacon with Heading Pointer */}
                                <g transform={`translate(${radarX}, ${radarZ}) rotate(${playerAngleDeg})`}>
                                    <circle
                                        cx="0"
                                        cy="0"
                                        r="0.09"
                                        fill="none"
                                        stroke="#00F0FF"
                                        strokeWidth="0.018"
                                        className="animate-ping"
                                    />
                                    <polygon
                                        points="0,-0.08 -0.055,0.05 0,0.025 0.055,0.05"
                                        fill="#00F0FF"
                                        stroke="#FFFFFF"
                                        strokeWidth="0.012"
                                    />
                                </g>
                            </svg>

                            {/* Floating Telemetry Box */}
                            <div className="absolute bottom-4 left-4 bg-black/80 border border-white/20 p-3 rounded-xl backdrop-blur-md text-[11px] flex flex-col gap-1">
                                <div className="text-amber-400 font-bold">CURRENT LOCATION:</div>
                                <div className="text-white font-bold">{currentBranchName}</div>
                                <div className="text-cyan-300">
                                    COORDS: X={Math.round(px)} | Z={Math.round(pz)}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
