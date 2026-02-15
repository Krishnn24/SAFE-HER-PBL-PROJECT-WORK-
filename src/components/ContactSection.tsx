import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Validation schema with length limits and proper format validation
const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(1000, "Message must be less than 1000 characters"),
  isDemo: z.boolean(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    message: "",
    isDemo: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const result = contactSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ContactFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }
    
    // Clear errors on successful validation
    setErrors({});
    
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({ name: "", email: "", message: "", isDemo: false });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      value: "safehersos112@gmail.com",
      link: "mailto:safehersos112@gmail.com",
    },
    {
      icon: Phone,
      title: "Call Us",
      value: "+91 7982903405   +91 9821229449",
      link: "tel:+917982903405",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      value: "Janakpuri New Delhi 110058",
      link: "#",
    },
  ];

  return (
    <section id="contact" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Content */}
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              Contact Us
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
              Get in <span className="gradient-text">Touch</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Have questions about SafeHer? Want to learn more about our enterprise solutions 
              or request a demo of our admin panel? We'd love to hear from you.
            </p>

            {/* Contact Info Cards */}
            <div className="space-y-4 mb-8">
              {contactInfo.map((info) => (
                <a
                  key={info.title}
                  href={info.link}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <info.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{info.title}</div>
                    <div className="font-semibold text-foreground">{info.value}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>

            {/* Request Demo CTA */}
            <div className="p-6 rounded-2xl gradient-bg text-primary-foreground">
              <h3 className="text-xl font-semibold mb-2">Request Admin Panel Demo</h3>
              <p className="text-primary-foreground/80 mb-4">
                See how SafeHer's powerful admin dashboard can help your organization respond to emergencies faster.
              </p>
              <Button
                variant="secondary"
                className="bg-card text-foreground hover:bg-card/90"
                onClick={() => setFormData({ ...formData, isDemo: true })}
              >
                Schedule Demo
              </Button>
            </div>
          </div>

          {/* Right Content - Contact Form */}
          <div className="bg-card rounded-3xl border border-border p-8 lg:p-10">
            <h3 className="text-2xl font-semibold text-foreground mb-6">
              {formData.isDemo ? "Request a Demo" : "Send us a Message"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  maxLength={100}
                  className={`h-12 rounded-xl bg-background border-border focus:border-primary ${errors.name ? 'border-destructive' : ''}`}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  maxLength={255}
                  className={`h-12 rounded-xl bg-background border-border focus:border-primary ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  {formData.isDemo ? "Tell us about your organization" : "Message"}
                </label>
                <Textarea
                  id="message"
                  placeholder={formData.isDemo ? "Organization name, size, and what you're looking for..." : "How can we help you?"}
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    if (errors.message) setErrors({ ...errors, message: undefined });
                  }}
                  maxLength={1000}
                  rows={5}
                  className={`rounded-xl bg-background border-border focus:border-primary resize-none ${errors.message ? 'border-destructive' : ''}`}
                />
                {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                <p className="text-xs text-muted-foreground mt-1">{formData.message.length}/1000 characters</p>
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full">
                <Send className="w-5 h-5" />
                {formData.isDemo ? "Request Demo" : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
