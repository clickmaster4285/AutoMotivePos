"use client";

import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ChevronDown, 
  Send, 
  CheckCircle2,
  User,
  Mail,
  Phone,
  Building,
  MessageSquare,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";

interface FormData {
  name: string;
  email: string;
  message: string;
  company: string;
  phone: string;
  services: string;
}

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
    company: "",
    phone: "",
    services: "",
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const scrollToNextSection = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        message: "",
        company: "",
        phone: "",
        services: "",
      });

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputClasses =
    "w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300 text-white placeholder:text-white/50";

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2072&auto=format&fit=crop')",
          }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
      </div>

      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className={`absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl transition-all duration-1000 ${
            isLoaded ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
        <div
          className={`absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-primary/15 blur-3xl transition-all duration-1000 delay-300 ${
            isLoaded ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
        <div
          className={`absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl transition-all duration-1000 delay-500 ${
            isLoaded ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Hero Content */}
            <div>
              {/* Badge - Left Aligned */}
              <div
                className={`inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm transition-all duration-700 ${
                  isLoaded
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-4 opacity-0"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-white/90">
                  Trusted by 500+ workshops
                </span>
              </div>

              {/* Headline - Left Aligned */}
              <h1
                className={`mt-6 text-balance text-4xl font-bold tracking-tight text-white transition-all duration-700 delay-100 sm:text-5xl md:text-6xl lg:text-7xl ${
                  isLoaded
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
              >
                The Complete Workshop
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Management + POS System
                </span>
              </h1>

              {/* Subheadline - Left Aligned */}
              <p
                className={`mt-6 max-w-2xl text-pretty text-lg text-white/80 transition-all duration-700 delay-200 sm:text-xl ${
                  isLoaded
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
              >
                Manage job cards, inventory, customers, HR, and multi-branch operations 
                all in one powerful platform. Built specifically for automotive workshops.
              </p>

              {/* Stats - Left Aligned */}
              <div
                className={`mt-8 grid grid-cols-2 gap-4 transition-all duration-700 delay-500 sm:gap-6 ${
                  isLoaded
                    ? "translate-y-0 opacity-100"
                    : "translate-y-12 opacity-0"
                }`}
              >
                {[
                  { value: "500+", label: "Active Workshops" },
                  { value: "98%", label: "Customer Satisfaction" },
                  { value: "50K+", label: "Jobs Completed" },
                  { value: "24/7", label: "Support Available" },
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    className="group rounded-xl p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 sm:p-6"
                    style={{
                      transitionDelay: isLoaded ? `${600 + index * 100}ms` : "0ms",
                    }}
                  >
                    <div className="text-2xl font-bold text-primary transition-all duration-300 group-hover:scale-110 sm:text-3xl [text-shadow:0_0_10px_rgba(255,255,255,0.5),0_0_20px_rgba(255,255,255,0.3)]">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-white/70">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div
              className={`transition-all duration-700 delay-400 ${
                isLoaded
                  ? "translate-x-0 opacity-100"
                  : "translate-x-8 opacity-0"
              }`}
            >
              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold text-white">
                    Get Started Today
                  </h3>
                </div>

                {error && (
                  <div className="mb-6 rounded-xl border border-red-300 bg-red-500/20 backdrop-blur-sm p-4 text-sm text-red-200">
                    {error}
                  </div>
                )}

                {success ? (
                  <div className="rounded-xl border border-green-300 bg-green-500/20 backdrop-blur-sm p-6 text-center">
                    <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-400" />
                    <h4 className="mb-2 text-xl font-bold text-white">
                      Message Sent!
                    </h4>
                    <p className="text-white/80">
                      Thank you for your interest. We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 h-5 w-5 text-white/50" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Full Name *"
                          className={`${inputClasses} pl-10`}
                          required
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-white/50" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Email Address *"
                          className={`${inputClasses} pl-10`}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 h-5 w-5 text-white/50" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Phone Number"
                          className={`${inputClasses} pl-10`}
                        />
                      </div>
                      <div className="relative">
                        <Building className="absolute left-3 top-3.5 h-5 w-5 text-white/50" />
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Workshop Name"
                          className={`${inputClasses} pl-10`}
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <select
                        name="services"
                        value={formData.services}
                        onChange={handleChange}
                        className={`${inputClasses} appearance-none cursor-pointer`}
                      >
                        <option value="" className="bg-gray-900">Select Service Interest</option>
                        <option value="pos-system" className="bg-gray-900">POS System</option>
                        <option value="job-cards" className="bg-gray-900">Job Cards Management</option>
                        <option value="inventory" className="bg-gray-900">Inventory & Warehouses</option>
                        <option value="multi-branch" className="bg-gray-900">Multi-Branch Support</option>
                        <option value="hr-payroll" className="bg-gray-900">HR & Payroll</option>
                        <option value="other" className="bg-gray-900">Other</option>
                      </select>
                    </div>

                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Tell us about your workshop needs... *"
                      className={inputClasses}
                      required
                    />

                    <Button
                      type="submit"
                      disabled={sending}
                      size="lg"
                      className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-transform duration-200 hover:scale-[1.02]"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-white/60">
                      *We'll respond within 24 hours.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className={`absolute bottom-8 left-1/2 z-20 -translate-x-1/2 cursor-pointer transition-all duration-700 delay-700 ${
          isLoaded
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0"
        }`}
        onClick={scrollToNextSection}
      >
        <div className="flex flex-col items-center gap-2 text-white/60 transition-all duration-300 hover:text-white/90">
          <span className="text-xs uppercase tracking-wider">Scroll</span>
          <div className="animate-bounce rounded-full p-2 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/20">
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </div>
    </section>
  );
}