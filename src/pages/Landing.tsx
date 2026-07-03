import { Button } from '@/components/ui/button';
import { Shuffle, Shield, Clock, CheckCircle, ArrowRight, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="relative min-h-screen bg-background">
      {/* ── Sticky Glass Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-border/10 bg-background/60 shadow-[0_16px_32px_rgba(0,0,0,0.3)] backdrop-blur-[40px]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-12">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shuffle className="h-4 w-4" />
            </span>
            <span className="text-2xl font-black tracking-tighter text-primary">
              Examazej
            </span>
          </Link>
          <Link to="/app">
            <Button
              size="lg"
              className="h-10 rounded-md bg-gradient-to-r from-primary to-primary-glow px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              Open App
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero-dark hero-mesh relative flex min-h-[780px] flex-col items-center justify-center overflow-hidden px-6">
        {/* Decorative dot grid */}
        <div className="pointer-events-none absolute inset-0 bg-dot-grid-hero opacity-[0.03]" />
        {/* Gradient orbs */}
        <div className="landing-orb absolute -top-40 left-1/4 h-[500px] w-[500px] bg-primary/20 opacity-40 animate-subtle-pulse" />
        <div className="landing-orb absolute -bottom-20 right-1/4 h-[400px] w-[400px] bg-secondary/15 opacity-30" />

        <div className="relative z-10 max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-6 opacity-0 animate-fade-in-up">
            <span className="mono-label inline-block rounded-full bg-primary/10 px-4 py-1.5 font-bold text-primary">
              Academic Tool
            </span>
          </div>

          {/* Heading */}
          <h1 className="mb-8 text-5xl font-extrabold leading-[1.1] tracking-tighter-landing text-white opacity-0 animate-fade-in-up-delay-1 md:text-7xl">
            Fair, Secure, Modern
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Exam Shuffling
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-white/50 opacity-0 animate-fade-in-up-delay-2 md:text-xl">
            Generate randomized, reproducible exam variants in seconds.
            Designed for educators who demand institutional integrity without the complexity.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-6 opacity-0 animate-fade-in-up-delay-3 sm:flex-row">
            <Link to="/app">
              <Button
                size="lg"
                className="h-14 rounded-md bg-gradient-to-r from-primary to-primary-glow px-10 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                Get Started Free
              </Button>
            </Link>
            <a
              href="#features"
              className="group flex items-center gap-2 text-base font-semibold text-white/60 transition-colors duration-300 hover:text-primary"
            >
              Learn more
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-6 py-32 md:px-12">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="mb-20 flex flex-col items-end justify-between gap-8 md:flex-row">
            <div className="max-w-xl">
              <span className="mono-label mb-3 inline-block text-primary">Features</span>
              <h2 className="text-4xl font-extrabold tracking-tighter-landing md:text-5xl">
                Why Choose Examazej?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Built for high-stakes testing, prioritizing privacy and precision at every step.
              </p>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid gap-8 md:grid-cols-3">
            {/* Card 1 */}
            <div className="group rounded-xl border border-transparent bg-muted/40 p-10 transition-all duration-500 hover:border-border/40 hover:bg-muted/60">
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
                <Shuffle className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-4 text-2xl font-bold tracking-tight-landing">
                Advanced Shuffling
              </h3>
              <p className="mb-8 leading-relaxed text-muted-foreground">
                Maintain total integrity with deterministic seed-based randomization. Reproduce any variant at any time with a single key.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                  <CheckCircle className="h-[18px] w-[18px] text-primary" />
                  Question order shuffle
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                  <CheckCircle className="h-[18px] w-[18px] text-primary" />
                  Answer choice shuffle
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                  <CheckCircle className="h-[18px] w-[18px] text-primary" />
                  Deterministic seeds
                </li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="group rounded-xl border border-transparent bg-muted/40 p-10 transition-all duration-500 hover:border-border/40 hover:bg-muted/60">
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-4 text-2xl font-bold tracking-tight-landing">
                100% Private
              </h3>
              <p className="mb-8 leading-relaxed text-muted-foreground">
                All exam data is processed locally in your browser — no accounts, no servers. Your content leaves your device only if you choose to open it in Overleaf.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                  <CheckCircle className="h-[18px] w-[18px] text-primary" />
                  No automatic uploads
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                  <CheckCircle className="h-[18px] w-[18px] text-primary" />
                  No server processing
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                  <CheckCircle className="h-[18px] w-[18px] text-primary" />
                  No account required
                </li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="group rounded-xl border border-transparent bg-muted/40 p-10 transition-all duration-500 hover:border-border/40 hover:bg-muted/60">
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-4 text-2xl font-bold tracking-tight-landing">
                Easy to Use
              </h3>
              <p className="mb-8 leading-relaxed text-muted-foreground">
                From LaTeX import to final export in minutes. Live preview allows you to see randomization results instantly.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                  <CheckCircle className="h-[18px] w-[18px] text-primary" />
                  Import LaTeX templates
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                  <CheckCircle className="h-[18px] w-[18px] text-primary" />
                  Instant preview
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                  <CheckCircle className="h-[18px] w-[18px] text-primary" />
                  Multiple export formats
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Regrade Companion Tool ── */}
      <section className="px-6 py-24">
        <div className="glow-card-wrapper mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-muted/60 p-8 md:p-12">
            {/* Decorative orb */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

            <div className="relative flex flex-col items-center gap-8 md:flex-row">
              {/* Icon */}
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-grow text-center md:text-left">
                <h3 className="mb-2 text-2xl font-bold tracking-tight-landing">
                  Already Graded Your Exam?
                </h3>
                <p className="text-lg leading-snug text-muted-foreground">
                  Discover our companion MCQ re-grading tool. Instantly audit results with comprehensive item analysis.
                </p>
              </div>

              {/* CTA */}
              <div className="flex-shrink-0">
                <a href="https://regrade.mshahrani.website/" target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    className="group h-12 gap-2 rounded-md border-primary/30 px-6 font-bold text-primary transition-all hover:bg-primary/10"
                  >
                    View Regrade Tool
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden px-6 py-40 text-center">
        {/* Background orb */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <h2 className="mb-8 text-4xl font-extrabold tracking-tighter-landing md:text-6xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-xl text-muted-foreground">
            Experience the new standard in academic exam preparation. Simple, fast, and entirely free.
          </p>
          <div className="space-y-6">
            <Link to="/app">
              <Button
                size="lg"
                className="h-16 rounded-md bg-gradient-to-r from-primary to-primary-glow px-14 text-xl font-black text-primary-foreground shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                Open App Now
              </Button>
            </Link>
            <p className="mono-label text-muted-foreground/60">
              Free to use. No account required.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/10 py-12 md:py-24">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row md:px-12">
          <div>
            <div className="mb-1 text-xl font-bold text-primary">Examazej</div>
            <p className="text-sm text-muted-foreground/50">Empowering educators since 2024.</p>
          </div>
          <div className="mono-label text-muted-foreground/50">
            &copy; {new Date().getFullYear()} Dr. Mohammed Alshahrani.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
