# Nanobanana Generation Prompt: Project MyOS 10x10 Spritesheets

**Context:**
I am building a modular 2D Paperdoll engine. I need to generate **10 separate SpriteSheet images** (one for each of my 10 distinct character archetypes). 

The engine uses strict algorithmic slicing. It will fail if you generate random layouts, overlapping sprites, or varying box sizes (like the example provided). 

### The Strict Requirement: The 10x10 Grid
For each character, you must generate exactly ONE image that contains a **10 Row by 10 Column Grid**.
Every single cell in the grid MUST map to a 64x64 pixel square. Do not deviate from this grid. The image must have a pure magenta (`#FF00FF`) background or pure transparency.

*   **The 10 Rows (Y-Axis) = The Body Parts.** Each row contains isolated parts of the character, drawn in the *exact location* they belong relative to the center of a 64x64 canvas.
*   **The 10 Columns (X-Axis) = The Variations/Modulations.** Each column represents a slight visual change, color swap, texture change, or animation frame for that specific body part.

### The 10 Layer Mapping (Rows Top to Bottom)
*   **Row 1 (Top): Omni (Aura/Background Effects)** - Energy fields, halos.
*   **Row 2: Resonance (Back Accessories)** - Capes, jets, backpacks.
*   **Row 3: Transcendence (Floating Elements)** - Drones, detached wings.
*   **Row 4: Existence (Legs)** - Waist down.
*   **Row 5: The Anchor (Base Torso)** - Chest and stomach.
*   **Row 6: Unity (Clothing Base)** - Undershirts, base plating over torso.
*   **Row 7: Improvement (Armor/Tech)** - Bulky armor overcoats.
*   **Row 8: Logic (Arms/Weapons)** - Symmetrical or asymmetrical arms.
*   **Row 9: Thought (Head/Face)** - The skull, eyes, jaw.
*   **Row 10 (Bottom): Mastery (Headwear)** - Helmets, crowns, hair.

### Example Generation: Character 1 - 'Self' (The Baseline)
Create the Master SpriteSheet for the 'Self' archetype using the 10x10 grid rules above.
*   **Vibe:** Standard, balanced humanoid.
*   **Rows:** Follow the exact 1-10 mapping above. Row 5 is a standard torso. Row 8 is standard arms.
*   **Columns:** 
    *   **Column 1:** The baseline default coloring and shape for all 10 body parts.
    *   **Columns 2-10:** Apply subtle modulations to the baseline parts as you move right across the grid. Change the metal texture, shift the hue of the aura, add scratches to the armor, or slightly tweak the shape of the visor.

*(Note to User: Once this generates a proper 10x10 'Self' sheet, run this exact prompt 9 more times for the remaining 9 characters ('Thought', 'Logic', 'Unity', etc.), tweaking the 'Vibe' line for each.)*
