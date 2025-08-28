import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Phone, Mail, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "#services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="/Almark logo.jpg"
              //src="https://cdn.builder.io/api/v1/assets/71f0184882c4419c9eb0eea502d5d8ef/img-20250411-wa0001-9983c9?format=webp&width=800"
              alt="Almark Tech Solutions"
              className="h-10 w-10 rounded-full  object-cover"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-brand-dark">
                Almark Tech Solutions
              </h1>
              <p className="text-sm text-brand-gold">Your Tech Partner</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              link.href.startsWith("#")? (
              <a
                key={link.href}
                href={link.href}
                className="text-brand-dark hover:text-brand-gold transition-colors duration-200 font-medium"
              >
                {link.label}
              </a>
            ): (
              <Link
              key={link.href}
              to={link.href}
              className="text-brand-dark hover:text-brand-gold transition-colors duration-200 font-medium"
              >
                {link.label}
              </Link>
            )
            ))}
          </nav>

          {/* Contact Info & CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-brand-dark">
              <Phone className="h-4 w-4" />
              <span>+254716227616</span>
            </div>
            <a
              href="https://wa.me/254716227616?text=Hello%20Almark%20Tech%20Solutions,%20I'm%20interested%20in%20your%20services"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">WhatsApp</span>
            </a>
            <Link to="/quote">
              <Button className="bg-brand-gold hover:bg-brand-gold-dark text-brand-dark font-semibold">
                Get Quote
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-brand-dark" />
            ) : (
              <Menu className="h-6 w-6 text-brand-dark" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <nav className="py-4 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-2 text-brand-dark hover:text-brand-gold hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="px-4 py-2 border-t mt-4 pt-4">
                <div className="flex items-center space-x-2 text-sm text-brand-dark mb-3">
                  <Phone className="h-4 w-4" />
                  <span>+254716227616</span>
                </div>
                <a
                  href="https://wa.me/254716227616?text=Hello%20Almark%20Tech%20Solutions,%20I'm%20interested%20in%20your%20services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 w-full py-2 mb-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat on WhatsApp</span>
                </a>
                <Link to="/quote">
                  <Button className="w-full bg-brand-gold hover:bg-brand-gold-dark text-brand-dark font-semibold">
                    Get Quote
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
