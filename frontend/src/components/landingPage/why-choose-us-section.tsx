"use client";

import { useAnimateOnScroll } from "@/hooks/landingPageHooks/use-animate-on-scroll";
import {
  Rocket,
  HeadphonesIcon,
  Lock,
  TrendingUp,
  Wrench,
  Globe,
} from "lucide-react";

const reasons = [
  {
    icon: Rocket,
    title: "Quick Setup",
    description:
      "Get up and running in under 30 minutes. No complex installation or IT team required.",
    stat: "30 min",
    statLabel: "Average setup time",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description:
      "Our dedicated support team is always available to help you resolve any issues.",
    stat: "< 2 min",
    statLabel: "Average response time",
  },
  {
    icon: Lock,
    title: "Bank-Level Security",
    description:
      "Your data is encrypted and protected with the same security standards used by banks.",
    stat: "256-bit",
    statLabel: "SSL encryption",
  },
  {
    icon: TrendingUp,
    title: "Proven Results",
    description:
      "Our customers report significant improvements in efficiency and revenue growth.",
    stat: "32%",
    statLabel: "Avg. revenue increase",
  },
  {
    icon: Wrench,
    title: "Built for Automotive",
    description:
      "Designed specifically for workshops, not a generic POS adapted for mechanics.",
    stat: "100%",
    statLabel: "Industry-focused",
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    description:
      "Cloud-based system accessible from any device, anywhere. Perfect for multi-location shops.",
    stat: "99.9%",
    statLabel: "Uptime guarantee",
  },
];

export function WhyChooseUsSection() {
  const { ref: headerRef, isVisible: headerVisible } =
    useAnimateOnScroll<HTMLDivElement>();
  const { ref: gridRef, isVisible: gridVisible } =
    useAnimateOnScroll<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center transition-all duration-700 ${
            headerVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Why Choose Us
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The smart choice for modern workshops
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            We&apos;ve helped thousands of automotive businesses streamline
            their operations. Here&apos;s why they chose us.
          </p>
        </div>

        {/* Reasons Grid */}
        <div
          ref={gridRef}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {reasons.map((reason, index) => (
            <div
              key={reason.title}
              className={`group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-700 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 ${
                gridVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-12 opacity-0"
              }`}
              style={{
                transitionDelay: gridVisible ? `${index * 100}ms` : "0ms",
              }}
            >
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                <reason.icon className="h-6 w-6 text-primary" />
              </div>

              {/* Content */}
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {reason.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {reason.description}
              </p>

              {/* Stat */}
              <div className="mt-4 flex items-baseline gap-2 border-t border-border pt-4">
                <span className="text-2xl font-bold text-primary">
                  {reason.stat}
                </span>
                <span className="text-xs text-muted-foreground">
                  {reason.statLabel}
                </span>
              </div>

              {/* Hover gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
