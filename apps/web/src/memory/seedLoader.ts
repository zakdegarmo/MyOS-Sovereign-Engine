import { saveLibraryItem, getLibraryItems } from './libraryService';

const SEEDS = [
    {
        title: "MyOS Architecture Overview",
        deweyCode: "004.2",
        content: `MyOS is a "Middle Reality" operating system built on top of a 3D isometric plane. It bridges the gap between static code and dynamic, generative environments.
        
        Key Components:
        - The Council: 10 distinct agents representing the MyOntology pillars.
        - The Orchestrator: A 2D manifestation that guides the user.
        - Battleship Grid: A 10x10 wireframe overlay (A1-J10).
        - The Universal Library: A multi-media internal filesystem.`,
        tags: ["architecture", "nexus", "overview"],
        pillarConnections: ["Thought.Architecture", "Existence.Assets"]
    },
    {
        title: "The 10 Pillars of MyOntology",
        deweyCode: "100.0",
        content: `These pillars form the Fractal Semantic Genome of MyOS.
        1. Self (⚹): Identity, Agency.
        2. Thought (☿): Analysis, Mental Models.
        3. Logic (🜔): Truth, Kernels.
        4. Unity (🝧): Connection.
        5. Existence (🜄): Assets.
        6. Improvement (🜏): Optimization.
        7. Mastery (☉): Skills.
        8. Resonance (♀): Aesthetics.
        9. Transcendence (🜍): Beyond the Grid.
        10. Omni (🜋): Synthesis.`,
        tags: ["ontology", "pillars", "genome"],
        pillarConnections: ["Self.Identity", "Omni.Synthesis"]
    },
    {
        title: "Evolution Log: HUD V4 & The 2D Manifestation",
        deweyCode: "005.1",
        content: `Recent refinements (2026-03-02):
        - Orchestrator: Shifted to a 2D Sprite manifestation.
        - Coordinate System: Battleship Grid (A1-J10) for layout, Euclidean for precision.
        - Library Evolution: Upgraded to Internal Filesystem with specialized tabs.`,
        tags: ["updates", "v4", "evolution"],
        pillarConnections: ["Improvement.Refinement", "Mastery.Precision"]
    }
];

export const initializeLibrary = () => {
    const existing = getLibraryItems();
    if (existing.length === 0) {
        console.log("Seeding Universal Library...");
        SEEDS.forEach(seed => {
            saveLibraryItem({
                ...seed,
                deweyCategory: seed.deweyCode.split('.')[0] + "00",
                type: 'knowledge'
            });
        });
    }
};
