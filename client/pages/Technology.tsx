import { ArrowLeft, Globe, Smartphone, Database, Cloud, Shield, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHead from '@/components/PageHead';

interface StackItem {
  name: string;
  role: string;
}

const stackGroups: { title: string; icon: JSX.Element; items: StackItem[] }[] = [
  {
    title: 'Web Development',
    icon: <Globe className="h-6 w-6 mr-3 text-brand-gold" />,
    items: [
      { name: 'React & TypeScript', role: 'Fast, maintainable web apps and dashboards' },
      { name: 'WordPress', role: 'Content-managed business and brochure websites' },
      { name: 'Node.js & Laravel', role: 'APIs and backend systems for e-commerce and web platforms' },
      { name: 'Tailwind CSS', role: 'Clean, responsive, on-brand interfaces' },
    ],
  },
  {
    title: 'Mobile App Development',
    icon: <Smartphone className="h-6 w-6 mr-3 text-brand-gold" />,
    items: [
      { name: 'Kotlin (native Android)', role: 'Performant apps for fintech, education, and utility tools' },
      { name: 'Flutter', role: 'Cross-platform apps that ship to Android and iOS from one codebase' },
      { name: 'Offline-first architecture', role: 'Apps that keep working in low-connectivity environments — schools, field teams' },
    ],
  },
  {
    title: 'Databases & Backend',
    icon: <Database className="h-6 w-6 mr-3 text-brand-gold" />,
    items: [
      { name: 'PostgreSQL & MySQL', role: 'Reliable relational data for business systems' },
      { name: 'SQLite & Room', role: 'Local, offline-capable storage for mobile apps' },
      { name: 'Firebase', role: 'Realtime data, auth, and push notifications where they fit' },
    ],
  },
  {
    title: 'Cloud & Hosting',
    icon: <Cloud className="h-6 w-6 mr-3 text-brand-gold" />,
    items: [
      { name: 'Netlify & Vercel', role: 'Fast, reliable hosting for web projects' },
      { name: 'Google Cloud & AWS', role: 'Scalable infrastructure for larger systems' },
      { name: 'CI/CD pipelines', role: 'Automated builds and deployments, fewer manual mistakes' },
    ],
  },
  {
    title: 'Cybersecurity & Networking',
    icon: <Shield className="h-6 w-6 mr-3 text-brand-gold" />,
    items: [
      { name: 'Vulnerability assessment tools', role: 'Used in our Security Assessment & Testing service' },
      { name: 'Secure payment integrations', role: 'M-Pesa, PayPal, and Stripe wired in with server-side validation, not just a form on a page' },
      { name: 'Network design & hardening', role: 'LAN/WiFi setup and access control for offices and institutions' },
    ],
  },
  {
    title: 'Design & Digital Marketing',
    icon: <Palette className="h-6 w-6 mr-3 text-brand-gold" />,
    items: [
      { name: 'Figma & Adobe Creative Suite', role: 'UI/UX design, branding, and marketing materials' },
      { name: 'SEO & analytics tooling', role: "Making sure client sites are actually found" },
    ],
  },
];

export default function Technology() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <PageHead path="/technology" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-brand-gold hover:text-brand-gold-dark mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-2">Technology We Use</h1>
          <p className="text-lg text-gray-600">
            The tools, frameworks, and platforms our team builds your project with
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-gray-700 leading-relaxed">
              Every project we take on — a website, a mobile app, a custom system, or a security
              review — is built with modern, well-supported technology chosen for what the project
              actually needs, not whatever's trendiest. Here's the toolkit we draw from.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {stackGroups.map((group) => (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="text-brand-dark flex items-center">
                  {group.icon}
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {group.items.map((item) => (
                    <div key={item.name} className="p-3 bg-gray-50 rounded border border-gray-100">
                      <p className="font-semibold text-brand-dark text-sm">{item.name}</p>
                      <p className="text-gray-600 text-sm mt-1">{item.role}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-brand-dark text-white">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-200">
              Have a specific stack in mind, or need advice on what fits your project? We're happy to
              talk it through —
              <Link to="/quote" className="text-brand-gold hover:underline ml-1">get a quote</Link>
              {' '}or
              <Link to="/contact" className="text-brand-gold hover:underline ml-1">reach out</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
