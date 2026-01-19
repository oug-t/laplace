/**
 * Universal Century Timeline - Main Application Entry
 * Initializes core systems and starts render loop.
 */

import './style.css';
import { TimeController } from './core/TimeController';
import { SceneManager } from './render/SceneManager';

// App configuration
const CONFIG = {
    START_YEAR: 79.0, // UC 0079
    TIME_PREFIX: 'UC 00',
    UI: {
        INFO_PANEL_MAX_WIDTH: '300px',
        TIME_COLOR: '#ffcc00', // Amber CRT
    },
} as const;

// Core system initialization
const timeCtrl = new TimeController(CONFIG.START_YEAR);
const appContainer = document.querySelector<HTMLDivElement>('#app');
if (!appContainer) throw new Error('#app container not found');
const sceneMgr = new SceneManager(appContainer);

// State tracking
let shiftPressed = false;

// UI Overlay Elements
const infoPanel = document.createElement('div');
Object.assign(infoPanel.style, {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    padding: '15px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    display: 'none',
    maxWidth: CONFIG.UI.INFO_PANEL_MAX_WIDTH,
    border: '1px solid #444',
    zIndex: '1000',
});
document.body.appendChild(infoPanel);

const timeDisplay = document.createElement('div');
Object.assign(timeDisplay.style, {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    color: CONFIG.UI.TIME_COLOR,
    fontFamily: 'monospace',
    fontSize: '24px',
    textShadow: '0 0 10px rgba(255,204,0,0.5)',
    zIndex: '1000',
});
document.body.appendChild(timeDisplay);

const stateDisplay = document.createElement('div');
Object.assign(stateDisplay.style, {
    position: 'absolute',
    top: '20px',
    left: '20px',
    color: '#ffcc00',
    fontFamily: 'monospace',
    fontSize: '12px',
    background: 'rgba(0,0,0,0.5)',
    padding: '8px',
    borderRadius: '4px',
    zIndex: '1001',
});
document.body.appendChild(stateDisplay);

// Add time feedback UI
const timeFeedback = document.createElement('div');
Object.assign(timeFeedback.style, {
    position: 'absolute',
    bottom: '60px',
    left: '20px',
    color: '#8899aa',
    fontFamily: 'monospace',
    fontSize: '11px',
    opacity: '0.7',
    transition: 'color 0.3s',
});
document.body.appendChild(timeFeedback);

// Event Handlers
const handleCanvasClick = (e: MouseEvent): void => {
    const data = sceneMgr.checkInteractions(e.clientX, e.clientY);
    if (data) {
        infoPanel.style.display = 'block';
        infoPanel.innerHTML = `
      <h3 style="margin:0 0 10px 0; border-bottom:1px solid #666; padding-bottom:5px;">
        ${escapeHtml(data.name)}
      </h3>
      <p style="font-size:14px; line-height:1.4;">
        ${escapeHtml(data.desc)}
      </p>
    `;
    } else {
        infoPanel.style.display = 'none';
    }
};

const handleWheel = (e: WheelEvent): void => {
    // Use e.shiftKey directly - it's reliable and resets automatically
    if (e.shiftKey) {
        // Shift + wheel: navigate timeline
        e.preventDefault(); // IMPORTANT: Prevent OrbitControls from also zooming
        if (timeCtrl.handleScroll) {
            timeCtrl.handleScroll(e.deltaY * 0.01);
        }
    }
    // Normal wheel: OrbitControls handles zoom automatically
};

const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') {
        shiftPressed = true;
        sceneMgr.setZoomEnabled(false);
        console.log('Shift pressed - zoom disabled');
    }

    // Add keyboard shortcuts for testing
    if (e.key === 'm' || e.key === 'M') {
        timeCtrl.targetYear += 5;
        console.log(`⏩ Time jumped +5 years to UC ${timeCtrl.targetYear}`);
    }
    if (e.key === 'n' || e.key === 'N') {
        timeCtrl.targetYear -= 5;
        console.log(`⏪ Time jumped -5 years to UC ${timeCtrl.targetYear}`);
    }
    if (e.key === 'r' || e.key === 'R') {
        timeCtrl.targetYear = CONFIG.START_YEAR;
        console.log(`🔁 Reset to UC ${CONFIG.START_YEAR}`);
    }
};

const handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') {
        shiftPressed = false;
        sceneMgr.setZoomEnabled(true);
        console.log('Shift released - zoom enabled');
    }
};

const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// Register event listeners
window.addEventListener('click', handleCanvasClick);
window.addEventListener('wheel', handleWheel);
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

// Performance monitoring variables
let lastTime = performance.now();
let frames = 0;
let fps = 60;
let frameCounter = 0; // ⭐⭐ ADDED THIS MISSING VARIABLE ⭐⭐

// Main render loop
const animate = (): void => {
    requestAnimationFrame(animate);

    // Calculate FPS
    frames++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
    }

    // Store previous state
    const wasMoving = timeCtrl.isMoving && timeCtrl.isMoving();

    // Update time controller
    timeCtrl.update();

    // Get current state
    const isMoving = timeCtrl.isMoving && timeCtrl.isMoving();
    const isInTransition = timeCtrl.inTransition && timeCtrl.inTransition();
    const velocity = timeCtrl.getVelocity ? timeCtrl.getVelocity() : 0;

    // Update main time display
    timeDisplay.textContent = `${CONFIG.TIME_PREFIX}${timeCtrl.currentYear.toFixed(2)}`;

    // Update time feedback with enhanced visuals
    updateTimeFeedback(isMoving, isInTransition, velocity);

    // Update state display with more info
    updateStateDisplay(isMoving, isInTransition, velocity, fps);

    // Render the scene
    sceneMgr.render(timeCtrl);

    // Performance logging
    logPerformance(fps, isMoving);

    // Frame counter increment
    frameCounter++;
};

