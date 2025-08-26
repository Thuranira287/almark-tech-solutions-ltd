import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
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
            Terms of Service
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
              Almark Tech Solutions Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  1. Agreement to Terms
                </h2>
                <p className="text-gray-700">
                  By accessing and using Almark Tech Solutions' services, you
                  agree to be bound by these Terms of Service and all applicable
                  laws and regulations. If you do not agree with any of these
                  terms, you are prohibited from using our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  2. Description of Services
                </h2>
                <p className="text-gray-700 mb-3">
                  Almark Tech Solutions provides comprehensive IT services
                  including:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                  <li>Website design and development</li>
                  <li>Mobile application development</li>
                  <li>Custom software development</li>
                  <li>Database design and management</li>
                  <li>IT support and maintenance</li>
                  <li>Cybersecurity services and training</li>
                  <li>Network design and installation</li>
                  <li>ICT consultancy and training</li>
                  <li>Digital marketing and graphic design</li>
                  <li>IT equipment sales and installation</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  3. Service Agreement and Scope
                </h2>
                <div className="space-y-3 text-gray-700">
                  <h3 className="font-semibold">Project Scope</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      All services will be provided according to agreed
                      specifications and timelines
                    </li>
                    <li>
                      Any changes to project scope must be agreed upon in
                      writing and may result in additional charges
                    </li>
                    <li>
                      Client responsibilities and deliverables will be clearly
                      outlined in service agreements
                    </li>
                  </ul>

                  <h3 className="font-semibold">Service Delivery</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      We commit to delivering services professionally and within
                      agreed timelines
                    </li>
                    <li>
                      Delays caused by client-side issues or external factors
                      beyond our control may extend delivery dates
                    </li>
                    <li>
                      Regular progress updates will be provided throughout the
                      project
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  4. Payment Terms
                </h2>
                <div className="space-y-3 text-gray-700">
                  <h3 className="font-semibold">Payment Schedule</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      Standard terms: 50% upfront payment, 50% upon completion
                    </li>
                    <li>
                      For large projects: Payment may be structured in
                      milestones as agreed
                    </li>
                    <li>
                      Monthly services: Payment due at the beginning of each
                      month
                    </li>
                  </ul>

                  <h3 className="font-semibold">Payment Methods</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>M-Pesa: 0716227616 (Almark Tech Solutions)</li>
                    <li>PayPal: Invoices sent via email</li>
                    <li>Bank transfer: Details provided upon request</li>
                  </ul>

                  <h3 className="font-semibold">Late Payments</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Payment is due within 30 days of invoice date</li>
                    <li>Late payments may incur a 2% monthly service charge</li>
                    <li>
                      Services may be suspended for payments overdue by more
                      than 30 days
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  5. Intellectual Property Rights
                </h2>
                <div className="space-y-3 text-gray-700">
                  <h3 className="font-semibold">Client Ownership</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      Upon full payment, clients own all custom developed
                      solutions
                    </li>
                    <li>
                      Source code and documentation will be provided upon
                      project completion
                    </li>
                    <li>
                      Clients retain rights to their content, data, and business
                      information
                    </li>
                  </ul>

                  <h3 className="font-semibold">
                    Almark Tech Solutions Rights
                  </h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      We retain rights to general methodologies, techniques, and
                      know-how
                    </li>
                    <li>
                      We may use project examples for portfolio and marketing
                      purposes (with client consent)
                    </li>
                    <li>
                      Third-party software and tools remain property of their
                      respective owners
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  6. Confidentiality
                </h2>
                <p className="text-gray-700">
                  We maintain strict confidentiality regarding:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                  <li>Client business information and trade secrets</li>
                  <li>Project specifications and technical details</li>
                  <li>User data and access credentials</li>
                  <li>Financial and commercial information</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  This confidentiality obligation continues beyond the
                  termination of our service agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  7. Warranties and Support
                </h2>
                <div className="space-y-3 text-gray-700">
                  <h3 className="font-semibold">Service Warranty</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      30-day warranty on all developed solutions for bug fixes
                    </li>
                    <li>
                      1-year warranty on custom software for major functionality
                      issues
                    </li>
                    <li>
                      Website hosting and maintenance as per service agreements
                    </li>
                  </ul>

                  <h3 className="font-semibold">Support Services</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      Technical support available during business hours (8 AM -
                      6 PM, Mon-Fri)
                    </li>
                    <li>
                      Emergency support available for critical issues
                      (additional charges may apply)
                    </li>
                    <li>
                      Training and documentation provided for delivered
                      solutions
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  8. Limitation of Liability
                </h2>
                <p className="text-gray-700 mb-3">
                  To the maximum extent permitted by law:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                  <li>
                    Our total liability shall not exceed the amount paid for the
                    specific service
                  </li>
                  <li>
                    We are not liable for indirect, consequential, or punitive
                    damages
                  </li>
                  <li>
                    We are not responsible for data loss due to client-side
                    issues or external factors
                  </li>
                  <li>
                    Client is responsible for regular data backups and security
                    measures
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  9. Client Responsibilities
                </h2>
                <p className="text-gray-700 mb-3">
                  Clients are responsible for:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
                  <li>Providing accurate and complete project requirements</li>
                  <li>Timely provision of content, feedback, and approvals</li>
                  <li>Ensuring proper use of delivered solutions</li>
                  <li>
                    Maintaining security of access credentials and systems
                  </li>
                  <li>Compliance with applicable laws and regulations</li>
                  <li>Regular backups of critical data and systems</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  10. Termination
                </h2>
                <div className="space-y-3 text-gray-700">
                  <h3 className="font-semibold">Termination by Client</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>30-day written notice required for ongoing services</li>
                    <li>
                      Payment due for all completed work and expenses incurred
                    </li>
                    <li>Data and deliverables provided upon full payment</li>
                  </ul>

                  <h3 className="font-semibold">
                    Termination by Almark Tech Solutions
                  </h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>May terminate for non-payment or breach of terms</li>
                    <li>
                      30-day notice provided except in cases of material breach
                    </li>
                    <li>
                      Client data provided in accessible format upon request
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  11. Force Majeure
                </h2>
                <p className="text-gray-700">
                  We are not liable for delays or failures in performance due to
                  circumstances beyond our reasonable control, including natural
                  disasters, government actions, internet outages, or other
                  force majeure events.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  12. Governing Law
                </h2>
                <p className="text-gray-700">
                  These terms are governed by the laws of Kenya. Any disputes
                  will be resolved through arbitration in Nairobi, Kenya, or
                  through competent courts in Kenya.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  13. Changes to Terms
                </h2>
                <p className="text-gray-700">
                  We reserve the right to modify these terms at any time.
                  Significant changes will be communicated to clients with 30
                  days' notice. Continued use of our services constitutes
                  acceptance of modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-brand-dark mb-3">
                  14. Contact Information
                </h2>
                <div className="text-gray-700">
                  <p>
                    For questions about these terms or our services, contact us:
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

              <section className="border-t pt-4">
                <p className="text-sm text-gray-500 italic">
                  By using our services, you acknowledge that you have read,
                  understood, and agree to be bound by these Terms of Service.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
