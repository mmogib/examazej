import { describe, it, expect } from "vitest";
import { DeterministicRNG } from "../rng";

/**
 * Tests for rng.ts - Deterministic Random Number Generator
 *
 * Coverage:
 * - Deterministic behavior (reproducibility)
 * - Shuffle function correctness
 * - Invalid inputs
 * - Edge cases
 * - Statistical properties
 */

describe("DeterministicRNG", () => {
  // ============================================================================
  // SECTION 1: Deterministic Behavior (Reproducibility)
  // ============================================================================

  describe("Deterministic Behavior", () => {
    it("should produce same sequence with same seed", () => {
      const rng1 = new DeterministicRNG("test-seed");
      const rng2 = new DeterministicRNG("test-seed");

      const seq1 = Array.from({ length: 10 }, () => rng1.next());
      const seq2 = Array.from({ length: 10 }, () => rng2.next());

      expect(seq1).toEqual(seq2);
    });

    it("should produce different sequences with different seeds", () => {
      const rng1 = new DeterministicRNG("seed-1");
      const rng2 = new DeterministicRNG("seed-2");

      const seq1 = Array.from({ length: 10 }, () => rng1.next());
      const seq2 = Array.from({ length: 10 }, () => rng2.next());

      expect(seq1).not.toEqual(seq2);
    });

    it("should be reproducible across multiple shuffle calls", () => {
      const rng1 = new DeterministicRNG("test-seed");
      const rng2 = new DeterministicRNG("test-seed");

      const arr = [1, 2, 3, 4, 5];
      const shuffled1 = rng1.shuffle([...arr]);
      const shuffled2 = rng2.shuffle([...arr]);

      expect(shuffled1).toEqual(shuffled2);
    });

    it("should produce consistent sequence after reset with same seed", () => {
      const seed = "consistent-seed";
      const rng1 = new DeterministicRNG(seed);
      const seq1 = Array.from({ length: 5 }, () => rng1.next());

      const rng2 = new DeterministicRNG(seed);
      const seq2 = Array.from({ length: 5 }, () => rng2.next());

      expect(seq1).toEqual(seq2);
    });
  });

  // ============================================================================
  // SECTION 2: Shuffle Function Correctness
  // ============================================================================

  describe("Shuffle Function", () => {
    it("should shuffle array elements", () => {
      const rng = new DeterministicRNG("shuffle-test");
      const arr = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle([...arr]);

      // Should not be in original order (with high probability)
      // Note: There's a 1/120 chance this test fails randomly
      expect(shuffled).not.toEqual(arr);
    });

    it("should preserve all elements (no loss)", () => {
      const rng = new DeterministicRNG("preserve-test");
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = rng.shuffle([...arr]);

      expect(shuffled).toHaveLength(arr.length);
      expect(shuffled.sort((a, b) => a - b)).toEqual(arr);
    });

    it("should not create duplicates", () => {
      const rng = new DeterministicRNG("duplicate-test");
      const arr = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle([...arr]);

      const uniqueElements = new Set(shuffled);
      expect(uniqueElements.size).toBe(arr.length);
    });

    it("should handle array of strings", () => {
      const rng = new DeterministicRNG("string-test");
      const arr = ["apple", "banana", "cherry", "date"];
      const shuffled = rng.shuffle([...arr]);

      expect(shuffled).toHaveLength(arr.length);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it("should handle array of objects", () => {
      const rng = new DeterministicRNG("object-test");
      const arr = [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
        { id: 3, name: "C" },
      ];
      const shuffled = rng.shuffle([...arr]);

      expect(shuffled).toHaveLength(arr.length);
      const ids = shuffled.map((obj) => obj.id).sort();
      expect(ids).toEqual([1, 2, 3]);
    });

    it("should not favor any position (statistical test)", () => {
      const rng = new DeterministicRNG("bias-test");
      const arr = [0, 1, 2, 3, 4];
      const positionCounts = Array(5).fill(0);

      // Run 1000 shuffles
      for (let i = 0; i < 1000; i++) {
        const shuffled = rng.shuffle([...arr]);
        const position = shuffled.indexOf(0);
        positionCounts[position]++;
      }

      // Each position should have roughly 200 occurrences (1000/5 = 200)
      // Allow ±70 variance (not too strict, not too loose)
      positionCounts.forEach((count) => {
        expect(count).toBeGreaterThan(130);
        expect(count).toBeLessThan(270);
      });
    });
  });

  // ============================================================================
  // SECTION 3: Invalid Inputs
  // ============================================================================

  describe("Invalid Inputs", () => {
    it("should handle empty array", () => {
      const rng = new DeterministicRNG("empty-test");
      const arr: number[] = [];
      const shuffled = rng.shuffle(arr);

      expect(shuffled).toEqual([]);
    });

    it("should handle single element array", () => {
      const rng = new DeterministicRNG("single-test");
      const arr = [42];
      const shuffled = rng.shuffle([...arr]);

      expect(shuffled).toEqual([42]);
    });

    it("should handle empty string seed", () => {
      const rng = new DeterministicRNG("");
      const seq = Array.from({ length: 5 }, () => rng.next());

      // Should still produce valid numbers
      seq.forEach((num) => {
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(1);
      });
    });

    it("should handle two element array", () => {
      const rng = new DeterministicRNG("two-test");
      const arr = [1, 2];
      const shuffled = rng.shuffle([...arr]);

      expect(shuffled).toHaveLength(2);
      expect(shuffled.sort()).toEqual([1, 2]);
    });
  });

  // ============================================================================
  // SECTION 4: Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle very long seed strings", () => {
      const longSeed = "a".repeat(1000);
      const rng = new DeterministicRNG(longSeed);
      const seq = Array.from({ length: 5 }, () => rng.next());

      // Should still produce valid numbers
      seq.forEach((num) => {
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(1);
      });
    });

    it("should handle special characters in seed", () => {
      const specialSeed = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`";
      const rng = new DeterministicRNG(specialSeed);
      const seq = Array.from({ length: 5 }, () => rng.next());

      seq.forEach((num) => {
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(1);
      });
    });

    it("should handle Unicode characters in seed", () => {
      const unicodeSeed = "こんにちは世界🌍🎉";
      const rng = new DeterministicRNG(unicodeSeed);
      const seq = Array.from({ length: 5 }, () => rng.next());

      seq.forEach((num) => {
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(1);
      });
    });

    it("should handle large arrays (1000+ elements)", () => {
      const rng = new DeterministicRNG("large-test");
      const arr = Array.from({ length: 1000 }, (_, i) => i);
      const shuffled = rng.shuffle([...arr]);

      expect(shuffled).toHaveLength(1000);
      expect(shuffled.sort((a, b) => a - b)).toEqual(arr);
    });

    it("should handle array with duplicate values", () => {
      const rng = new DeterministicRNG("duplicate-values-test");
      const arr = [1, 2, 2, 3, 3, 3];
      const shuffled = rng.shuffle([...arr]);

      expect(shuffled).toHaveLength(6);
      expect(shuffled.sort()).toEqual([1, 2, 2, 3, 3, 3]);
    });

    it("should handle numeric seed-like strings", () => {
      const rng1 = new DeterministicRNG("12345");
      const rng2 = new DeterministicRNG("12345");

      const seq1 = Array.from({ length: 5 }, () => rng1.next());
      const seq2 = Array.from({ length: 5 }, () => rng2.next());

      expect(seq1).toEqual(seq2);
    });
  });

  // ============================================================================
  // SECTION 5: Statistical Properties
  // ============================================================================

  describe("Statistical Properties", () => {
    it("should produce values in [0, 1) range", () => {
      const rng = new DeterministicRNG("range-test");
      const values = Array.from({ length: 100 }, () => rng.next());

      values.forEach((val) => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      });
    });

    it("should generate full range of random numbers", () => {
      const rng = new DeterministicRNG("full-range-test");
      const values = Array.from({ length: 1000 }, () => rng.next());

      // Should have values in different quartiles
      const quartiles = [0, 0, 0, 0];
      values.forEach((val) => {
        if (val < 0.25) quartiles[0]++;
        else if (val < 0.5) quartiles[1]++;
        else if (val < 0.75) quartiles[2]++;
        else quartiles[3]++;
      });

      // Each quartile should have at least 15% of values (expected: 25%)
      quartiles.forEach((count) => {
        expect(count).toBeGreaterThan(150);
      });
    });

    it("should produce uniform-like distribution (chi-square test approximation)", () => {
      const rng = new DeterministicRNG("uniform-test");
      const buckets = Array(10).fill(0);
      const numSamples = 10000;

      for (let i = 0; i < numSamples; i++) {
        const val = rng.next();
        const bucketIndex = Math.floor(val * 10);
        buckets[bucketIndex < 10 ? bucketIndex : 9]++;
      }

      // Expected count per bucket: 1000
      // Allow ±200 variance (not a strict chi-square test, but reasonable)
      buckets.forEach((count) => {
        expect(count).toBeGreaterThan(800);
        expect(count).toBeLessThan(1200);
      });
    });

    it("should not produce sequential patterns", () => {
      const rng = new DeterministicRNG("pattern-test");
      const values = Array.from({ length: 10 }, () => rng.next());

      // Check that values are not monotonically increasing or decreasing
      const increasing = values.every((val, i) => i === 0 || val > values[i - 1]);
      const decreasing = values.every((val, i) => i === 0 || val < values[i - 1]);

      expect(increasing).toBe(false);
      expect(decreasing).toBe(false);
    });

    it("should maintain independence (consecutive values not correlated)", () => {
      const rng = new DeterministicRNG("independence-test");
      const pairs: Array<[number, number]> = [];

      for (let i = 0; i < 100; i++) {
        pairs.push([rng.next(), rng.next()]);
      }

      // Simple correlation check: high first value shouldn't always mean high second value
      const highFirst = pairs.filter(([a]) => a > 0.5);
      const highSecond = highFirst.filter(([, b]) => b > 0.5);

      // If independent, roughly 50% of high-first should have high-second
      const ratio = highSecond.length / highFirst.length;
      expect(ratio).toBeGreaterThan(0.3);
      expect(ratio).toBeLessThan(0.7);
    });
  });

  // ============================================================================
  // SECTION 6: Real-World Use Cases
  // ============================================================================

  describe("Real-World Use Cases", () => {
    it("should handle exam question shuffling scenario", () => {
      const rng = new DeterministicRNG("exam-seed-2026");
      const questions = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        text: `Question ${i + 1}`,
      }));

      const shuffled = rng.shuffle([...questions]);

      expect(shuffled).toHaveLength(20);
      const ids = shuffled.map((q) => q.id).sort((a, b) => a - b);
      expect(ids).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    });

    it("should handle option shuffling scenario", () => {
      const rng = new DeterministicRNG("option-seed");
      const options = ["A", "B", "C", "D"];

      const shuffled = rng.shuffle([...options]);

      expect(shuffled).toHaveLength(4);
      expect(shuffled.sort()).toEqual(["A", "B", "C", "D"]);
    });

    it("should handle group shuffling scenario", () => {
      const rng = new DeterministicRNG("group-seed");
      const groups = [
        { id: 1, questions: [1, 2, 3, 4, 5] },
        { id: 2, questions: [6, 7, 8, 9, 10] },
        { id: 3, questions: [11, 12, 13, 14, 15] },
      ];

      const shuffled = rng.shuffle([...groups]);

      expect(shuffled).toHaveLength(3);
      const ids = shuffled.map((g) => g.id).sort();
      expect(ids).toEqual([1, 2, 3]);
    });

    it("should produce consistent results for exam versioning", () => {
      const seed = "exam-v1-seed";
      const questions = [1, 2, 3, 4, 5];

      const rng1 = new DeterministicRNG(seed);
      const version1 = rng1.shuffle([...questions]);

      const rng2 = new DeterministicRNG(seed);
      const version2 = rng2.shuffle([...questions]);

      // Same seed should produce identical versions
      expect(version1).toEqual(version2);
    });
  });
});

// ============================================================================
// TESTING BEST PRACTICES DEMONSTRATED:
// ============================================================================
//
// 1. ✅ Deterministic behavior verified
// 2. ✅ Correctness properties tested (no loss, no duplicates)
// 3. ✅ Statistical properties validated
// 4. ✅ Edge cases covered
// 5. ✅ Real-world scenarios tested
// 6. ✅ Reproducibility requirements met
// 7. ✅ Independence and uniformity checked
// 8. ✅ Focus on observable behavior, not implementation
//
// ============================================================================
