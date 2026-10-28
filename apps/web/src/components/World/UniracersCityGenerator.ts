// apps/web/src/components/World/UniracersCityGenerator.ts
import * as THREE from 'three';
import { CITY_DISTANCE, PILLAR_NAMES, PILLAR_COLORS } from './UniracersHighwayGraph';

export interface CityLandmark {
    pillarIndex: number;
    name: string;
    center: THREE.Vector3;
    color: string;
    group: THREE.Group;
}

/**
 * Procedurally generates the 10 Themed Pillar City Landmarks along the GTA-scale world perimeter
 */
export function generatePillarCities(): CityLandmark[] {
    const cities: CityLandmark[] = [];

    for (let k = 0; k < 10; k++) {
        const angle = (k / 10) * Math.PI * 2;
        const x = Math.cos(angle) * CITY_DISTANCE;
        const z = Math.sin(angle) * CITY_DISTANCE;
        const center = new THREE.Vector3(x, 0, z);

        const group = new THREE.Group();
        group.position.copy(center);
        group.rotation.y = -angle; // Face back towards the central hub

        const colorHex = PILLAR_COLORS[k];
        const primaryMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.25,
            metalness: 0.85,
            emissive: colorHex,
            emissiveIntensity: 0.25
        });

        const darkConcreteMat = new THREE.MeshStandardMaterial({
            color: '#1e293b',
            roughness: 0.8,
            metalness: 0.2
        });

        const neonGlowMat = new THREE.MeshBasicMaterial({
            color: colorHex
        });

        // --- Shared City Foundation / Base Plinth ---
        const baseGeom = new THREE.CylinderGeometry(550, 600, 30, 24);
        const baseMesh = new THREE.Mesh(baseGeom, darkConcreteMat);
        baseMesh.position.y = 15;
        group.add(baseMesh);

        // --- Distinct Architecture per Pillar ---
        switch (k) {
            case 0: // Self (◉): Sovereign Citadel
                // Central gold/black obelisk surrounded by 4 reflection spires
                const obelisk = new THREE.Mesh(new THREE.ConeGeometry(50, 420, 4), primaryMat);
                obelisk.position.y = 220;
                group.add(obelisk);

                for (let i = 0; i < 4; i++) {
                    const a = (i / 4) * Math.PI * 2;
                    const subSpire = new THREE.Mesh(new THREE.BoxGeometry(30, 260, 30), primaryMat);
                    subSpire.position.set(Math.cos(a) * 160, 140, Math.sin(a) * 160);
                    group.add(subSpire);
                }
                break;

            case 1: // Thought (✧): Cloud Mind Archipelago
                // Floating crystalline terraces and recursive glass bridges
                for (let i = 0; i < 5; i++) {
                    const h = 140 + i * 65;
                    const r = 180 - i * 25;
                    const plat = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 15, 6), primaryMat);
                    plat.position.set(Math.sin(i * 1.5) * 80, h, Math.cos(i * 1.5) * 80);
                    group.add(plat);
                }
                break;

            case 2: // Logic (∴): Silicon Core Megalopolis
                // Orthogonal cyber grid towers, PCB bus trusses, Terry Davis HolyC shrine
                for (let gx = -2; gx <= 2; gx++) {
                    for (let gz = -2; gz <= 2; gz++) {
                        const h = 160 + (Math.abs(gx) + Math.abs(gz)) * 60;
                        const tower = new THREE.Mesh(new THREE.BoxGeometry(45, h, 45), darkConcreteMat);
                        tower.position.set(gx * 85, h / 2 + 30, gz * 85);
                        
                        // Neon circuit striping on roofs
                        const cap = new THREE.Mesh(new THREE.BoxGeometry(46, 6, 46), neonGlowMat);
                        cap.position.set(gx * 85, h + 33, gz * 85);
                        group.add(tower);
                        group.add(cap);
                    }
                }
                break;

            case 3: // Unity (⚭): Gestalt Concourse
                // Interlocking concentric ring structures and copper pavilions
                for (let i = 0; i < 3; i++) {
                    const ring = new THREE.Mesh(new THREE.TorusGeometry(120 + i * 75, 12, 16, 32), primaryMat);
                    ring.rotation.x = Math.PI * 0.5;
                    ring.rotation.y = (i * Math.PI) / 6;
                    ring.position.y = 80 + i * 70;
                    group.add(ring);
                }
                break;

            case 4: // Existence (⬡): Primal Earth Bastion
                // Brutalist basalt pillars and heavy industrial steel girders
                for (let i = 0; i < 12; i++) {
                    const a = (i / 12) * Math.PI * 2;
                    const h = 180 + Math.sin(i * 3) * 80;
                    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(35, 45, h, 6), darkConcreteMat);
                    pillar.position.set(Math.cos(a) * 220, h / 2 + 30, Math.sin(a) * 220);
                    group.add(pillar);
                }
                break;

            case 5: // Improvement (⇈): Kinetic Foundry
                // Ascending helical spiral towers with dynamic gantry cranes
                for (let i = 0; i < 18; i++) {
                    const a = i * 0.45;
                    const h = 40 + i * 20;
                    const r = 160 - i * 5;
                    const block = new THREE.Mesh(new THREE.BoxGeometry(30, 20, 50), primaryMat);
                    block.position.set(Math.cos(a) * r, h, Math.sin(a) * r);
                    block.rotation.y = a;
                    group.add(block);
                }
                break;

            case 6: // Mastery (❂): Gold Champion Arena
                // Grand triumphal arches and gilded colosseum bowl
                const bowl = new THREE.Mesh(new THREE.CylinderGeometry(280, 180, 120, 32, 1, true), primaryMat);
                bowl.position.y = 90;
                group.add(bowl);
                
                const beacon = new THREE.Mesh(new THREE.SphereGeometry(40, 16, 16), neonGlowMat);
                beacon.position.y = 230;
                group.add(beacon);
                break;

            case 7: // Resonance (∿): Sonic Bay
                // Sinusoidal waveform towers & illuminated equalizer spires
                for (let i = 0; i < 9; i++) {
                    const xOffset = (i - 4) * 45;
                    const h = 120 + Math.sin(i * 0.9) * 160;
                    const spire = new THREE.Mesh(new THREE.BoxGeometry(25, h, 25), primaryMat);
                    spire.position.set(xOffset, h / 2 + 30, 0);
                    group.add(spire);
                }
                break;

            case 8: // Transcendence (⍟): Zero-G Vortex
                // Suspended anti-gravity rings and quantum rift monoliths
                for (let i = 0; i < 3; i++) {
                    const ring = new THREE.Mesh(new THREE.TorusGeometry(140 + i * 50, 8, 16, 48), primaryMat);
                    ring.rotation.x = 0.5 + i * 0.6;
                    ring.rotation.z = i * 0.8;
                    ring.position.y = 180 + i * 40;
                    group.add(ring);
                }
                break;

            case 9: // Omniscience (۞): The Akashic Nexus
                // Massive central sphere with multi-axis planetary orbital rings
                const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 32), primaryMat);
                coreSphere.position.y = 220;
                group.add(coreSphere);

                for (let i = 0; i < 3; i++) {
                    const orbit = new THREE.Mesh(new THREE.TorusGeometry(200 + i * 40, 6, 16, 64), neonGlowMat);
                    orbit.rotation.x = (i * Math.PI) / 3;
                    orbit.rotation.y = (i * Math.PI) / 4;
                    orbit.position.y = 220;
                    group.add(orbit);
                }
                break;
        }

        cities.push({
            pillarIndex: k,
            name: PILLAR_NAMES[k],
            center,
            color: colorHex,
            group
        });
    }

    return cities;
}
