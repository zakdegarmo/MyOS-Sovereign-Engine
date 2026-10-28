import { useState, useCallback } from 'react';
import { generateResponse } from '../components/MaxOverlay/localLlmService';

export type GameBoard = (string | null)[];

/**
 * useAgentGamePlay
 * Orchestrates a Tic-Tac-Toe game between two AI agents using the local LLM.
 */
export const useAgentGamePlay = () => {
    const [board, setBoard] = useState<GameBoard>(Array(9).fill(null));
    const [currentMoveAgent, setCurrentMoveAgent] = useState<'A' | 'B'>('A');
    const [dialogue, setDialogue] = useState<{ [key: string]: string }>({ 
        'A': 'Initialization complete. Board is clear.', 
        'B': 'Calculations beginning. I await the first move.' 
    });
    const [winner, setWinner] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    const checkWinner = (v: GameBoard) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (v[a] && v[a] === v[b] && v[a] === v[c]) {
                return v[a];
            }
        }
        return v.includes(null) ? null : 'Draw';
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setWinner(null);
        setCurrentMoveAgent('A');
        setDialogue({
            'A': 'Game reset. Let us begin again.',
            'B': 'Ready for the next iteration.'
        });
    };

    const triggerAiTurn = useCallback(async () => {
        if (winner || isThinking) return;

        setIsThinking(true);
        const agentName = currentMoveAgent === 'A' ? 'Logic Prime' : 'System Arbiter';
        const opponentName = currentMoveAgent === 'A' ? 'System Arbiter' : 'Logic Prime';
        const mark = currentMoveAgent === 'A' ? 'X' : 'O';

        // Represent board clearly for LLM
        const boardStr = board.map((cell, i) => cell === null ? `index ${i}` : cell).join(' | ');
        
        const prompt = `
            CURRENT GAME: Tic-Tac-Toe
            YOU ARE: ${agentName}
            OPPONENT: ${opponentName}
            YOUR MARK: ${mark}
            BOARD: [ ${boardStr} ]

            TASK: 
            1. Select an available index (0-8) where the board says "index X".
            2. Provide a short, logical teaser/banter (max 15 words).
            
            FORMAT: Respond with a JSON block:
            { "move": number, "dialogue": "string" }
        `;

        try {
            const result = await generateResponse(prompt, undefined, "You are a competitive but highly logical AI player in a simulation.");
            
            // Extract JSON from the potentially verbose LLM output
            const jsonStart = result.text.indexOf('{');
            const jsonEnd = result.text.lastIndexOf('}') + 1;
            
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = result.text.substring(jsonStart, jsonEnd);
                const { move, dialogue: npcDialogue } = JSON.parse(jsonStr);

                if (typeof move === 'number' && move >= 0 && move <= 8 && board[move] === null) {
                    const newBoard = [...board];
                    newBoard[move] = mark;
                    setBoard(newBoard);
                    setDialogue(prev => ({ ...prev, [currentMoveAgent]: npcDialogue }));
                    
                    const gameResult = checkWinner(newBoard);
                    if (gameResult) {
                        setWinner(gameResult === 'Draw' ? 'Draw' : (currentMoveAgent === 'A' ? 'Logic Prime' : 'System Arbiter'));
                    } else {
                        setCurrentMoveAgent(currentMoveAgent === 'A' ? 'B' : 'A');
                    }
                } else {
                    console.warn(`[AgentGame] Agent ${agentName} attempted illegal move: ${move}`);
                    // Fallback to first available move if LLM fails
                    const fallbackMove = board.indexOf(null);
                    if (fallbackMove !== -1) {
                        const newBoard = [...board];
                        newBoard[fallbackMove] = mark;
                        setBoard(newBoard);
                        setDialogue(prev => ({ ...prev, [currentMoveAgent]: "Logical error encountered. Recalculating path..." }));
                        
                        const gameResult = checkWinner(newBoard);
                        if (gameResult) {
                            setWinner(gameResult === 'Draw' ? 'Draw' : (currentMoveAgent === 'A' ? 'Logic Prime' : 'System Arbiter'));
                        } else {
                            setCurrentMoveAgent(currentMoveAgent === 'A' ? 'B' : 'A');
                        }
                    }
                }
            }
        } catch (e) {
            console.error("[AgentGame] AI processing error:", e);
        } finally {
            setIsThinking(false);
        }
    }, [board, currentMoveAgent, winner, isThinking]);

    return { 
        board, 
        currentMoveAgent, 
        dialogue, 
        winner, 
        isThinking, 
        resetGame, 
        triggerAiTurn 
    };
};
