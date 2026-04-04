# Logger Utility Guide

**File**: `src/lib/utils/logger.ts`

---

## Basic Usage

```typescript
import { createLogger } from '@/lib/utils/logger';
const logger = createLogger('MY_MODULE');

logger.debug('Verbose detail', { data });
logger.info('Important milestone');
logger.warn('Something unexpected');
logger.error('Critical error');  // Always shown, even in production
```

## CRITICAL Rule

**Never put business logic inside logger callbacks.** They are tree-shaken in production.

```typescript
// WRONG -- business logic disappears in production
logger.time('Gen', () => {
  const template = createTemplate();  // GONE in prod!
  downloadFile(template);
});

// CORRECT -- logic at function scope
const template = createTemplate();
downloadFile(template);
logger.info('Template generated');
```

## Other Features

```typescript
logger.group('Label', () => { logger.debug('...'); });  // Grouped output
logger.time('Label', () => { /* measured */ });          // Performance timing
logger.table([{ id: 1, name: 'Q1' }]);                  // Table view
```

## Production Behavior

- `npm run dev`: All logs visible
- `npm run build`: Only `error()` visible, rest tree-shaken to zero cost
