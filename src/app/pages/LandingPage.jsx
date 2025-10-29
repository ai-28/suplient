"use client"
import { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { ArrowRight, CheckCircle, Users, Shield, Clock, MessageSquare, Calendar, Heart, Star, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Import images
const headerImage = "/assets/header-image.webp";
const ceoImage = "/assets/ceo-image.webp";
const gridLeftImage = "/assets/grid-left.webp";
const gridRight1Image = "/assets/grid-right-1.webp";
const gridRight2Image = "/assets/grid-right-2.webp";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState({
    hero: false,
    problem: false,
    solution: false,
    features: false,
    cta: false
  });
  const router = useRouter();
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '50px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionName = entry.target.getAttribute('data-section');
          if (sectionName) {
            setIsVisible(prev => ({ ...prev, [sectionName]: true }));
          }
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  // Companies that trust us (better company data)
  const trustedCompanies = [
    { name: "Wellness Corp", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='40' viewBox='0 0 120 40'%3E%3Crect width='120' height='40' fill='%23E5E7EB'/%3E%3Ctext x='60' y='25' text-anchor='middle' fill='%236B7280' font-family='Arial,sans-serif' font-size='12' font-weight='600'%3EWellness Corp%3C/text%3E%3C/svg%3E" },
    { name: "MindCare", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='40' viewBox='0 0 120 40'%3E%3Crect width='120' height='40' fill='%23E5E7EB'/%3E%3Ctext x='60' y='25' text-anchor='middle' fill='%236B7280' font-family='Arial,sans-serif' font-size='12' font-weight='600'%3EMindCare%3C/text%3E%3C/svg%3E" },
    { name: "Health Solutions", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='40' viewBox='0 0 120 40'%3E%3Crect width='120' height='40' fill='%23E5E7EB'/%3E%3Ctext x='60' y='25' text-anchor='middle' fill='%236B7280' font-family='Arial,sans-serif' font-size='12' font-weight='600'%3EHealth Solutions%3C/text%3E%3C/svg%3E" },
    { name: "TherapyPlus", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='40' viewBox='0 0 120 40'%3E%3Crect width='120' height='40' fill='%23E5E7EB'/%3E%3Ctext x='60' y='25' text-anchor='middle' fill='%236B7280' font-family='Arial,sans-serif' font-size='12' font-weight='600'%3ETherapyPlus%3C/text%3E%3C/svg%3E" },
    { name: "MentalWell", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='40' viewBox='0 0 120 40'%3E%3Crect width='120' height='40' fill='%23E5E7EB'/%3E%3Ctext x='60' y='25' text-anchor='middle' fill='%236B7280' font-family='Arial,sans-serif' font-size='12' font-weight='600'%3EMentalWell%3C/text%3E%3C/svg%3E" },
    { name: "LifeCare Pro", logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='40' viewBox='0 0 120 40'%3E%3Crect width='120' height='40' fill='%23E5E7EB'/%3E%3Ctext x='60' y='25' text-anchor='middle' fill='%236B7280' font-family='Arial,sans-serif' font-size='12' font-weight='600'%3ELifeCare Pro%3C/text%3E%3C/svg%3E" }
  ];

  return (
    <div className="min-h-screen">
      {/* Clean Modern Header */}
      <nav className="relative z-50 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <img 
                src="/assets/logo.png" 
                alt="MindWell Logo" 
                className="h-10 w-auto"
              />
              <div className="hidden md:flex items-center space-x-6 text-black">
                <a href="#pricing" className="hover:text-black/80 transition-colors font-medium">Pricing</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-black hover:text-black/80 transition-colors font-medium" onClick={() => router.push('/login')}>Login</button>
              <Button className="bg-primary hover:bg-primary/90 text-white font-medium">
                Sign up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Clean Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white z-20">
        <div 
          data-section="hero" 
          className={`relative z-10 container mx-auto px-4 py-24 transition-all duration-1000 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                Transform 1000s of lives with{' '}
                <span className="text-primary">personalized mental health coaching</span>{' '}
                without burning out.
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                AI-powered coaching platform that scales your impact while maintaining the personal touch your clients need.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-medium">
                  Sign up now
                </Button>
                <p className="text-gray-500 text-sm flex items-center">
                  ✨ Free 14-day trial, no credit card required
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
                <img 
                  src={headerImage} 
                  alt="Mental Health Platform Demo" 
                  className="w-full h-auto rounded-2xl"
                />
                <div className="absolute -bottom-4 -right-4 bg-primary rounded-full p-3 shadow-lg">
                  <div className="text-xs text-center text-white">
                    <div className="text-sm font-bold">✨ We use MindWell</div>
                    <div className="text-primary-foreground/90">to scale our practice!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section 
        data-section="problem" 
        className={`py-24 bg-gray-50 z-20 relative transition-all duration-1000 ${isVisible.problem ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8">The Problem</h2>
            <h3 className="text-2xl lg:text-3xl font-medium text-gray-600 mb-8 max-w-4xl mx-auto">
              You're tired of the traditional therapy model limiting your impact.
            </h3>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center p-8 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">You can never scale enough</h4>
                <p className="text-gray-600 leading-relaxed">
                  1-on-1 sessions limit how many people you can help, creating a bottleneck in your practice.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">Something always goes wrong</h4>
                <p className="text-gray-600 leading-relaxed">
                  Client cancellations, no-shows, and scheduling conflicts disrupt your workflow and income.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">You feel burnt out and wish you</h4>
                <p className="text-gray-600 leading-relaxed">
                  could be working on something more impactful and rewarding than repetitive sessions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section 
        data-section="solution" 
        className={`py-20 bg-white z-20 relative transition-all duration-1000 ${isVisible.solution ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl text-primary font-semibold mb-4">The Solution</h2>
            <h3 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-8">
              Turn your expertise into an AI-powered coaching platform that{' '}
              <span className="text-primary underline decoration-primary/30">scales better</span>{' '}
              than traditional therapy.
            </h3>
          </div>
          
          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">5X</div>
              <div className="text-lg text-gray-800 font-medium">client capacity</div>
              <div className="text-gray-600">vs traditional 1-on-1 sessions</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">90%</div>
              <div className="text-lg text-gray-800 font-medium">satisfaction rates</div>
              <div className="text-gray-600">from personalized AI coaching</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">3X</div>
              <div className="text-lg text-gray-800 font-medium">revenue growth</div>
              <div className="text-gray-600">through scalable programs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* Fixed Background Container */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${gridRight2Image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      <section 
        data-section="features" 
        className={`relative py-24 min-h-screen transition-all duration-1000 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        {/* Light Overlay */}
        <div className="absolute inset-0 bg-black/10" />
        
        {/* Content Overlay */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8 drop-shadow-lg">
              What makes MindWell so powerful
            </h2>
          </div>

          <div className="space-y-24">
            {/* Feature 1 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
                  <img 
                    src={gridLeftImage} 
                    alt="AI-Powered Chat Interface" 
                    className="w-full h-auto rounded-xl shadow-lg"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-white drop-shadow-lg">AI-Powered Personalized Chat</h3>
                <p className="text-xl text-white/90 leading-relaxed drop-shadow">
                  Create personalized coaching experiences with AI that learns from your methodology. 
                  Each client gets tailored support based on their unique needs and progress.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">AI-Powered</Badge>
                  <Badge variant="secondary">Personalized</Badge>
                  <Badge variant="secondary">Tailored Support</Badge>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6 lg:order-1">
                <h3 className="text-3xl font-bold text-white drop-shadow-lg">Smart Program Builder</h3>
                <p className="text-xl text-white/90 leading-relaxed drop-shadow">
                  Transform your coaching methods into scalable programs with interactive exercises, 
                  progress tracking, and automated check-ins that maintain your personal touch.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Scalable Programs</Badge>
                  <Badge variant="secondary">Interactive Exercises</Badge>
                  <Badge variant="secondary">Progress Tracking</Badge>
                </div>
              </div>
              <div className="relative lg:order-2">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
                  <img 
                    src={gridRight1Image} 
                    alt="Program Builder Interface" 
                    className="w-full h-auto rounded-xl shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-white drop-shadow-lg">Flexible Client Management</h3>
                <p className="text-xl text-white/90 leading-relaxed drop-shadow">
                  Manage hundreds of clients efficiently with automated progress tracking, 
                  smart scheduling, and intervention alerts when clients need your direct attention.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Automated Progress Tracking</Badge>
                  <Badge variant="secondary">Smart Scheduling</Badge>
                  <Badge variant="secondary">Intervention Alerts</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white z-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8">Choose Your Plan</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Scale your mental health practice with our flexible partnership plans
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Silver Partner */}
            <Card className="relative p-8 bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <Badge variant="outline" className="text-gray-600">Basic Plan</Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">SILVER PARTNER</h3>
                  <p className="text-gray-600 mb-6">
                    For coaches who want to try our platform with basic support
                  </p>
                  <div className="text-4xl font-bold text-gray-900 mb-2">$4,900</div>
                  <div className="text-gray-600 mb-6">PER MONTH</div>
                </div>
                
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                    Access to Supplier platform
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                    Unlimited clients
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                    Name, phone, email, notes
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                    Web & Mobile app
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                    Calendar - Set available times
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                    Sales guide for therapists
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                    Email support
                  </li>
                </ul>

                <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 text-lg font-medium mt-8">
                  LEARN MORE
                </Button>
                
                <div className="text-center text-sm text-gray-500 mt-4">
                  3000,- setup fee<br/>
                  3 month commitment
                </div>
              </CardContent>
            </Card>

            {/* Gold Partner - Recommended */}
            <Card className="relative p-8 bg-white border-2 border-yellow-400 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-yellow-400 text-black px-6 py-2 rounded-full text-sm font-bold">
                  RECOMMENDED
                </div>
              </div>
              
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Most Popular</Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">GOLD PARTNER</h3>
                  <p className="text-gray-600 mb-6">
                    Our tailored coaching services are designed based on insights and experience from hundreds of therapists and coaches
                  </p>
                  <div className="text-4xl font-bold text-yellow-600 mb-2">$7,900</div>
                  <div className="text-gray-600 mb-6">PER MONTH</div>
                </div>
                
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
                    Includes everything from Silver
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
                    Advertising strategy with you
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
                    We develop campaigns and ads
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
                    Monitoring & Optimization
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
                    Sales coaching 1:1
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
                    Dedicated phone number for SMS & calls
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
                    Communicate with clients via platform
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
                    Phone support
                  </li>
                </ul>

                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 text-lg font-medium mt-8">
                  LEARN MORE
                </Button>
                
                <div className="text-center text-sm text-gray-500 mt-4">
                  4000,- setup fee<br/>
                  3 month commitment
                </div>
              </CardContent>
            </Card>

            {/* Diamond Partner */}
            <Card className="relative p-8 bg-white border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <Badge variant="outline" className="text-purple-600 border-purple-300">Premium Plan</Badge>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">DIAMOND PARTNER</h3>
                  <p className="text-gray-600 mb-6">
                    For coaches who want to be covered, so you can focus on your clients
                  </p>
                  <div className="text-4xl font-bold text-purple-600 mb-2">$14,900</div>
                  <div className="text-gray-600 mb-6">PER MONTH</div>
                </div>
                
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                    Includes everything from Silver & Gold
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                    Booking of conversations with clients
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                    Collect payments and send invoices
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                    Setup of Landing page
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                    Setup of Funnel
                  </li>
                </ul>

                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-medium mt-8">
                  LEARN MORE
                </Button>
                
                <div className="text-center text-sm text-gray-500 mt-4">
                  5000,- setup fee<br/>
                  3 month commitment
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section 
        data-section="cta" 
        className={`py-24 bg-gray-50 transition-all duration-1000 ${isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Transform your practice.{' '}
              <span className="text-primary">Scale your impact.</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Join thousands of mental health professionals who have revolutionized their practice 
              with AI-powered coaching that maintains the human connection.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-medium">
                Start your free trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-gray-500">No credit card required • 14-day free trial</p>
            </div>
            
            {/* Trial Progress Indicator */}
            <div className="max-w-md mx-auto mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Trial Progress</span>
                <span className="text-sm text-gray-500">Day 1 of 14</span>
              </div>
              <Progress value={7} className="h-2" />
              <p className="text-xs text-gray-500 mt-2 text-center">✨ Start your journey today!</p>
            </div>

            {/* Features List */}
            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-900">Free 14-day trial</h4>
                <p className="text-gray-600">Start transforming your practice today</p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-800">HIPAA Compliant</h4>
                <p className="text-gray-600">Enterprise-grade security & privacy</p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-gray-800">Expert Support</h4>
                <p className="text-gray-600">Dedicated onboarding & training</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
