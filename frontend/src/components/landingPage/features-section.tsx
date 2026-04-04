"use client";

import { useAnimateOnScroll } from "@/hooks/landingPageHooks/use-animate-on-scroll";
import {
  FileText,
  Package,
  Users,
  ClipboardList,
  BarChart3,
  Clock,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Smart Invoicing",
    description:
      "Generate professional invoices in seconds with automatic parts pricing and labor calculations.",
  },
  {
    icon: Package,
    title: "Inventory Management",
    description:
      "Track parts and supplies in real-time. Get alerts when stock runs low and automate reordering.",
  },
  {
    icon: Users,
    title: "Customer Database",
    description:
      "Store customer info, vehicle history, and service records. Build lasting relationships.",
  },
  {
    icon: ClipboardList,
    title: "Work Order Tracking",
    description:
      "Create and manage service orders from check-in to completion with status updates.",
  },
  {
    icon: BarChart3,
    title: "Business Analytics",
    description:
      "Gain insights with detailed reports on revenue, popular services, and technician performance.",
  },
  {
    icon: Clock,
    title: "Appointment Scheduling",
    description:
      "Let customers book online. Manage your shop calendar and reduce no-shows with reminders.",
  },
];

export function FeaturesSection() {
  const { ref: headerRef, isVisible: headerVisible } =
    useAnimateOnScroll<HTMLDivElement>();
  const { ref: gridRef, isVisible: gridVisible } =
    useAnimateOnScroll<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section id="features" className="py-16 sm:py-24">
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
            Features
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything your workshop needs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From the front desk to the shop floor, our POS system covers every
            aspect of running a successful automotive business.
          </p>
        </div>

        {/* Features Grid */}
        <div
          ref={gridRef}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group rounded-xl border border-border bg-card p-6 transition-all duration-700 hover:border-primary/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 ${
                gridVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-12 opacity-0"
              }`}
              style={{
                transitionDelay: gridVisible ? `${index * 100}ms` : "0ms",
              }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
