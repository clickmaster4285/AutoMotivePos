"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const scrollToNextSection = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2072&auto=format&fit=crop')",
          }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
      </div>

      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className={`absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl transition-all duration-1000 ${
            isLoaded ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
        <div
          className={`absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-primary/15 blur-3xl transition-all duration-1000 delay-300 ${
            isLoaded ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
        <div
          className={`absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl transition-all duration-1000 delay-500 ${
            isLoaded ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm transition-all duration-700 ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "-translate-y-4 opacity-0"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-white/90">
              Trusted by 2,500+ workshops
            </span>
          </div>

          {/* Headline */}
          <h1
            className={`mt-6 text-balance text-4xl font-bold tracking-tight text-white transition-all duration-700 delay-100 sm:text-5xl md:text-6xl lg:text-7xl ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            The Complete POS
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              for Auto Workshops
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className={`mx-auto mt-6 max-w-2xl text-pretty text-lg text-white/80 transition-all duration-700 delay-200 sm:text-xl ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            Manage invoices, inventory, customers, and service orders all in one
            powerful platform. Built specifically for mechanics and workshop
            owners.
          </p>

          {/* CTA Buttons */}
          <div
            className={`mt-10 flex flex-col items-center justify-center gap-4 transition-all duration-700 delay-300 sm:flex-row ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <Button
              size="lg"
              className="gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:scale-105 hover:bg-primary/90"
            >
              Contact Us
              <ArrowRight className="h-4 w-4" />
            </Button>
            
          </div>

          {/* Stats */}
          <div
            className={`mt-16 grid grid-cols-2 gap-4 transition-all duration-700 delay-500 sm:gap-6 md:grid-cols-4 ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            }`}
          >
            {[
              { value: "2,500+", label: "Active Workshops" },
              { value: "98%", label: "Customer Satisfaction" },
              { value: "45%", label: "Time Saved on Admin" },
              { value: "24/7", label: "Support Available" },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="group rounded-xl   p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover: hover:shadow-2xl hover:shadow-primary/20 sm:p-6"
                style={{
                  transitionDelay: isLoaded ? `${600 + index * 100}ms` : "0ms",
                }}
              >
               <div className="text-2xl font-bold text-primary transition-all duration-300 group-hover:scale-110 sm:text-3xl [text-shadow:0_0_10px_rgba(255,255,255,0.5),0_0_20px_rgba(255,255,255,0.3)]">
  {stat.value}
</div>
                <div className="mt-1 text-sm text-white/70">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className={`absolute bottom-8 left-1/2 z-20 -translate-x-1/2 cursor-pointer transition-all duration-700 delay-700 ${
          isLoaded
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0"
        }`}
        onClick={scrollToNextSection}
      >
        <div className="flex flex-col items-center gap-2 text-white/60 transition-all duration-300 hover:text-white/90">
          <span className="text-xs uppercase tracking-wider">Scroll</span>
          <div className="animate-bounce rounded-full   p-2 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/20">
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </div>
    </section>
  );
}