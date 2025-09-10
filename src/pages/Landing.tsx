import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Users, Clock, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-sm bg-card/50">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shuffle className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">ExamShuffler</h1>
          </div>
          <Link to="/auth">
            <Button variant="outline" size="lg">
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
        <h1 className="text-6xl font-bold text-foreground mb-6 leading-tight">
          Professional Exam Question
          <br />
          <span className="text-primary">Shuffling Platform</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Create randomized, fair examinations with our advanced question shuffling system. 
          Perfect for educational institutions and certification programs.
        </p>
        <Link to="/auth">
          <Button size="lg" className="gap-3 px-12 py-6 text-xl h-auto font-semibold">
            Get Started
            <ArrowRight className="h-6 w-6" />
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Why Choose ExamShuffler?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built specifically for academic environments with security and fairness in mind.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <Shuffle className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Advanced Shuffling</CardTitle>
              <CardDescription className="text-base">
                Sophisticated algorithms ensure true randomization while maintaining exam integrity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-base">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Question order randomization
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Answer choice shuffling
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Seed-based reproducibility
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Secure Access</CardTitle>
              <CardDescription className="text-base">
                Role-based authentication with Airtable integration for user management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-base">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Authorized user verification
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Time-based access control
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Status-based permissions
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <Clock className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl">Easy to Use</CardTitle>
              <CardDescription className="text-base">
                Streamlined workflow from exam upload to result generation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-base">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  LaTeX file import
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Instant preview
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Multiple format export
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="bg-card border-border shadow-elegant max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl text-foreground mb-4">Ready to Get Started?</CardTitle>
            <CardDescription className="text-xl text-muted-foreground">
              Join academic institutions worldwide using ExamShuffler for fair, secure examinations.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/auth">
              <Button size="lg" className="gap-4 px-16 py-8 text-2xl h-auto font-semibold mb-6">
                Access Platform
                <Users className="h-6 w-6" />
              </Button>
            </Link>
            <p className="text-base text-muted-foreground">
              Access requires authorized account. Contact administrator for approval.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 ExamShuffler. Professional Academic Tool.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;