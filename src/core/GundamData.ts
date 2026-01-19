import * as THREE from 'three';

export interface GraphNode {
    id: string;
    position: [number, number, number]; // [x, y, z]
    type: 'HUB' | 'MINOR' | 'DEBRIS' | 'RUIN';
    size: number; // Visual size multiplier
    color: number; // HEX color
    start?: number; // Active start year
    end?: number; // Active end year
    name?: string; // Display name
    desc?: string; // Description
}

export interface GraphEdge {
    from: number; // Index in the nodes array (for performance in LineSegments)
    to: number; // Index in the nodes array
    opacity: number;
    type?: 'MAJOR' | 'MINOR' | 'SIDE';
}

// Gundam UC Palette - EVE Style
const PALETTE = {
    // Nodes
    NODE_HUB: 0xaaccff, // Pale Cyan
    NODE_MINOR: 0x334455, // Dark Blue-Grey
    NODE_DEBRIS: 0x445566, // Grey-Blue
    NODE_RUIN: 0xaa6655, // Rust Red

    // Special Locations
    EARTH: 0x00aaff, // Cyan
    MOON: 0x8899aa, // Moon Grey
    COLONY: 0x44dd88, // Pale Green
    LAGRANGE: 0x6699ff, // Lavender Blue
    LUNAR_CITY: 0xffeeaa, // Pale Gold

    // Factions
    EFSF: 0x0088ff,
    ZEON: 0xff5500,
    TITANS: 0xaa22ff,
    NEO_ZEON: 0xff3366,

    // Special
    LAPLACE_GOLD: 0xffd700,
    LAPLACE_RUIN: 0x444444,
    ACCENT: 0xffaa00,
};

export const DATA_SET = generateEarthSphere();

/**
 * Calculates Lagrange Points for the Earth-Moon system.
 * Assumes Moon is on the X-axis at `moonDistance`.
 * All points are on the XZ plane (Y=0).
 */
function calculateLagrangePoints(moonDistance: number): {
    [key: string]: [number, number, number];
} {
    // Mass ratio mu = M_moon / (M_earth + M_moon) approx 0.01215
    const mu = 0.01215;

    // L1: Between Earth and Moon
    const L1_dist = moonDistance * (1 - Math.pow(mu / 3, 1 / 3));
    const L1: [number, number, number] = [L1_dist, 0, 0];

    // L2: Beyond the Moon
    const L2_dist = moonDistance * (1 + Math.pow(mu / 3, 1 / 3));
    const L2: [number, number, number] = [L2_dist, 0, 0];

    // L3: Opposite side of Earth
    const L3_dist = moonDistance * (1 + (5 / 12) * mu);
    const L3: [number, number, number] = [-L3_dist, 0, 0];

    // L4 & L5: 60 degrees ahead/behind Moon orbit
    const angle60 = Math.PI / 3;
    const L4: [number, number, number] = [
        moonDistance * Math.cos(angle60),
        0,
        moonDistance * Math.sin(angle60),
    ];

    const L5: [number, number, number] = [
        moonDistance * Math.cos(angle60),
        0,
        -moonDistance * Math.sin(angle60),
    ];

    return { L1, L2, L3, L4, L5 };
}

