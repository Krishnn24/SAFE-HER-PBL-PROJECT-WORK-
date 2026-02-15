import { Shield, Lock, Eye, Server, Key, CheckCircle } from "lucide-react";

const SecuritySection = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All your data is encrypted from the moment it leaves your device until it reaches its destination.",
    },
    {
      icon: Eye,
      title: "Discreet Operation",
      description: "The app operates silently in emergencies, recording and alerting without drawing attention.",
    },
    {
      icon: Server,
      title: "Secure Cloud Storage",
      description: "Your recordings and data are stored on enterprise-grade secure servers with redundancy.",
    },
    {
      icon: Key,
      title: "Private Access",
      description: "Only you and your designated contacts can access your emergency data and recordings.",
    },
  ];

  const certifications = [
    "GDPR Compliant",
    "ISO 27001",
    "SOC 2 Type II",
    "256-bit SSL",
  ];

  return (
    <section id="security" className="py-20 lg:py-32 bg-card relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content - Shield Visual */}
          <div className="relative flex justify-center lg:justify-start">
            <div className="relative">
              {/* Glowing Shield */}
              <div className="w-64 h-72 lg:w-80 lg:h-96 relative">
                <div className="absolute inset-0 gradient-bg rounded-[3rem] transform rotate-3 opacity-20 blur-2xl" />
                <div className="absolute inset-0 gradient-bg rounded-[3rem] flex items-center justify-center shadow-glow">
                  <Shield className="w-24 h-24 lg:w-32 lg:h-32 text-primary-foreground" />
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-card rounded-2xl shadow-lg flex items-center justify-center animate-float">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-card rounded-2xl shadow-lg flex items-center justify-center animate-float-delayed">
                  <Key className="w-8 h-8 text-accent" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              Security & Privacy
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
              Your Safety Data is <span className="gradient-text">Protected</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We understand the sensitive nature of safety data. That's why we've implemented 
              military-grade security measures to protect every piece of information you share with us.
            </p>

            {/* Security Features */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {securityFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Certifications */}
            <div className="p-6 rounded-2xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Certifications & Compliance</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {certifications.map((cert) => (
                  <span
                    key={cert}
                    className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
