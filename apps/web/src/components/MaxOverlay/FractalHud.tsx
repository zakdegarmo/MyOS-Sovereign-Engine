import React, { useState } from 'react';
import type { GemId } from '../../Omni/types';
import { Dock } from '../../Unity/components/navigation/Dock';
import { FractalDock } from '../../Unity/components/navigation/FractalDock';
import { PILLAR_MODULES } from '../../Omni/constants';

// Our HUD Modules
import { AvatarRoster } from '../HUDModules/AvatarRoster';
import { EnvironmentControls } from '../HUDModules/EnvironmentControls';
import { StateManager } from '../HUDModules/StateManager';
import { SocialInterlink } from '../HUDModules/SocialInterlink';
import { StagecraftControls } from '../HUDModules/StagecraftControls';
import { SpriteLabModule } from '../HUDModules/SpriteLabModule';
import { SpelljammerHelmModule } from '../HUDModules/SpelljammerHelmModule';
import { OrchestratorModule } from '../HUDModules/OrchestratorModule';
import { type AgentId } from '../../council/agentRegistry';

interface FractalHudProps {
    // Dock Navigation Props
    activeGem: GemId;
    setActiveGem: (gem: GemId) => void;

    // HUD Control Props (formerly in SystemHud)
    agents: Record<string, any>;
    activeAgentId: AgentId;
    setActiveAgent: (id: AgentId) => void;
    visibleAgentIds: AgentId[];
    toggleAgentVisibility: (id: AgentId) => void;

    isUiVisible: boolean;
    setIsUiVisible: (val: boolean) => void;
    floorTextureUrl: string;
    setFloorTextureUrl: (url: string) => void;

    onExportState: () => void;
    onImportState: () => void;

    isSocialMode: boolean;
    setIsSocialMode: (val: boolean) => void;

    isStagecraftMode: boolean;
    setIsStagecraftMode: (val: boolean) => void;

    showLab: boolean;
    setShowLab: (val: boolean) => void;

    showHelm: boolean;
    setShowHelm: (val: boolean) => void;

    fileContext?: string;
}

export const FractalHud: React.FC<FractalHudProps> = ({
    activeGem, setActiveGem,
    // Note: Other props are kept for context but no longer used in this simplified view
}) => {
    return (
        <div className="fixed top-4 left-4 z-[70] pointer-events-auto">
            <Dock
                activeGem={activeGem}
                onNavigate={setActiveGem}
            />
        </div>
    );
};
