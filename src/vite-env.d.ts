/// <reference types="vite/client" />

// Injected by Vite `define` — true only in the desktop (Electron) build, false on web.
declare const __DESKTOP__: boolean;

// Injected by Vite `define` — the app version from package.json (release.sh keeps it in lockstep).
declare const __APP_VERSION__: string;

// Preload bridge exposed on the desktop build (electron/preload.ts).
interface Window {
  examazej?: {
    isDesktop: boolean;
    getVersion: () => Promise<string>;
    onShowDocs: (cb: () => void) => () => void;
    onUpdateStatus: (cb: (status: unknown) => void) => () => void;
  };
}
