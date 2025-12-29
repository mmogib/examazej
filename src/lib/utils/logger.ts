/**
 * Safe logger that only logs in development mode
 * Automatically stripped from production builds by Vite's tree-shaking
 *
 * Usage:
 *   import { logger } from '@/lib/utils/logger';
 *   logger.debug("Debug message", { data });
 *
 * Or create scoped loggers:
 *   import { createLogger } from '@/lib/utils/logger';
 *   const logger = createLogger("SETTINGS");
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// Safety check: ensure environment is correctly configured
if (isDev && isProd) {
  throw new Error("Invalid environment: both DEV and PROD are true!");
}

// Optional: Force disable all logs (useful for testing production behavior in dev)
const FORCE_DISABLE_LOGS = false;

const canLog = isDev && !FORCE_DISABLE_LOGS;

class Logger {
  private prefix: string;

  constructor(prefix = "APP") {
    this.prefix = prefix;
  }

  /**
   * Format log messages with timestamp and prefix
   */
  private format(level: string, ...args: any[]) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    return [`[${timestamp}] [${this.prefix}] [${level}]`, ...args];
  }

  /**
   * Debug-level logging (most verbose)
   * Only shown in development
   */
  debug(...args: any[]) {
    if (canLog) {
      console.log(...this.format("DEBUG", ...args));
    }
  }

  /**
   * Info-level logging
   * Only shown in development
   */
  info(...args: any[]) {
    if (canLog) {
      console.info(...this.format("INFO", ...args));
    }
  }

  /**
   * Warning-level logging
   * Only shown in development
   */
  warn(...args: any[]) {
    if (canLog) {
      console.warn(...this.format("WARN", ...args));
    }
  }

  /**
   * Error-level logging
   * ALWAYS shown (even in production) for critical issues
   */
  error(...args: any[]) {
    console.error(...this.format("ERROR", ...args));
  }

  /**
   * Grouped logs for complex debugging
   * Only shown in development
   *
   * Example:
   *   logger.group("Template Generation", () => {
   *     logger.debug("Step 1");
   *     logger.debug("Step 2");
   *   });
   */
  group(label: string, fn: () => void) {
    if (canLog) {
      console.group(label);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    }
  }

  /**
   * Collapsed group (same as group but starts collapsed)
   * Only shown in development
   */
  groupCollapsed(label: string, fn: () => void) {
    if (canLog) {
      console.groupCollapsed(label);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    }
  }

  /**
   * Table view for arrays/objects
   * Only shown in development
   *
   * Example:
   *   logger.table([{ id: 1, name: "Q1" }, { id: 2, name: "Q2" }]);
   */
  table(data: any, columns?: string[]) {
    if (canLog) {
      if (columns) {
        console.table(data, columns);
      } else {
        console.table(data);
      }
    }
  }

  /**
   * Time a function execution
   * Only shown in development
   *
   * Example:
   *   logger.time("Generate Template", () => {
   *     // ... expensive operation
   *   });
   */
  time<T>(label: string, fn: () => T): T {
    if (canLog) {
      console.time(label);
    }
    try {
      return fn();
    } finally {
      if (canLog) {
        console.timeEnd(label);
      }
    }
  }

  /**
   * Async version of time()
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (canLog) {
      console.time(label);
    }
    try {
      return await fn();
    } finally {
      if (canLog) {
        console.timeEnd(label);
      }
    }
  }
}

/**
 * Default logger instance
 * Use for general application logging
 */
export const logger = new Logger("APP");

/**
 * Create a scoped logger with a custom prefix
 * Useful for module-specific logging
 *
 * Example:
 *   const settingsLogger = createLogger("SETTINGS");
 *   settingsLogger.debug("Settings loaded");
 */
export const createLogger = (prefix: string) => new Logger(prefix);
