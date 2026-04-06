"use client";

import { useAnimateOnScroll } from "@/hooks/landingPageHooks/use-animate-on-scroll";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2,
  User,
  Building,
  MessageSquare,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useState } from "react";

interface FormData {
  name: string;
  email: string;
  message: string;
  company: string;
  phone: string;
  services: string;
}

export function CTASection() {
  const { ref: sectionRef, isVisible } = useAnimateOnScroll<HTMLDivElement>();
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
    "w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300 text-foreground placeholder:text-muted-foreground";

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

          <div className="relative">
            {/* Header */}
            <div className="text-center mb-12">
              <h2
                className={`text-balance text-3xl font-bold tracking-tight text-foreground transition-all duration-700 delay-100 sm:text-4xl ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
              >
                Get in Touch
              </h2>
              <p
                className={`mx-auto mt-4 max-w-2xl text-muted-foreground transition-all duration-700 delay-200 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
              >
                Have questions about AutoShop Pro? We're here to help you
                streamline your workshop operations.
              </p>
            </div>

            {/* Contact Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Contact Info & Map */}
              <div
                className={`space-y-6 transition-all duration-700 delay-300 ${
                  isVisible
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-8 opacity-0"
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ContactInfoCard
                    icon={Phone}
                    title="Call Us"
                   details={['+92 333-1116842', '+92 332-5394285']}
                  />
                  <ContactInfoCard
                    icon={Mail}
                    title="Email Us"
                   details={['marketing@clickmasters.pk', 'info@clickmasters.pk']}
                  />
                  <ContactInfoCard
                    icon={MapPin}
                    title="Visit Us"
                    details={['Main PWD Rd, Islamabad, Punjab, Pakistan']}
                  />
                  <ContactInfoCard
                    icon={Clock}
                    title="Business Hours"
                     details={['Mon-Sat: 9AM - 6PM', '24/7 Support']}
                  />
                </div>

                {/* Location Map */}
                <div className="rounded-xl border border-border bg-background/50 overflow-hidden transition-all duration-300 hover:shadow-lg">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Find Us Here
                    </h3>
                  </div>
                  <div className="h-[250px] w-full">
                    <iframe
                      title="AutoShop Pro Location"
                      src="https://www.google.com/maps?q=Main+PWD+Rd,+PWD+Housing+Society+Sector+A+PWD+Society,+Islamabad,+Punjab+45700,+Pakistan&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>

              </div>

              {/* Right Column - Contact Form */}
              <div
                className={`transition-all duration-700 delay-400 ${
                  isVisible
                    ? "translate-x-0 opacity-100"
                    : "translate-x-8 opacity-0"
                }`}
              >
                <div className="rounded-xl border border-border bg-background/50 p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <MessageSquare className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">
                      Send us a message
                    </h3>
                  </div>

                  {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {success ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
                      <h4 className="mb-2 text-xl font-bold text-foreground">
                        Message Sent!
                      </h4>
                      <p className="text-muted-foreground">
                        Thank you for contacting AutoShop Pro. We'll get back to
                        you within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
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
                          <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
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
                          <Phone className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
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
                          <Building className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
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
                          className={`${inputClasses} appearance-none`}
                        >
                          <option value="">Select Service Interest</option>
                          <option value="workshop-management">Workshop Management</option>
                          <option value="inventory-tracking">Inventory Tracking</option>
                          <option value="customer-management">Customer Management</option>
                          <option value="reporting-analytics">Reporting & Analytics</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Tell us about your workshop needs... *"
                        className={inputClasses}
                        required
                      />

                      <Button
                        type="submit"
                        disabled={sending}
                        size="lg"
                        className="w-full gap-2 transition-transform duration-200 hover:scale-[1.02]"
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

                      <p className="text-center text-xs text-muted-foreground">
                        * Required fields. We'll respond within 24 hours.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

// Helper component for contact info cards
const ContactInfoCard: React.FC<{
  icon: React.ElementType;
  title: string;
  details: string[];
}> = ({ icon: Icon, title, details }) => {
  return (
    <div className="group relative h-full">
      <div className="relative h-full rounded-xl border border-border bg-background/50 p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2 transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
            {details.map((detail, idx) => (
              <p key={idx} className="text-sm text-muted-foreground">
                {detail}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};