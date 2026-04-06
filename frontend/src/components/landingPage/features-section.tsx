"use client";

import { useAnimateOnScroll } from "@/hooks/landingPageHooks/use-animate-on-scroll";
import {
  ShoppingCart,
  Package,
  Users,
  ClipboardList,
  Receipt,
  Building2,
  Warehouse,
  Briefcase,
  FileText,
  Settings,
  Activity,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Point of Sale (POS)",
    description:
      "Complete checkout system with cart management, payment processing, and thermal printer-ready receipts (72mm optimized).",
  },
  {
    icon: Package,
    title: "Inventory Management",
    description:
      "Track products and stock levels in real-time across multiple warehouses. Centralized product database with supplier management.",
  },
  {
    icon: ClipboardList,
    title: "Job Cards",
    description:
      "Manage workshop jobs with service tracking and parts integration. Monitor status from check-in to completion.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Store customer information with credit tracking and vehicle service history. Build lasting relationships.",
  },
  {
    icon: Receipt,
    title: "Transaction History",
    description:
      "View all transactions, reprint receipts, and handle voids. Complete audit trail of all sales activities.",
  },
  {
    icon: Building2,
    title: "Multi-Branch Support",
    description:
      "Manage multiple locations from a single dashboard. Perfect for automotive chains with role-based access control.",
  },
  {
    icon: Warehouse,
    title: "Warehouse Management",
    description:
      "Track inventory across different storage locations. Optimize stock distribution and transfers between warehouses.",
  },
  {
    icon: Briefcase,
    title: "HR Management",
    description:
      "Employee management with shift scheduling, payroll tracking, and performance monitoring.",
  },
  {
    icon: FileText,
    title: "Reports & Analytics",
    description:
      "Comprehensive sales and inventory reports. Gain insights into revenue trends and popular services.",
  },
  {
    icon: Settings,
    title: "Company Settings",
    description:
      "Customize your brand with logo uploads, tax rates, currency preferences, and notification configurations.",
  },
  {
    icon: Activity,
    title: "Audit Logging",
    description:
      "Complete activity tracking for compliance and security. Monitor all key actions across the system.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Analytics",
    description:
      "Real-time overview of sales, jobs, and inventory metrics. Make data-driven decisions at a glance.",
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
        {/* Section Header - Left Aligned */}
        <div
          ref={headerRef}
          className={`transition-all duration-700 ${
            headerVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Complete Workshop Solution
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything your automotive business needs
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            AutoMotivee combines workshop management with integrated Point of Sale.
            From inventory to HR, manage your entire operation seamlessly.
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