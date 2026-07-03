import { contextBridge, ipcRenderer } from "electron";

// Minimal, sandbox-safe bridge. The renderer already knows it's desktop via the
// compile-time __DESKTOP__ flag; this exposes only what needs the main process.
contextBridge.exposeInMainWorld("examazej", {
  isDesktop: true,

  getVersion: (): Promise<string> => ipcRenderer.invoke("app:getVersion"),

  // Native menu → "Documentation" opens the in-app docs step (T8).
  onShowDocs: (cb: () => void): (() => void) => {
    const listener = () => cb();
    ipcRenderer.on("menu:show-docs", listener);
    return () => ipcRenderer.removeListener("menu:show-docs", listener);
  },

  // Auto-update status channel (main → renderer). Payload = UpdaterStatus (see main.ts).
  onUpdateStatus: (cb: (status: unknown) => void): (() => void) => {
    const listener = (_e: unknown, status: unknown) => cb(status);
    ipcRenderer.on("updater:status", listener);
    return () => ipcRenderer.removeListener("updater:status", listener);
  },

  // Renderer → main: apply the already-downloaded update now ("Restart now").
  installUpdate: (): Promise<void> => ipcRenderer.invoke("updater:install"),
});
