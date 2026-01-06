# Testing Guide - Priority 1 Tests

This guide explains the test template structure and how to write the Priority 1 tests.

---

## Test Template Structure

I've created `parser.test.ts.template` as a comprehensive example. Here's the breakdown:

### 6-Section Organization

```typescript
describe("functionName", () => {

  // Section 1: Happy Path
  describe("Valid Inputs", () => {
    it("should handle basic case", () => { ... });
    it("should handle complex case", () => { ... });
  });

  // Section 2: Feature-Specific Tests
  describe("Feature X", () => {
    it("should do X correctly", () => { ... });
  });

  // Section 3: Error Cases
  describe("Invalid Inputs", () => {
    it("should reject invalid case", () => { ... });
    it("should provide clear error message", () => { ... });
  });

  // Section 4: Edge Cases
  describe("Edge Cases", () => {
    it("should handle edge case 1", () => { ... });
  });

  // Section 5: Integration
  describe("Integration", () => {
    it("should work with other modules", () => { ... });
  });
});
```

---

## Test Writing Pattern (AAA)

Every test follows **Arrange-Act-Assert**:

```typescript
it("should parse simple question", () => {
  // ARRANGE: Set up test data
  const latex = `
    %% Question: Regular
    What is 2+2?
    %% Option: *
    Four
    %% End Question
  `.trim();

  // ACT: Call the function under test
  const result = parseLatexTemplate(latex);

  // ASSERT: Verify the results
  expect(result.questions).toHaveLength(1);
  expect(result.questions[0].text).toBe("What is 2+2?");
  expect(result.questions[0].choices[1]).toBe(0); // Correct answer index
});
```

---

## Key Testing Principles

### 1. Test Behavior, Not Implementation
```typescript
// ❌ BAD - Tests implementation details
it("should call validateQuestionTags", () => {
  const spy = vi.spyOn(validator, 'validateQuestionTags');
  parseLatexTemplate(latex);
  expect(spy).toHaveBeenCalled();
});

// ✅ GOOD - Tests observable behavior
it("should reject invalid tags", () => {
  const latex = `%% Question: invalid-tag ...`;
  expect(() => parseLatexTemplate(latex)).toThrow(/invalid tag/i);
});
```

### 2. Test Edge Cases
```typescript
it("should handle empty array", () => { ... });
it("should handle single element", () => { ... });
it("should handle very large input", () => { ... });
it("should handle special characters", () => { ... });
```

### 3. Test Error Messages
```typescript
it("should provide helpful error message", () => {
  expect(() => parseLatexTemplate(invalid))
    .toThrow(/Question 2.*cannot combine fixed and fixed-options/i);
});
```

### 4. Use Helper Functions
```typescript
// Helper for cleaner tests
function createQuestion(text: string, tags?: string): string {
  return `
%% Question: ${tags || "Regular"}
${text}
%% Option: *
Answer
%% End Question
  `.trim();
}

// Usage
it("should parse fixed question", () => {
  const result = parseLatexTemplate(createQuestion("Test?", "fixed"));
  expect(result.questions[0].fixed).toBe(true);
});
```

---

## Applying Template to Priority 1 Tests

### 1. Parser Test (Template Already Created)

**File:** `src/lib/core/__tests__/parser.test.ts`

**Sections:**
1. Valid Templates (happy path)
2. Tag Validation (fixed, fixed-options, separate-page)
3. Tag Conflicts (errors)
4. Invalid Templates (errors)
5. Edge Cases
6. Integration with tag-validator

**Copy from template:**
```bash
cp parser.test.ts.template parser.test.ts
# Then fill in actual implementation
```

---

### 2. LaTeX Generator Test

**File:** `src/lib/core/__tests__/latex.test.ts`

**Sections to create:**

```typescript
describe("generateLatexDocument", () => {

  describe("Valid Document Generation", () => {
    it("should generate complete LaTeX document");
    it("should include all versions");
    it("should include master exam");
    it("should have valid LaTeX syntax");
  });

  describe("Cover Page", () => {
    it("should generate cover page when includeCoverPage=true");
    it("should skip cover page when includeCoverPage=false");
    it("should include correct metadata");
  });

  describe("Page Count Calculation", () => {
    it("should calculate page count per version");
    it("should detect page count variations");
    it("should add warning comment when variation detected");
    it("should return pageCountWarning in result");
  });

  describe("Separate-Page Questions", () => {
    it("should handle separate-page tag");
    it("should add \\newpage before separate-page questions");
  });

  describe("Invalid Inputs", () => {
    it("should error on no questions");
    it("should error on empty versions array");
  });

  describe("Edge Cases", () => {
    it("should handle single version");
    it("should handle large exams (100+ questions)");
    it("should handle all open-ended questions");
  });
});
```

