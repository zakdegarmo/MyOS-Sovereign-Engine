
import type { PrimitiveType, TransformState, ModifiersState } from '@Omni/types';

// Define the Schema for AI Commands
export type CoreCommandType = 'spawn' | 'transform' | 'modify' | 'delete' | 'clear' | 'load_library';

export interface CoreCommand {
    action: CoreCommandType;
    // For 'spawn'
    primitive?: PrimitiveType;
    params?: any;
    // For 'transform' / 'modify' / 'delete'
    targetId?: string; // If null, applies to last created or currently selected? Agent should specify.
    transform?: Partial<TransformState>;
    modifiers?: Partial<ModifiersState>;
    // For 'load_library'
    libraryId?: string;
}

export interface DispatcherResult {
    success: boolean;
    message: string;
    createdId?: string;
}

/**
 * The Dispatcher functions as the "Hands" of the AI. 
 * It takes a raw JSON command (likely from a Large Language Model) 
 * and executes the corresponding function in the Core Context.
 */
export class CoreDispatcher {
    private context: any; // Typed as CoreContextType in usage

    constructor(context: any) {
        this.context = context;
    }

    public execute(command: CoreCommand): DispatcherResult {
        console.log(`[CoreDispatcher] Executing: ${command.action}`, command);

        try {
            switch (command.action) {
                case 'spawn':
                    return this.handleSpawn(command);
                case 'transform':
                    return this.handleTransform(command);
                case 'modify':
                    return this.handleModify(command);
                case 'delete':
                    return this.handleDelete(command);
                case 'clear':
                    this.context.clearScene(); // Assuming CoreContext has this
                    return { success: true, message: "Scene Cleared." };
                default:
                    return { success: false, message: `Unknown action: ${command.action}` };
            }
        } catch (error) {
            console.error("[CoreDispatcher] Execution Failed:", error);
            return { success: false, message: `Execution Error: ${error}` };
        }
    }

    private handleSpawn(cmd: CoreCommand): DispatcherResult {
        if (!cmd.primitive) return { success: false, message: "Spawn requires 'primitive' type." };

        // Prepare overrides to set initial state immediately
        let newId: string;

        if (cmd.primitive === 'voxel_grid') {
            // For Voxel Grid, we pass the ENTIRE params object as the materialParams/modifiers
            // The Viewer3D will need a special component to render this list.
            const overrides = {
                transform: cmd.transform,
                params: cmd.params // Contains { voxelSize, voxels: [] }
            };
            newId = this.context.addPrimitive('voxel_grid', overrides);
        } else {
            const overrides = {
                transform: cmd.transform,
                params: cmd.params
            };
            newId = this.context.addPrimitive(cmd.primitive, overrides);
        }

        return { success: true, message: `Spawned ${cmd.primitive}`, createdId: newId };
    }

    private handleTransform(cmd: CoreCommand): DispatcherResult {
        if (!cmd.targetId) return { success: false, message: "Transform requires 'targetId'." };
        if (!cmd.transform) return { success: false, message: "Transform requires 'transform' data." };

        this.context.updateTransform(cmd.targetId, cmd.transform);
        return { success: true, message: `Transformed ${cmd.targetId}` };
    }

    private handleModify(cmd: CoreCommand): DispatcherResult {
        // Implementation for modifiers update
        if (!cmd.targetId) return { success: false, message: "Modify requires 'targetId'." };
        // Context needs updateModifiers method
        // this.context.updateModifiers(cmd.targetId, cmd.modifiers);
        return { success: true, message: `Modified ${cmd.targetId}` };
    }

    private handleDelete(cmd: CoreCommand): DispatcherResult {
        if (!cmd.targetId) return { success: false, message: "Delete requires 'targetId'." };
        this.context.deleteObject(cmd.targetId);
        return { success: true, message: `Deleted ${cmd.targetId}` };
    }
}