function generateEarthSphere() {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // --- REALISTIC CONSTANTS (Modified for Visuals) ---
    const EARTH_RADIUS = 4.0;
    // Compressed distance scale (Game/Cinematic Scale)
    const DIST_SCALE = 18.0;
    const MOON_DIST = EARTH_RADIUS * DIST_SCALE; // approx 72.0

    // 1. EARTH CORE
    nodes.push({
        id: 'earth_core',
        position: [0, 0, 0],
        type: 'HUB',
        size: 4.0,
        color: PALETTE.EARTH,
        name: 'Earth',
        desc: 'Earth - The cradle of humanity and capital of the Earth Federation.',
        start: 0,
        end: 999,
    });

    // Generate GEO Belt (Debris/Satellites)
    for (let i = 0; i < 300; i++) {
        const r = 5.0 + Math.random() * 2.0;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const yScale = 0.2; // Flatten belt

        nodes.push({
            id: `geo_${i}`,
            position: [
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta) * yScale,
                r * Math.cos(phi),
            ],
            type: 'DEBRIS',
            size: 0.4,
            color: PALETTE.NODE_DEBRIS,
            start: 0,
            end: 999,
        });
    }

    // 2. MOON
    nodes.push({
        id: 'moon',
        position: [MOON_DIST, 0, 0],
        type: 'HUB',
        size: 2.0,
        color: PALETTE.MOON,
        name: 'Moon',
        desc: "The Moon - Earth's only natural satellite. Home to Von Braun and Granada.",
        start: 0,
        end: 999,
    });

    // 3. LAGRANGE POINTS
    const { L1, L2, L3, L4, L5 } = calculateLagrangePoints(MOON_DIST);

    const lPoints = [
        {
            id: 'L1',
            pos: L1,
            name: 'L1 Point',
            desc: 'Between Earth and Moon.',
        },
        {
            id: 'L2',
            pos: L2,
            name: 'L2 Point',
            desc: 'Beyond the Moon (Side 3).',
        },
        {
            id: 'L3',
            pos: L3,
            name: 'L3 Point',
            desc: 'Opposite Side (Side 7).',
        },
        {
            id: 'L4',
            pos: L4,
            name: 'L4 Cluster',
            desc: 'Trojan Point (Side 2, Side 6).',
        },
        {
            id: 'L5',
            pos: L5,
            name: 'L5 Cluster',
            desc: 'Trojan Point (Side 1, Side 4, Side 5).',
        },
    ];

    lPoints.forEach((p) => {
        nodes.push({
            id: p.id,
            position: p.pos,
            type: 'MINOR', // Or HUB if major colonies exist
            size: 1.2,
            color: PALETTE.LAGRANGE,
            name: p.name,
            desc: p.desc,
            start: 0,
            end: 999,
        });

        // Add Cluster "Clouds" around L-Points to simulate colonies
        for (let i = 0; i < 30; i++) {
            const spread = 3.0;
            nodes.push({
                id: `${p.id}_colony_${i}`,
                position: [
                    p.pos[0] + (Math.random() - 0.5) * spread,
                    p.pos[1] + (Math.random() - 0.5) * spread,
                    p.pos[2] + (Math.random() - 0.5) * spread,
                ],
                type: 'MINOR',
                size: 0.6,
                color: PALETTE.COLONY,
                start: 50, // Colonies built later
                end: 999,
            });
        }
    });

    // 4. LUNAR CITIES (Relative to Moon Position)
    // Von Braun: Faces Earth (Less X than Moon)
    nodes.push({
        id: 'von_braun',
        position: [MOON_DIST - 1.2, 0, 0],
        type: 'MINOR',
        size: 0.8,
        color: PALETTE.LUNAR_CITY,
        name: 'Von Braun',
        desc: 'First permanent lunar city. HQ of Anaheim Electronics.',
        start: 20,
        end: 999,
    });

    // Granada: Faces Deep Space (More X than Moon)
    nodes.push({
        id: 'granada',
        position: [MOON_DIST + 1.2, 0, 0],
        type: 'MINOR',
        size: 0.8,
        color: PALETTE.ZEON, // Zeon influence
        name: 'Granada',
        desc: 'Industrial lunar city. Major Zeon stronghold.',
        start: 25,
        end: 999,
    });

    // 5. LAPLACE (Special Logic)
    // Placed at a high orbital position (e.g., Polar Orbit or high equatorial)
    const laplacePos: [number, number, number] = [0, 8, 0];

    // Laplace Station (Golden Era)
    nodes.push({
        id: 'laplace_station',
        position: laplacePos,
        type: 'HUB',
        size: 2.5,
        color: PALETTE.LAPLACE_GOLD,
        name: 'Laplace Prime Minister Residence',
        start: 0,
        end: 1.1, // Destroyed in UC 0001
    });

    // Laplace Ruins (The Ghost)
    nodes.push({
        id: 'laplace_ruins',
        position: laplacePos,
        type: 'RUIN',
        size: 1.8,
        color: PALETTE.LAPLACE_RUIN,
        name: 'Laplace Ruins',
        start: 1.1,
        end: 96.5, // Falling to Earth in UC 0096
    });

    // Debris field around Laplace
    for (let i = 0; i < 20; i++) {
        nodes.push({
            id: `laplace_debris_${i}`,
            position: [
                laplacePos[0] + (Math.random() - 0.5) * 1.5,
                laplacePos[1] + (Math.random() - 0.5) * 1.5,
                laplacePos[2] + (Math.random() - 0.5) * 1.5,
            ],
            type: 'DEBRIS',
            size: 0.4,
            color: PALETTE.NODE_DEBRIS,
            start: 1.1,
            end: 96.5,
        });
    }

    // --- GENERATE EDGES (LINKS) ---
    // Note: GraphManager expects edges to use INDEXES, not IDs.
    // We must find the index of the nodes we want to link.

    const getId = (id: string) => nodes.findIndex((n) => n.id === id);

    // Core Axis: Earth -> Moon
    edges.push({
        from: getId('earth_core'),
        to: getId('moon'),
        opacity: 0.2,
        type: 'MAJOR',
    });

    // Earth -> L-Points
    ['L1', 'L2', 'L3', 'L4', 'L5'].forEach((lid) => {
        const idx = getId(lid);
        if (idx !== -1)
            edges.push({ from: 0, to: idx, opacity: 0.1, type: 'MINOR' });
    });

    // Moon -> L-Points (Gravity influence)
    edges.push({
        from: getId('moon'),
        to: getId('L1'),
        opacity: 0.1,
        type: 'MINOR',
    });
    edges.push({
        from: getId('moon'),
        to: getId('L2'),
        opacity: 0.1,
        type: 'MINOR',
    });
    edges.push({
        from: getId('moon'),
        to: getId('L4'),
        opacity: 0.05,
        type: 'SIDE',
    });
    edges.push({
        from: getId('moon'),
        to: getId('L5'),
        opacity: 0.05,
        type: 'SIDE',
    });

    // Moon -> Cities
    edges.push({
        from: getId('moon'),
        to: getId('von_braun'),
        opacity: 0.4,
        type: 'SIDE',
    });
    edges.push({
        from: getId('moon'),
        to: getId('granada'),
        opacity: 0.4,
        type: 'SIDE',
    });

    // Laplace -> Earth (The Elevator/Orbit connection)
    edges.push({
        from: getId('earth_core'),
        to: getId('laplace_station'),
        opacity: 0.3,
        type: 'MAJOR',
    });
    edges.push({
        from: getId('earth_core'),
        to: getId('laplace_ruins'),
        opacity: 0.1,
        type: 'MINOR',
    });

    return { nodes, edges };
}
