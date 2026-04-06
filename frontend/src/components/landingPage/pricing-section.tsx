"use client";

import { useAnimateOnScroll } from "@/hooks/landingPageHooks/use-animate-on-scroll";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "49",
    description: "Perfect for small independent workshops.",
    features: [
      "Up to 3 users",
      "Basic POS & checkout",
      "Customer database with credit tracking",
      "Job card management (50 jobs/month)",
      "Basic inventory management",
      "Transaction history & receipts",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "99",
    description: "For growing workshops with higher demands.",
    features: [
      "Up to 15 users",
      "Full POS + cart management",
      "Unlimited job cards",
      "Complete inventory with warehouses",
      "Supplier & vendor management",
      "HR management (shifts & payroll)",
      "Reports & analytics dashboard",
      "Multi-branch support (up to 3 locations)",
      "Audit logging & activity tracking",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "299",
    description: "For large operations and multi-location chains.",
    features: [
      "Unlimited users",
      "Unlimited branches & warehouses",
      "Advanced permissions & RBAC",
      "Custom company branding (logo, tax, currency)",
      "Full API access & webhooks",
      "Dedicated account manager",
      "On-site training & setup",
      "Custom reporting & analytics",
      "99.9% SLA guarantee",
      "24/7 phone support",
    ],
    popular: false,
  },
];

export function PricingSection() {
  const { ref: headerRef, isVisible: headerVisible } =
    useAnimateOnScroll<HTMLDivElement>();
  const { ref: gridRef, isVisible: gridVisible } =
    useAnimateOnScroll<HTMLDivElement>({ threshold: 0.1 });

  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-secondary/20">
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
            Pricing
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Plans for every workshop size
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            From single-bay garages to multi-location chains. Get all the tools
            you need to run your automotive business efficiently.
          </p>
        </div>

        {/* Pricing Cards */}
        <div ref={gridRef} className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`group relative rounded-xl border p-6 transition-all duration-700 hover:shadow-xl sm:p-8 ${
                plan.popular
                  ? "border-primary bg-card shadow-lg shadow-primary/10 hover:shadow-primary/20"
                  : "border-border bg-card hover:border-primary/50 hover:shadow-primary/5"
              } ${
                gridVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-12 scale-95 opacity-0"
              }`}
              style={{
                transitionDelay: gridVisible ? `${index * 150}ms` : "0ms",
              }}
            >
              {plan.popular && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 transition-all duration-500 ${
                    gridVisible
                      ? "translate-y-0 opacity-100"
                      : "-translate-y-2 opacity-0"
                  }`}
                  style={{
                    transitionDelay: gridVisible
                      ? `${index * 150 + 200}ms`
                      : "0ms",
                  }}
                >
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-foreground transition-transform duration-300 group-hover:scale-105 inline-block">
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  billed annually • cancel anytime
                </p>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-3 transition-all duration-500 ${
                      gridVisible
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-4 opacity-0"
                    }`}
                    style={{
                      transitionDelay: gridVisible
                        ? `${index * 150 + featureIndex * 50}ms`
                        : "0ms",
                    }}
                  >
                    <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full transition-transform duration-200 hover:scale-105"
                variant={plan.popular ? "default" : "outline"}
                onClick={scrollToContact}
              >
                Contact Sales
              </Button>
              
              <p className="mt-3 text-center text-xs text-muted-foreground">
                No credit card required • 14-day free trial
              </p>
            </div>
          ))}
        </div>
        
        {/* Additional CTA for enterprise */}
        <div
          className={`mt-12 text-center transition-all duration-700 delay-300 ${
            gridVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <p className="text-sm text-muted-foreground">
            Need a custom plan for your automotive chain?{" "}
            <button
              onClick={scrollToContact}
              className="font-semibold text-primary hover:underline"
            >
              Contact our sales team
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}