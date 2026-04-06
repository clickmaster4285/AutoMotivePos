"use client";

import { useAnimateOnScroll } from "@/hooks/landingPageHooks/use-animate-on-scroll";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "AutoMotivee completely transformed our workshop. The job card system and inventory tracking integration saved us countless hours. Now we know exactly what parts we have and what we need.",
    author: "Mike Rodriguez",
    role: "Owner, Mike's Auto Repair",
    rating: 5,
    feature: "Job Cards + Inventory",
  },
  {
    quote:
      "Managing multiple branches was a headache until we found AutoMotivee. The multi-branch support and warehouse management let us track everything from one dashboard.",
    author: "Sarah Chen",
    role: "Operations Manager, Premier Auto Services",
    rating: 5,
    feature: "Multi-Branch",
  },
  {
    quote:
      "The POS system with thermal receipt printing is perfect for our shop. Customers love the professional receipts, and we love how easy it is to track transactions and reprint when needed.",
    author: "James Thompson",
    role: "Owner, Thompson Garage",
    rating: 5,
    feature: "POS + Receipts",
  },
  {
    quote:
      "HR management and payroll tracking used to take hours every week. Now it's automated. The shift scheduling feature alone is worth the investment.",
    author: "David Kim",
    role: "General Manager, Kim's Auto Center",
    rating: 5,
    feature: "HR & Payroll",
  },
  {
    quote:
      "The audit logging gives me peace of mind. I can see exactly who did what in the system. Plus, the role-based permissions mean my staff only sees what they need.",
    author: "Lisa Martinez",
    role: "Owner, Martinez Motors",
    rating: 5,
    feature: "Security & Audit",
  },
  {
    quote:
      "From job cards to customer credit tracking, this system does it all. Our service history for each vehicle helps us provide better customer service and build lasting relationships.",
    author: "Tom Wilson",
    role: "Service Manager, Wilson's Garage",
    rating: 5,
    feature: "Customer Management",
  },
];

export function TestimonialsSection() {
  const { ref: headerRef, isVisible: headerVisible } =
    useAnimateOnScroll<HTMLDivElement>();
  const { ref: gridRef, isVisible: gridVisible } =
    useAnimateOnScroll<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section className="border-y border-border bg-secondary/30 py-16 sm:py-24">
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
            Testimonials
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by workshop owners
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Join hundreds of automotive businesses that have streamlined their operations with AutoMotivee.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div ref={gridRef} className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className={`group relative rounded-xl border border-border bg-card p-6 transition-all duration-700 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 ${
                gridVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-8 scale-95 opacity-0"
              }`}
              style={{
                transitionDelay: gridVisible ? `${index * 100}ms` : "0ms",
              }}
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10">
                <Quote className="h-8 w-8 text-primary" />
              </div>

              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 fill-primary text-primary transition-all duration-300 ${
                      gridVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    }`}
                    style={{
                      transitionDelay: gridVisible
                        ? `${index * 100 + i * 50}ms`
                        : "0ms",
                    }}
                  />
                ))}
              </div>

              {/* Feature Badge */}
              <div className="mt-2">
                <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {testimonial.feature}
                </span>
              </div>

              {/* Quote */}
              <blockquote className="mt-4 text-sm leading-relaxed text-foreground">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="mt-4 border-t border-border pt-4">
                <p className="font-medium text-foreground">
                  {testimonial.author}
                </p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicator */}
        <div
          className={`mt-12 text-center transition-all duration-700 delay-300 ${
            gridVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <p className="text-sm text-muted-foreground">
            ⭐⭐⭐⭐⭐ <span className="font-semibold text-foreground">4.9/5</span> average rating from 500+ workshops
          </p>
        </div>
      </div>
    </section>
  );
}