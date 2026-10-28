export const GameConfig = {
    camera: {
        offsetX: 0,
        offsetY: 25,
        offsetZ: -50,
        lookAtHeight: 5,
        smoothness: 5.0,
        baseFov: 85,
        maxFov: 110,
        fovSpeedEffect: 1.0,
        snapThreshold: 100
    },
    physics: {
        gravity: 100,
        jumpStrength: 40,
        jumpChargeTime: 1.0,
        maxJumpMultiplier: 2.0,
        speedScale: 0.1,
        groundOffset: 2.5,
        stompGravity: 400, // Force during stomp
        stompBoost: 300    // Speed gain on landing after stomp
    },
    // The Decad: 10-Pillar Micro-Ontology Stats
    decad: {
        existence: 600,   // Base Velocity (maxSpeed)
        thought: 6.0,     // Rotation X (pitch)
        logic: 6.0,       // Rotation Z (roll)
        unity: 4.0,       // Rotation Y (yaw)
        self: 0.97,       // Handling (grip/friction)
        improvement: 5.0, // Magnetism (landing assist radius)
        mastery: 0.1,     // Combo Multiplier (per trick weight)
        resonance: 200,   // Boost Strength
        transcendence: 45, // Jump Force
        omni: 1.0         // Stomp / Recovery Power
    },
    tricks: {
        rotationSpeed: 5.0,
        landingWindow: 0.5
    },
    track: {
        tubeRadius: 30,
        side: 'OUTSIDE' as 'INSIDE' | 'OUTSIDE',
        baseLerpSpeed: 0.1 // Base P/Q interpolation speed
    }
};
