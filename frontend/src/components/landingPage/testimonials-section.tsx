"use client";

import { useAnimateOnScroll } from "@/hooks/landingPageHooks/use-animate-on-scroll";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "AutoShop Pro cut our invoicing time in half. We can focus on fixing cars instead of paperwork.",
    author: "Mike Rodriguez",
    role: "Owner, Mike's Auto Repair",
    rating: 5,
  },
  {
    quote:
      "The inventory tracking alone saved us thousands. We always know what parts we have and what we need.",
    author: "Sarah Chen",
    role: "Manager, Premier Auto Services",
    rating: 5,
  },
  {
    quote:
      "Finally a POS system that understands how workshops actually work. The support team is incredible too.",
    author: "James Thompson",
    role: "Owner, Thompson Garage",
    rating: 5,
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
            Testimonials
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by workshop owners
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div ref={gridRef} className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className={`group rounded-xl border border-border bg-card p-6 transition-all duration-700 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 ${
                gridVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-8 scale-95 opacity-0"
              }`}
              style={{
                transitionDelay: gridVisible ? `${index * 150}ms` : "0ms",
              }}
            >
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
                        ? `${index * 150 + i * 50}ms`
                        : "0ms",
                    }}
                  />
                ))}
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
      </div>
    </section>
  );
}
