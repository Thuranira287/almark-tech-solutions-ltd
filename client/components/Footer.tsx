import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Github,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: "Facebook",
      href: "https://www.facebook.com/alexander.thuranira.1044",
      icon: Facebook,
      className: "text-blue-400 hover:text-blue-300",
    },
    {
      name: "X",
      href: "https://x.com/ranviah?s=09",
      icon: Twitter,
      className: "text-gray-300 hover:text-white",
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/",
      icon: Linkedin,
      className: "text-blue-400 hover:text-blue-300",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/",
      icon: Instagram,
      className: "text-pink-400 hover:text-pink-300",
    },
    {
      name: "GitHub",
      href: "https://github.com/Thuranira287",
      icon: Github,
      className: "text-gray-300 hover:text-white",
    },
  ];

  const quickLinks = [
    { name: "Our Services", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Get a Quote", href: "/quote" },
  ];

  return (
    <footer
      className="bg-brand-dark text-white border-t border-white/10"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-14 lg:py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {/* Company Information */}
            <div className="lg:col-span-2">
              <Link
                to="/"
                className="inline-flex items-center gap-3 group"
                aria-label="Almark Tech Solutions home"
              >
              
<img
  src="/Almarklogo.png"
  alt="Almark Tech Solutions logo"
  className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-gold/30 group-hover:ring-brand-gold/60 transition-all duration-300"
/>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Almark Tech Solutions
                  </h2>
                  <p className="text-sm text-brand-gold italic">
                    Your Tech Partner
                  </p>
                </div>
              </Link>

              <p className="mt-5 max-w-xl text-sm leading-7 text-gray-300">
                Empowering businesses with innovative technology solutions.
                From website development and mobile applications to
                cybersecurity and IT consulting, we help businesses build,
                secure, and grow in the digital world.
              </p>

              {/* Social Media */}
              <div className="mt-7">
                <p className="mb-3 text-sm font-medium text-gray-400">
                  Connect with us
                </p>

                <div className="flex items-center gap-3">
                  {socialLinks.map(
                    ({ name, href, icon: Icon, className }) => (
                      <a
                        key={name}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Almark Tech Solutions on ${name}`}
                        title={name}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 ${className} transition-all duration-300 hover:-translate-y-1 hover:border-brand-gold/40 hover:bg-white/10`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-brand-gold">
                Quick Links
              </h3>

              <nav aria-label="Footer navigation">
                <ul className="space-y-3">
                  {quickLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className="group inline-flex items-center gap-1 text-sm text-gray-300 transition-colors duration-200 hover:text-white"
                      >
                        <span>{link.name}</span>
                        <ArrowUpRight
                          className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-brand-gold">
                Contact Us
              </h3>

              <address className="not-italic">
                <ul className="space-y-4">
                  {/* Phone */}
                  <li>
                    <a
                      href="tel:+254716227616"
                      className="group flex items-start gap-3"
                    >
                      <Phone
                        className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold"
                        aria-hidden="true"
                      />

                      <span className="text-sm text-gray-300 transition-colors group-hover:text-white">
                        +254 716 227 616
                      </span>
                    </a>
                  </li>

                  {/* Email */}
                  <li>
                    <a
                      href="mailto:info@almarktechsolutions.co.ke"
                      className="group flex items-start gap-3"
                    >
                      <Mail
                        className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold"
                        aria-hidden="true"
                      />

                      <span className="break-all text-sm text-gray-300 transition-colors group-hover:text-white">
                        info@almarktechsolutions.co.ke
                      </span>
                    </a>
                  </li>

                  {/* WhatsApp */}
                  <li>
                    <a
                      href="https://wa.me/254716227616?text=Hello%20Almark%20Tech%20Solutions%2C%20I%27m%20interested%20in%20your%20services."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3"
                    >
                      <MessageCircle
                        className="mt-0.5 h-5 w-5 shrink-0 text-green-400"
                        aria-hidden="true"
                      />

                      <span className="text-sm text-green-400 transition-colors group-hover:text-green-300">
                        Chat on WhatsApp
                      </span>
                    </a>
                  </li>

                  {/* Location */}
                  <li>
                    <div className="flex items-start gap-3">
                      <MapPin
                        className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold"
                        aria-hidden="true"
                      />

                      <span className="text-sm text-gray-300">
                        Nairobi, Kenya
                      </span>
                    </div>
                  </li>
                </ul>
              </address>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Copyright */}
            <p className="text-center text-xs text-gray-400 md:text-left">
              © {currentYear}{" "}
              <span className="font-medium text-gray-300">
                Almark Tech Solutions
              </span>
              . All rights reserved.
            </p>

            {/* Legal Links */}
            <nav
              aria-label="Legal navigation"
              className="flex items-center justify-center gap-5 md:justify-end"
            >
              <Link
                to="/privacy-policy"
                className="text-xs text-gray-400 transition-colors hover:text-white"
              >
                Privacy Policy
              </Link>

              <span
                className="h-3 w-px bg-gray-700"
                aria-hidden="true"
              />

              <Link
                to="/terms-of-service"
                className="text-xs text-gray-400 transition-colors hover:text-white"
              >
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}