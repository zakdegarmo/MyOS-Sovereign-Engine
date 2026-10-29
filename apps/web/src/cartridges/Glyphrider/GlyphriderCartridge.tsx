/**
 * Glyphrider/GlyphriderCartridge.tsx
 * 
 * Master Cartridge Component: Glyphrider - Rogue Unicycle League (Indy Reboot).
 * Integrates 3D stunt physics, rail-racing track curves, trick multipliers,
 * and the 5-Act Uniracers reboot story campaign.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameManager } from './game/GameManager';
import { GlyphriderCampaignHUD } from './GlyphriderCampaignHUD';
import { UNIRACER_CAMPAIGN_CHAPTERS } from './campaign/UniracerCampaign';
import { INITIAL_LEADERBOARD, type LeaderboardEntry } from './campaign/mockLeaderboard';
import type { CartridgeProps } from '../Cartridge';

export const GlyphriderCartridge: React.FC<CartridgeProps> = ({ onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<GameManager | null>(null);

    const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [speed, setSpeed] = useState<number>(0);
    const [boost, setBoost] = useState<number>(0);
    const [lastTrick, setLastTrick] = useState<{ name: string; points: number } | null>(null);
    const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(true);
    const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);

    const currentChapter = UNIRACER_CAMPAIGN_CHAPTERS[currentChapterIndex];

    // Initialize 3D Stunt Game Engine
    useEffect(() => {
        if (!containerRef.current) return;

        const game = new GameManager(containerRef.current);
        gameRef.current = game;

        // Custom config for chapter 1
        game.trackConfig = {
            ...currentChapter.trackConfig,
            tubeRadius: currentChapter.trackConfig.tubeRadius || 28,
            tubularSegments: currentChapter.trackConfig.tubularSegments || 300,
            radialSegments: currentChapter.trackConfig.radialSegments || 16,
            trackColor: currentChapter.trackConfig.trackColor || '#ef4444'
        };

        game.onExit = () => {
            if (onClose) onClose();
        };

        game.init().then(() => {
            game.createTrack();
            game.createRacers();
        });

        (window as any).__GLYPHRIDER_GAME = game;

        return () => {
            game.dispose();
            (window as any).__GLYPHRIDER_GAME = null;
            gameRef.current = null;
        };
    }, []);

    // Stunt simulation metric polling
    useEffect(() => {
        const interval = setInterval(() => {
            if (!gameRef.current) return;
            const player = (gameRef.current as any).player;
            if (player) {
                const currentSpeed = Math.max(0, Math.floor(player.speed * 0.1));
                setSpeed(currentSpeed);
                setBoost(Math.min(100, Math.max(0, (player.speed - 300) / 4)));

                // Check for trick updates
                if (player.score !== undefined && player.score !== score) {
                    const diff = player.score - score;
                    if (diff > 0) {
                        setScore(player.score);
                        setLastTrick({
                            name: player.lastTrickName || 'RADICAL STUNT COMBO',
                            points: diff
                        });

                        // Check Win Condition
                        const target = currentChapter.winCondition.targetScore || 2000;
                        if (player.score >= target && !isVictoryOpen) {
                            setIsVictoryOpen(true);
                            // Update player position in leaderboard
                            setLeaderboard(prev => {
                                const copy = [...prev];
                                const pIdx = copy.findIndex(e => e.isPlayer);
                                if (pIdx >= 0) copy[pIdx].score = player.score;
                                else copy.push({ rank: 4, name: "Player (You)", score: player.score, bestTrick: "Mega Combo", avatarColor: "#facc15", isPlayer: true });
                                copy.sort((a, b) => b.score - a.score);
                                return copy.map((e, idx) => ({ ...e, rank: idx + 1 }));
                            });
                        }
                    }
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [score, currentChapter, isVictoryOpen]);

    const handleStartChapter = useCallback(() => {
        setIsBriefingOpen(false);
        if (gameRef.current) {
            gameRef.current.startRace();
        }
    }, []);

    const handleNextChapter = useCallback(() => {
        setIsVictoryOpen(false);
        const nextIdx = (currentChapterIndex + 1) % UNIRACER_CAMPAIGN_CHAPTERS.length;
        setCurrentChapterIndex(nextIdx);
        setIsBriefingOpen(true);
        setScore(0);

        // Morph Track Topology in Game Engine
        if (gameRef.current) {
            const nextCh = UNIRACER_CAMPAIGN_CHAPTERS[nextIdx];
            gameRef.current.trackConfig = {
                ...nextCh.trackConfig,
                tubeRadius: nextCh.trackConfig.tubeRadius || 30,
                tubularSegments: nextCh.trackConfig.tubularSegments || 350,
                radialSegments: nextCh.trackConfig.radialSegments || 16,
                trackColor: nextCh.trackConfig.trackColor || '#3b82f6'
            };
            (gameRef.current as any).createTrack?.();
        }
    }, [currentChapterIndex]);

    const handleRestartChapter = useCallback(() => {
        setIsVictoryOpen(false);
        setScore(0);
        if (gameRef.current) {
            (gameRef.current as any).createTrack?.();
        }
    }, []);

    return (
        <div className="w-full h-full bg-black relative overflow-hidden select-none">
            {/* --- 90S TOURNAMENT BROADCAST HUD --- */}
            <GlyphriderCampaignHUD
                currentChapter={currentChapter}
                score={score}
                speed={speed}
                boost={boost}
                lastTrick={lastTrick}
                leaderboard={leaderboard}
                isBriefingOpen={isBriefingOpen}
                isVictoryOpen={isVictoryOpen}
                onStartChapter={handleStartChapter}
                onNextChapter={handleNextChapter}
                onRestartChapter={handleRestartChapter}
            />

            {/* --- 3D VIEWPORT CONTAINER --- */}
            <div 
                ref={containerRef} 
                className="w-full h-full relative"
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default GlyphriderCartridge;
