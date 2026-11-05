/**
 * Version stamps for template files.
 *
 * From v1.8.0 every template the app writes carries `app_version` in its settings, so a file
 * is always read by the rules of the version that made it. A file without a stamp (or with
 * an unreadable one) was made before v1.8.0 and is read by the older rules.
 */

/** The running app's version (package.json, injected at build time). */
export const APP_VERSION: string = __APP_VERSION__;

/**
 * v1.8.0: `%{#fixed-options:X}` keeps only option X in place. Before, it kept every option in
 * order and also made X the answer.
 */
export const PINNED_OPTIONS_VERSION = "1.8.0";

/**
 * v1.8.0: a `fixed` question inside a `(n)` group keeps its options in order. Before, they
 * were shuffled by mistake, so such a question's answers differ from older answer keys.
 */
export const FIXED_IN_PAREN_GROUP_VERSION = "1.8.0";

/** The newest version whose file rules this code applies. Bump it with each new rule. */
const NEWEST_RULES_VERSION = PINNED_OPTIONS_VERSION;

type Version = [number, number, number];

/** Parse "1.8.0", "1.8" or "v1.8.0"; null when the text is not a version number. */
function parseVersion(raw: string | undefined): Version | null {
  const match = raw?.trim().match(/^v?(\d+)\.(\d+)(?:\.(\d+))?$/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
}

function compareVersions(a: Version, b: Version): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

const formatVersion = (version: Version) => version.join(".");

const NEWEST_RULES = parseVersion(NEWEST_RULES_VERSION) as Version;

/**
 * The stamp written into templates: the app's version, or the newest rules version when this
 * build is older than that (a development build before the release bumps package.json).
 * The stamp names the rules a file follows, so it is never older than the rules applied here.
 */
export function getTemplateVersion(): string {
  const app = parseVersion(APP_VERSION);
  return app && compareVersions(app, NEWEST_RULES) > 0 ? formatVersion(app) : NEWEST_RULES_VERSION;
}

/** How a file's `app_version` stamp reads. */
export interface FileVersion {
  /** The stamp as written; undefined when the file has none. */
  raw?: string;
  /** The parsed stamp; null when missing or unreadable. */
  version: Version | null;
}

export function readFileVersion(raw: string | undefined): FileVersion {
  return { raw, version: parseVersion(raw) };
}

/** True when the file follows rules older than `version` (missing or unreadable stamps do). */
export function isFileBefore(file: FileVersion, version: string): boolean {
  if (!file.version) return true;
  return compareVersions(file.version, parseVersion(version) as Version) < 0;
}

/** Notes about the stamp itself: unreadable, or newer than this app understands. */
export function getFileVersionNotes(file: FileVersion): string[] {
  if (file.raw !== undefined && !file.version) {
    return [
      `app_version "${file.raw}" is not a version number (like 1.8.0), so the file was read as one made before v1.8.`,
    ];
  }
  const known = parseVersion(getTemplateVersion()) as Version;
  // Compare major.minor only: patch releases never change how files are read.
  if (
    file.version &&
    (file.version[0] > known[0] || (file.version[0] === known[0] && file.version[1] > known[1]))
  ) {
    return [
      `This file was made with Examazej ${formatVersion(file.version)}, which is newer than this app (${APP_VERSION}). ` +
        `Update the app; some tags may be read differently here.`,
    ];
  }
  return [];
}

/** "Made with" text for the Details page. */
export function describeFileVersion(file: FileVersion): string {
  if (file.version) return `Examazej ${formatVersion(file.version)}`;
  return file.raw === undefined
    ? "Examazej before 1.8 (no app_version)"
    : "Examazej before 1.8 (unreadable app_version)";
}

/** Short description of where a file's version came from, for notes. */
export function describeFileOrigin(file: FileVersion): string {
  if (file.version) return `This file was made with Examazej ${formatVersion(file.version)}`;
  return file.raw === undefined
    ? "This file has no app_version, so it was read as a file from before v1.8"
    : "This file was read as a file from before v1.8";
}
