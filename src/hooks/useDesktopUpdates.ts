import { useEffect } from "react";
import { toast } from "sonner";

// Desktop-only: surface electron-updater status as subtle sonner toasts (D11).
//
// Silent by design — the on-launch check downloads in the background without nagging. The only
// toast that always shows is the persistent "Update ready — Restart now" once a build has been
// downloaded. User-initiated checks (Help ▸ Check for Updates…) get lightweight feedback so the
// menu item feels responsive. On web this hook is dead-code-eliminated (`__DESKTOP__` is false).
const TOAST_ID = "examazej-update";

export function useDesktopUpdates() {
  useEffect(() => {
    if (!__DESKTOP__) return;
    const bridge = window.examazej;
    if (!bridge?.onUpdateStatus) return;

    return bridge.onUpdateStatus((s: UpdaterStatus) => {
      switch (s.kind) {
        case "checking":
          if (s.manual) toast.loading("Checking for updates…", { id: TOAST_ID });
          break;
        case "available":
          if (s.manual)
            toast.loading(`Downloading update ${s.version}…`, { id: TOAST_ID });
          break;
        case "none":
          if (s.manual) toast.success("You're on the latest version.", { id: TOAST_ID });
          break;
        case "downloaded":
          toast.success("Update ready", {
            id: TOAST_ID,
            description: "It'll be applied the next time you restart Examazej.",
            duration: Infinity,
            action: {
              label: "Restart now",
              onClick: () => window.examazej?.installUpdate(),
            },
          });
          break;
        case "error":
          if (s.manual) toast.error("Couldn't check for updates.", { id: TOAST_ID });
          break;
        // "progress" → stay silent (background download, D11).
      }
    });
  }, []);
}
