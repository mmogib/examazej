import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Users, Clock, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-academic">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shuffle className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-white">ExamShuffler</h1>
          </div>
          <Link to="/auth">
            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
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
        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          Professional Exam Question
          <br />
          <span className="text-primary">Shuffling Platform</span>
        </h1>
        <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
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
          <h2 className="text-3xl font-bold text-white mb-4">
            Why Choose ExamShuffler?
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Built specifically for academic environments with security and fairness in mind.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <Shuffle className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Advanced Shuffling</CardTitle>
              <CardDescription className="text-white/70">
                Sophisticated algorithms ensure true randomization while maintaining exam integrity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Question order randomization
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Answer choice shuffling
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Seed-based reproducibility
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Secure Access</CardTitle>
              <CardDescription className="text-white/70">
                Role-based authentication with Airtable integration for user management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Authorized user verification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Time-based access control
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Status-based permissions
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <Clock className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Easy to Use</CardTitle>
              <CardDescription className="text-white/70">
                Streamlined workflow from exam upload to result generation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  LaTeX file import
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Instant preview
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Multiple format export
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="bg-white/5 border-white/10 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-white">Ready to Get Started?</CardTitle>
            <CardDescription className="text-white/70 text-lg">
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
            <p className="text-sm text-white/60 mt-4">
              Access requires authorized account. Contact administrator for approval.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-white/60">
          <p>&copy; 2024 ExamShuffler. Professional Academic Tool.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;