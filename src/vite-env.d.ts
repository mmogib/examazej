/// <reference types="vite/client" />

// Injected by Vite `define` — true only in the desktop (Electron) build, false on web.
declare const __DESKTOP__: boolean;

// Injected by Vite `define` — the app version from package.json (release.sh keeps it in lockstep).
declare const __APP_VERSION__: string;

// Auto-update status pushed from the main process (electron-updater, Phase 4).
// Keep in sync with UpdaterStatus in electron/main.ts.
type UpdaterStatus =
  | { kind: "checking"; manual: boolean }
  | { kind: "available"; version: string; manual: boolean }
  | { kind: "none"; manual: boolean }
  | { kind: "progress"; percent: number }
  | { kind: "downloaded"; version: string }
  | { kind: "error"; message: string; manual: boolean };

// Preload bridge exposed on the desktop build (electron/preload.ts).
interface Window {
  examazej?: {
    isDesktop: boolean;
    getVersion: () => Promise<string>;
    onShowDocs: (cb: () => void) => () => void;
    onUpdateStatus: (cb: (status: UpdaterStatus) => void) => () => void;
    installUpdate: () => Promise<void>;
  };
}
