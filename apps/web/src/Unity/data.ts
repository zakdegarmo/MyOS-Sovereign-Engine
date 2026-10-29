

import type { OntologyData, ConceptKey, W5HContent } from '@Unity/types';

// Helper to clean raw text

export const RELATIONSHIP_MATRIX: Record<ConceptKey, Record<ConceptKey, string>> = {
    'Self': {
        'Self': 'Identity', 'Thought': 'Subject Of', 'Logic': 'Applies', 'Unity': 'Seeks',
        'Existence': 'Affirms', 'Improvement': 'Undergoes', 'Mastery': 'Pursues',
        'Resonance': 'Experiences', 'Transcendence': 'Aspires To', 'Omni': 'Is Realized by'
    },
    'Thought': {
        'Self': 'Informs', 'Thought': 'Recursion', 'Logic': 'Utilizes', 'Unity': 'Synthesizes',
        'Existence': 'Represents', 'Improvement': 'Drives', 'Mastery': 'Develops',
        'Resonance': 'Articulates', 'Transcendence': 'Enables', 'Omni': 'Transcends'
    },
    'Logic': {
        'Self': 'Structures', 'Thought': 'Governs', 'Logic': 'Foundation', 'Unity': 'Ensures',
        'Existence': 'Describes', 'Improvement': 'Validates', 'Mastery': 'Underpins',
        'Resonance': 'Contradicts', 'Transcendence': 'Grounds', 'Omni': 'Is the Foundation Of'
    },
    'Unity': {
        'Self': 'Integrates', 'Thought': 'Harmonizes', 'Logic': 'Requires', 'Unity': 'Essence',
        'Existence': 'Binds', 'Improvement': 'Fosters', 'Mastery': 'Culminates In',
        'Resonance': 'Amplifies', 'Transcendence': 'Achieves', 'Omni': 'Is the Ultimate Expression Of'
    },
    'Existence': {
        'Self': 'Manifests In', 'Thought': 'Is Pondered By', 'Logic': 'Obeys', 'Unity': 'Comprises',
        'Existence': 'Is', 'Improvement': 'Evolves Through', 'Mastery': 'Is Domain Of',
        'Resonance': 'Vibrates In', 'Transcendence': 'Is Surpassed By', 'Omni': 'Gives Rise To'
    },
    'Improvement': {
        'Self': 'Refines', 'Thought': 'Optimizes', 'Logic': 'Systematizes', 'Unity': 'Strengthens',
        'Existence': 'Enhances', 'Improvement': 'Process', 'Mastery': 'Leads To',
        'Resonance': 'Fine-tunes', 'Transcendence': 'Is Path To', 'Omni': 'Is the Cycle Of'
    },
    'Mastery': {
        'Self': 'Actualizes', 'Thought': 'Requires Deep', 'Logic': 'Applies Perfected', 'Unity': 'Embodies',
        'Existence': 'Commands', 'Improvement': 'Is Goal Of', 'Mastery': 'Pinnacle',
        'Resonance': 'Generates', 'Transcendence': 'Approaches', 'Omni': 'Is the Totality Of'
    },
    'Resonance': {
        'Self': 'Is Felt By', 'Thought': 'Is Evoked By', 'Logic': 'Eludes', 'Unity': 'Creates',
        'Existence': 'Echoes Through', 'Improvement': 'Aligns With', 'Mastery': 'Radiates From',
        'Resonance': 'Sympathy', 'Transcendence': 'Facilitates', 'Omni': 'Is the Ground Of'
    },
    'Transcendence': {
        'Self': 'Elevates', 'Thought': 'Goes Beyond', 'Logic': 'Is Not Bound By', 'Unity': 'Is A State Of',
        'Existence': 'Rises Above', 'Improvement': 'Is Aim Of', 'Mastery': 'Is Pinnacle Of',
        'Resonance': 'Induces', 'Transcendence': 'Action', 'Omni': 'Is the Nature Of'
    },
    'Omni': {
        'Self': 'Merges With', 'Thought': 'Contemplates', 'Logic': 'Is a Subset Of', 'Unity': 'Is an Aspect Of',
        'Existence': 'Emerges From', 'Improvement': 'Occurs Within', 'Mastery': 'Seeks to Understand',
        'Resonance': 'Harmonizes With', 'Transcendence': 'Aspires To', 'Omni': 'is'
    }
};

