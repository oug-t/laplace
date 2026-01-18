import * as THREE from "three";
import { DATA_SET } from "../core/GundamData";

export class GraphManager {
    public group: THREE.Group;

    private pointSystem: THREE.Points;
    private lineSystem: THREE.LineSegments;

    private pointMat: THREE.ShaderMaterial;

    public constructor() {
        this.group = new THREE.Group();

        // --- NODES (Points) ---
        const nodeGeo = new THREE.BufferGeometry();

        const positions: number[] = [];
        const colors: number[] = [];
        const sizes: number[] = [];

        for (const n of DATA_SET.nodes) {
            positions.push(n.position[0], n.position[1], n.position[2]);

            const c = new THREE.Color(n.color);
            colors.push(c.r, c.g, c.b);

            // Visual Hierarchy: Hubs are noticeably larger
            if (n.type === "HUB") {
                sizes.push(1.8); // Big anchor nodes
            } else if (n.type === "MINOR") {
                sizes.push(0.8); // Standard data points
            } else {
                sizes.push(0.5); // Debris/Background noise
            }
        }

        nodeGeo.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3)
        );
        nodeGeo.setAttribute(
            "aColor",
            new THREE.Float32BufferAttribute(colors, 3)
        );
        nodeGeo.setAttribute(
            "aSize",
            new THREE.Float32BufferAttribute(sizes, 1)
        );

        const dotTex = this.createDotTexture();

        this.pointMat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            // NormalBlending keeps edges crisp. Additive makes them glowy/fuzzy.
            // For Obsidian style, NormalBlending is often better, or very subtle Additive.
            blending: THREE.NormalBlending,

            uniforms: {
                uMap: { value: dotTex },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
                uBaseSize: { value: 12.0 }, // Base pixel size for nodes
            },
            vertexShader: `
                attribute float aSize;
                attribute vec3 aColor;
                varying vec3 vColor;
                uniform float uPixelRatio;
                uniform float uBaseSize;

                void main() {
                    vColor = aColor;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Distance attenuation (nodes get smaller further away)
                    float dist = -mvPosition.z;
                    float size = uBaseSize * aSize * uPixelRatio;
                    
                    // Clamp size so distant nodes don't vanish completely
                    gl_PointSize = size * (40.0 / dist);
                    
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D uMap;
                varying vec3 vColor;

                void main() {
                    vec4 tex = texture2D(uMap, gl_PointCoord);
                    
                    // Discard transparent pixels for performance
                    if (tex.a < 0.05) discard;

                    // Multiply texture alpha by vertex color
                    gl_FragColor = vec4(vColor, tex.a);
                }
            `,
        });

        this.pointSystem = new THREE.Points(nodeGeo, this.pointMat);
        this.group.add(this.pointSystem);

        // --- LINKS (LineSegments) ---
        const lineGeo = new THREE.BufferGeometry();
        const linePos: number[] = [];
        const lineCols: number[] = [];

        // Darker, subtler line colors for the background web
        const c1 = new THREE.Color(0x1a2b3c); // Dark Blue-Grey
        const c2 = new THREE.Color(0x2d4e66); // Lighter Blue-Grey

        for (const e of DATA_SET.edges) {
            const n1 = DATA_SET.nodes[e.from];
            const n2 = DATA_SET.nodes[e.to];

            linePos.push(n1.position[0], n1.position[1], n1.position[2]);
            linePos.push(n2.position[0], n2.position[1], n2.position[2]);

            lineCols.push(c1.r, c1.g, c1.b);
            lineCols.push(c2.r, c2.g, c2.b);
        }

        lineGeo.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(linePos, 3)
        );
        lineGeo.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(lineCols, 3)
        );

        const lineMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.08, // Very faint! Let them stack to create density.
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        this.lineSystem = new THREE.LineSegments(lineGeo, lineMat);
        this.group.add(this.lineSystem);

        // Handle resize for pixel ratio
        window.addEventListener("resize", () => {
            this.pointMat.uniforms.uPixelRatio.value = Math.min(
                window.devicePixelRatio,
                2
            );
        });
    }

    public update(time: number): void {
        const t = time * 0.001;
        // Subtle "breathing" of node sizes
        this.pointMat.uniforms.uBaseSize.value = 12.0 + Math.sin(t * 0.5) * 1.0;

        // Slow rotation of the whole system
        this.group.rotation.y = t * 0.02;
    }

    // Create a crisp circle texture with a soft edge
    private createDotTexture(): THREE.Texture {
        const size = 128;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        if (!ctx) throw new Error("Canvas 2D context failed");

        const c = size / 2;

        // Draw the main solid core
        ctx.beginPath();
        ctx.arc(c, c, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
        ctx.fill();

        // Draw a subtle glow/halo
        const grad = ctx.createRadialGradient(
            c,
            c,
            size * 0.3,
            c,
            c,
            size * 0.5
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0.5)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c, c, size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }
}
