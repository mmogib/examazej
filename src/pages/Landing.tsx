import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Users, Clock, Shield, CheckCircle, ArrowRight, LogIn, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
const Landing = () => {
  return <div className="relative min-h-screen bg-gradient-academic">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="absolute inset-0 bg-dot-grid" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-card/60 backdrop-blur-xl supports-[backdrop-filter]:bg-card/50">
        <div className="container flex items-center justify-between px-4 py-5">
          <Link to="/" className="group inline-flex items-center gap-2">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
              <Shuffle className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight group-hover:opacity-90">ExamShuffler</h1>
          </Link>
          <Link to="/auth">
            <Button variant="secondary" size="lg" className="group h-10 gap-2 rounded-xl border border-border/60 bg-card/60 text-foreground/90 shadow-card ring-1 ring-transparent transition hover:bg-primary hover:text-primary-foreground hover:ring-primary/30 hover:shadow-elegant py-[16px] px-[32px] text-lg">
              <LogIn className="h-4 w-4 opacity-80 transition-transform group-hover:translate-x-0.5" />
              <span>Sign In</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="container px-4 py-24 text-center">
          <Badge variant="secondary" className="mb-5 text-lg px-6 py-2">Academic Tool</Badge>
          <h1 className="mx-auto max-w-4xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
            Fair, Secure, Modern Exam Shuffling
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Generate randomized, reproducible exam variants in seconds. Built for universities and certification programs.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="group h-12 gap-3 rounded-xl px-8 text-base font-semibold shadow-elegant ring-1 ring-primary/20">
                Get Started
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <a href="#features" className="text-sm font-medium text-foreground/80 underline-offset-8 hover:text-foreground hover:underline">
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container px-4 py-20">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Choose ExamShuffler?</h2>
          <p className="mt-3 text-lg text-muted-foreground">Purpose-built for academic integrity, security, and ease of use.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/80 shadow-card transition hover:shadow-elegant">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-primary opacity-10 blur-2xl transition group-hover:opacity-20" />
            <CardHeader>
              <Shuffle className="mb-4 h-11 w-11 text-primary" />
              <CardTitle className="text-lg">Advanced Shuffling</CardTitle>
              <CardDescription className="text-base">Randomization with integrity and seed-based reproducibility.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-base">
                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Question order shuffle</li>
                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Answer choice shuffle</li>
                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Deterministic seeds</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/80 shadow-card transition hover:shadow-elegant">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-primary opacity-10 blur-2xl transition group-hover:opacity-20" />
            <CardHeader>
              <Shield className="mb-4 h-11 w-11 text-primary" />
              <CardTitle className="text-lg">Secure Access</CardTitle>
              <CardDescription className="text-base">Supabase auth with role-aware access controls.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-base">
                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Authorized users only</li>
                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Time-based access</li>
                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Status permissions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/80 shadow-card transition hover:shadow-elegant">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-primary opacity-10 blur-2xl transition group-hover:opacity-20" />
            <CardHeader>
              <Clock className="mb-4 h-11 w-11 text-primary" />
              <CardTitle className="text-lg">Easy to Use</CardTitle>
              <CardDescription className="text-base">From LaTeX import to final export.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-base">
                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Import LaTeX</li>
                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Instant preview</li>
                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Multiple formats</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Regrade Tool Section */}
      <section className="container px-4 py-16">
        <div className="relative mx-auto max-w-4xl">
          <Card className="group relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5 shadow-elegant transition hover:shadow-2xl hover:border-primary/60">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-primary opacity-30 blur-3xl transition group-hover:opacity-40" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-r from-secondary to-primary opacity-20 blur-3xl" />

            <CardHeader className="relative pb-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <BarChart3 className="h-8 w-8" />
              </div>
              <CardTitle className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Already Graded Your Exam?
              </CardTitle>
              <CardDescription className="mt-3 text-lg text-foreground/80">
                Complete your exam workflow with our companion tool for MCQ re-grading and comprehensive item analysis.
              </CardDescription>
            </CardHeader>

            <CardContent className="relative text-center">
              <div className="mb-6 grid gap-3 sm:grid-cols-2 text-left mx-auto max-w-2xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-base text-foreground/90">Re-grade MCQ exams efficiently</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-base text-foreground/90">Perform detailed item analysis</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-base text-foreground/90">Process results from grading center</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-base text-foreground/90">100% client-side processing</span>
                </div>
              </div>

              <a href="https://regrade.mshahrani.website/" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="group h-14 gap-3 rounded-xl px-10 text-lg font-semibold shadow-elegant ring-2 ring-primary/30 hover:ring-primary/50">
                  Go to Regrade Tool
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>

              <p className="mt-4 text-sm text-muted-foreground">
                Analyze results after receiving them from KFUPM ITC grading center
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 pb-24 text-center">
        <Card className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-elegant">
          <CardHeader>
            <CardTitle className="text-3xl sm:text-4xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg">Join institutions using ExamShuffler for fair, secure examinations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth">
              <Button size="lg" className="mb-4 h-12 gap-3 rounded-xl px-10 text-lg font-semibold">
                Access Platform
                <Users className="h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">Access requires an authorized account. Contact your administrator.</p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/40 py-8">
        <div className="container px-4 text-center text-muted-foreground">
          <p>&copy; 2024 ExamShuffler. Professional Academic Tool.</p>
        </div>
      </footer>
    </div>;
};
export default Landing;