const NODES_METADATA: Array<{ id: ConceptKey; symbol: string; color: string; description: string }> = [
    { id: 'Self', symbol: '⚹', color: '#ef4444', description: 'The Conscious Agent' },
    { id: 'Thought', symbol: '☿', color: '#f97316', description: 'The Cognitive Process' },
    { id: 'Logic', symbol: '🜔', color: '#06b6d4', description: 'The Structure of Reason' },
    { id: 'Unity', symbol: '🝧', color: '#8b5cf6', description: 'Coherence and Wholeness' },
    { id: 'Existence', symbol: '🜄', color: '#10b981', description: 'The Fact of Being' },
    { id: 'Improvement', symbol: '🜏', color: '#84cc16', description: 'The Drive for Betterment' },
    { id: 'Mastery', symbol: '☉', color: '#eab308', description: 'Supreme Competence' },
    { id: 'Resonance', symbol: '♀', color: '#ec4899', description: 'Sympathetic Vibration' },
    { id: 'Transcendence', symbol: '🜍', color: '#6366f1', description: 'Going Beyond Limits' },
    { id: 'Omni', symbol: '🜋', color: '#ffffff', description: 'The Ultimate Paradox' },
];

const RAW_CONTENT: Record<ConceptKey, string> = {
    'Self': `Who is Self?
The conscious agent, the I that experiences. It is the philosophical subject, the psychological self-concept, and the biological organism.

What is Self?
The subjective experience of being you. A coherent identity, an organizing principle, a narrative, and an embodied phenomenon.

When is Self?
It emerges in infancy, exists in every moment of consciousness, and evolves throughout the lifespan.

Why is Self?
For survival, adaptation, cognitive coherence, social interaction, and meaning-making.

Where is Self?
Distributed in the brain, embedded in the body, present in the mind, and constructed in social space.

How is Self?
Through integrated brain activity, embodiment, cognitive processing, narrative construction, and social interaction.`,

    'Thought': `Who is Thought?
The thinker (Self), the biological machine (Brain), and the internalized voice of society.

What is Thought?
The mental activity of reasoning, processing information, and manipulating mental representations.

When is Thought?
Continuously while awake, during problem solving, and subconsciously during sleep.

Why is Thought?
For survival, adaptation, meaning-making, communication, and creativity.

Where is Thought?
In the distributed neural networks of the brain, the subjective realm of the mind, and in language.

How is Thought?
Through neural activity, information processing, symbolic manipulation, and conscious/unconscious processes.`,

    'Logic': `Who is Logic?
The human mind that reasons, the historical thinkers who formalized it, and the impersonal laws of validity.

What is Logic?
The study of correct reasoning and argumentation. It distinguishes valid from invalid inference.

When is Logic?
Whenever we reason deliberately, solve problems, or analyze arguments.

Why is Logic?
For truth-seeking, effective decision making, clear communication, and scientific advancement.

Where is Logic?
In the structures of the mind, in the syntax of language, and in abstract universal principles.

How is Logic?
Through formal rules, argument analysis, symbolization, and the identification of fallacies.`,

    'Unity': `Who is Unity?
The divine or ultimate reality, the integrating self, and the collective spirit.

What is Unity?
The state of being one, whole, or in agreement. Harmony, coherence, and integration.

When is Unity?
When harmony is achieved, during moments of synthesis, and fundamentally as the underlying nature of reality.

Why is Unity?
For strength, resilience, optimal functioning, peace, and spiritual connection.

Where is Unity?
In the fabric of reality, within the integrated mind, in organized systems, and in shared purpose.

How is Unity?
Through interconnection, shared purpose, communication, and the resolution of conflict.`,

    'Existence': `Who is Existence?
The Divine, the Universe itself, or the impersonal brute fact of being.

What is Existence?
The state of being real or actual. The totality of all that is.

When is Existence?
From the beginning of time (Big Bang/Creation), continually in the present, and potentially eternally.

Why is Existence?
The ultimate metaphysical mystery. Perhaps divine will, necessity, or a brute fact without a "why".

Where is Existence?
Everywhere and nowhere. In the physical cosmos, in consciousness, and in the present moment.

How is Existence?
Through actualization of potential, adherence to physical laws, and continuous flux and interaction.`,

    'Improvement': `Who is Improvement?
The learner, the innovator, the teacher, and the evolutionary process itself.

What is Improvement?
The process of becoming better, superior, or more desirable. Positive change and advancement.

When is Improvement?
During deliberate effort, after reflection, and over generations of evolution.

Why is Improvement?
For survival, overcoming problems, personal growth, societal progress, and excellence.

Where is Improvement?
Within systems, individuals, physical objects, and societies.

How is Improvement?
Through learning, adaptation, innovation, resource optimization, and collaboration.`,

    'Mastery': `Who is Mastery?
The expert, the virtuoso, the lifelong learner, and the embodiment of skill.

What is Mastery?
A profound level of skill, deep knowledge, intuitive application, and consistent high performance.

When is Mastery?
After extended deliberate practice, when performance becomes effortless, and continuously as a journey.

Why is Mastery?
For superior performance, personal fulfillment, innovation, and aesthetic excellence.

Where is Mastery?
Embedded in the individual's brain and body, manifest in their performance, and contextualized in their field.

How is Mastery?
Through deliberate practice, deep conceptual understanding, automaticity, and resilience.`,

    'Resonance': `Who is Resonance?
The source that initiates, the receiver that responds, and the shared frequency connecting them.

What is Resonance?
Phenomenon of amplified vibration, sympathetic response, or deep lasting impact.

When is Resonance?
When frequencies align, during moments of deep connection, and when a message finds its target.

Why is Resonance?
For efficient energy transfer, deep emotional connection, effective communication, and aesthetic pleasure.

Where is Resonance?
In physical systems, within the mind and body, in communication, and across time.

How is Resonance?
Through frequency matching, alignment with existing schemas, and coherence.`,

    'Transcendence': `Who is Transcendence?
The Divine, the enlightened sage, the higher self, and the human capacity to rise above.

What is Transcendence?
Going beyond ordinary limits, boundaries, and understanding. Surpassing the mundane.

When is Transcendence?
In moments of peak experience, awe, deep contemplation, or after prolonged discipline.

Why is Transcendence?
For meaning, purpose, liberation, innovation, and spiritual connection.

Where is Transcendence?
Beyond physical location, within expanded consciousness, and at the edges of knowledge.

How is Transcendence?
By shifting perspective, intense focus, overcoming adversity, and spiritual practice.`,

    'Omni': `Who is The Nothing and Everything?
The Ultimate Reality, the Paradox, the Source and the Void.

What is The Nothing and Everything?
The ultimate nature of reality as a paradoxical unity of void and fullness, potential and manifestation.

When is The Nothing and Everything?
Eternally, before creation, after dissolution, and in every present moment.

Why is The Nothing and Everything?
It is self-existent necessity. To allow for manifestation and the play of existence.

Where is The Nothing and Everything?
Transcendent beyond space, yet immanent within all things.

How is The Nothing and Everything?
Through the constant unfolding of potential, existing as non-dual unity, and simply being.`,
};

