import { useEffect, useState } from "react";

// Live release info for the desktop installer, read from the public GitHub Releases API.
// Keeps the /download page version/size/checksum accurate without a rebuild, with a safe
// fallback if the API is unreachable (offline, rate-limited).

const OWNER = "mmogib";
const REPO = "examazej";
const CACHE_KEY = "examazej-latest-release";

export type ReleaseInfo = {
  version: string; // e.g. "1.6.2"
  fileName: string; // e.g. "Examazej Setup 1.6.2.exe"
  downloadUrl: string; // direct .exe asset URL, or the releases/latest page as fallback
  sizeMB: number | null;
  sha256: string | null; // hex digest, or null if unavailable
  releasesUrl: string; // the human GitHub releases page
  isFallback: boolean; // true when the live fetch failed (no live asset URL/checksum)
};

const FALLBACK: ReleaseInfo = {
  version: __APP_VERSION__,
  fileName: `Examazej Setup ${__APP_VERSION__}.exe`,
  downloadUrl: `https://github.com/${OWNER}/${REPO}/releases/latest`,
  sizeMB: null,
  sha256: null,
  releasesUrl: `https://github.com/${OWNER}/${REPO}/releases`,
  isFallback: true,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parse(data: any): ReleaseInfo {
  const version = String(data?.tag_name ?? "").replace(/^v/, "") || FALLBACK.version;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asset = (data?.assets ?? []).find((a: any) => /\.exe$/i.test(a?.name ?? ""));
  if (!asset) return { ...FALLBACK, version, isFallback: true };
  return {
    version,
    fileName: asset.name,
    downloadUrl: asset.browser_download_url,
    sizeMB: asset.size ? Math.round(asset.size / (1024 * 1024)) : null,
    sha256:
      typeof asset.digest === "string" ? asset.digest.replace(/^sha256:/, "") : null,
    releasesUrl: `https://github.com/${OWNER}/${REPO}/releases`,
    isFallback: false,
  };
}

export function useLatestRelease(): ReleaseInfo {
  const [info, setInfo] = useState<ReleaseInfo>(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached) as ReleaseInfo;
    } catch {
      /* ignore */
    }
    return FALLBACK;
  });

  useEffect(() => {
    if (!info.isFallback) return; // already have real data (from cache)
    let cancelled = false;
    fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (cancelled) return;
        const result = parse(data);
        setInfo(result);
        try {
          if (!result.isFallback) sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [info.isFallback]);

  return info;
}
