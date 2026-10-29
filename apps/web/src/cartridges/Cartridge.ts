/**
 * Cartridge.ts
 * 
 * The "Game Cartridge" interface for the OmniLab engine.
 * Defines the contract for swappable React-based modules.
 */

import React from 'react';

export interface CartridgeMetadata {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    icon?: string;
    category: 'game' | 'utility' | 'experimental' | 'optical';
}

export interface CartridgeProps {
    onClose?: () => void;
    swarmHost?: string; // e.g. "localhost:3000"
    currentDimension?: string;
    [key: string]: any;
}

export type CartridgeComponent = React.FC<CartridgeProps>;

export interface Cartridge {
    metadata: CartridgeMetadata;
    Component: CartridgeComponent;
}
