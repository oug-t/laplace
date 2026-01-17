export class TimeController {
    public currentYear: number;
    public targetYear: number;
    private minYear = 1; // UC 0001
    private maxYear = 100; // Cap at UC 0100 for now
    private scrollSensitivity = 0.05; // Years per scroll tick
    private lerpFactor = 0.1; // Smoothness (lower is heavier/slower)

    constructor(startYear: number = 79) {
        // Start at OYW
        this.currentYear = startYear;
        this.targetYear = startYear;
    }

    public handleScroll(deltaY: number) {
        // Scroll Down (+) -> Move Forward in Time
        // Scroll Up (-) -> Move Backward in Time
        const direction = deltaY > 0 ? 1 : -1;
        this.targetYear += direction * this.scrollSensitivity;

        // Clamp
        this.targetYear = Math.max(
            this.minYear,
            Math.min(this.maxYear, this.targetYear)
        );
    }

    public update() {
        // Easing function: Asymptotically approach target
        if (Math.abs(this.targetYear - this.currentYear) > 0.001) {
            this.currentYear +=
                (this.targetYear - this.currentYear) * this.lerpFactor;
        } else {
            this.currentYear = this.targetYear;
        }
    }
}
