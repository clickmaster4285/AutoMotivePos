"use client";

import { useAnimateOnScroll } from "@/hooks/landingPageHooks/use-animate-on-scroll";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const { ref: sectionRef, isVisible } = useAnimateOnScroll<HTMLDivElement>();

  return (
    <section id="contact" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          ref={sectionRef}
          className={`relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-16 transition-all duration-1000 sm:px-12 sm:py-20 ${
            isVisible
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-12 scale-95 opacity-0"
          }`}
        >
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className={`absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl transition-all duration-1000 ${
                isVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"
              }`}
            />
            <div
              className={`absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl transition-all duration-1000 delay-200 ${
                isVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"
              }`}
            />
          </div>

          <div className="relative text-center">
            <h2
              className={`text-balance text-3xl font-bold tracking-tight text-foreground transition-all duration-700 delay-100 sm:text-4xl ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              Ready to transform your workshop?
            </h2>
            <p
              className={`mx-auto mt-4 max-w-xl text-muted-foreground transition-all duration-700 delay-200 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              Join thousands of automotive professionals who have streamlined
              their operations with AutoShop Pro. Start your free trial today.
            </p>

            <div
              className={`mt-8 flex flex-col items-center justify-center gap-4 transition-all duration-700 delay-300 sm:flex-row ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              <Button
                size="lg"
                className="gap-2 transition-transform duration-200 hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="transition-transform duration-200 hover:scale-105"
              >
                Schedule a Demo
              </Button>
            </div>

            <p
              className={`mt-6 text-sm text-muted-foreground transition-all duration-700 delay-500 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              No credit card required. 14-day free trial.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
