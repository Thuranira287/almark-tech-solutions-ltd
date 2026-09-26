import { useEffect, useState } from 'react';
import { ArrowLeft, MessageSquarePlus, Quote as QuoteIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/StarRating';
import PageHead from '@/components/PageHead';

interface Testimonial {
  id: string;
  name: string;
  company: string | null;
  projectName: string | null;
  rating: number;
  message: string;
  createdAt: string;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [projectName, setProjectName] = useState('');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/testimonials');
        const json = await res.json();
        if (json.success) setTestimonials(json.data);
      } catch {
        // fail quietly — the page still works without the list
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, projectName, rating, message }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to submit');
      setSubmitResult({ ok: true, text: json.message });
      setName('');
      setEmail('');
      setCompany('');
      setProjectName('');
      setRating(5);
      setMessage('');
    } catch (err) {
      setSubmitResult({ ok: false, text: err instanceof Error ? err.message : 'Failed to submit review' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <PageHead path="/testimonials" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-brand-gold hover:text-brand-gold-dark mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-brand-dark mb-2">Client Reviews</h1>
          <p className="text-lg text-gray-600">What people we've worked with have to say</p>
        </div>

        {!loading && testimonials.length === 0 && (
          <Card className="mb-8">
            <CardContent className="pt-6 text-center text-gray-500">
              <QuoteIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              No reviews yet — be the first to share your experience working with us.
            </CardContent>
          </Card>
        )}

        {testimonials.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {testimonials.map((t) => (
              <Card key={t.id}>
                <CardContent className="pt-6">
                  <StarRating value={t.rating} />
                  <p className="text-gray-700 text-sm mt-3 mb-4">"{t.message}"</p>
                  <p className="font-semibold text-brand-dark text-sm">
                    {t.name}
                    {t.company && <span className="font-normal text-gray-500"> · {t.company}</span>}
                  </p>
                  {t.projectName && <p className="text-xs text-gray-400">{t.projectName}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-brand-dark">
              <MessageSquarePlus className="h-5 w-5 mr-2 text-brand-gold" />
              Leave a Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="t-name">Name *</Label>
                  <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="t-email">Email *</Label>
                  <Input
                    id="t-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Never shown publicly — used only to follow up if needed.</p>
                </div>
                <div>
                  <Label htmlFor="t-company">Company (optional)</Label>
                  <Input id="t-company" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="t-project">What did we build/help with? (optional)</Label>
                  <Input
                    id="t-project"
                    placeholder="e.g. Website, Security Assessment"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Rating *</Label>
                <div className="mt-1">
                  <StarRating value={rating} onChange={setRating} size={24} />
                </div>
              </div>

              <div>
                <Label htmlFor="t-message">Your review *</Label>
                <Textarea
                  id="t-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your experience working with us..."
                  required
                  minLength={10}
                />
              </div>

              {submitResult && (
                <p className={`text-sm ${submitResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {submitResult.text}
                </p>
              )}

              <p className="text-xs text-gray-400">
                Submitted reviews are checked before they appear publicly — this keeps every review on this
                page genuine.
              </p>

              <Button
                type="submit"
                disabled={submitting}
                className="bg-brand-gold hover:bg-brand-gold-dark text-brand-dark font-semibold"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
