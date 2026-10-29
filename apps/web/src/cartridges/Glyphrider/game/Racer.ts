import * as THREE from 'three';
import { Track } from './Track';
import { TrickSystem } from './TrickSystem';
import { GameConfig } from './GameConfig';
import { ParticleSystem } from './ParticleSystem';

export enum Archetype {
    PLUMBER = 'PLUMBER',
    BLUR = 'BLUR',
    HUNTER = 'HUNTER',
    ELF = 'ELF'
}

export interface RacerStats {
    acceleration: number;
    maxSpeed: number;
    handling: number; // Steering speed
    weight: number;   // Affects gravity/fall speed
    grip: number;     // Friction
    // Trick Stats (Radians per second)
    pitchSpeed: number;
    yawSpeed: number;
    rollSpeed: number;
    color: string;
    tireColor: string;
}

// Physics Balance:
// Top Speed approx = Acceleration * Delta / (1 - Grip)
// To reach 600 speed with 0.99 friction @ 60fps (dt 0.016):
// 600 * 0.01 = Accel * 0.016 => Accel = 375.
// Let's standardize Grip to very low drag (0.998) so acceleration feels punchy but they drift longer.

export const ARCHETYPE_STATS: Record<Archetype, RacerStats> = {
    [Archetype.PLUMBER]: {
        acceleration: 1200, maxSpeed: 600, handling: 3.0, weight: 60, grip: 0.96,
        pitchSpeed: 4.0, yawSpeed: 5.0, rollSpeed: 3.0,
        color: '#ff0000', tireColor: '#0000ff'
    },
    [Archetype.BLUR]: {
        acceleration: 1500, maxSpeed: 650, handling: 2.5, weight: 50, grip: 0.97,
        pitchSpeed: 6.0, yawSpeed: 4.0, rollSpeed: 6.0,
        color: '#0000ff', tireColor: '#ff0000'
    },
    [Archetype.HUNTER]: {
        acceleration: 1000, maxSpeed: 600, handling: 1.5, weight: 90, grip: 0.95,
        pitchSpeed: 3.0, yawSpeed: 3.0, rollSpeed: 2.0,
        color: '#ffaa00', tireColor: '#00ff00'
    },
    [Archetype.ELF]: {
        acceleration: 1300, maxSpeed: 550, handling: 5.0, weight: 40, grip: 0.96,
        pitchSpeed: 8.0, yawSpeed: 8.0, rollSpeed: 8.0,
        color: '#00ff00', tireColor: '#884400'
    },
};
// Note: I boosted acceleration significantly to overcome the drag.

export class Racer {
    public mesh: THREE.Object3D;
    public t: number = 0;
    public speed: number = 0;
    public angle: number = 0; // Position around the tube
    public altitude: number = 0;
    public verticalVelocity: number = 0;
    public lateralVelocity: number = 0; // Angular velocity
    public railPosition: THREE.Vector3 = new THREE.Vector3(); // Position on the curve (for camera)
    public railTangent: THREE.Vector3 = new THREE.Vector3(); // Tangent of the curve (for camera)
    public railUp: THREE.Vector3 = new THREE.Vector3(); // Up vector of the rail frame (for camera)

    // airborneRotation is defined below, removing duplicate here if present

    public airborneRotation: THREE.Quaternion = new THREE.Quaternion();
    public lastTrickText: string = "";

    // State
    public isGrounded: boolean = true;
    public isJumping: boolean = false;
    public isWipingOut: boolean = false;
    public wipeoutTimer: number = 0;
    private jumpCharge: number = 0;
    private track: Track;
    private stats: RacerStats;
    private model: THREE.Object3D | null = null;
    public wheel: THREE.Object3D | null = null;
    public frameBone: THREE.Object3D | null = null;
    public saddleHead: THREE.Object3D | null = null;
    // Drift & Power-slide State
    public isDrifting: boolean = false;
    public driftSide: number = 0;
    public driftCharge: number = 0;
    public driftTier: number = 0; // 0 = smoke, 1 = blue sparks, 2 = fiery gold sparks
    public particleSystem: ParticleSystem | null = null;
    private trickSystem: TrickSystem;