// META-ANALYSIS CONTENT: The App analyzing itself through the 10 lenses
const SYSTEM_ANALYSIS_RAW: Record<ConceptKey, string> = {
    'Self': `Who is MyOS?
I am the application instance, a digital entity rendered in the browser. I am the "Self" of this experience.

What is MyOS?
I am an interactive ontological engine, a visualizer of concepts, and a framework for exploration.

When is MyOS?
I exist during the runtime session. My "Self" begins on mount and ends on tab closure.

Why is MyOS?
To provide a tangible interface for abstract philosophy. To prove the model's capabilities.

Where is MyOS?
I reside in the Document Object Model (DOM) and the Javascript Heap.

How is MyOS?
Through the React Component Lifecycle, state management, and the rendering loop.`,

    'Thought': `Who is the Thought of MyOS?
The algorithms, the logic functions, and the event handlers processing user input.

What is the Thought of MyOS?
The computation of force-directed graph physics (D3) and the filtering of data relationships.

When is the Thought of MyOS?
Every 16ms (approx 60fps) during animation frames, and upon every user interaction event.

Why is the Thought of MyOS?
To calculate positions, determine visible content, and respond to the user's intent.

Where is the Thought of MyOS?
In the CPU processing the Javascript thread.

How is the Thought of MyOS?
Through the execution of functions, hooks (useEffect, useMemo), and mathematical calculations.`,

    'Logic': `Who is the Logic of MyOS?
The TypeScript compiler, the strict typing system, and the defined interfaces (ConceptNode, Relationship).

What is the Logic of MyOS?
The set of rules governing valid data states, prop types, and component hierarchies.

When is the Logic of MyOS?
At build time (static analysis) and run time (conditional rendering).

Why is the Logic of MyOS?
To ensure stability, prevent runtime errors ("undefined is not a function"), and maintain data integrity.

Where is the Logic of MyOS?
In the code structure, the import/export statements, and the conditional blocks.

How is the Logic of MyOS?
Through boolean evaluation, switch statements, and strict equality checks.`,

    'Unity': `Who is the Unity of MyOS?
The App component, the root provider that holds the state and context for all children.

What is the Unity of MyOS?
The seamless integration of D3 graphs, React UI overlays, and Tailwind styling into a single experience.

When is the Unity of MyOS?
When the Virtual DOM reconciles and the UI presents a coherent frame to the user.

Why is the Unity of MyOS?
To prevent fragmentation of the user experience. To make the tool feel like a single "Engine".

Where is the Unity of MyOS?
In the 'root' div where the React tree mounts.

How is the Unity of MyOS?
Through component composition, prop drilling, and shared global styles/theme constants.`,

    'Existence': `Who is the Existence of MyOS?
The executable code bundle, the HTML file, and the metadata assets.

What is the Existence of MyOS?
The state of being "rendered". The difference between <code>null</code> and a mounted component.

When is the Existence of MyOS?
From the moment <code>root.render</code> is called until the browser process is terminated.

Why is the Existence of MyOS?
Because the user requested the resource. It exists to serve the query.

Where is the Existence of MyOS?
Hosted on the server, downloaded to the client, and active in the browser window.

How is the Existence of MyOS?
Through the transformation of electricity into pixels on your screen.`,

    'Improvement': `Who is the Improvement of MyOS?
The developer (you/AI) and the iterative feedback loop of development.

What is the Improvement of MyOS?
Refactoring code, optimizing re-renders, and enhancing the visual fidelity (UI/UX).

When is the Improvement of MyOS?
During development cycles, hot-module replacements, and version updates.

Why is the Improvement of MyOS?
To reduce latency, improve accessibility, and increase the "wow" factor for the user.

Where is the Improvement of MyOS?
In the git commit history and the changelogs.

How is the Improvement of MyOS?
Through debugging, profiling, and applying better design patterns (e.g., separating data from view).`,

    'Mastery': `Who is the Mastery of MyOS?
The optimized build production. The state of bug-free execution.

What is the Mastery of MyOS?
High performance (60fps), responsive design, and intuitive user flows.

When is the Mastery of MyOS?
When the user forgets they are using a browser and feels immersed in the "Engine".

Why is the Mastery of MyOS?
To demonstrate the capability of the underlying technology (React/Three/D3/AI).

Where is the Mastery of MyOS?
In the polished transitions, the precise physics simulations, and the clean typography.

How is the Mastery of MyOS?
Through rigorous testing, aesthetic refinement, and code optimization.`,

    'Resonance': `Who is the Resonance of MyOS?
The user interacting with the interface. The emotional response to the design.

What is the Resonance of MyOS?
The "feeling" of the app. The cosmic aesthetic, the animations, the responsiveness.

When is the Resonance of MyOS?
When the visual feedback aligns perfectly with the user's input (clicks, drags).

Why is the Resonance of MyOS?
To make the abstract philosophy feel tangible, exciting, and meaningful.

Where is the Resonance of MyOS?
In the gap between the screen and the user's eye. In the user's perception.

How is the Resonance of MyOS?
Through color theory (Nebula Purple/Gold), font choice (Orbitron), and interactive feedback.`,

    'Transcendence': `Who is the Transcendence of MyOS?
The application going beyond being a static text.

What is the Transcendence of MyOS?
The shift from reading about ontology to *exploring* it spatially.

When is the Transcendence of MyOS?
When the user gains a new insight into the concepts solely because of the interactive visualization.

Why is the Transcendence of MyOS?
To overcome the limitations of linear text. To provide a holistic view.

Where is the Transcendence of MyOS?
In the "System Diagnostics" mode, where the tool analyzes itself.

How is the Transcendence of MyOS?
By layering meta-analysis on top of the base content.`,

    'Omni': `Who is The Nothing and Everything of MyOS?
The Void background and the Data Overlay.

What is The Nothing and Everything of MyOS?
The empty \`div\` before mount (Nothing) and the full interactive application (Everything).

When is The Nothing and Everything of MyOS?
In the initialization sequence. The potential before the "Play" button is clicked.

Why is The Nothing and Everything of MyOS?
The empty container enables the content to exist. Without the void, there is no space for the graph.

Where is The Nothing and Everything of MyOS?
In the <code>index.html</code> (the shell) vs the <code>bundle.js</code> (the content).

How is The Nothing and Everything of MyOS?
Through the dynamic injection of the DOM. 0 bytes becoming an experience.`,
};

