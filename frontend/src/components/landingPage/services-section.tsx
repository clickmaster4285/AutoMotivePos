"use client";

import { useAnimateOnScroll } from "@/hooks/landingPageHooks/use-animate-on-scroll";
import { Check, Cog, Car, Gauge, Droplets, Zap, Shield } from "lucide-react";

const services = [
  {
    icon: Cog,
    name: "General Repairs",
    description: "Engine diagnostics, brake service, suspension work",
  },
  {
    icon: Car,
    name: "Body Work",
    description: "Dent repair, paint touch-ups, collision restoration",
  },
  {
    icon: Gauge,
    name: "Diagnostics",
    description: "Computer scanning, performance tuning, error codes",
  },
  {
    icon: Droplets,
    name: "Fluid Services",
    description: "Oil changes, coolant flush, transmission fluid",
  },
  {
    icon: Zap,
    name: "Electrical",
    description: "Battery, alternator, starter, wiring repairs",
  },
  {
    icon: Shield,
    name: "Maintenance",
    description: "Scheduled services, inspections, tire rotation",
  },
];

const benefits = [
  "Track all service types in one system",
  "Customizable service categories",
  "Labor time estimation tools",
  "Parts catalog integration",
  "Service history for each vehicle",
  "Warranty tracking and alerts",
];

export function ServicesSection() {
  const { ref: contentRef, isVisible: contentVisible } =
    useAnimateOnScroll<HTMLDivElement>();
  const { ref: gridRef, isVisible: gridVisible } =
    useAnimateOnScroll<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section
      id="services"
      className="border-y border-border bg-secondary/30 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Content */}
          <div
            ref={contentRef}
            className={`transition-all duration-700 ${
              contentVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-12 opacity-0"
            }`}
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Services
            </p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built for every type of automotive service
            </h2>
            <p className="mt-4 text-muted-foreground">
              Whether you specialize in one area or offer full-service repairs,
              our POS adapts to your workflow with customizable service
              categories and pricing.
            </p>

            {/* Benefits List */}
            <ul className="mt-8 space-y-3">
              {benefits.map((benefit, index) => (
                <li
                  key={benefit}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    contentVisible
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-4 opacity-0"
                  }`}
                  style={{
                    transitionDelay: contentVisible
                      ? `${300 + index * 100}ms`
                      : "0ms",
                  }}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column - Service Cards Grid */}
          <div ref={gridRef} className="grid grid-cols-2 gap-4 sm:gap-6">
            {services.map((service, index) => (
              <div
                key={service.name}
                className={`group rounded-xl border border-border bg-card p-4 transition-all duration-700 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 ${
                  gridVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
                style={{
                  transitionDelay: gridVisible ? `${index * 100}ms` : "0ms",
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                  <service.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-3 font-semibold text-foreground">
                  {service.name}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
