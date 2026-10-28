import * as THREE from 'three';

export class ParticleSystem {
    private scene: THREE.Scene;
    private mesh: THREE.InstancedMesh;
    private dummy: THREE.Object3D = new THREE.Object3D();

    // Pool Data
    private maxParticles = 500;
    private particles: { position: THREE.Vector3, velocity: THREE.Vector3, life: number, active: boolean }[] = [];
    private nextIndex = 0;

    constructor(scene: THREE.Scene, color: string) {
        this.scene = scene;

        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
            // blending: THREE.AdditiveBlending 
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, this.maxParticles);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.mesh);

        // Initialize Pool
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                life: 0,
                active: false
            });
            // Hide initially
            this.mesh.setMatrixAt(i, new THREE.Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0));
        }
    }

    public emit(position: THREE.Vector3, count: number) {
        for (let k = 0; k < count; k++) {
            const index = this.nextIndex;
            const p = this.particles[index];

            p.active = true;
            p.life = 1.0;
            p.position.copy(position);

            // Random spread
            p.position.x += (Math.random() - 0.5) * 2;
            p.position.y += (Math.random() - 0.5) * 2;
            p.position.z += (Math.random() - 0.5) * 2;

            // Velocity
            p.velocity.set(
                (Math.random() - 0.5),
                (Math.random() - 0.5),
                (Math.random() - 0.5)
            );

            this.nextIndex = (this.nextIndex + 1) % this.maxParticles;
        }
    }

    public update(delta: number) {
        let activeCount = 0;
        for (let i = 0; i < this.maxParticles; i++) {
            const p = this.particles[i];
            if (!p.active) {
                // Ensure hidden
                this.mesh.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
                continue;
            }

            p.life -= delta * 2; // Fade speed

            if (p.life <= 0) {
                p.active = false;
                this.mesh.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
                continue;
            }

            p.position.add(p.velocity);

            this.dummy.position.copy(p.position);
            this.dummy.rotation.x += delta * 5;
            this.dummy.rotation.y += delta * 5;
            this.dummy.scale.setScalar(p.life);
            this.dummy.updateMatrix();

            this.mesh.setMatrixAt(i, this.dummy.matrix);
            activeCount++;
        }

        if (activeCount > 0) {
            this.mesh.instanceMatrix.needsUpdate = true;
        }
    }
}