    constructor(scene: THREE.Scene, track: Track, archetype: Archetype, startT: number, modelTemplate: THREE.Object3D) {
        this.track = track;
        this.t = startT;
        this.stats = ARCHETYPE_STATS[archetype];
        this.trickSystem = new TrickSystem();

        // Clone and setup model
        this.model = modelTemplate.clone();
        this.setupModelColors();

        this.mesh = new THREE.Object3D();
        this.mesh.add(this.model);
        scene.add(this.mesh);

        // Find skeletal bones for mechanical rolling, chassis pitch, and anthropomorphic head camber
        let foundWheelBone: THREE.Object3D | null = null;
        this.model.traverse((child) => {
            if (child.name === 'Bone_Wheel' || child.name === 'Wheel') {
                foundWheelBone = child;
            } else if (child.name === 'Bone_Frame' || child.name === 'Frame') {
                this.frameBone = child;
            } else if (child.name === 'Bone_SaddleHead' || child.name === 'SaddleHead') {
                this.saddleHead = child;
            } else if (!foundWheelBone && !this.wheel && (child.name.toLowerCase().includes('wheel') || child.name.toLowerCase().includes('tire'))) {
                this.wheel = child;
            }
        });
        if (foundWheelBone) {
            this.wheel = foundWheelBone;
        }
    }

