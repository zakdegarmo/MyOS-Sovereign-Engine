
import { useEffect, useRef, useState, useCallback } from 'react';
import { SwarmClient } from './swarm-client';

export type SwarmMessage = {
    method?: string;
    params?: any;
    result?: any;
    error?: any;
}

export function useSwarm() {
    const [lastMessage, setLastMessage] = useState<SwarmMessage | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef<SwarmClient | null>(null);

    useEffect(() => {
        // Initialize Client
        clientRef.current = new SwarmClient('http://localhost:3000');

        clientRef.current.connect(
            (data) => {
                console.log('Swarm Incoming:', data);
                setLastMessage(data);
            },
            () => {
                setIsConnected(true);
            }
        );

        return () => {
            clientRef.current?.disconnect();
        };
    }, []);

    const sendCommand = useCallback(async (command: string) => {
        // In a real generic MCP client, we would verify what tools are available.
        // For now, we assume we are talking to the 'Self' agent via a chat-like tool 
        // OR we just use a hypothetical 'chat' method.
        // BUT, since we have 'spawn_agent', let's just try to call that if the user types 'spawn ...'

        // Basic simulation of intent parsing
        if (command.startsWith('spawn ')) {
            const parts = command.split(' ');
            const pillar = parts[1];
            const task = parts.slice(2).join(' ');

            const response = await clientRef.current?.sendMessage('tools/call', {
                name: 'spawn_agent',
                arguments: { pillar, task }
            });
            if (response) {
                console.log('Command Response:', response);
                setLastMessage(response);
            }
        } else {
            // [CHAT ROUTER SUPPORT]
            // Send as a generic message payload, not JSON-RPC, to be handled by the Server Router
            console.log("Sending Chat Message:", command);
            fetch('http://localhost:3000/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat: command })
            }).catch(err => console.error("Chat Error:", err));
        }
    }, []);

    const callTool = useCallback(async (name: string, args: any) => {
        if (!clientRef.current) throw new Error('Swarm Client not connected');
        // @ts-ignore - SwarmClient definition update pending
        return clientRef.current.callTool(name, args);
    }, []);

    return { isConnected, lastMessage, sendCommand, callTool, client: clientRef.current };
}
