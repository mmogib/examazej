import { app, BrowserWindow, Menu, shell, session, ipcMain, dialog, screen } from "electron";
import type { MenuItemConstructorOptions } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import electronUpdater from "electron-updater";

// electron-updater is CommonJS; this is its documented ESM interop.
const { autoUpdater } = electronUpdater;

// ESM entrypoint → reconstruct __dirname.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// vite-plugin-electron injects this in dev; undefined in a packaged build.
const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const isDev = !!DEV_URL;

let mainWindow: BrowserWindow | null = null;

// ── Auto-update status → renderer (Phase 4, D11). Silent by default; the renderer
// (useDesktopUpdates) only surfaces a subtle "ready to restart" toast, plus feedback for a
// user-initiated "Check for Updates…". Keep in sync with UpdaterStatus in src/vite-env.d.ts.
type UpdaterStatus =
  | { kind: "checking"; manual: boolean }
  | { kind: "available"; version: string; manual: boolean }
  | { kind: "none"; manual: boolean }
  | { kind: "progress"; percent: number }
  | { kind: "downloaded"; version: string }
  | { kind: "error"; message: string; manual: boolean };

// True while the in-flight check came from the Help menu (→ show feedback) rather than the
// silent on-launch check (→ stay quiet unless an update is actually ready to install).
let manualCheck = false;

function sendUpdateStatus(status: UpdaterStatus) {
  mainWindow?.webContents.send("updater:status", status);
}

// ── Window-state persistence (the app's ONLY on-disk state; local-only) ──────
const stateFile = path.join(app.getPath("userData"), "window-state.json");

type WindowState = { width?: number; height?: number; x?: number; y?: number; maximized?: boolean };

function loadWindowState(): WindowState {
  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  } catch {
    return {};
  }
}

function saveWindowState(win: BrowserWindow) {
  if (!win || win.isDestroyed()) return;
  try {
    // getNormalBounds() = the un-maximized size, so we restore to that then re-maximize.
    fs.writeFileSync(
      stateFile,
      JSON.stringify({ ...win.getNormalBounds(), maximized: win.isMaximized() })
    );
  } catch {
    /* best-effort */
  }
}

// Only reuse saved x/y if the window would still be visible on a connected display
// (e.g. after unplugging the monitor it was last on) — otherwise let it center.
function isOnScreen(s: WindowState): boolean {
  if (s.x == null || s.y == null || s.width == null || s.height == null) return false;
  const { x, y, width, height } = screen.getDisplayMatching({
    x: s.x,
    y: s.y,
    width: s.width,
    height: s.height,
  }).workArea;
  const intersects = s.x < x + width && s.x + s.width > x && s.y < y + height && s.y + s.height > y;
  const titleReachable = s.y >= y - 8 && s.y < y + height - 30;
  return intersects && titleReachable;
}

// The GitHub Releases hosts electron-updater talks to (on the default session). This is the
// app's ONLY sanctioned network egress — the disclosed "we only check for updates" exception
// (D11). The renderer stays boxed to 'self' by CSP, so it can't piggyback on this allowlist.
function isUpdateFeedHost(host: string): boolean {
  return (
    host === "github.com" ||
    host === "api.github.com" ||
    host.endsWith(".githubusercontent.com") // objects/… + release-assets/… asset redirects
  );
}

// ── Offline enforcement + CSP (T5). The renderer makes zero external calls; this blocks all
// of them at the request layer. The single exception is the update feed above (electron-updater
// uses Electron's `net` on session.defaultSession, so it flows through here too).
function hardenSession() {
  const ses = session.defaultSession;
  const devHost = DEV_URL ? new URL(DEV_URL).host : null;

  ses.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*"] },
    (details, cb) => {
      try {
        const { host } = new URL(details.url);
        if (isDev && devHost && host === devHost) {
          return cb({}); // allow the Vite dev server + HMR websocket
        }
        if (isUpdateFeedHost(host)) {
          return cb({}); // allow the GitHub update feed (electron-updater, main process)
        }
      } catch {
        /* fallthrough to block */
      }
      cb({ cancel: true }); // block every other outbound request
    }
  );

  ses.webRequest.onHeadersReceived((details, cb) => {
    const connect = isDev && devHost ? ` http://${devHost} ws://${devHost}` : "";
    cb({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self';" +
            " script-src 'self' 'unsafe-inline';" +
            " style-src 'self' 'unsafe-inline';" +
            " img-src 'self' data: blob:;" +
            " font-src 'self' data:;" +
            " media-src 'self' blob:;" +
            ` connect-src 'self'${connect};` +
            " object-src 'none'; base-uri 'self'",
        ],
      },
    });
  });

  // Native Save-As dialog for blob/<a download> exports (T1). Without this,
  // Electron would silently write to the Downloads folder with no prompt.
  ses.on("will-download", (_e, item) => {
    item.setSaveDialogOptions({ defaultPath: item.getFilename() });
  });
}

