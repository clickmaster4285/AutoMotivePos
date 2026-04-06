"use client";

import { useAnimateOnScroll } from "@/hooks/landingPageHooks/use-animate-on-scroll";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Zap, 
  Users, 
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

// Counter Component
function Counter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentCount = Math.floor(progress * target);
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, target, duration]);

  return (
    <div ref={elementRef} className="text-3xl font-bold sm:text-4xl">
      {count}{suffix}
    </div>
  );
}

const values = [
  {
    icon: Shield,
    title: "Security First",
    description: "JWT authentication, role-based permissions, and complete audit logging to keep your business data safe.",
  },
  {
    icon: Zap,
    title: "Built for Speed",
    description: "React + Vite frontend with Node.js backend ensures fast, responsive performance for your daily operations.",
  },
  {
    icon: Users,
    title: "User-Centric Design",
    description: "Intuitive interface designed for workshop owners, mechanics, and cashiers alike.",
  },
  {
    icon: TrendingUp,
    title: "Growth Focused",
    description: "From single-branch shops to multi-location chains, our platform scales with your business.",
  },
];

const milestones = [
  {
    year: "2020",
    title: "Founded",
    description: "AutoMotivee started with a mission to modernize automotive workshop management.",
  },
  {
    year: "2021",
    title: "First Release",
    description: "Launched POS + Inventory management for small workshops.",
  },
  {
    year: "2022",
    title: "Multi-Branch",
    description: "Added support for chains with warehouses and branch management.",
  },
  {
    year: "2023",
    title: "HR & Analytics",
    description: "Introduced employee management, payroll, and advanced reporting.",
  },
  {
    year: "2024",
    title: "Enterprise Ready",
    description: "Full RBAC, audit logging, and API access for large operations.",
  },
];

