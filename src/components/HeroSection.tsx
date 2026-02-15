import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Play, Shield, Bell, MapPin } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden pt-24 lg:pt-32">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Your Safety, Our Priority</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight mb-6">
              <span className="text-foreground">Empowering</span>
              <br />
              <span className="gradient-text">Women's Safety</span>
              <br />
              <span className="text-foreground">Everywhere</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
              Instant SOS alerts, real-time location tracking, and discreet emergency recording. 
              Feel protected 24/7 with our comprehensive safety companion.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button variant="hero" size="xl">
                <Download className="w-5 h-5" />
                Download App
              </Button>
              <Button variant="heroOutline" size="xl">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-bold gradient-text">50K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-bold gradient-text">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-bold gradient-text">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Content - Phone Mockups */}
          <div className="relative flex justify-center lg:justify-end animate-slide-in-right">
            {/* Main Phone */}
            <div className="relative z-20">
              <div className="w-[280px] sm:w-[320px] h-[560px] sm:h-[640px] bg-secondary rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-card rounded-[2.5rem] overflow-hidden relative">
                  {/* Phone Content - User App */}
                  <div className="absolute inset-0 gradient-card p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-semibold text-foreground">SafeHer</span>
                      </div>
                      <Bell className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-32 h-32 rounded-full gradient-bg flex items-center justify-center mb-6 animate-pulse-glow">
                        <span className="text-3xl font-bold text-primary-foreground">SOS</span>
                      </div>
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        Shake your phone or tap to send emergency alert
                      </p>
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <MapPin className="w-4 h-4" />
                        <span>Location sharing active</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {["Contacts", "Record", "Police"].map((item) => (
                        <div key={item} className="bg-muted/50 rounded-xl p-3 text-center">
                          <span className="text-xs font-medium text-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Phone - Admin Dashboard */}
            <div className="absolute -left-16 sm:-left-20 top-20 z-10 hidden sm:block">
              <div className="w-[200px] sm:w-[240px] h-[400px] sm:h-[480px] bg-secondary/80 rounded-[2.5rem] p-2 shadow-xl opacity-90">
                <div className="w-full h-full bg-card rounded-[2rem] overflow-hidden relative">
                  <div className="absolute inset-0 p-4 flex flex-col">
                    <div className="text-xs font-semibold text-foreground mb-3">Admin Panel</div>
                    <div className="space-y-2">
                      <div className="bg-primary/10 rounded-lg p-2">
                        <div className="text-xs text-primary font-semibold">Active Alerts</div>
                        <div className="text-2xl font-bold text-foreground">12</div>
                      </div>
                      <div className="bg-muted rounded-lg p-2">
                        <div className="text-xs text-muted-foreground">Users Online</div>
                        <div className="text-lg font-bold text-foreground">2,847</div>
                      </div>
                      <div className="bg-muted rounded-lg p-2">
                        <div className="text-xs text-muted-foreground">Resolved Today</div>
                        <div className="text-lg font-bold text-foreground">45</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-sm text-muted-foreground">Scroll to explore</span>
        <ArrowRight className="w-5 h-5 rotate-90 text-primary" />
      </div>
    </section>
  );
};

export default HeroSection;
