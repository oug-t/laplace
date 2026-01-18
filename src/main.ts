import "./style.css";
import { TimeController } from "./core/TimeController";
import { SceneManager } from "./render/SceneManager";

// ----------------------------------------
// Core initialization
// ----------------------------------------

const timeCtrl = new TimeController(79.0); // UC 0079 start
const appContainer = document.querySelector<HTMLDivElement>("#app")!;
const sceneMgr = new SceneManager(appContainer);

// ----------------------------------------
// UI overlays (DOM)
// ----------------------------------------

const infoPanel = document.createElement("div");
infoPanel.style.position = "absolute";
infoPanel.style.top = "20px";
infoPanel.style.right = "20px";
infoPanel.style.background = "rgba(0,0,0,0.8)";
infoPanel.style.color = "#fff";
infoPanel.style.padding = "15px";
infoPanel.style.borderRadius = "4px";
infoPanel.style.fontFamily = "monospace";
infoPanel.style.display = "none"; // Hidden by default
infoPanel.style.maxWidth = "300px";
infoPanel.style.border = "1px solid #444";
document.body.appendChild(infoPanel);

const timeDisplay = document.createElement("div");
timeDisplay.style.position = "absolute";
timeDisplay.style.bottom = "20px";
timeDisplay.style.left = "20px";
timeDisplay.style.color = "#ffcc00"; // Amber CRT color
timeDisplay.style.fontFamily = "monospace";
timeDisplay.style.fontSize = "24px";
document.body.appendChild(timeDisplay);

// ----------------------------------------
// Input handling
// ----------------------------------------

window.addEventListener("wheel", (e) => {
    if (e.shiftKey) {
        timeCtrl.handleScroll(e.deltaY); // travel through the timeline
    }
});

window.addEventListener("click", (e) => {
    const data = sceneMgr.checkInteractions(e.clientX, e.clientY);
    if (data) {
        infoPanel.style.display = "block";
        infoPanel.innerHTML = `
            <h3 style="margin:0 0 10px 0; border-bottom:1px solid #666; padding-bottom:5px;">${data.name}</h3>
            <p style="font-size:14px; line-height:1.4;">${data.desc}</p>
        `;
    } else {
        infoPanel.style.display = "none";
    }
});

// ----------------------------------------
// Main loop
// ----------------------------------------

function animate() {
    requestAnimationFrame(animate);

    timeCtrl.update();

    timeDisplay.innerText = `UC 00${timeCtrl.currentYear.toFixed(2)}`;

    sceneMgr.render(timeCtrl);
}

animate();