// ── Native menu (D13/D14/D15): minimal, always visible, no DevTools/Reload ───
function buildMenu() {
  const template: MenuItemConstructorOptions[] = [
    { label: "File", submenu: [{ role: "quit", label: "Exit" }] },
    {
      label: "View",
      submenu: [
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Check for Updates…",
          click: () => checkForUpdates(),
        },
        {
          label: "Documentation",
          click: () => mainWindow?.webContents.send("menu:show-docs"),
        },
        { type: "separator" },
        { label: "About Examazej", click: () => showAbout() },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function showAbout() {
  dialog.showMessageBox(mainWindow!, {
    type: "info",
    title: "About Examazej",
    message: `Examazej ${app.getVersion()}`,
    detail:
      "Multiple-Choice Exam Randomizer\n\n" +
      "This app runs fully offline. The only network use is checking for updates — " +
      "your exam content never leaves your machine.\n\n" +
      "© Mohammed Alshahrani",
    buttons: ["OK"],
  });
}

// Help ▸ "Check for Updates…" — user-initiated, so we show feedback. The on-launch check runs
// silently from initAutoUpdater().
function checkForUpdates() {
  if (isDev) {
    dialog.showMessageBox(mainWindow!, {
      type: "info",
      title: "Examazej",
      message: "Updates are delivered in packaged release builds.",
      buttons: ["OK"],
    });
    return;
  }
  manualCheck = true;
  autoUpdater.checkForUpdates().catch((err) => {
    sendUpdateStatus({ kind: "error", message: String(err?.message ?? err), manual: true });
    manualCheck = false;
  });
}

// electron-updater: check on launch → download silently → install on quit (D11). Signature
// verification stays off until code-signing lands (D9); we rely on HTTPS + the public repo.
function initAutoUpdater() {
  if (isDev) return; // no app-update.yml in dev → autoUpdater would throw

  autoUpdater.autoDownload = true; // silent background download
  autoUpdater.autoInstallOnAppQuit = true; // apply on the next quit

  autoUpdater.on("checking-for-update", () =>
    sendUpdateStatus({ kind: "checking", manual: manualCheck })
  );
  autoUpdater.on("update-available", (info) =>
    sendUpdateStatus({ kind: "available", version: info.version, manual: manualCheck })
  );
  autoUpdater.on("update-not-available", () => {
    sendUpdateStatus({ kind: "none", manual: manualCheck });
    manualCheck = false;
  });
  autoUpdater.on("download-progress", (p) =>
    sendUpdateStatus({ kind: "progress", percent: Math.round(p.percent) })
  );
  autoUpdater.on("update-downloaded", (info) => {
    sendUpdateStatus({ kind: "downloaded", version: info.version });
    manualCheck = false;
  });
  autoUpdater.on("error", (err) => {
    // Silent on the auto check (don't nag offline users); surfaced only for manual checks.
    sendUpdateStatus({ kind: "error", message: String(err?.message ?? err), manual: manualCheck });
    manualCheck = false;
  });

  // Check shortly after launch, once the renderer is up to receive toast events.
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 3000);
}

function createWindow() {
  const state = loadWindowState();
  const useSavedPos = isOnScreen(state);
  mainWindow = new BrowserWindow({
    width: state.width ?? 1280,
    height: state.height ?? 840,
    x: useSavedPos ? state.x : undefined,
    y: useSavedPos ? state.y : undefined,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: "#027E2F",
    title: "Examazej",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true, // preload is emitted as CommonJS (preload.cjs), so the sandbox works
    },
  });
  if (state.maximized) mainWindow.maximize();

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("close", () => mainWindow && saveWindowState(mainWindow));
  mainWindow.on("closed", () => (mainWindow = null));

  // External links → system browser; deny in-window navigation away (T7).
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (e, url) => {
    const internal = DEV_URL ?? "file://";
    if (!url.startsWith(internal) && /^https?:\/\//.test(url)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  // Hidden DevTools for owner support only (D15).
  mainWindow.webContents.on("before-input-event", (_e, input) => {
    if (input.type !== "keyDown") return; // avoid the keyUp double-toggle
    if (input.control && input.shift && input.key.toLowerCase() === "i") {
      mainWindow?.webContents.toggleDevTools();
    }
  });

  // Resilience: never leave a blank window on load failure (T12; no retry loop).
  let retried = false;
  mainWindow.webContents.on("did-fail-load", (_e, code, desc) => {
    if (code === -3) return; // ERR_ABORTED — ignore
    if (isDev && !retried) {
      retried = true;
      setTimeout(() => mainWindow?.loadURL(`${DEV_URL}#/app`), 800);
      return;
    }
    dialog.showErrorBox("Examazej", `Failed to load the app (${desc}).`);
    app.quit(); // don't leave a hidden zombie window (show:false never fired)
  });

  // Boot straight into the app (D12).
  if (DEV_URL) {
    mainWindow.loadURL(`${DEV_URL}#/app`);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"), { hash: "/app" });
  }
}

// ── Single-instance lock (D18) ───────────────────────────────────────────────
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    ipcMain.handle("app:getVersion", () => app.getVersion());
    // Renderer "Restart now" action → apply the downloaded update (silent install + relaunch).
    ipcMain.handle("updater:install", () => autoUpdater.quitAndInstall(true, true));
    hardenSession();
    buildMenu();
    createWindow();
    initAutoUpdater();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
