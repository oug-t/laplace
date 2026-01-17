import * as THREE from "three";

export class NebulaBackground {
    public mesh: THREE.Group;
    private materials: THREE.MeshBasicMaterial[] = [];

    constructor() {
        this.mesh = new THREE.Group();

        // We create 3 layers of "clouds" at different distances
        // Layer 1: Distant dark clouds (Background)
        this.addLayer(400, 0x330000, 0.3, 0.0001); // Dark Red/Brown

        // Layer 2: Mid-range nebula (Main Color)
        this.addLayer(300, 0xaa4400, 0.2, -0.0002); // Orange/Gold (like your reference image)

        // Layer 3: Closer, faster wisps
        this.addLayer(200, 0xffaa88, 0.1, 0.0003); // Pale Peach
    }

    private addLayer(
        radius: number,
        color: number,
        opacity: number,
        rotationSpeed: number
    ) {
        const geometry = new THREE.SphereGeometry(radius, 64, 64);

        // Generate a "Cloud" texture procedurally
        const texture = this.createCloudTexture();

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            color: color,
            transparent: true,
            opacity: opacity,
            side: THREE.BackSide, // Render on the inside
            depthWrite: false, // Don't block stars behind it
            blending: THREE.AdditiveBlending, // Glow effect
        });

        const sphere = new THREE.Mesh(geometry, material);
        sphere.userData = { rotationSpeed: rotationSpeed };

        // Randomize initial rotation
        sphere.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        this.materials.push(material);
        this.mesh.add(sphere);
    }

    private createCloudTexture(): THREE.CanvasTexture {
        const size = 512;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        // Fill black
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, size, size);

        // Draw random "clouds"
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = Math.random() * 100 + 20;

            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, "rgba(255, 255, 255, 0.1)");
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        return new THREE.CanvasTexture(canvas);
    }

    public update() {
        // Rotate each layer slowly to simulate drifting nebula
        this.mesh.children.forEach((child: any) => {
            child.rotation.y += child.userData.rotationSpeed;
            child.rotation.x += child.userData.rotationSpeed * 0.5;
        });
    }
}
