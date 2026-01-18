/**
 * Manages temporal visibility and transitions
 * EVE-inspired: Entities fade in/out based on temporal relevance
 */
export class TemporalLayer {
    private entities: TemporalEntity[] = [];

    register(entity: TemporalEntity): void {
        this.entities.push(entity);
    }

    update(currentYear: number): void {
        this.entities.forEach((entity) => {
            // Calculate temporal relevance (0-1)
            const relevance = this.calculateRelevance(entity, currentYear);
            entity.setTemporalAlpha(relevance);

            // Emphasize recently appeared entities
            if (relevance > 0 && relevance < 0.1) {
                entity.emphasize(); // Brief pulse effect
            }
        });
    }

    private calculateRelevance(entity: TemporalEntity, year: number): number {
        // Smooth fade in/out around start/end years
        const fadeRange = 0.5; // Years of fade transition

        const afterStart = THREE.MathUtils.smoothstep(
            entity.startYear - fadeRange,
            entity.startYear + fadeRange,
            year
        );

        const beforeEnd =
            1.0 -
            THREE.MathUtils.smoothstep(
                entity.endYear - fadeRange,
                entity.endYear + fadeRange,
                year
            );

        return afterStart * beforeEnd;
    }
}
