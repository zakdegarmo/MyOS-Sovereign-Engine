
import * as THREE from 'three';
import { GhostSystem, type GhostFrame } from './GhostSystem';
import { Track } from './Track';
import { GameConfig } from './GameConfig';

export class GhostRacer {
    public mesh: THREE.Object3D;
    private ghostSystem: GhostSystem;
    private track: Track;
    private model: THREE.Object3D;

    constructor(scene: THREE.Scene, track: Track, system: GhostSystem, modelTemplate: THREE.Object3D) {
        this.track = track;
        this.ghostSystem = system;

        // Visuals
        this.model = modelTemplate.clone();
        this.makeTranslucent(this.model);

        this.mesh = new THREE.Object3D();
        this.mesh.add(this.model);
        scene.add(this.mesh);
    }

    private makeTranslucent(obj: THREE.Object3D) {
        obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                if (child.material) {
                    // Clone material to avoid affecting real player
                    const mat = child.material instanceof THREE.Material ? child.material.clone() : child.material;

                    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                        mat.transparent = true;
                        mat.opacity = 0.4;
                        mat.color.setHex(0x00ffff); // Cyan Ghost
                        mat.emissive.setHex(0x00ffff);
                        mat.emissiveIntensity = 0.5;
                        child.material = mat;
                    }
                }
            }
        });
    }

    public update(time: number) {
        const frame = this.ghostSystem.getStateAtTime(time);
        if (!frame) {
            // Hide if no data yet or finished
            this.mesh.visible = false;
            return;
        }

        this.mesh.visible = true;

        // Position on Track
        // Reuse Position Logic from Racer (simplified)
        // 1. Get Curve Point
        const curvePoint = this.track.getPointAt(frame.t);
        
        // Safety: If the track is currently unstable, it returns (0,0,0)
        // Skip update this frame to prevent the ghost from flickering to the origin.
        if (curvePoint.lengthSq() < 0.0001) {
            return;
        }

        const frenet = this.track.getFrenetAt(frame.t);

        // 2. Calculate Radial Offset
        const sideSign = GameConfig.track.side === 'INSIDE' ? -1 : 1;
        const radius = this.track.tubeRadius - (sideSign === -1 ? frame.altitude : -frame.altitude) + (GameConfig.physics.groundOffset * sideSign);

        // Wait, altitude logic:
        // Inside: Radius = Tube - Alt
        // Outside: Radius = Tube + Alt

        let effectiveRadius = 0;
        if (GameConfig.track.side === 'INSIDE') {
            effectiveRadius = this.track.tubeRadius - (frame.altitude + GameConfig.physics.groundOffset);
        } else {
            effectiveRadius = this.track.tubeRadius + (frame.altitude + GameConfig.physics.groundOffset);
        }

        const radialVec = frenet.normal.clone().applyAxisAngle(frenet.tangent, frame.angle);

        this.mesh.position.copy(curvePoint).add(radialVec.clone().multiplyScalar(effectiveRadius));

        // 3. Orientation
        // Align to Track
        const up = radialVec.clone().multiplyScalar(sideSign);
        const lookAt = this.mesh.position.clone().add(frenet.tangent);

        this.mesh.up.copy(up);
        this.mesh.lookAt(lookAt);

        // Apply Recorded Rotation
        const recRot = new THREE.Quaternion(frame.rot[0], frame.rot[1], frame.rot[2], frame.rot[3]);
        this.mesh.quaternion.multiply(recRot);
    }

    public reset(newTrack: Track) {
        this.track = newTrack;
        // Check new best run?
    }
}
