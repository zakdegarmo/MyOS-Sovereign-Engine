/**
 * TestCrucible.ts
 * 
 * A test script to demonstrate the 27-point evaluation of a daemon.
 */

import { OptimizationDaemon } from '../Logic/OptimizationDaemon';
import { Crucible } from './Crucible';
import { INITIAL_WORLD_STATE } from '../engine/WorldState';

export async function runCrucibleDemo() {
    const daemon = new OptimizationDaemon();
    console.log("--- ⚗️ INITIATING ALCHEMICAL CRUCIBLE ⚗️ ---");
    
    // 1. Solve: Start the Holographic Fork
    await daemon.execute(INITIAL_WORLD_STATE);
    
    // 2. Extract: Generate the StickyNote (Wisdom)
    const note = daemon.propose();
    console.log("StickyNote Generated:", note);
    
    // 3. Coagulate: Run through the 27-point Evaluation Prism
    const validation = await Crucible.evaluate(daemon, note);
    console.log("Validation Result:", validation);
    
    if (validation.passed) {
        console.log("SUCCESS: Wisdom merged into Master Genome.");
        // In a real system, we would apply note.proposedChanges to the global state here.
    } else {
        console.log("FAILURE: Logic burned in the fire.");
    }

    return validation;
}