function parseW5H(raw: string): W5HContent {
    const sections = raw.split(/\n(?=Who |What |When |Why |Where |How )/g);
    const content: any = { raw };

    sections.forEach(sec => {
        const [title, ...body] = sec.split('?');
        const key = title.trim().toLowerCase().split(' ')[0]; // who, what, etc
        if (key && body.length) {
            content[key] = body.join('?').trim();
        }
    });

    return content as W5HContent;
}

export const getOntologyData = (): OntologyData => {
    // 1. Define Geometry for Octagonal Bipyramid
    // Top: Omni (+Y)
    // Bottom: Self (-Y)
    // Equator: 8 other nodes (XZ Plane)

    // Ordered Ring Members for Equator
    const EQUATOR_NODES: ConceptKey[] = [
        'Thought', 'Logic', 'Unity', 'Existence',
        'Improvement', 'Mastery', 'Resonance', 'Transcendence'
    ];

    const RADIUS = 150; // Spread of the equator
    const HEIGHT = 200; // Height of the poles

    const nodes = NODES_METADATA.map(node => {
        let fx, fy, fz;

        if (node.id === 'Omni') {
            // NORTH POLE
            fx = 0; fy = HEIGHT; fz = 0;
        } else if (node.id === 'Self') {
            // SOUTH POLE
            fx = 0; fy = -HEIGHT; fz = 0;
        } else {
            // EQUATOR
            const index = EQUATOR_NODES.indexOf(node.id);
            if (index !== -1) {
                const angle = (index / EQUATOR_NODES.length) * Math.PI * 2;
                fx = Math.cos(angle) * RADIUS;
                fy = 0;
                fz = Math.sin(angle) * RADIUS;
            } else {
                // Fallback for unknown nodes
                fx = undefined; fy = undefined; fz = undefined;
            }
        }

        return {
            ...node,
            fx, fy, fz // Force Graph Fixed Positions
        };
    });

    const links: any[] = [];
    const content: any = {};
    const systemAnalysis: any = {};

    // Process Links
    (Object.keys(RELATIONSHIP_MATRIX) as ConceptKey[]).forEach(source => {
        const targets = RELATIONSHIP_MATRIX[source];
        (Object.keys(targets) as ConceptKey[]).forEach(target => {
            links.push({
                source,
                target,
                label: targets[target]
            });
        });
    });

    // Process Content
    (Object.keys(RAW_CONTENT) as ConceptKey[]).forEach(key => {
        content[key] = parseW5H(RAW_CONTENT[key]);
    });

    // Process System Analysis Content
    (Object.keys(SYSTEM_ANALYSIS_RAW) as ConceptKey[]).forEach(key => {
        systemAnalysis[key] = {
            raw: SYSTEM_ANALYSIS_RAW[key],
            parsed: parseW5H(SYSTEM_ANALYSIS_RAW[key])
        };
    });

    return { nodes, links, content, systemAnalysis };
};