    private setupModelColors() {
        if (!this.model) return;
        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                const updatedMats = materials.map((m) => {
                    const mat = m as THREE.MeshStandardMaterial;
                    const matName = (mat.name || '').toLowerCase();
                    if (matName.includes('tire')) {
                        const clonedMat = mat.clone();
                        clonedMat.color.set(this.stats.tireColor || '#111111');
                        return clonedMat;
                    } else if (matName.includes('body')) {
                        const clonedMat = mat.clone();
                        clonedMat.color.set(this.stats.color);
                        return clonedMat;
                    }
                    return mat;
                });
                child.material = Array.isArray(child.material) ? updatedMats : updatedMats[0];
            }
        });
    }

    public update(delta: number, input: any) {
        const { accelerate, brake, steer, jump, pitch, yaw, roll } = input;

        // --- Wipeout State ---
        if (this.isWipingOut) {
            this.wipeoutTimer -= delta;

            // Slow down (friction)
            this.speed *= 0.98;

            // Exaggerated Tumbling (Cartoonish Spin)
            const tumbleSpeed = 20.0;
            this.airborneRotation.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(
                (Math.random() - 0.5) * tumbleSpeed * delta,
                (Math.random() - 0.5) * tumbleSpeed * delta,
                (Math.random() - 0.5) * tumbleSpeed * delta
            )));

            // High Bounce Logic
            if (this.altitude <= 0 && this.verticalVelocity < 0) {
                this.verticalVelocity = -this.verticalVelocity * 0.8; // High restitution (80%)
                // Ensure minimum bounce for "rolling" effect
                if (this.verticalVelocity < 40) this.verticalVelocity = 40;
                this.altitude = 0.1;

                // Add lateral "kick" on bounce
                this.lateralVelocity += (Math.random() - 0.5) * 50;
            }

            this.verticalVelocity -= GameConfig.physics.gravity * delta;
            this.altitude += this.verticalVelocity * delta;

            if (this.wipeoutTimer <= 0) {
                this.recoverFromWipeout();
            }

            // Move along track (uncontrolled forward momentum)
            const trackLength = this.track.curve.getLength();
            this.t += (this.speed * delta) / trackLength;
            this.t %= 1.0;
            if (this.t < 0) this.t += 1.0;

            this.updateMeshPosition(delta);
            return; // Skip normal physics
        }

        // --- Lateral & Drift Physics (Momentum) ---
        const wantsDrift = this.isGrounded && brake && Math.abs(steer) > 0.1 && this.speed > 60;

        if (wantsDrift) {
            this.isDrifting = true;
            this.driftSide = Math.sign(steer);
            this.driftCharge += delta * (this.speed / 160);

            if (this.driftCharge >= 1.8) {
                this.driftTier = 2; // Fiery Gold Sparks
            } else if (this.driftCharge >= 0.7) {
                this.driftTier = 1; // Electric Blue Sparks
            } else {
                this.driftTier = 0; // Tire Smoke
            }

            // High lateral steering into slide
            const driftHandlingAccel = this.stats.handling * 8.0;
            this.lateralVelocity += steer * driftHandlingAccel * delta;

            // Low drag allows rear to whip around
            const driftDrag = 1.8;
            this.lateralVelocity -= this.lateralVelocity * driftDrag * delta;

            // Maintain speed momentum with minimal loss during drift
            this.speed *= 0.988;
        } else {
            // Drift Release Boost!
            if (this.isDrifting) {
                if (this.driftTier === 2) {
                    this.speed += 220;
                    this.lastTrickText = "TURBO POWER-SLIDE (+220 BOOST!)";
                    setTimeout(() => { if (this.lastTrickText.includes("TURBO")) this.lastTrickText = ""; }, 2000);
                } else if (this.driftTier === 1) {
                    this.speed += 95;
                    this.lastTrickText = "DRIFT BOOST (+95!)";
                    setTimeout(() => { if (this.lastTrickText.includes("DRIFT")) this.lastTrickText = ""; }, 2000);
                }
                this.isDrifting = false;
                this.driftTier = 0;
                this.driftCharge = 0;
            }

            // Standard Lateral Handling
            const handlingAccel = this.stats.handling * 5.0;
            this.lateralVelocity += steer * handlingAccel * delta;

            const lateralDrag = 4.0;
            this.lateralVelocity -= this.lateralVelocity * lateralDrag * delta;
        }

        // Update Angle
        this.angle += this.lateralVelocity * delta;

        // --- Linear Physics ---
        if (this.isGrounded) {
            if (!this.isDrifting) {
                // Acceleration
                if (accelerate) this.speed += this.stats.acceleration * delta;
                if (brake) this.speed -= this.stats.acceleration * 1.5 * delta;

                // Friction
                this.speed *= this.stats.grip;
            }

            // Reset rotation
            this.airborneRotation.slerp(new THREE.Quaternion(), 10 * delta);

            // Jumping Logic (Charge)
            if (jump) {
                // Charging...
                this.jumpCharge += delta;
                this.jumpCharge = Math.min(this.jumpCharge, GameConfig.physics.jumpChargeTime);
            } else {
                if (this.jumpCharge > 0) {
                    // Release!
                    this.isGrounded = false;
                    const chargeRatio = this.jumpCharge / GameConfig.physics.jumpChargeTime;
                    const multiplier = 1.0 + (chargeRatio * (GameConfig.physics.maxJumpMultiplier - 1.0));
                    this.verticalVelocity = GameConfig.physics.jumpStrength * multiplier;
                    this.trickSystem.startJump(this.airborneRotation);
                    this.jumpCharge = 0;
                }
            }
        } else {
            // Airborne
            this.verticalVelocity -= GameConfig.physics.gravity * delta;
            this.altitude += this.verticalVelocity * delta;

            // Air control (Tricks - 6 DOF)

            // X-Axis (Pitch): Up/Down Arrow
            const pitchDelta = pitch * this.stats.pitchSpeed * delta;

            // Y-Axis (Yaw): Q/E Keys (Bumper Spin)
            const yawDelta = yaw * this.stats.yawSpeed * delta;

            // Z-Axis (Roll): Left/Right Arrow
            const rollDelta = roll * this.stats.rollSpeed * delta;

            // Strafing momentum is handled by lateralVelocity now.
            // if (steer !== 0) { ... } removed

            const euler = new THREE.Euler(pitchDelta, yawDelta, rollDelta, 'YXZ');
            const rotDelta = new THREE.Quaternion().setFromEuler(euler);
            this.airborneRotation.multiply(rotDelta);

            // Update Trick System with RAW DELTAS
            this.trickSystem.updateInputDeltas(pitchDelta, yawDelta, rollDelta);

            // Landing check
            if (this.altitude <= 0) {
                this.altitude = 0;
                this.verticalVelocity = 0;
                this.isGrounded = true;
                this.checkLanding();
            }
        }

        // --- Movement along Track ---
        const trackLength = this.track.curve.getLength();
        this.t += (this.speed * delta) / trackLength;
        this.t %= 1.0;
        if (this.t < 0) this.t += 1.0;

        // --- Visual Update ---
        this.updateMeshPosition(delta, input);
    }

    private checkLanding() {
        // Calculate Up Vector match
        // Track Up is defined by flow
        // Just checking if we are upright-ish
        const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.airborneRotation);
        // Ideally should be (0,1,0) if we reset perfectly relative to the frame

        if (localUp.y < 0.5) {
            // Trigger Wipeout
            this.isWipingOut = true;
            this.wipeoutTimer = 2.0; // 2 Seconds of shame
            this.isGrounded = false; // We are bouncing
            this.verticalVelocity = 30; // Initial bounce
            this.lastTrickText = "WIPEOUT!";
            // Reset text
            setTimeout(() => { if (this.lastTrickText === "WIPEOUT!") this.lastTrickText = ""; }, 2000);

            // Maintain some speed to slide/bounce
            this.speed *= 0.8;
        } else {
            const result = this.trickSystem.completeJump();
            if (result) {
                this.speed += result.boost;
                // Fade effect or timer could be added later
                this.lastTrickText = `${result.name} (+${result.boost}!)`;
                // Trigger Screen Shake via Global or callback?
                // For prototype, we can make GameManager singleton or pass callback.
                // Assuming we can access game instance... or just skip for now and use speed shake.

                // Clear text after 2 seconds
                setTimeout(() => { if (this.lastTrickText.includes(result.name)) this.lastTrickText = ""; }, 2000);
            }
        }
    }

    private updateMeshPosition(delta: number = 0, input: any = null) {
        // 1. Roll wheel proportional to ground travel speed (wheel radius ~6.25)
        if (this.wheel && delta > 0) {
            this.wheel.rotation.x -= (this.speed * delta) / 6.25;
        }

        // 2. Chassis Lean & Anthropomorphic Head Camber
        if (delta > 0) {
            const isAccelerating = input?.accelerate ?? false;
            const isBraking = input?.brake ?? false;
            const steerVal = input?.steer ?? 0;

            // Pitch: -0.26 rad (~-15 deg) forward lean on accelerate, +0.32 rad (~+18 deg) back on brake
            let targetPitch = 0;
            if (isAccelerating) {
                targetPitch = -0.26;
            } else if (isBraking && !this.isDrifting) {
                targetPitch = 0.32;
            } else if (this.isDrifting) {
                targetPitch = 0.10; // Aggressive power-slide crouch
            }

            // Bank & Yaw: Roll and slide into turn
            let targetBank = -this.lateralVelocity * 0.008;
            let targetChassisYaw = 0;

            if (this.isDrifting) {
                // Kick unicycle tail out sideways into the drift angle
                targetChassisYaw = -this.driftSide * 0.44; // ~25 deg slide angle
                targetBank = -this.driftSide * 0.38;       // Deep bank
            }

            if (this.frameBone) {
                this.frameBone.rotation.x = THREE.MathUtils.lerp(this.frameBone.rotation.x, targetPitch, 12 * delta);
                this.frameBone.rotation.y = THREE.MathUtils.lerp(this.frameBone.rotation.y, targetChassisYaw, 14 * delta);
                this.frameBone.rotation.z = THREE.MathUtils.lerp(this.frameBone.rotation.z, targetBank, 10 * delta);
            }

            // Saddle Head: Counter-pitch (camber joint) to maintain level horizon gaze + counter-steer looking toward apex
            if (this.saddleHead) {
                const targetHeadPitch = -targetPitch * 0.95; // Counter-pitch to keep head level down the track
                // When drifting, head counter-steers to maintain eye contact with the track ahead!
                const targetHeadYaw = this.isDrifting ? (this.driftSide * 0.40) : (steerVal * 0.28);
                const targetHeadRoll = -targetBank * 0.4;    // Subtle cartoon counter-tilt

                this.saddleHead.rotation.x = THREE.MathUtils.lerp(this.saddleHead.rotation.x, targetHeadPitch, 14 * delta);
                this.saddleHead.rotation.y = THREE.MathUtils.lerp(this.saddleHead.rotation.y, targetHeadYaw, 12 * delta);
                this.saddleHead.rotation.z = THREE.MathUtils.lerp(this.saddleHead.rotation.z, targetHeadRoll, 10 * delta);
            }
        }

        const pointOnCurve = this.track.getPointAt(this.t);
        const frame = this.track.getFrenetAt(this.t);
        const tangent = frame.tangent;
        const trackNormal = frame.normal;

        // Calculate Radial Vector (Normal rotated by Angle)
        // This vector always points OUT from the curve center in the corresponding direction.
        const radialVec = trackNormal.clone().applyAxisAngle(tangent, this.angle);

        // Determine Radius and Up-Vector based on Config
        let effectiveRadius: number;
        let playerUpSign: number;

        if (GameConfig.track.side === 'INSIDE') {
            // Inside: Radius = Tube - (Altitude + Offset)
            effectiveRadius = this.track.tubeRadius - (this.altitude + GameConfig.physics.groundOffset);
            playerUpSign = -1; // Player heads towards center (Up is -Radial)
        } else {
            // Outside: Radius = Tube + (Altitude + Offset)
            effectiveRadius = this.track.tubeRadius + (this.altitude + GameConfig.physics.groundOffset);
            playerUpSign = 1; // Player heads away from center
        }

        const finalPos = pointOnCurve.clone().add(radialVec.clone().multiplyScalar(effectiveRadius));
        this.mesh.position.copy(finalPos);

        // Emit drift skid particles from tire contact patch
        if (this.particleSystem && this.isDrifting && this.isGrounded && delta > 0) {
            this.particleSystem.emitSkid(finalPos, tangent, 3, this.driftTier);
        }

        // Calculate Player Up Vector
        const playerUp = radialVec.clone().multiplyScalar(playerUpSign);

        // Store Rail Data for Camera
        this.railPosition.copy(pointOnCurve);
        this.railTangent.copy(tangent);
        this.railUp.copy(playerUp); // Camera locks to this

        // Orientation
        this.mesh.up.copy(playerUp);
        const lookAt = finalPos.clone().add(tangent);
        this.mesh.lookAt(lookAt);

        // Apply airborne rotation
        this.mesh.quaternion.multiply(this.airborneRotation);
    }

    private recoverFromWipeout() {
        this.isWipingOut = false;
        this.isGrounded = true;
        this.verticalVelocity = 0;
        this.altitude = 0;

        // Reset Orientation to normal
        this.airborneRotation.identity();

        // Give control back
        this.lastTrickText = "";
    }

    public reset(newTrack: Track) {
        this.track = newTrack;
        this.t = 0;
        this.speed = 0;
        this.isGrounded = true;
        this.verticalVelocity = 0;
        this.altitude = 0;
        this.airborneRotation.identity();
        this.updateMeshPosition();
    }
}
