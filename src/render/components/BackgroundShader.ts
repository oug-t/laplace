import * as THREE from "three";

export class BackgroundShader {
    public mesh: THREE.Mesh;

    constructor() {
        // Giant sphere to encompass the world
        const geometry = new THREE.SphereGeometry(800, 32, 32);

        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec2 vUv;

            void main() {
                // Calculate distance from center (0.5, 0.5)
                // We offset it slightly so the "deepest" black is near the camera focus
                vec2 center = vec2(0.5, 0.5);
                float dist = distance(vUv, center);

                // RADIAL GRADIENT LOGIC:
                // Inner color: Pure Black (0.0, 0.0, 0.0)
                // Outer color: Very Dark Grey (0.05, 0.05, 0.07) for subtle depth
                
                vec3 colorInner = vec3(0.0, 0.0, 0.0);
                vec3 colorOuter = vec3(0.05, 0.05, 0.07);

                // Smooth interpolation based on distance
                // The '0.8' factor pushes the darkness further out
                float mask = smoothstep(0.2, 1.2, dist);

                vec3 finalColor = mix(colorInner, colorOuter, mask);

                // Add extremely subtle dithering to prevent "banding" on good monitors
                float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
                finalColor += noise * 0.01; 

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide, // Render on the inside
            depthWrite: false, // Draw behind everything else
        });

        this.mesh = new THREE.Mesh(geometry, material);
    }

    public update() {
        // No animation needed for a static void, keeping it efficient.
    }
}
