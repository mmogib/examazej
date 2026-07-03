import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Download as DownloadIcon,
  Info,
  Monitor,
  Code2,
  WifiOff,
  EyeOff,
  Copy,
  Check,
  FileCheck2,
  ExternalLink,
  Shuffle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLatestRelease } from "@/hooks/useLatestRelease";

const REPO_URL = "https://github.com/mmogib/examazej";
const AUTHOR_URL = "https://mshahrani.website/";
const OFFLINE_LINE =
  "It only uses the network to check for updates; your exam content never leaves your machine.";
const isWindows =
  typeof navigator !== "undefined" && /Win(dows|32|64|NT)/i.test(navigator.userAgent);

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      aria-label="Copy"
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setCopied(false), 1500);
        })
      }
    >
      {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

/** Faithful CSS re-creation of the Windows SmartScreen dialog — never a screenshot, so the
 *  filename/version always matches the live download. */
function SmartScreenFigure({
  fileName,
  variant,
}: {
  fileName: string;
  variant: "more-info" | "run-anyway";
}) {
  return (
    <figure className="my-4">
      <div className="max-w-md rounded-lg border border-black/10 bg-[#0b4a9e] p-5 text-white shadow-lg">
        <p className="text-lg font-semibold">Windows protected your PC</p>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          Microsoft Defender SmartScreen prevented an unrecognized app from starting.
          Running this app might put your PC at risk.
        </p>
        {variant === "more-info" ? (
          <p className="mt-3 text-sm">
            <span className="rounded px-1 underline decoration-2 underline-offset-2 ring-2 ring-accent">
              More info
            </span>
          </p>
        ) : (
          <>
            <div className="mt-3 space-y-0.5 text-sm text-white/90">
              <p>
                <span className="text-white/60">App:</span> {fileName}
              </p>
              <p>
                <span className="text-white/60">Publisher:</span> Unknown publisher
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="rounded bg-white px-4 py-1.5 text-sm font-medium text-[#0b4a9e] ring-2 ring-accent ring-offset-2 ring-offset-[#0b4a9e]">
                Run anyway
              </span>
              <span className="rounded bg-white/15 px-4 py-1.5 text-sm">Don't run</span>
            </div>
          </>
        )}
      </div>
      <figcaption className="mt-2 text-xs italic text-muted-foreground">
        Re-creation of the Windows screen, shown for guidance — not a live screenshot.
      </figcaption>
    </figure>
  );
}

const Download = () => {
  const rel = useLatestRelease();
  useEffect(() => {
    document.title = "Download Examazej for Windows";
  }, []);

  const sizeLabel = rel.sizeMB ? `${rel.sizeMB} MB` : "~101 MB";
  const hashCmd = `Get-FileHash "$env:USERPROFILE\\Downloads\\${rel.fileName}" -Algorithm SHA256`;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky glass nav (matches Landing) */}
      <nav className="sticky top-0 z-50 border-b border-border/10 bg-background/70 backdrop-blur-[40px]">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shuffle className="h-4 w-4" />
            </span>
            <span className="text-xl font-black tracking-tighter text-primary">Examazej</span>
          </Link>
          <Link to="/app">
            <Button size="sm" className="bg-gradient-to-r from-primary to-primary-glow font-bold text-primary-foreground">
              Open App
            </Button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-14">
        {/* §1 Header */}
        <header className="text-center">
          <span className="mono-label inline-block rounded-full bg-primary/10 px-4 py-1.5 font-bold text-primary">
            WINDOWS DESKTOP APP
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tighter-landing md:text-5xl">
            Examazej for{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Windows
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            The same exam tool as the web version — installed on your PC and fully offline. {OFFLINE_LINE}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Free and open source · Built and maintained by{" "}
            <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Dr. Mohammed Alshahrani
            </a>
          </p>
        </header>

        {/* Non-Windows notice */}
        {!isWindows && (
          <Alert className="mt-8 border-primary/20 bg-primary/5">
            <Monitor className="h-4 w-4" />
            <AlertDescription>
              You appear to be on macOS/Linux. Examazej desktop is currently Windows-only — the{" "}
              <Link to="/app" className="font-semibold text-primary underline">
                web app
              </Link>{" "}
              has every feature. You can still download the installer here for a Windows machine.
            </AlertDescription>
          </Alert>
        )}

        {/* §2 Download card */}
        <Card className="mt-8 border-primary/10 bg-muted/50 shadow-card">
          <CardContent className="flex flex-col items-center gap-5 p-8 text-center md:p-10">
            <img src="/icon-192.png" alt="Examazej" className="h-16 w-16 rounded-2xl shadow-elegant" />
            <a href={rel.downloadUrl} download className="w-full max-w-sm">
              <Button
                size="lg"
                className="h-14 w-full bg-gradient-to-r from-primary to-primary-glow px-10 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20"
              >
                <DownloadIcon className="mr-2 h-5 w-5" />
                Download Examazej for Windows
              </Button>
            </a>
            <p className="mono-label text-muted-foreground">
              {rel.fileName.toUpperCase()} · {sizeLabel} · WINDOWS 10 &amp; 11 · FREE
            </p>
            <p className="text-sm text-muted-foreground">
              Installs to your own user folder — no administrator password needed.
            </p>

            <Alert className="border-accent bg-accent/20 text-left text-accent-foreground">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-accent-foreground/90">
                <span className="font-semibold">Heads up:</span> the first time you run the
                installer, Windows shows a blue caution screen. That's normal for a new free
                app and takes two clicks to pass —{" "}
                <a href="#install-guide" className="font-semibold underline">
                  see exactly what to click ↓
                </a>
              </AlertDescription>
            </Alert>

            <a
              href={rel.releasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Prefer GitHub? View all releases and checksums <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </CardContent>
        </Card>

        {/* §3 Install guide */}
        <section id="install-guide" className="mt-16 scroll-mt-20">
          <span className="mono-label text-primary">30-SECOND INSTALL GUIDE</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tighter-landing">
            Windows will ask you once — here's what to click
          </h2>
          <p className="mt-3 text-muted-foreground">
            Because Examazej is a new free app, Windows double-checks it the first time. You'll
            click twice and never see the screen again.
          </p>

          <ol className="mt-8 space-y-8">
            <li className="flex gap-4">
              <StepNum n={1} />
              <div className="flex-1">
                <p className="font-semibold">Open the file you downloaded.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Double-click <code className="font-mono">{rel.fileName}</code> in your Downloads folder.
                </p>
                <Collapsible className="mt-2">
                  <CollapsibleTrigger className="text-sm font-medium text-primary hover:underline">
                    Did your browser flag the download first? ▾
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 rounded-md border border-border/40 bg-muted/40 p-3 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Microsoft Edge:</span> click the
                      <span className="font-mono"> … </span> next to the blocked download →{" "}
                      <span className="font-medium">Keep</span> → <span className="font-medium">Show more</span> →{" "}
                      <span className="font-medium">Keep anyway</span>.
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-foreground">Chrome:</span> click the download in the bar,
                      then <span className="font-medium">Keep</span>.
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </li>

            <li className="flex gap-4">
              <StepNum n={2} />
              <div className="flex-1">
                <p className="font-semibold">Windows shows a blue screen: "Windows protected your PC."</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This is Windows SmartScreen being cautious about a new app — not a virus alert.
                  Click the small <span className="font-semibold">More info</span> link.
                </p>
                <SmartScreenFigure fileName={rel.fileName} variant="more-info" />
              </div>
            </li>

            <li className="flex gap-4">
              <StepNum n={3} />
              <div className="flex-1">
                <p className="font-semibold">Click "Run anyway."</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The button appears after More info. You'll see "Publisher: Unknown publisher" —
                  expected, and explained below. Setup starts immediately.
                </p>
                <SmartScreenFigure fileName={rel.fileName} variant="run-anyway" />
              </div>
            </li>

            <li className="flex gap-4">
              <StepNum n={4} />
              <div className="flex-1">
                <p className="font-semibold">Done.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Examazej opens, and you'll find it on your Desktop and Start Menu. Windows won't ask again.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* §4 Why unsigned */}
        <section className="mt-16 max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tighter-landing">Why the warning appears</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
            <p>
              Windows shows that screen for any program that isn't signed with a commercial
              <em> code-signing certificate</em>. Certificates cost several hundred dollars per year,
              and Examazej — a free academic tool — doesn't have one yet. We plan to add signing
              (ideally through the university), and the warning will disappear for everyone once we do.
            </p>
            <p>
              Until then, Windows simply can't confirm the publisher's identity automatically, so it
              asks you to decide. The warning means <span className="font-semibold text-foreground">"unverified publisher"</span> — it
              does not mean a virus was found.
            </p>
            <p>
              Since you can't rely on the certificate, we give you two stronger ways to check the
              download yourself ↓
            </p>
          </div>
        </section>

        {/* §5 Verify */}
        <Card className="mt-8 border-primary/10 bg-muted/40">
          <CardContent className="p-6 md:p-8">
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <FileCheck2 className="h-5 w-5 text-primary" />
              Verify your download (optional, 1 minute)
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Every release publishes its SHA-256 fingerprint. If your file's fingerprint matches,
              the file is byte-for-byte the one we published.
            </p>
            {rel.sha256 ? (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-muted p-3">
                <code className="flex-1 break-all font-mono text-xs">{rel.sha256}</code>
                <CopyButton text={rel.sha256} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                The fingerprint is listed on the{" "}
                <a href={rel.releasesUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  GitHub release page
                </a>
                .
              </p>
            )}
            <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>1. Open PowerShell (Start menu → type "PowerShell").</li>
              <li>2. Paste:</li>
            </ol>
            <div className="mt-2 flex items-center gap-2 rounded-md bg-muted p-3">
              <code className="flex-1 break-all font-mono text-xs">{hashCmd}</code>
              <CopyButton text={hashCmd} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              3. Compare the result with the fingerprint above — they should match exactly.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              The same fingerprint is shown independently on the GitHub release page, so you can
              cross-check that this website and GitHub agree.
            </p>
          </CardContent>
        </Card>

        {/* §6 Trust grid */}
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <TrustCard icon={<Code2 className="h-6 w-6 text-primary" />} title="Open source">
            Every line of Examazej is public. Read it, audit it, or ask your IT department to.{" "}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              View the source →
            </a>
          </TrustCard>
          <TrustCard icon={<WifiOff className="h-6 w-6 text-primary" />} title="Offline by design">
            The desktop app only uses the network to check for updates — your exam content never
            leaves your machine. It's enforced in the app: all other network traffic is blocked.
          </TrustCard>
          <TrustCard icon={<EyeOff className="h-6 w-6 text-primary" />} title="Nothing to sign up for">
            No account, no analytics, no telemetry. The app doesn't know who you are.
          </TrustCard>
        </section>

        {/* §7 FAQ */}
        <section className="mx-auto mt-16 max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tighter-landing">Questions</h2>
          <Accordion type="single" collapsible className="mt-4">
            <Faq q="Is this safe to install?">
              An unsigned app isn't a dangerous one — it just means Windows can't auto-verify the
              publisher (we don't have a paid certificate yet). You can verify the exact file with
              the SHA-256 fingerprint above, and the entire source is public to audit.
            </Faq>
            <Faq q="Do I need administrator rights?">
              No. Examazej installs to your own user folder, so it works on university-managed
              machines without an IT ticket.
            </Faq>
            <Faq q="How do updates work?">
              The app checks for a new version when it starts and quietly prepares it; the update
              applies the next time you restart the app. That version check is the only network
              request the app ever makes — your exams are never transmitted.
            </Faq>
            <Faq q="Is the desktop app different from the web version?">
              No — it's the identical tool, same deterministic results. One difference: the "Open in
              Overleaf" shortcut is web-only, because it would send your exam to overleaf.com; on
              desktop, download the ZIP and compile where you choose.
            </Faq>
            <Faq q="Is there a macOS or Linux version?">
              Not yet — Windows first, others if there's demand. The web app runs everywhere.
            </Faq>
            <Faq q="Who makes this?">
              Dr. Mohammed Alshahrani —{" "}
              <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                mshahrani.website
              </a>
              .
            </Faq>
          </Accordion>
        </section>
      </main>

      <footer className="border-t border-border/10 py-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-6 text-center text-sm text-muted-foreground/60">
          <p>
            &copy; {new Date().getFullYear()} Dr. Mohammed Alshahrani ·{" "}
            <Link to="/app" className="text-primary hover:underline">
              Open the web app
            </Link>
          </p>
          <p className="mono-label">Examazej v{rel.version}</p>
        </div>
      </footer>
    </div>
  );
};

function StepNum({ n }: { n: number }) {
  return (
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">
      {n}
    </span>
  );
}

function TrustCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={q}>
      <AccordionTrigger className="text-left">{q}</AccordionTrigger>
      <AccordionContent className="text-muted-foreground">{children}</AccordionContent>
    </AccordionItem>
  );
}

export default Download;
