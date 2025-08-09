import { ArrowLeft, Users, Target, Award, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-brand-gold hover:text-brand-gold-dark mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-2">About Almark Tech Solutions</h1>
          <p className="text-lg text-gray-600">Your trusted technology partner in Kenya</p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Company Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-dark flex items-center">
                <Lightbulb className="h-6 w-6 mr-3 text-brand-gold" />
                Who We Are
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Almark Tech Solutions is a leading technology company based in Nairobi, Kenya, dedicated to 
                empowering businesses through innovative IT solutions. Since our establishment, we have been 
                committed to delivering high-quality, reliable, and cost-effective technology services that 
                help our clients achieve their digital transformation goals.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We specialize in comprehensive IT services including website development, mobile applications, 
                custom software solutions, cybersecurity, and digital transformation consulting. Our team of 
                experienced professionals combines technical expertise with deep understanding of local business 
                needs to deliver solutions that truly make a difference.
              </p>
            </CardContent>
          </Card>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-brand-dark flex items-center">
                  <Target className="h-6 w-6 mr-3 text-brand-tech-blue" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  To empower businesses across Kenya and East Africa with cutting-edge technology solutions 
                  that drive growth, efficiency, and innovation. We are committed to bridging the digital 
                  divide by making advanced technology accessible and affordable for businesses of all sizes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-brand-dark flex items-center">
                  <Award className="h-6 w-6 mr-3 text-brand-tech-green" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  To be the most trusted technology partner in Kenya, recognized for our innovation, 
                  reliability, and commitment to client success. We envision a future where every 
                  business, regardless of size, has access to world-class technology solutions.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Core Values */}
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-dark flex items-center">
                <Users className="h-6 w-6 mr-3 text-purple-600" />
                Our Core Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-brand-dark mb-2">Innovation</h4>
                  <p className="text-gray-600 text-sm">
                    We continuously explore new technologies and methodologies to provide cutting-edge solutions.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-dark mb-2">Reliability</h4>
                  <p className="text-gray-600 text-sm">
                    We deliver consistent, dependable services that our clients can count on.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-dark mb-2">Excellence</h4>
                  <p className="text-gray-600 text-sm">
                    We strive for perfection in every project, ensuring the highest quality standards.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-brand-dark mb-2">Partnership</h4>
                  <p className="text-gray-600 text-sm">
                    We build long-term relationships with our clients, acting as true technology partners.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Choose Us */}
          <Card>
            <CardHeader>
              <CardTitle className="text-brand-dark">Why Choose Almark Tech Solutions?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-brand-gold mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-brand-dark">Local Expertise</h4>
                    <p className="text-gray-600 text-sm">Deep understanding of the Kenyan market and business environment.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-brand-gold mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-brand-dark">Comprehensive Services</h4>
                    <p className="text-gray-600 text-sm">One-stop solution for all your technology needs, from development to support.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-brand-gold mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-brand-dark">Proven Track Record</h4>
                    <p className="text-gray-600 text-sm">Successfully delivered projects across various industries including education, retail, and corporate.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-brand-gold mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-brand-dark">Affordable Solutions</h4>
                    <p className="text-gray-600 text-sm">Competitive pricing without compromising on quality or service delivery.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-brand-gold mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-brand-dark">24/7 Support</h4>
                    <p className="text-gray-600 text-sm">Ongoing support and maintenance to ensure your systems run smoothly.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <div className="text-center bg-gradient-to-r from-brand-dark to-brand-dark-light rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Work with Us?</h3>
            <p className="text-gray-300 mb-6">
              Let's discuss how we can help transform your business with technology.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/quote" className="inline-block">
                <button className="bg-brand-gold hover:bg-brand-gold-dark text-brand-dark font-semibold px-6 py-3 rounded-lg transition-colors">
                  Get a Quote
                </button>
              </Link>
              <Link to="/contact" className="inline-block">
                <button className="border border-white text-white hover:bg-white hover:text-brand-dark font-semibold px-6 py-3 rounded-lg transition-colors">
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}