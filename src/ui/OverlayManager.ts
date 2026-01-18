export class OverlayManager {
    private container: HTMLElement;
    private currentOverlay: HTMLElement | null = null;

    constructor() {
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            pointerEvents: 'none',
            fontFamily: "'Segoe UI', 'Roboto Mono', monospace",
            fontSize: '13px',
            color: '#a0b0c0', // EVE-style muted cyan
            zIndex: '1000',
        });
        document.body.appendChild(this.container);
    }

    showNodeInfo(data: NodeData): void {
        this.clear();

        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(10, 20, 30, 0.85)',
            border: '1px solid rgba(100, 150, 200, 0.3)',
            borderRadius: '2px',
            padding: '15px',
            maxWidth: '300px',
            pointerEvents: 'auto',
            backdropFilter: 'blur(4px)',
        });

        overlay.innerHTML = `
            <div style="
                border-bottom: 1px solid rgba(100, 150, 200, 0.2);
                margin-bottom: 8px;
                padding-bottom: 8px;
            ">
                <div style="
                    color: #ffcc00;
                    font-size: 16px;
                    font-weight: 500;
                    margin-bottom: 4px;
                ">${this.escapeHtml(data.name)}</div>
                <div style="
                    color: #8899aa;
                    font-size: 11px;
                    font-family: 'Roboto Mono', monospace;
                ">UC ${data.start} — UC ${data.end}</div>
            </div>
            <div style="
                color: #bbccdd;
                line-height: 1.5;
                font-size: 13px;
            ">${this.escapeHtml(data.desc)}</div>
        `;

        this.container.appendChild(overlay);
        this.currentOverlay = overlay;
    }

    clear(): void {
        if (this.currentOverlay) {
            this.container.removeChild(this.currentOverlay);
            this.currentOverlay = null;
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
