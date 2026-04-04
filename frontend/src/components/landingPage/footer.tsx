import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";

const footerLinks = {
  Product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Integrations", href: "#" },
    { name: "Updates", href: "#" },
  ],
  Company: [
    { name: "About", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Press", href: "#" },
  ],
  Resources: [
    { name: "Documentation", href: "#" },
    { name: "Help Center", href: "#" },
    { name: "API Reference", href: "#" },
    { name: "Community", href: "#" },
  ],
  Legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
    { name: "Security", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                AutoShop<span className="text-primary">Pro</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The complete point-of-sale system built specifically for
              automotive workshops and repair shops.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground">
                {category}
              </h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AutoShop Pro. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Twitter
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              LinkedIn
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Facebook
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
