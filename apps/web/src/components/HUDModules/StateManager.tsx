import React from 'react';
import { SaveLoadStateModal } from './SaveLoadStateModal';

interface StateManagerProps {
    onExportState: () => void;
    onImportState: () => Promise<any> | void;
    onClose?: () => void;
}

export const StateManager: React.FC<StateManagerProps> = ({
    onExportState,
    onImportState,
    onClose
}) => {
    return (
        <SaveLoadStateModal
            onExportState={onExportState}
            onImportState={onImportState}
            onClose={onClose}
        />
    );
};
