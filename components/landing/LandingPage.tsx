"use client";

import { ArrowRight, Brain, FileText, BarChart3, Zap, Users, Shield, CheckCircle, Lightbulb, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { AnimatedGradientText } from './AnimatedGradientText';
import { ShimmerButton } from '../ui/shimmer-button';
import { RetroGrid } from './RetroGrid';
import { Meteors } from './Meteors';
import { TextReveal } from './TextReveal';
import { NumberTicker } from './NumberTicker';
import { BlurFade } from '../ui/blur-fade';
import { AnimatedBeam } from '../ui/animated-beam';
import { BorderBeam } from '../ui/border-beam';
import { MagicCard } from '../ui/magic-card';
import { Particles } from '../ui/particles';
import { forwardRef, useRef } from 'react';

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={`z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:bg-gray-800 dark:border-gray-600 ${className || ''}`}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-background relative">
      <Particles
        className="absolute inset-0 z-0"
        quantity={50}
        ease={80}
        color="#60A5FA"
        refresh
      />
      
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
                <ShimmerButton className="relative dark:text-muted-foreground dark:hover:text-foreground">
                  Get Started
                  <BorderBeam size={40} duration={12} delay={9} />
                </ShimmerButton>
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
            <BlurFade delay={0.25} inView>
              <div className="mb-4">
                <AnimatedGradientText>
                  🚀 Introducing Synapse v2.0
                </AnimatedGradientText>
              </div>
            </BlurFade>
            
            <BlurFade delay={0.5} inView>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
                Synapse AI
                <br />
                <span className="relative">
                  Your Second Brain
                  <Meteors number={20} />
                </span>
              </h1>
            </BlurFade>
            
            <BlurFade delay={0.75} inView>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Capture thoughts, organize ideas, and discover connections with AI-powered note-taking and task management.
              </p>
            </BlurFade>
            
            <BlurFade delay={1} inView>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signup">
                  <ShimmerButton className="text-lg px-8 py-3 relative dark:text-muted-foreground dark:hover:text-foreground">
                    Start Building Your Brain
                    <ArrowRight className="ml-2 h-5 w-5" />
                    <BorderBeam size={60} duration={8} />
                  </ShimmerButton>
                </Link>

              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Connection Animation Section */}
      <section className="py-20 bg-accent/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <BlurFade delay={0.25} inView>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                Connect Everything
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                See how Synapse connects your thoughts, tasks, and knowledge into a unified intelligent system.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.5} inView>
            <div
              className="relative flex h-[250px] w-full items-center justify-center overflow-hidden rounded-lg"
              ref={containerRef}
            >
              <div className="flex size-full max-w-lg flex-row items-stretch justify-between gap-10">
                <div className="flex flex-col justify-center gap-4">
                  <Circle ref={div1Ref}>
                    <FileText className="h-6 w-6 text-blue-500" />
                  </Circle>
                  <Circle ref={div2Ref}>
                    <BarChart3 className="h-6 w-6 text-green-500" />
                  </Circle>
                  <Circle ref={div3Ref}>
                    <BookOpen className="h-6 w-6 text-purple-500" />
                  </Circle>
                </div>
                <div className="flex flex-col justify-center">
                  <Circle ref={div4Ref} className="size-16">
                    <Brain className="h-8 w-8 text-primary" />
                  </Circle>
                </div>
                <div className="flex flex-col justify-center">
                  <Circle ref={div5Ref}>
                    <Lightbulb className="h-6 w-6 text-yellow-500" />
                  </Circle>
                </div>
              </div>

              <AnimatedBeam
                containerRef={containerRef}
                fromRef={div1Ref}
                toRef={div4Ref}
                curvature={-20}
                gradientStartColor="#3B82F6"
                gradientStopColor="#8B5CF6"
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={div2Ref}
                toRef={div4Ref}
                gradientStartColor="#10B981"
                gradientStopColor="#8B5CF6"
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={div3Ref}
                toRef={div4Ref}
                curvature={20}
                gradientStartColor="#8B5CF6"
                gradientStopColor="#F59E0B"
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={div4Ref}
                toRef={div5Ref}
                reverse
                gradientStartColor="#F59E0B"
                gradientStopColor="#EF4444"
              />
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-accent/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <BlurFade delay={0.25} inView>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  <NumberTicker value={50000} />+
                </div>
                <p className="text-muted-foreground">Active Users</p>
              </div>
            </BlurFade>
            <BlurFade delay={0.5} inView>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  <NumberTicker value={1000000} />+
                </div>
                <p className="text-muted-foreground">Notes Created</p>
              </div>
            </BlurFade>
            <BlurFade delay={0.75} inView>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  <NumberTicker value={99} />%
                </div>
                <p className="text-muted-foreground">Satisfaction Rate</p>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <BlurFade delay={0.25} inView>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                <TextReveal>Powerful Features for Modern Thinkers</TextReveal>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to capture, organize, and connect your ideas in one intelligent workspace.
              </p>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BlurFade delay={0.25} inView>
              <MagicCard className="p-6 h-full">
                <FeatureCard
                  icon={<FileText className="h-8 w-8" />}
                  title="Smart Note-Taking"
                  description="Rich text editor with markdown support, backlinks, and AI-powered suggestions."
                />
              </MagicCard>
            </BlurFade>
            
            <BlurFade delay={0.5} inView>
              <MagicCard className="p-6 h-full">
                <FeatureCard
                  icon={<BarChart3 className="h-8 w-8" />}
                  title="Task Management"
                  description="Organize tasks with subtasks, due dates, and priority levels. Never miss a deadline."
                />
              </MagicCard>
            </BlurFade>
            
            <BlurFade delay={0.75} inView>
              <MagicCard className="p-6 h-full">
                <FeatureCard
                  icon={<Brain className="h-8 w-8" />}
                  title="Knowledge Graph"
                  description="Visualize connections between your notes and discover new insights automatically."
                />
              </MagicCard>
            </BlurFade>
            
            <BlurFade delay={1} inView>
              <MagicCard className="p-6 h-full">
                <FeatureCard
                  icon={<Zap className="h-8 w-8" />}
                  title="AI Summarization"
                  description="Get instant summaries of your notes and conversations with advanced AI."
                />
              </MagicCard>
            </BlurFade>
            
            <BlurFade delay={1.25} inView>
              <MagicCard className="p-6 h-full">
                <FeatureCard
                  icon={<Users className="h-8 w-8" />}
                  title="Collaboration"
                  description="Share notes and collaborate with team members in real-time."
                />
              </MagicCard>
            </BlurFade>
            
            <BlurFade delay={1.5} inView>
              <MagicCard className="p-6 h-full">
                <FeatureCard
                  icon={<Shield className="h-8 w-8" />}
                  title="Privacy First"
                  description="Your data is encrypted and secure. You own your thoughts and ideas."
                />
              </MagicCard>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <BlurFade delay={0.25} inView>
            <h2 className="text-4xl font-bold mb-4">Ready to Build Your Second Brain?</h2>
          </BlurFade>
          <BlurFade delay={0.5} inView>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of users who have transformed their productivity with Synapse.
            </p>
          </BlurFade>
          <BlurFade delay={0.75} inView>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <ShimmerButton className="text-lg px-8 py-3 relative dark:text-muted-foreground dark:hover:text-foreground">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                  <BorderBeam size={50} duration={10} />
                </ShimmerButton>
              </Link>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
            </div>
          </BlurFade>
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
    <div className="relative group h-full">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
} 