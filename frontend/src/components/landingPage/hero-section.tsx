"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useEffect, useState } from "react";

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl transition-all duration-1000 ${
            isLoaded ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
        <div
          className={`absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl transition-all duration-1000 delay-300 ${
            isLoaded ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm transition-all duration-700 ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "-translate-y-4 opacity-0"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-muted-foreground">
              Trusted by 2,500+ workshops
            </span>
          </div>

          {/* Headline */}
          <h1
            className={`mt-6 text-balance text-4xl font-bold tracking-tight text-foreground transition-all duration-700 delay-100 sm:text-5xl md:text-6xl lg:text-7xl ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            The Complete POS
            <br />
            <span className="text-primary">for Auto Workshops</span>
          </h1>

          {/* Subheadline */}
          <p
            className={`mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground transition-all duration-700 delay-200 sm:text-xl ${
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
              className="gap-2 transition-transform duration-200 hover:scale-105"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 transition-transform duration-200 hover:scale-105"
            >
              <Play className="h-4 w-4" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div
            className={`mt-16 grid grid-cols-2 gap-4 transition-all duration-700 delay-500 sm:gap-8 md:grid-cols-4 ${
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
                className="group rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 sm:p-6"
                style={{
                  transitionDelay: isLoaded ? `${600 + index * 100}ms` : "0ms",
                }}
              >
                <div className="text-2xl font-bold text-primary transition-transform duration-300 group-hover:scale-110 sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
