"use client";

import { useAnimateOnScroll } from "@/hooks/landingPageHooks/use-animate-on-scroll";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "49",
    description: "Perfect for small shops just getting started.",
    features: [
      "Up to 2 users",
      "Basic invoicing",
      "Customer database",
      "100 service orders/month",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "99",
    description: "For growing workshops with more demands.",
    features: [
      "Up to 10 users",
      "Advanced invoicing",
      "Inventory management",
      "Unlimited service orders",
      "Analytics dashboard",
      "Priority support",
      "API access",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "199",
    description: "For large operations and multi-location shops.",
    features: [
      "Unlimited users",
      "Multi-location support",
      "Custom integrations",
      "Dedicated account manager",
      "On-site training",
      "Custom reporting",
      "SLA guarantee",
    ],
    popular: false,
  },
];

export function PricingSection() {
  const { ref: headerRef, isVisible: headerVisible } =
    useAnimateOnScroll<HTMLDivElement>();
  const { ref: gridRef, isVisible: gridVisible } =
    useAnimateOnScroll<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id="pricing" className="py-16 sm:py-24">
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
            Pricing
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            No hidden fees. No long-term contracts. Start with a 14-day free
            trial on any plan.
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
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={feature}
                    className={`flex items-center gap-3 transition-all duration-500 ${
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
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full transition-transform duration-200 hover:scale-105"
                variant={plan.popular ? "default" : "outline"}
              >
                Start Free Trial
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
