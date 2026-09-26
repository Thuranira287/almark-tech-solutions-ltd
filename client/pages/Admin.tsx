import { useEffect, useState } from 'react';
import { Lock, RefreshCw, LogOut, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminUsersPanel from '@/components/admin/AdminUsersPanel';
import TestimonialsPanel from '@/components/admin/TestimonialsPanel';
import SEO from '@/components/SEO';

// This page is intentionally not linked from Header/Footer or any other
// public page — it's only reachable by someone who navigates to /admin
// directly, and everything it shows requires a valid session with the
// server (see server/routes/admin.ts + server/lib/adminAuth.ts).

interface QuoteRow {
  quoteId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company: string | null;
  totalPrice: number;
  paidAmount: number;
  balance: number;
  status: string;
  createdAt: string;
  services: { name: string; price: number }[];
  payments: { method: string; amount: number; currency: string; status: string; providerRef: string | null; createdAt: string }[];
}

export default function Admin() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [updatingQuoteId, setUpdatingQuoteId] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/session', { credentials: 'include' });
        const json = await res.json();
        setAuthenticated(res.ok && json.success);
        if (res.ok && json.success) setCurrentEmail(json.data.email);
      } catch {
        setAuthenticated(false);
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (authenticated) loadQuotes();
  }, [authenticated]);

  async function loadQuotes() {
    setLoadingQuotes(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/quotes', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load quotes');
      setQuotes(json.data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoadingQuotes(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, totpCode: totpCode || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setLoginError('Incorrect email, password, or code');
        return;
      }
      setAuthenticated(true);
      setCurrentEmail(json.data.email);
      setPassword('');
      setTotpCode('');
    } catch {
      setLoginError('Login failed. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    setAuthenticated(false);
    setQuotes([]);
  }

  async function changeStatus(quoteId: string, status: string) {
    setUpdatingQuoteId(quoteId);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update status');
      setQuotes((prev) => prev.map((q) => (q.quoteId === quoteId ? { ...q, status } : q)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingQuoteId(null);
    }
  }

  if (checkingSession) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <SEO title="Admin — Almark Tech Solutions" description="Internal admin dashboard." path="/admin" noindex />
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-brand-dark">
              <Lock className="h-5 w-5 mr-2 text-brand-gold" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  autoComplete="username"
                />
              </div>
              <div>
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <Label htmlFor="admin-totp">Authenticator code (if 2FA is enabled)</Label>
                <Input
                  id="admin-totp"
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                />
              </div>
              {loginError && <p className="text-sm text-red-600">{loginError}</p>}
              <Button type="submit" className="w-full bg-brand-gold hover:bg-brand-gold-dark text-brand-dark" disabled={loggingIn}>
                {loggingIn ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO title="Admin — Almark Tech Solutions" description="Internal admin dashboard." path="/admin" noindex />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Quotes & Payments</h1>
            <p className="text-xs text-gray-500">Signed in as {currentEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTestimonials((v) => !v)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              {showTestimonials ? 'Hide reviews' : 'Reviews'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowUsers((v) => !v)}>
              <Users className="h-4 w-4 mr-2" />
              {showUsers ? 'Hide admins' : 'Manage admins'}
            </Button>
            <Button variant="outline" size="sm" onClick={loadQuotes} disabled={loadingQuotes}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingQuotes ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>

        {showTestimonials && (
          <div className="mb-6">
            <TestimonialsPanel />
          </div>
        )}

        {showUsers && (
          <div className="mb-6">
            <AdminUsersPanel currentEmail={currentEmail} />
          </div>
        )}

        {loadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{loadError}</div>
        )}

        <div className="space-y-4">
          {quotes.map((q) => (
            <Card key={q.quoteId}>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-brand-dark">{q.quoteId}</p>
                    <p className="text-sm text-gray-600">{q.customerName} — {q.customerEmail} — {q.customerPhone}</p>
                    {q.company && <p className="text-sm text-gray-500">{q.company}</p>}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      q.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : q.status === 'partially_paid'
                          ? 'bg-yellow-100 text-yellow-700'
                          : q.status === 'cancelled'
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {q.status}
                  </span>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <Label htmlFor={`status-${q.quoteId}`} className="text-xs text-gray-500">
                    Change status:
                  </Label>
                  <select
                    id={`status-${q.quoteId}`}
                    value={q.status}
                    disabled={updatingQuoteId === q.quoteId}
                    onChange={(e) => changeStatus(q.quoteId, e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="pending">pending</option>
                    <option value="partially_paid">partially_paid</option>
                    <option value="paid">paid</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-sm mb-3">
                  <div><span className="text-gray-500">Total:</span> <span className="font-semibold">KES {q.totalPrice.toLocaleString()}</span></div>
                  <div><span className="text-gray-500">Paid:</span> <span className="font-semibold text-green-600">KES {q.paidAmount.toLocaleString()}</span></div>
                  <div><span className="text-gray-500">Balance:</span> <span className="font-semibold text-orange-600">KES {q.balance.toLocaleString()}</span></div>
                </div>

                <details className="text-sm">
                  <summary className="cursor-pointer text-brand-gold-dark">Services & payment history</summary>
                  <div className="mt-2 grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Services</p>
                      <ul className="text-gray-600 space-y-1">
                        {q.services.map((s, i) => (
                          <li key={i}>{s.name} — KES {s.price.toLocaleString()}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Payments</p>
                      <ul className="text-gray-600 space-y-1">
                        {q.payments.length === 0 && <li className="text-gray-400">None yet</li>}
                        {q.payments.map((p, i) => (
                          <li key={i}>
                            {p.method} — {p.currency} {p.amount.toLocaleString()} — {p.status}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
          {quotes.length === 0 && !loadingQuotes && (
            <p className="text-gray-500 text-sm">No quotes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
