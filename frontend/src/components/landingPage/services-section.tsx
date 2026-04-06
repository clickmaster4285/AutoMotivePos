"use client";

import { useAnimateOnScroll } from "@/hooks/landingPageHooks/use-animate-on-scroll";
import { Check, Wrench, ClipboardList, Clock, TrendingUp, Calendar, Users, AlertCircle } from "lucide-react";

const services = [
  {
    icon: ClipboardList,
    name: "Job Card Management",
    description: "Create and track service orders from check-in to completion with real-time status updates",
  },
  {
    icon: Wrench,
    name: "Service & Parts Integration",
    description: "Combine services with parts inventory for accurate job costing and billing",
  },
  {
    icon: Clock,
    name: "Labor Tracking",
    description: "Track technician hours, estimate labor times, and optimize workflow",
  },
  {
    icon: TrendingUp,
    name: "Status Monitoring",
    description: "Monitor job progress: pending, in-progress, completed, or ready for pickup",
  },
  {
    icon: Calendar,
    name: "Service Scheduling",
    description: "Manage appointments and reduce no-shows with automated reminders",
  },
  {
    icon: Users,
    name: "Vehicle History",
    description: "Store complete service records for each customer vehicle",
  },
];

const benefits = [
  "Complete job lifecycle tracking from check-in to completion",
  "Seamless integration with inventory for parts usage",
  "Customer credit tracking and payment history",
  "Multi-branch support for workshop chains",
  "Digital service records for each vehicle",
  "Real-time status updates for customers",
  "Automated receipt generation (thermal printer ready)",
  "Audit logging for compliance and security",
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
              Workshop Management
            </p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Complete job card & service tracking
            </h2>
            <p className="mt-4 text-muted-foreground">
              AutoMotivee's Job Card system lets you manage every aspect of workshop operations. 
              Track services, parts, labor, and customer history - all from one integrated platform.
            </p>

            {/* Benefits List */}
            <ul className="mt-8 space-y-3">
              {benefits.map((benefit, index) => (
                <li
                  key={benefit}
                  className={`flex items-start gap-3 transition-all duration-500 ${
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
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
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
                <h3 className="mt-3 font-semibold text-foreground text-sm sm:text-base">
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