import { useState, useEffect } from 'react';

export interface TelemetryState {
    agents: Record<string, any>;
    system: {
        cpu: number;
        fps: number;
        status: string;
        [key: string]: any;
    };
    timestamp: number;
}

export function useSwarmTelemetry() {
    const [telemetry, setTelemetry] = useState<TelemetryState>({
        agents: {},
        system: { cpu: 0, fps: 0, status: 'disconnected' },
        timestamp: Date.now()
    });
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Fetch initial state immediately
        fetch('http://localhost:3000/state')
            .then(res => res.json())
            .then(data => {
                setTelemetry(data);
                setIsConnected(true);
            })
            .catch(err => console.error('Failed to fetch initial telemetry state:', err));

        const eventSource = new EventSource('http://localhost:3000/sse');

        eventSource.onopen = () => setIsConnected(true);
        eventSource.onerror = () => setIsConnected(false);

        eventSource.addEventListener('telemetry', (e) => {
            try {
                const data = JSON.parse(e.data);
                setTelemetry(data);
                setIsConnected(true);
            } catch (err) {
                console.warn('Failed to parse telemetry event', err);
            }
        });

        return () => {
            eventSource.close();
            setIsConnected(false);
        };
    }, []);

    return { telemetry, isConnected };
}
