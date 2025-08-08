import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-brand-gold hover:text-brand-gold-dark mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-2">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-KE", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-brand-dark">
              Almark Tech Solutions Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  1. Information We Collect
                </h2>
                <div className="space-y-3 text-gray-700">
                  <h3 className="font-semibold">Personal Information</h3>
                  <p>
                    We collect information you provide directly to us, such as:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Name, email address, and phone number</li>
                    <li>Company or organization name</li>
                    <li>Project requirements and specifications</li>
                    <li>
                      Payment information (processed securely through
                      third-party providers)
                    </li>
                    <li>Communication records and support inquiries</li>
                  </ul>

                  <h3 className="font-semibold mt-4">Technical Information</h3>
                  <p>
                    We automatically collect certain technical information when
                    you visit our website:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>IP address and browser information</li>
                    <li>Device information and operating system</li>
                    <li>Pages visited and time spent on our website</li>
                    <li>Referring website and exit pages</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  2. How We Use Your Information
                </h2>
                <p className="text-gray-700 mb-3">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                  <li>Provide and deliver our IT services and solutions</li>
                  <li>Process quotes, invoices, and payments</li>
                  <li>Communicate with you about projects and services</li>
                  <li>Provide customer support and technical assistance</li>
                  <li>Improve our website and services</li>
                  <li>
                    Send you relevant business updates and marketing materials
                    (with your consent)
                  </li>
                  <li>Comply with legal obligations and protect our rights</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  3. Information Sharing and Disclosure
                </h2>
                <p className="text-gray-700 mb-3">
                  We do not sell, trade, or rent your personal information to
                  third parties. We may share your information only in the
                  following circumstances:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                  <li>
                    <strong>Service Providers:</strong> With trusted third-party
                    vendors who assist us in providing services (payment
                    processors, hosting providers)
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law or
                    to protect our rights and safety
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In connection with any
                    merger, sale, or transfer of company assets
                  </li>
                  <li>
                    <strong>With Your Consent:</strong> When you explicitly
                    agree to share information with specific third parties
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  4. Data Security
                </h2>
                <p className="text-gray-700 mb-3">
                  We implement appropriate technical and organizational measures
                  to protect your personal information:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                  <li>Encryption of sensitive data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and employee training</li>
                  <li>Secure payment processing through certified providers</li>
                  <li>Regular data backups and disaster recovery procedures</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  5. Data Retention
                </h2>
                <p className="text-gray-700">
                  We retain your personal information for as long as necessary
                  to provide our services and comply with legal obligations.
                  Typically:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                  <li>
                    Customer data: Retained for the duration of our business
                    relationship plus 7 years for accounting purposes
                  </li>
                  <li>
                    Marketing communications: Until you unsubscribe or request
                    deletion
                  </li>
                  <li>
                    Website analytics: Anonymized data retained for 2 years
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  6. Your Rights
                </h2>
                <p className="text-gray-700 mb-3">
                  You have the following rights regarding your personal
                  information:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                  <li>
                    <strong>Access:</strong> Request a copy of the personal
                    information we hold about you
                  </li>
                  <li>
                    <strong>Correction:</strong> Request correction of
                    inaccurate or incomplete information
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your personal
                    information (subject to legal obligations)
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to processing of your
                    information for marketing purposes
                  </li>
                  <li>
                    <strong>Data Portability:</strong> Request transfer of your
                    data to another service provider
                  </li>
                </ul>
                <p className="text-gray-700 mt-3">
                  To exercise these rights, contact us at info@almarktech.com or
                  +254716227616.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  7. Cookies and Tracking
                </h2>
                <p className="text-gray-700">
                  Our website uses cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                  <li>Remember your preferences and improve user experience</li>
                  <li>Analyze website traffic and usage patterns</li>
                  <li>Provide personalized content and recommendations</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  You can control cookie settings through your browser
                  preferences.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  8. Third-Party Services
                </h2>
                <p className="text-gray-700">
                  Our website may contain links to third-party services (M-Pesa,
                  PayPal, WhatsApp). These services have their own privacy
                  policies, and we are not responsible for their practices.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  9. Children's Privacy
                </h2>
                <p className="text-gray-700">
                  Our services are not directed to children under 13. We do not
                  knowingly collect personal information from children under 13.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  10. Changes to This Policy
                </h2>
                <p className="text-gray-700">
                  We may update this privacy policy from time to time. We will
                  notify you of significant changes by posting the new policy on
                  our website and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  11. Contact Information
                </h2>
                <div className="text-gray-700">
                  <p>
                    If you have questions about this privacy policy or our data
                    practices, contact us:
                  </p>
                  <div className="mt-3 space-y-1">
                    <p>
                      <strong>Almark Tech Solutions</strong>
                    </p>
                    <p>Email: info@almarktech.com</p>
                    <p>Phone: +254716227616</p>
                    <p>
                      WhatsApp:{" "}
                      <a
                        href="https://wa.me/254716227616"
                        className="text-brand-gold hover:underline"
                      >
                        wa.me/254716227616
                      </a>
                    </p>
                    <p>Address: Nairobi, Kenya</p>
                  </div>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
