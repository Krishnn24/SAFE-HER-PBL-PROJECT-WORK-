import { 
  Smartphone, 
  MapPin, 
  Video, 
  Shield, 
  Bell, 
  Phone,
  Timer,
  Users
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Smartphone,
      title: "Shake Detection SOS",
      description: "Simply shake your phone to trigger an instant emergency alert. No fumbling required in stressful situations.",
      color: "from-primary to-accent",
    },
    {
      icon: MapPin,
      title: "Live Location Tracking",
      description: "Share your real-time location with trusted contacts and emergency services during an alert.",
      color: "from-accent to-primary",
    },
    {
      icon: Video,
      title: "Discreet Recording",
      description: "Automatically record audio and video during emergencies without alerting anyone around you.",
      color: "from-primary to-secondary",
    },
    {
      icon: Shield,
      title: "Nearest Police Station",
      description: "Instantly locate and navigate to the nearest police station with one-tap directions.",
      color: "from-secondary to-primary",
    },
    {
      icon: Bell,
      title: "Instant SOS Alerts",
      description: "Send emergency notifications to all your trusted contacts simultaneously with your location.",
      color: "from-accent to-secondary",
    },
    {
      icon: Phone,
      title: "Fake Call Feature",
      description: "Generate realistic fake calls to escape uncomfortable or dangerous situations discreetly.",
      color: "from-primary to-accent",
    },
    {
      icon: Timer,
      title: "Safety Timer",
      description: "Set a timer for your journey. If not deactivated, it automatically sends alerts to your contacts.",
      color: "from-secondary to-accent",
    },
    {
      icon: Users,
      title: "Emergency Contacts",
      description: "Easily manage and prioritize your trusted contacts for quick emergency notifications.",
      color: "from-accent to-primary",
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            User App Features
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Powerful Features for Your <span className="gradient-text">Safety</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our comprehensive suite of safety tools ensures you're protected in any situation. 
            Every feature is designed with real-world scenarios in mind.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-lg hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
