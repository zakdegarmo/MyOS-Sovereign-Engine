import * as THREE from 'three';

export class SpeedLines {
    private scene: THREE.Scene;
    private mesh: THREE.InstancedMesh;
    private count: number = 500;
    private dummy: THREE.Object3D = new THREE.Object3D();
    private particles: { x: number, y: number, z: number, speed: number, len: number, color: THREE.Color }[] = [];

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        // Create geometry for a single line (tapered look via scaling)
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 1.0);
        geometry.translate(0, 0, 0.5); // Pivot at start

        // Use BasicMaterial for maximum pop, additive blending for glow
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff, // Vertex colors will override
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        // Allocation for vertex colors
        this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.count * 3), 3);
        this.scene.add(this.mesh);

        // Init particles
        for (let i = 0; i < this.count; i++) {
            this.particles.push(this.resetParticle(true));
        }
    }

    private resetParticle(initial: boolean = false) {
        // Spawn in a tunnel, leaving center clear
        const r = 15 + Math.random() * 40;
        const angle = Math.random() * Math.PI * 2;

        const color = Math.random() > 0.5 ? new THREE.Color('#00ffff') : new THREE.Color('#ff00ff');

        return {
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            z: initial ? (Math.random() - 0.5) * 200 : -100 - Math.random() * 50, // Start ahead of camera (negative Z in local space?)
            // Actually, we want lines to fly TOWARDS camera or PAST it?
            // "Speed lines" usually streak past. So they move +Z relative to camera if camera looks -Z.
            speed: 50 + Math.random() * 100, // Very fast relative speed
            len: 5 + Math.random() * 10,
            color: color
        };
    }

    public update(delta: number, playerSpeed: number, camera: THREE.Camera) {
        // Show based on speed threshold
        const speedRatio = Math.max(0, (playerSpeed - 100) / 1000); // 0 at 100, 1 at 1100

        if (speedRatio <= 0.05) {
            this.mesh.visible = false;
            return;
        }
        this.mesh.visible = true;

        // Update Material Opacity based on speed
        (this.mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(speedRatio * 0.8, 0.5);

        // Visual Speed Multiplier
        const relativeSpeed = 200 + (playerSpeed * 0.5);

        for (let i = 0; i < this.count; i++) {
            const p = this.particles[i];

            // Move past camera (+Z)
            p.z += relativeSpeed * delta;

            // Respawn if behind camera (z > 20)
            if (p.z > 20) {
                const newP = this.resetParticle();
                p.x = newP.x;
                p.y = newP.y;
                // Start far in front (-Z)
                p.z = -100 - Math.random() * 100;
                p.speed = newP.speed;
                p.color = newP.color;

                // Update color buffer for this instance
                this.mesh.setColorAt(i, p.color);
            }

            // Update Instance
            this.dummy.position.set(p.x, p.y, p.z);
            // Stretch along Z based on speed
            this.dummy.scale.set(1, 1, p.len * (1 + speedRatio));
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

        // Lock to Camera Position (billboard effect)
        this.mesh.position.copy(camera.position);
        this.mesh.quaternion.copy(camera.quaternion);
    }
}
