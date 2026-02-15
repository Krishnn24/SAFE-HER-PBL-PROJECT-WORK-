import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "College Student",
      avatar: "SM",
      rating: 5,
      text: "SafeHer has given me the confidence to walk home late from the library. Knowing my mom can track me in real-time gives us both peace of mind.",
    },
    {
      name: "Emily Rodriguez",
      role: "Night Shift Nurse",
      avatar: "ER",
      rating: 5,
      text: "Working late nights, I always felt vulnerable. The shake detection feature is brilliant - I can trigger an alert without even looking at my phone.",
    },
    {
      name: "Jessica Chen",
      role: "Solo Traveler",
      avatar: "JC",
      rating: 5,
      text: "I travel alone frequently, and SafeHer is my constant companion. The safety timer feature is perfect for solo hikes and explorations.",
    },
    {
      name: "Amanda Williams",
      role: "Working Professional",
      avatar: "AW",
      rating: 5,
      text: "The fake call feature has helped me exit uncomfortable situations so many times. This app is a must-have for every woman.",
    },
    {
      name: "Lisa Thompson",
      role: "Mother of Two",
      avatar: "LT",
      rating: 5,
      text: "I feel so much better knowing my daughters have SafeHer on their phones. The instant location sharing has been invaluable.",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            Testimonials
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Stories of <span className="gradient-text">Safety & Confidence</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Hear from women who have made SafeHer their trusted safety companion.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial Card */}
          <div className="relative bg-card rounded-3xl border border-border p-8 lg:p-12 shadow-lg overflow-hidden">
            {/* Quote Icon */}
            <div className="absolute top-8 right-8 opacity-10">
              <Quote className="w-24 h-24 text-primary" />
            </div>

            <div className="relative z-10">
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-xl lg:text-2xl text-foreground leading-relaxed mb-8">
                "{testimonials[currentIndex].text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-semibold text-lg">
                  {testimonials[currentIndex].avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-lg">
                    {testimonials[currentIndex].name}
                  </div>
                  <div className="text-muted-foreground">
                    {testimonials[currentIndex].role}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={goToPrevious}
              className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            
            {/* Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-8 bg-primary"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
