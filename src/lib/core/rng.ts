// Deterministic random number generator using LCG (Linear Congruential Generator)
export class DeterministicRNG {
  private seed: number;
  private current: number;

  constructor(seed: string) {
    // Convert string seed to number
    this.seed = this.hashCode(seed);
    this.current = this.seed;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // LCG formula: (a * seed + c) % m
  // Using values from Numerical Recipes
  next(): number {
    this.current = (this.current * 1664525 + 1013904223) % Math.pow(2, 32);
    return this.current / Math.pow(2, 32);
  }

  // Fisher-Yates shuffle with deterministic RNG
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Reset to original seed
  reset(): void {
    this.current = this.seed;
  }
}