function updateTimeFeedback(
    isMoving: boolean,
    isInTransition: boolean,
    velocity: number
): void {
    if (isMoving) {
        // Animated flowing time indicator
        const flowSpeed = Math.min(Math.abs(velocity) * 10, 1);
        const pulse =
            0.8 + Math.sin(performance.now() * flowSpeed * 0.01) * 0.2;

        timeFeedback.textContent = '▶';
        timeFeedback.style.color = '#ffcc00';
        timeFeedback.style.opacity = '1';
        timeFeedback.style.transform = `scale(${pulse})`;
        timeFeedback.style.textShadow = '0 0 10px rgba(255, 204, 0, 0.5)';
    } else if (isInTransition) {
        // Smooth transition indicator
        const transitionProgress = (performance.now() % 2000) / 2000;
        const rotation = transitionProgress * 360;

        timeFeedback.textContent = '⟳';
        timeFeedback.style.color = '#ffcc00';
        timeFeedback.style.opacity = '0.7';
        timeFeedback.style.transform = `rotate(${rotation}deg) scale(0.9)`;
    } else {
        //静止状态
        timeFeedback.textContent = '▪';
        timeFeedback.style.color = '#8899aa';
        timeFeedback.style.opacity = '0.8';
        timeFeedback.style.transform = 'scale(1)';
        timeFeedback.style.textShadow = 'none';
    }
}

function updateStateDisplay(
    isMoving: boolean,
    isInTransition: boolean,
    velocity: number,
    fps: number
): void {
    if (!stateDisplay) return;

    const velocityColor =
        Math.abs(velocity) > 0.1
            ? '#ff6666'
            : Math.abs(velocity) > 0.01
              ? '#ffaa44'
              : '#66cc66';

    stateDisplay.innerHTML = `
        <div style="
            color: ${isMoving ? '#ffcc00' : '#8899aa'}; 
            font-weight: ${isMoving ? 'bold' : 'normal'};
            font-size: 14px;
            margin-bottom: 4px;
        ">
            UC ${timeCtrl.currentYear.toFixed(2)}
            ${isMoving ? ' ▶' : isInTransition ? ' ⟳' : ''}
        </div>
        
        <div style="
            font-size: 11px;
            color: ${isMoving ? '#aaccff' : '#8899aa'};
            margin-bottom: 2px;
        ">
            ${isMoving ? 'Time flowing' : 'Time静止'}
            ${isInTransition ? ' (smoothing)' : ''}
        </div>
        
        <div style="
            font-size: 10px;
            color: ${velocityColor};
            margin-bottom: 2px;
        ">
            Velocity: ${velocity.toFixed(4)} yr/frame
        </div>
        
        <div style="
            font-size: 9px;
            color: #667788;
            border-top: 1px solid rgba(100, 120, 150, 0.2);
            padding-top: 2px;
            margin-top: 2px;
        ">
            ${fps} FPS | Shift+scroll for time | M/N/R for testing
        </div>
    `;
}

function logPerformance(fps: number, isMoving: boolean): void {
    // Log performance issues
    if (fps < 30 && frameCounter % 120 === 0) {
        console.warn(`⚠️ Low FPS: ${fps} (time moving: ${isMoving})`);
    }

    // Log every 5 seconds
    if (frameCounter % 300 === 0) {
        console.log(
            `📊 Performance: ${fps} FPS, Memory: ${
                (performance as any).memory
                    ? `Used ${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB`
                    : 'N/A'
            }`
        );
    }
}

// Start the animation loop
animate();

// Debug exposure (development only)
if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__DEBUG_APP = {
        timeCtrl,
        sceneMgr,
        config: CONFIG,
        shiftPressed: () => shiftPressed,
    };

    // Debug console
    console.log('Laplace Application started', {
        timeCtrl,
        sceneMgr,
        container: appContainer,
        moonOrbitRadius: sceneMgr.getMoonOrbitRadius
            ? sceneMgr.getMoonOrbitRadius()
            : 'N/A',
    });

    // Add moon distance monitoring
    const monitorMoonDistance = () => {
        if ((sceneMgr as any).moonGroup) {
            const moonPos = (sceneMgr as any).moonGroup.position;
            const distance = Math.sqrt(
                moonPos.x * moonPos.x + moonPos.z * moonPos.z
            );
            const targetRadius = sceneMgr.getMoonOrbitRadius
                ? sceneMgr.getMoonOrbitRadius()
                : 40;
            console.log(
                `🌙 Moon monitoring: Distance=${distance.toFixed(1)}, Target=${targetRadius}, Error=${Math.abs(distance - targetRadius).toFixed(2)}`
            );
        }
        setTimeout(monitorMoonDistance, 2000); // Check every 2 seconds
    };
    monitorMoonDistance();
}

// Error handling for missing methods
if (!timeCtrl.handleScroll) {
    console.warn('TimeController.handleScroll() is not implemented');
}

if (!sceneMgr.handleZoom) {
    console.warn('SceneManager.handleZoom() is not implemented');
}

// Optional: Add moon position debug to window
if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).getMoonPosition = () => {
        if ((sceneMgr as any).moonGroup) {
            const pos = (sceneMgr as any).moonGroup.position;
            const distance = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
            return {
                x: pos.x.toFixed(2),
                z: pos.z.toFixed(2),
                distance: distance.toFixed(2),
                angle: (Math.atan2(pos.z, pos.x) * 180) / Math.PI,
            };
        }
        return 'Moon group not found';
    };
}
