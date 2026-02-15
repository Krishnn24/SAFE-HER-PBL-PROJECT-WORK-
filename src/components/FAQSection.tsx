import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "How does the shake detection SOS feature work?",
      answer: "When enabled, the app uses your phone's accelerometer to detect a specific shaking pattern. Once detected, it automatically triggers an SOS alert, sending your location and emergency message to all your designated contacts and optionally to nearby emergency services.",
    },
    {
      question: "What happens when an SOS alert is triggered?",
      answer: "When an SOS is triggered, the app immediately sends your real-time GPS location to your emergency contacts via SMS and app notification. It also starts discreet audio/video recording, locates the nearest police station, and maintains a live tracking session until you manually deactivate it.",
    },
    {
      question: "How does real-time location sharing work?",
      answer: "Once an emergency is triggered, your phone continuously transmits your GPS coordinates to our secure servers. Your trusted contacts receive a unique link to view your live location on a map. The tracking continues until you safely deactivate the alert or reach a safe location.",
    },
    {
      question: "Who can access the admin panel?",
      answer: "The admin panel is exclusively available to authorized personnel such as designated family guardians, organizational safety officers, and verified law enforcement agencies. Access requires proper authentication and is logged for accountability.",
    },
    {
      question: "Is my personal data and recordings secure?",
      answer: "Absolutely. All data is encrypted end-to-end using AES-256 encryption. Recordings are stored on secure, GDPR-compliant servers and are only accessible by you and your designated contacts. We never sell or share your data with third parties.",
    },
    {
      question: "Does the app work without internet connection?",
      answer: "The app can send SMS-based SOS alerts even without internet. However, features like live location tracking and cloud recording backup require an active data connection. Offline recordings are automatically synced when connection is restored.",
    },
    {
      question: "How do I add or manage emergency contacts?",
      answer: "You can easily manage your emergency contacts in the app settings. Simply tap 'Emergency Contacts', add contacts from your phone book, and prioritize them. You can add up to 5 primary contacts who will receive instant alerts during emergencies.",
    },
  ];

  return (
    <section id="faq" className="py-20 lg:py-32 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            FAQ
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Got questions? We've got answers. Find everything you need to know about SafeHer.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background rounded-2xl border border-border px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-left text-foreground font-semibold py-6 hover:text-primary transition-colors [&[data-state=open]]:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
