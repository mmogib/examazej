import { app, BrowserWindow, Menu, shell, session, ipcMain, dialog } from "electron";
import type { MenuItemConstructorOptions } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// ESM entrypoint → reconstruct __dirname.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// vite-plugin-electron injects this in dev; undefined in a packaged build.
const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const isDev = !!DEV_URL;

let mainWindow: BrowserWindow | null = null;

// ── Window-state persistence (the app's ONLY on-disk state; local-only) ──────
const stateFile = path.join(app.getPath("userData"), "window-state.json");

function loadWindowState(): { width?: number; height?: number; x?: number; y?: number } {
  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  } catch {
    return {};
  }
}

function saveWindowState(win: BrowserWindow) {
  if (!win || win.isDestroyed() || win.isMinimized()) return;
  try {
    fs.writeFileSync(stateFile, JSON.stringify(win.getBounds()));
  } catch {
    /* best-effort */
  }
}

// ── Offline enforcement + CSP (T5). The renderer makes zero external calls; ──
// this blocks all of them at the request layer. NOTE: electron-updater uses
// Electron's `net` on session.defaultSession, so it is ALSO caught by this block.
// TODO(Phase 4): allowlist the update-feed hosts here (or run updates on a separate
// partitioned session) before wiring auto-update — otherwise updates are silently blocked.
function hardenSession() {
  const ses = session.defaultSession;
  const devHost = DEV_URL ? new URL(DEV_URL).host : null;

  ses.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*"] },
    (details, cb) => {
      try {
        if (isDev && devHost && new URL(details.url).host === devHost) {
          return cb({}); // allow the Vite dev server + HMR websocket
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

// Phase 4 replaces this with the electron-updater flow.
function checkForUpdates() {
  // TODO(Phase 4): replace with autoUpdater.checkForUpdates() + sonner-toast status.
  dialog.showMessageBox(mainWindow!, {
    type: "info",
    title: "Examazej",
    message: isDev
      ? "Updates are delivered in release builds."
      : "Automatic update checks will arrive in an upcoming release.",
    buttons: ["OK"],
  });
}

function createWindow() {
  const state = loadWindowState();
  mainWindow = new BrowserWindow({
    width: state.width ?? 1280,
    height: state.height ?? 840,
    x: state.x,
    y: state.y,
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
    hardenSession();
    buildMenu();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