export function AboutSection() {
  const { ref: headerRef, isVisible: headerVisible } =
    useAnimateOnScroll<HTMLDivElement>();
  const { ref: contentRef, isVisible: contentVisible } =
    useAnimateOnScroll<HTMLDivElement>({ threshold: 0.05 });
  const { ref: statsRef, isVisible: statsVisible } =
    useAnimateOnScroll<HTMLDivElement>({ threshold: 0.1 });
  const { ref: valuesRef, isVisible: valuesVisible } =
    useAnimateOnScroll<HTMLDivElement>({ threshold: 0.05 });
  const { ref: timelineRef, isVisible: timelineVisible } =
    useAnimateOnScroll<HTMLDivElement>({ threshold: 0.05 });

  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="about" className="py-16 sm:py-24 bg-secondary/20">
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
            About Us
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Powering automotive workshops worldwide
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            AutoMotivee combines workshop management with integrated Point of Sale.
            We're on a mission to help automotive businesses run more efficiently.
          </p>
        </div>

        {/* Stats Grid - Left Aligned Text with Glowing Counters */}
        <div
          ref={statsRef}
          className={`mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 transition-all duration-700 ${
            statsVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <div className="group text-left transition-all duration-500 hover:scale-105">
            <div className="text-3xl font-bold text-primary sm:text-4xl [text-shadow:0_0_10px_rgba(34,197,94,0.5),0_0_20px_rgba(34,197,94,0.3)] group-hover:[text-shadow:0_0_15px_rgba(34,197,94,0.7),0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300">
              <Counter target={500} suffix="+" duration={2000} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Workshops Trust Us</div>
          </div>
          <div className="group text-left transition-all duration-500 hover:scale-105">
            <div className="text-3xl font-bold text-primary sm:text-4xl [text-shadow:0_0_10px_rgba(34,197,94,0.5),0_0_20px_rgba(34,197,94,0.3)] group-hover:[text-shadow:0_0_15px_rgba(34,197,94,0.7),0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300">
              <Counter target={50} suffix="K+" duration={2000} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Jobs Completed</div>
          </div>
          <div className="group text-left transition-all duration-500 hover:scale-105">
            <div className="text-3xl font-bold text-primary sm:text-4xl [text-shadow:0_0_10px_rgba(34,197,94,0.5),0_0_20px_rgba(34,197,94,0.3)] group-hover:[text-shadow:0_0_15px_rgba(34,197,94,0.7),0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300">
              <Counter target={98} suffix="%" duration={1500} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Customer Satisfaction</div>
          </div>
          <div className="group text-left transition-all duration-500 hover:scale-105">
            <div className="text-3xl font-bold text-primary sm:text-4xl [text-shadow:0_0_10px_rgba(34,197,94,0.5),0_0_20px_rgba(34,197,94,0.3)] group-hover:[text-shadow:0_0_15px_rgba(34,197,94,0.7),0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300">
              <Counter target={24} suffix="/7" duration={1000} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Support Available</div>
          </div>
        </div>

        {/* Main Content */}
        <div
          ref={contentRef}
          className={`mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16 transition-all duration-700 ${
            contentVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          {/* Left Column - Story */}
          <div>
            <h3 className="text-2xl font-semibold text-foreground">
              Our Story
            </h3>
          <div className="mt-4 space-y-4 text-muted-foreground">
  <p>
    AutoMotivee was founded by a team of automotive industry experts and software engineers who truly understand the challenges workshop owners face every day. We noticed a gap: most POS systems were either too basic to meet real needs or too complex and expensive for small businesses.
  </p>
  <p>
    Today, AutoMotivee is a complete, all-in-one platform that helps workshops run smoothly from managing job cards and inventory to HR and multi-branch operations. Workshops of all sizes, from independent garages to multi-location chains, trust us to keep their business moving.
  </p>
  <p>
    Built with modern technology like React, Node.js, and MongoDB, and backed by enterprise-grade security including JWT authentication, audit logging, and role-based access control, we give you the tools to grow your automotive business with confidence.
  </p>
</div>
          </div>

          {/* Right Column - Tech Stack */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-2xl font-semibold text-foreground">
              Built for the future
            </h3>
            <p className="mt-2 text-muted-foreground">
              Modern tech stack that scales with your business
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-sm font-semibold text-foreground">Frontend</div>
                <div className="text-xs text-muted-foreground">React 18 + TypeScript</div>
                <div className="text-xs text-muted-foreground">TailwindCSS + shadcn/ui</div>
                <div className="text-xs text-muted-foreground">TanStack Query</div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="text-sm font-semibold text-foreground">Backend</div>
                <div className="text-xs text-muted-foreground">Node.js + Express</div>
                <div className="text-xs text-muted-foreground">MongoDB + Mongoose</div>
                <div className="text-xs text-muted-foreground">JWT + RBAC</div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">POS Ready</span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Multi-Branch</span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Audit Logging</span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Warehouse Mgmt</span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">HR & Payroll</span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">API Access</span>
            </div>
          </div>
        </div>

        {/* Values Section - Left Aligned Title */}
        <div
          ref={valuesRef}
          className={`mt-16 transition-all duration-700 ${
            valuesVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <h3 className="text-left text-2xl font-semibold text-foreground">
            Our Core Values
          </h3>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="rounded-xl border border-border bg-card p-6 text-left transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                style={{
                  transitionDelay: valuesVisible ? `${index * 100}ms` : "0ms",
                }}
              >
                <div className="flex justify-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h4 className="mt-4 font-semibold text-foreground">
                  {value.title}
                </h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline / Milestones - Left Aligned Title */}
        <div
          ref={timelineRef}
          className={`mt-16 transition-all duration-700 ${
            timelineVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <h3 className="text-left text-2xl font-semibold text-foreground">
            Our Journey
          </h3>
          <div className="mt-8">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 h-full w-0.5 bg-primary/20 lg:left-1/2 lg:-translate-x-px" />
              
              {/* Timeline items */}
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.year}
                    className={`relative flex flex-col gap-4 ${
                      index % 2 === 0
                        ? "lg:flex-row"
                        : "lg:flex-row-reverse"
                    }`}
                    style={{
                      transitionDelay: timelineVisible ? `${index * 100}ms` : "0ms",
                    }}
                  >
                    <div className="flex-1 lg:w-1/2">
                      <div className={`rounded-lg border border-border bg-card p-4 ${
                        index % 2 === 0 ? "lg:mr-8" : "lg:ml-8"
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-sm font-bold text-primary">
                              {milestone.year.slice(-2)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {milestone.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {milestone.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="hidden lg:block lg:w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA - Contact Sales */}
        <div
          className={`mt-16 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 text-center transition-all duration-700 ${
            timelineVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <UserCheck className="mx-auto h-10 w-10 text-primary" />
          <h3 className="mt-4 text-xl font-semibold text-foreground">
            Ready to transform your workshop?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Join hundreds of workshops using AutoMotivee to streamline their operations.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={scrollToContact}>
              Contact Sales
            </Button>
            <Button size="lg" variant="outline" onClick={scrollToContact}>
              Request Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}