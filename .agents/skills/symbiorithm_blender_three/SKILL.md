---
name: symbiorithm-blender-three
description: >-
  Bridge Blender's offline rigging, animation baking, and armature exports with MyOS's native Three.js soundstage, enabling live automated multi-shot filming and 60fps canvas recording.
---

# Symbiorithm Blender-Three.js Cinematic Bridge

## Overview
The **Symbiorithm Blender-Three.js Bridge** formalizes the "Workshop and Soundstage" architecture between Blender 5.2 and MyOS (React Three Fiber / Three.js).
- **Blender (The Workshop)**: Authoring 3D geometry, rigging armatures, maintaining bone hierarchies, and baking modular character `AnimationClips` (e.g. `roll_puddle`, `idle_slouch`, `spring_bounce`).
- **MyOS (The Soundstage)**: Staging physical sets, lights, shaders, programmatic multi-camera choreography, live audio synchronization, and 60 FPS viewport recording via `useCanvasRecorder`.

## Dependencies
- Blender 5.2 (`C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`)
- MyOS WebGL Soundstage (`apps/web/src/hooks/useCanvasRecorder.ts`)
- `symbiorithm` skill for Triadic human-AI-AI governance

## Quick Start

### 1. Inspect Rig and Animation Tracks
Verify that an exported actor GLB has all parent bones and animation tracks intact:
```powershell
python scripts/tools/blender_three_bridge.py inspect-glb apps/web/public/models/uniracer_hero.glb
```

### 2. Export Actor from Blend File
Export the verified model with bone parenting preserved:
```powershell
python scripts/tools/blender_three_bridge.py export-actor --blend uniracer_model.blend --output apps/web/public/models/uniracer_hero.glb
```

### 3. Bake Named Animation Clip
Bake character actions into the Blender rig for in-engine playback:
```powershell
python scripts/tools/blender_three_bridge.py bake-clip --blend uniracer_model.blend --action roll_puddle --type roll_puddle
```

## The 5 Theatrical Primitives
Every cinematic shot in MyOS is composed of 5 primitives:
1. **The Set**: Geometry, floor elevation, environmental fog, lighting (e.g. `JunkyardWorld.tsx`).
2. **The Props**: Dynamic and static scene props (e.g. couches, burn barrels, CRT TVs, oil puddles).
3. **The Actors**: Rigged GLB assets with named `AnimationClips` driven by Three.js `AnimationMixer`.
4. **The Camera**: Programmatic camera rig (interpolating position, lookAt target, FOV, lens damping).
5. **The Audio**: Diegetic sound effects and background musical score.

## Workflow

### 1. Model & Rig Verification in Blender
1. Check that all child meshes (pedals, cranks, saddle) are parented to armature bones via `type='BONE'` with zero inverted scale.
2. Run `inspect-glb` to ensure no disconnected meshes or orphaned transforms exist.

### 2. Live Soundstage Directing in MyOS
1. Mount the character GLB in the active dimension (e.g. `JunkyardWorld.tsx`).
2. Use camera interpolation or keyframed timeline tracks for cinematic cuts (e.g. bird's-eye descent into worm's-eye puddle).
3. Trigger canvas recording via `useCanvasRecorder` to export high-bitrate MP4 screenings directly into `apps/web/public/screenings/`.

## Common Mistakes
1. **Scaling Only the Armature in Blender**: If child meshes are not parent-inverted or are parented to bones with relative offsets, scaling the armature object alone causes child meshes (like pedals) to float in mid-air. Always apply transforms or verify bone parenting before export.
2. **Using Outdated Subfolder Models**: Always treat the root workspace `.blend` file as canonical unless explicitly directed otherwise.
3. **Attempting to Author Skeletal Rigs in Three.js**: Never attempt to write manual joint-matrix solvers in Three.js when Blender can bake clean, standard GLTF `AnimationClip` tracks in seconds.
