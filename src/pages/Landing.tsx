import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Users, Clock, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-primary-foreground/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shuffle className="h-8 w-8 text-primary-foreground" />
            <h1 className="text-2xl font-bold text-primary-foreground">ExamShuffler</h1>
          </div>
          <Link to="/auth">
            <Button variant="outline" className="text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          Academic Tool
        </Badge>
        <h1 className="text-5xl font-bold text-primary-foreground mb-6 leading-tight">
          Professional Exam Question
          <br />
          <span className="text-accent">Shuffling Platform</span>
        </h1>
        <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
          Create randomized, fair examinations with our advanced question shuffling system. 
          Perfect for educational institutions and certification programs.
        </p>
        <Link to="/auth">
          <Button size="lg" className="gap-2">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Why Choose ExamShuffler?
          </h2>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">
            Built specifically for academic environments with security and fairness in mind.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground">
            <CardHeader>
              <Shuffle className="h-12 w-12 text-accent mb-4" />
              <CardTitle>Advanced Shuffling</CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Sophisticated algorithms ensure true randomization while maintaining exam integrity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Question order randomization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Answer choice shuffling
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Seed-based reproducibility
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground">
            <CardHeader>
              <Shield className="h-12 w-12 text-accent mb-4" />
              <CardTitle>Secure Access</CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Role-based authentication with Airtable integration for user management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Authorized user verification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Time-based access control
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Status-based permissions
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground">
            <CardHeader>
              <Clock className="h-12 w-12 text-accent mb-4" />
              <CardTitle>Easy to Use</CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Streamlined workflow from exam upload to result generation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  LaTeX file import
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Instant preview
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Multiple format export
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="bg-primary-foreground/5 border-primary-foreground/10 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-primary-foreground">Ready to Get Started?</CardTitle>
            <CardDescription className="text-primary-foreground/70 text-lg">
              Join academic institutions worldwide using ExamShuffler for fair, secure examinations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Access Platform
                <Users className="h-4 w-4" />
              </Button>
            </Link>
            <p className="text-sm text-primary-foreground/60 mt-4">
              Access requires authorized account. Contact administrator for approval.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary-foreground/10 py-8">
        <div className="container mx-auto px-4 text-center text-primary-foreground/60">
          <p>&copy; 2024 ExamShuffler. Professional Academic Tool.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;