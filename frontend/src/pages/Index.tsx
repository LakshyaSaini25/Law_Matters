import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Scale, 
  Briefcase, 
  FileText, 
  Calendar, 
  Shield, 
  Clock,
  Users,
  Zap,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Briefcase,
      title: "Matter Management",
      description: "Comprehensive case tracking with status, deadlines, and team assignments"
    },
    {
      icon: FileText,
      title: "Document Automation",
      description: "PDF bookmarking, OCR, search, and template-based document generation"
    },
    {
      icon: Calendar,
      title: "Court Calendar",
      description: "Hearing schedules, reminders, and automatic calendar synchronization"
    },
    {
      icon: Clock,
      title: "Time & Billing",
      description: "Track billable hours, generate invoices, and manage retainers"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Role-based access, 2FA, encryption, and comprehensive audit trails"
    },
    {
      icon: Users,
      title: "Client Portal",
      description: "Secure collaboration and document sharing with clients"
    }
  ];

  const benefits = [
    "Streamline case workflows",
    "Reduce administrative overhead",
    "Improve client communication",
    "Ensure compliance & security",
    "Track billable time accurately",
    "Access from anywhere, anytime"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                <Scale className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">LegalFlow</h1>
                <p className="text-xs text-muted-foreground">Case Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Professional Legal Practice Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Streamline Your Legal Practice with{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Intelligent Case Management
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Comprehensive platform for matter management, document automation, billing, and secure client collaboration. Built for modern law firms.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="gap-2 shadow-elegant" onClick={() => navigate("/auth")}>
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Run Your Practice
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed specifically for legal professionals
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card p-6 rounded-xl border border-border shadow-elegant hover-scale transition-smooth"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Legal Professionals Choose LegalFlow
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border"
              >
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-foreground font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-gradient-primary rounded-2xl p-12 shadow-glow">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Join law firms worldwide using LegalFlow to manage their cases more efficiently
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="gap-2">
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">LegalFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 LegalFlow. Professional Legal Case Management Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
