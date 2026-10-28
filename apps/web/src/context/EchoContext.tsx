import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface ThoughtPacket {
    agentId: string;
    monologue: string;
    state: string;
    timestamp: number;
    skillActive?: boolean;
    skillType?: 'pc' | 'screen' | 'none';
}

interface EchoContextType {
    packets: ThoughtPacket[];
    emitPulse: (pulse: Omit<ThoughtPacket, 'timestamp'>) => void;
}

const EchoContext = createContext<EchoContextType | undefined>(undefined);

export function EchoProvider({ children }: { children: ReactNode }) {
    const [packets, setPackets] = useState<ThoughtPacket[]>([]);

    const emitPulse = useCallback((pulse: Omit<ThoughtPacket, 'timestamp'>) => {
        const newPacket = { ...pulse, timestamp: Date.now() };
        setPackets(prev => [newPacket, ...prev].slice(0, 50)); // Keep last 50 thoughts
    }, []);

    return (
        <EchoContext.Provider value={{ packets, emitPulse }}>
            {children}
        </EchoContext.Provider>
    );
}

export const useEcho = () => {
    const context = useContext(EchoContext);
    if (!context) throw new Error('useEcho must be used within EchoProvider');
    return context;
};
