import { Heart, Shield, Zap, Lock } from "lucide-react";

const AboutSection = () => {
  const values = [
    {
      icon: Heart,
      title: "Empowering Safety",
      description: "We believe every woman deserves to feel safe and protected, anywhere and anytime.",
    },
    {
      icon: Zap,
      title: "Instant Response",
      description: "Real-time alerts and quick action when seconds matter the most.",
    },
    {
      icon: Lock,
      title: "Complete Privacy",
      description: "Your data is encrypted and secure. We prioritize your privacy above all.",
    },
    {
      icon: Shield,
      title: "Reliable Protection",
      description: "24/7 monitoring and support to ensure you're never alone in an emergency.",
    },
  ];

  return (
    <section id="about" className="py-20 lg:py-32 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="animate-slide-in-left">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              About SafeHer
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
              Your <span className="gradient-text">Guardian Angel</span> in Your Pocket
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              SafeHer was born from a simple yet powerful mission: to create a world where every woman 
              can walk freely, travel confidently, and live without fear. Our app combines cutting-edge 
              technology with intuitive design to provide comprehensive safety solutions.
            </p>
            <p className="text-muted-foreground mb-8">
              With features like shake detection, discreet recording, and instant SOS alerts, SafeHer 
              ensures help is always just a moment away. Our dedicated admin panel enables authorities 
              and guardians to respond swiftly to any emergency.
            </p>
            
            {/* Mission Statement */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <p className="text-foreground font-medium italic">
                "We're not just building an app; we're building a safer world for women everywhere."
              </p>
            </div>
          </div>

          {/* Right Content - Values Grid */}
          <div className="grid grid-cols-2 gap-4 lg:gap-6">
            {values.map((value, index) => (
              <div
                key={value.title}
                className={`p-6 rounded-2xl gradient-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  index === 1 || index === 2 ? "lg:translate-y-8" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