**Test data example:**
```typescript
const mockMasterExam = {
  name: "master",
  questions: [
    { text: "Q1?", choices: [[{text: "A"}], 0, null] },
    { text: "Q2?", choices: [[{text: "B"}], 0, null] },
  ],
  // ... rest of exam data
};

const mockVersions = [
  { name: "version_1", questions: [...] },
  { name: "version_2", questions: [...] },
];

const mockSettings = {
  university: "Test Uni",
  // ... rest of settings
};
```

---

### 3. RNG Test

**File:** `src/lib/core/__tests__/rng.test.ts`

**Sections to create:**

```typescript
describe("DeterministicRNG", () => {

  describe("Deterministic Behavior", () => {
    it("should produce same sequence with same seed");
    it("should produce different sequences with different seeds");
    it("should be reproducible across test runs");
  });

  describe("Shuffle Function", () => {
    it("should shuffle array elements");
    it("should preserve all elements (no loss)");
    it("should not create duplicates");
    it("should not favor any position (no bias)");
  });

  describe("Invalid Inputs", () => {
    it("should handle empty array");
    it("should handle single element array");
    it("should handle null seed");
  });

  describe("Edge Cases", () => {
    it("should handle very long seed strings");
    it("should handle special characters in seed");
    it("should handle large arrays (1000+ elements)");
  });

  describe("Statistical Properties", () => {
    it("should produce uniform distribution");
    it("should generate full range of random numbers");
  });
});
```

**Test examples:**
```typescript
it("should produce same sequence with same seed", () => {
  const rng1 = new DeterministicRNG("test-seed");
  const rng2 = new DeterministicRNG("test-seed");

  const seq1 = Array.from({ length: 10 }, () => rng1.next());
  const seq2 = Array.from({ length: 10 }, () => rng2.next());

  expect(seq1).toEqual(seq2);
});

it("should shuffle without bias (statistical test)", () => {
  const rng = new DeterministicRNG("test");
  const arr = [0, 1, 2, 3, 4];
  const positionCounts = [0, 0, 0, 0, 0];

  // Run 1000 shuffles
  for (let i = 0; i < 1000; i++) {
    const shuffled = rng.shuffle([...arr]);
    positionCounts[shuffled.indexOf(0)]++;
  }

  // Each position should have roughly 200 occurrences (1000/5 = 200)
  // Allow ±50 variance (not too strict, not too loose)
  positionCounts.forEach(count => {
    expect(count).toBeGreaterThan(150);
    expect(count).toBeLessThan(250);
  });
});
```

---

## Test Execution Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- parser.test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run only Priority 1 tests
npm test -- src/lib/core/__tests__
```

---

## Coverage Goals

After implementing Priority 1 tests:

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| parser.ts | 0% | 80% | P1 |
| latex.ts | 0% | 80% | P1 |
| rng.ts | 0% | 90% | P1 |
| settings.ts | 100% | 100% | ✅ Done |
| versioning.ts | 100% | 100% | ✅ Done |

**Overall Core Logic:** 40% → **85%**

---

## Common Patterns from Template

### Pattern 1: Testing Throws
```typescript
it("should reject invalid input", () => {
  expect(() => functionName(invalid)).toThrow(/error pattern/i);
});
```

### Pattern 2: Testing Complex Objects
```typescript
it("should return correct structure", () => {
  const result = functionName(input);

  expect(result).toHaveProperty("questions");
  expect(result.questions).toHaveLength(5);
  expect(result.questions[0]).toMatchObject({
    text: expect.any(String),
    choices: expect.any(Array),
  });
});
```

### Pattern 3: Testing Arrays
```typescript
it("should preserve all elements", () => {
  const original = [1, 2, 3, 4, 5];
  const result = shuffle([...original]);

  expect(result).toHaveLength(original.length);
  expect(result.sort()).toEqual(original);
});
```

### Pattern 4: Snapshot Testing (Optional)
```typescript
it("should generate expected LaTeX", () => {
  const result = generateLatexDocument(mock);
  expect(result.content).toMatchSnapshot();
});
```

---

## Next Steps

1. **Review the template** (`parser.test.ts.template`)
2. **Copy pattern** to `parser.test.ts`
3. **Fill in implementation** (replace template examples with actual tests)
4. **Run tests:** `npm test -- parser.test`
5. **Fix failures** until all tests pass
6. **Repeat for latex.test.ts and rng.test.ts**

---

## Tips

✅ **DO:**
- Write clear test names (`should do X when Y`)
- Test one thing per test
- Use descriptive variable names
- Add comments for complex logic
- Test both success and failure cases

❌ **DON'T:**
- Test implementation details
- Write flaky tests (random, timing-dependent)
- Skip edge cases
- Write tests that depend on execution order
- Leave commented-out tests

---

## Questions?

If you need help with:
- **Mock data:** Look at existing tests (settings.test.ts, versioning.test.ts)
- **Assertions:** Check Vitest docs: https://vitest.dev/api/expect.html
- **Test structure:** Follow the template structure
- **Edge cases:** Think about boundary conditions, empty inputs, invalid inputs

Happy testing! 🧪
