export class TimeController {
    public currentYear: number;
    public targetYear: number;
    private minYear = 1;
    private maxYear = 100;
    private scrollSensitivity = 0.05;
    private lerpFactor = 0.1;
    private isTransitioning = false;
    private transitionStartTime = 0;
    private lastYear = 0;

    constructor(startYear: number = 79) {
        this.currentYear = startYear;
        this.targetYear = startYear;
        this.lastYear = startYear;
    }

    public handleScroll(deltaY: number) {
        const direction = deltaY > 0 ? 1 : -1;
        this.targetYear += direction * this.scrollSensitivity;

        // Use Math.min/max instead of THREE.MathUtils.clamp
        this.targetYear = Math.max(
            this.minYear,
            Math.min(this.maxYear, this.targetYear)
        );

        this.isTransitioning = true;
        this.transitionStartTime = performance.now();
    }

    public jumpToYear(year: number): void {
        this.targetYear = Math.max(this.minYear, Math.min(this.maxYear, year));
        this.isTransitioning = true;
        this.transitionStartTime = performance.now();
    }

    update() {
        this.lastYear = this.currentYear;
        const yearDiff = this.targetYear - this.currentYear;
        this.currentYear += yearDiff * this.lerpFactor;

        if (Math.abs(yearDiff) < 0.001) {
            this.currentYear = this.targetYear;
        }

        if (
            this.isTransitioning &&
            Math.abs(this.currentYear - this.targetYear) < 0.01
        ) {
            this.isTransitioning = false;
        }

        // Use Math.min/max instead of THREE.MathUtils.clamp
        this.currentYear = Math.max(
            this.minYear,
            Math.min(this.maxYear, this.currentYear)
        );
    }

    public isMoving(): boolean {
        return Math.abs(this.currentYear - this.lastYear) > 0.0001;
    }

    public inTransition(): boolean {
        return (
            this.isTransitioning ||
            performance.now() - this.transitionStartTime < 300
        );
    }

    public getVelocity(): number {
        return this.currentYear - this.lastYear;
    }

    public formatYear(): string {
        const yearInt = Math.floor(this.currentYear);
        const yearFrac = this.currentYear - yearInt;
        const fracStr =
            yearFrac > 0
                ? `.${Math.floor(yearFrac * 100)
                      .toString()
                      .padStart(2, '0')}`
                : '';
        return `UC ${yearInt.toString().padStart(4, '0')}${fracStr}`;
    }
}
