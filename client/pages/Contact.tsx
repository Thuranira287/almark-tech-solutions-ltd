import { ArrowLeft, Phone, Mail, MapPin, MessageCircle, Clock, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Create WhatsApp message
    const whatsappMessage = encodeURIComponent(
      `Hello Almark Tech Solutions!\n\n` +
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Phone: ${formData.phone}\n` +
      `Subject: ${formData.subject}\n\n` +
      `Message: ${formData.message}`
    );
    
    // Open WhatsApp
    window.open(`https://wa.me/254716227616?text=${whatsappMessage}`, '_blank');
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
    
    alert('Form submitted! You will be redirected to WhatsApp to send your message.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-brand-gold hover:text-brand-gold-dark mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-2">Contact Us</h1>
          <p className="text-lg text-gray-600">Get in touch with our team - we're here to help!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-brand-dark">Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-brand-gold" />
                  <div>
                    <p className="font-semibold text-brand-dark">Phone</p>
                    <a href="tel:+254716227616" className="text-gray-600 hover:text-brand-gold transition-colors">
                      +254716227616
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-brand-gold" />
                  <div>
                    <p className="font-semibold text-brand-dark">Email</p>
                    <a href="mailto:info@almarktech.com" className="text-gray-600 hover:text-brand-gold transition-colors">
                      info@almarktech.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-brand-gold" />
                  <div>
                    <p className="font-semibold text-brand-dark">Location</p>
                    <p className="text-gray-600">Nairobi, Kenya</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-5 w-5 text-brand-gold" />
                  <div>
                    <p className="font-semibold text-brand-dark">WhatsApp</p>
                    <a 
                      href="https://wa.me/254716227616?text=Hello%20Almark%20Tech%20Solutions,%20I'm%20interested%20in%20your%20services"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-brand-gold transition-colors"
                    >
                      Chat with us instantly
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-brand-dark flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-semibold text-brand-dark">8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-semibold text-brand-dark">9:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-semibold text-brand-dark">Emergency Support Only</span>
                </div>
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">
                    <strong>Emergency Support:</strong> Available 24/7 for critical issues
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-brand-dark text-white">
              <CardHeader>
                <CardTitle className="text-brand-gold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/quote" className="block">
                  <Button className="w-full bg-brand-gold hover:bg-brand-gold-dark text-brand-dark font-semibold">
                    Get a Quote
                  </Button>
                </Link>
                <a 
                  href="https://wa.me/254716227616?text=Hello%20Almark%20Tech%20Solutions,%20I%20need%20emergency%20support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-brand-dark">
                    Emergency Support
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-brand-dark flex items-center">
                  <Send className="h-5 w-5 mr-2" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact-name">Full Name *</Label>
                      <Input
                        id="contact-name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-email">Email Address *</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact-phone">Phone Number</Label>
                      <Input
                        id="contact-phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="e.g., +254712345678"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-subject">Subject *</Label>
                      <Input
                        id="contact-subject"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="What can we help you with?"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contact-message">Message *</Label>
                    <Textarea
                      id="contact-message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Tell us more about your project or inquiry..."
                      rows={6}
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Button 
                      type="submit"
                      className="bg-brand-gold hover:bg-brand-gold-dark text-brand-dark font-semibold flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message via WhatsApp
                    </Button>
                    <a 
                      href="mailto:info@almarktech.com"
                      className="flex-1"
                    >
                      <Button 
                        type="button"
                        variant="outline" 
                        className="w-full border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email Instead
                      </Button>
                    </a>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700 text-sm">
                      <strong>Note:</strong> Submitting this form will open WhatsApp with your message pre-filled. 
                      This ensures faster response times and direct communication with our team.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-brand-dark">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-brand-dark mb-2">How quickly do you respond to inquiries?</h4>
                  <p className="text-gray-600 text-sm">
                    We typically respond within 2-4 hours during business hours, and within 24 hours on weekends.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-dark mb-2">Do you offer free consultations?</h4>
                  <p className="text-gray-600 text-sm">
                    Yes! We offer free initial consultations to understand your needs and provide preliminary recommendations.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-dark mb-2">What payment methods do you accept?</h4>
                  <p className="text-gray-600 text-sm">
                    We accept M-Pesa, bank transfers, and PayPal. Flexible payment terms available for larger projects.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-dark mb-2">Do you provide ongoing support?</h4>
                  <p className="text-gray-600 text-sm">
                    Absolutely! We offer various support packages including maintenance, updates, and 24/7 emergency support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}