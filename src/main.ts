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

// Main render loop
const animate = (): void => {
    requestAnimationFrame(animate);

    // Update time controller
    timeCtrl.update();

    // Update UI displays
    timeDisplay.textContent = `${CONFIG.TIME_PREFIX}${timeCtrl.currentYear.toFixed(2)}`;

    // Update time feedback indicator
    if (timeCtrl.isMoving && timeCtrl.isMoving()) {
        timeFeedback.textContent = '▶';
        timeFeedback.style.color = '#ffcc00';
    } else {
        timeFeedback.textContent = '▪';
        timeFeedback.style.color = '#8899aa';
    }

    // Update transition feedback
    if (timeCtrl.inTransition && timeCtrl.inTransition()) {
        timeFeedback.style.color = '#ffcc00';
    }

    // Render scene
    sceneMgr.render(timeCtrl);
};

// Start application
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
    console.log('Application started', {
        timeCtrl,
        sceneMgr,
        container: appContainer,
    });
}

// Error handling for missing methods
if (!timeCtrl.handleScroll) {
    console.warn('TimeController.handleScroll() is not implemented');
}

if (!sceneMgr.handleZoom) {
    console.warn('SceneManager.handleZoom() is not implemented');
}
