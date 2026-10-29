
import React from 'react';
import { CharacterCreator } from './CharacterCreator';
import { type ProceduralGenome } from '../../utils/ManifestationAlgorithm';

const DEFAULT_GESTALT = {
    archetype: "Initiate",
    coreValues: ["Truth", "Growth"],
    attributes: { 
        construct: { level: 1, xp: 0, history: [] }, 
        resonance: { level: 1, xp: 0, history: [] }, 
        vision: { level: 1, xp: 0, history: [] }, 
        endurance: { level: 1, xp: 0, history: [] } 
    },
    cognitiveModel: { learningStyle: 'visual', riskTolerance: 'balanced', communicationDensity: 'concise' },
    symbiosis: { coherence: 50, friction: 0, flowState: false },
    identity: { name: 'Initiate', alias: 'User' },
    favorites: { color: '#00FFFF', food: 'Code' }
};

/**
 * KITBASHER APP: A standalone entry point for character modulation.
 * This allows testing the character system in isolation via ?kitbash URL.
 */
export const KitbasherApp: React.FC = () => {
    const handleSave = (genome: ProceduralGenome) => {
        console.log("Standalone Kitbash Save:", genome);
        // In standalone mode, we just log or maybe save to localstorage
        localStorage.setItem('myos_user_gestalt', JSON.stringify({ 
            ...DEFAULT_GESTALT, // We should probably import this or mock it
            identity: { name: 'User', alias: 'User' },
            genome 
        }));
        alert("Character Manifested! Restart without ?kitbash to see in world.");
    };

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center p-20">
            <CharacterCreator 
                onSave={handleSave} 
                onClose={() => window.location.href = window.location.origin} 
            />
        </div>
    );
};
