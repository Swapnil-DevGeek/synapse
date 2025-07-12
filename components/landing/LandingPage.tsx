import { ArrowRight, Brain, FileText, BarChart3, Zap, Users, Shield, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { AnimatedGradientText } from './AnimatedGradientText';
import { ShimmerButton } from '../ui/shimmer-button';
import { RetroGrid } from './RetroGrid';
import { Meteors } from './Meteors';
import { TextReveal } from './TextReveal';
import { NumberTicker } from './NumberTicker';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Synapse
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/signup">
                <ShimmerButton className="dark:text-muted-foreground dark:hover:text-foreground dark:transition-colors">Get Started</ShimmerButton>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <RetroGrid />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <AnimatedGradientText>
                🚀 Introducing Synapse v2.0
              </AnimatedGradientText>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
              Synapse AI
              <br />
              <span className="relative">
                Your Second Brain
                <Meteors number={20} />
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Capture thoughts, organize ideas, and discover connections with AI-powered note-taking and task management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <ShimmerButton className="text-lg px-8 py-3 dark:text-muted-foreground dark:hover:text-foreground dark:transition-colors">
                  Start Building Your Brain
                  <ArrowRight className="ml-2 h-5 w-5" />
                </ShimmerButton>
              </Link>
              <Link href="#demo" className="text-lg px-8 py-3 border border-border rounded-lg hover:bg-accent transition-colors">
                Watch Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-accent/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                <NumberTicker value={50000} />+
              </div>
              <p className="text-muted-foreground">Active Users</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                <NumberTicker value={1000000} />+
              </div>
              <p className="text-muted-foreground">Notes Created</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                <NumberTicker value={99} />%
              </div>
              <p className="text-muted-foreground">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <TextReveal>Powerful Features for Modern Thinkers</TextReveal>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to capture, organize, and connect your ideas in one intelligent workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText className="h-8 w-8" />}
              title="Smart Note-Taking"
              description="Rich text editor with markdown support, backlinks, and AI-powered suggestions."
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Task Management"
              description="Organize tasks with subtasks, due dates, and priority levels. Never miss a deadline."
            />
            <FeatureCard
              icon={<Brain className="h-8 w-8" />}
              title="Knowledge Graph"
              description="Visualize connections between your notes and discover new insights automatically."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="AI Summarization"
              description="Get instant summaries of your notes and conversations with advanced AI."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Collaboration"
              description="Share notes and collaborate with team members in real-time."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Privacy First"
              description="Your data is encrypted and secure. You own your thoughts and ideas."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Build Your Second Brain?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who have transformed their productivity with Synapse.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <ShimmerButton className="text-lg px-8 py-3 dark:text-muted-foreground dark:hover:text-foreground dark:transition-colors">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </ShimmerButton>
            </Link>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Synapse</span>
            </div>
            <div className="flex space-x-6 text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
            <p>&copy; 2024 Synapse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="relative group p-6 bg-card rounded-lg border hover:shadow-lg transition-all duration-300">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
} 