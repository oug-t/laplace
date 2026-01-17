import * as THREE from "three";

interface War {
    name: string;
    start: number; // UC Year
    end: number;
    color: number;
}

// Define major UC conflicts
const WARS: War[] = [
    { name: "One Year War", start: 79.0, end: 80.0, color: 0xff3333 }, // Red lasers
    { name: "Gryps Conflict", start: 87.0, end: 88.0, color: 0x33ff33 }, // Green lasers
    { name: "Neo Zeon War", start: 88.0, end: 89.0, color: 0xffff33 }, // Yellow lasers
];

export class BattleManager {
    public group: THREE.Group;
    private beams: THREE.Line[] = [];

    constructor() {
        this.group = new THREE.Group();
    }

    public update(currentYear: number) {
        // 1. Check if we are in a war
        const activeWar = WARS.find(
            (w) => currentYear >= w.start && currentYear <= w.end
        );

        if (activeWar) {
            // 2. Spawn randomly: "Battle Chaos"
            // Chance to spawn a beam frame
            if (Math.random() > 0.8) {
                this.spawnBeam(activeWar.color);
            }
        }

        // 3. Cleanup old beams
        for (let i = this.beams.length - 1; i >= 0; i--) {
            const beam = this.beams[i];
            (beam.material as THREE.LineBasicMaterial).opacity -= 0.05; // Fade out

            if ((beam.material as THREE.LineBasicMaterial).opacity <= 0) {
                this.group.remove(beam);
                this.beams.splice(i, 1);
            }
        }
    }

    private spawnBeam(colorHex: number) {
        // ... start/end calculation same as before ...
        const start = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        const end = new THREE.Vector3(
            15 + (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );

        const points = [start, end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        // HATHAWAY UPDATE:
        // Use a much brighter color intensity so the Bloom picks it up.
        // We can't set intensity > 1 on LineBasicMaterial easily, but standard bright colors work well with Bloom.
        const material = new THREE.LineBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.8,
            linewidth: 2, // Note: Linewidth might not work on all browsers, but opacity+glow does the work
        });

        const line = new THREE.Line(geometry, material);

        // OPTIONAL: Add a tiny "PointLight" at the start of the beam for extra drama
        // This is heavy on performance if too many beams, so use sparingly.

        this.group.add(line);
        this.beams.push(line);
    }
}
