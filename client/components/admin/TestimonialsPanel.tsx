import { useEffect, useState } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StarRating from '@/components/StarRating';

interface TestimonialRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  projectName: string | null;
  rating: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function TestimonialsPanel() {
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/testimonials', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load reviews');
      setItems(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: 'approved' | 'rejected') {
    try {
      const res = await fetch(`/api/admin/testimonials/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update');
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update review');
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this review permanently?')) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete');
      setItems((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete review');
    }
  }

  const pending = items.filter((t) => t.status === 'pending');
  const decided = items.filter((t) => t.status !== 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-dark text-lg">
          Reviews {pending.length > 0 && <span className="text-sm font-normal text-orange-600">({pending.length} pending)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {!loading && items.length === 0 && <p className="text-gray-400 text-sm">No reviews submitted yet.</p>}

        <div className="space-y-3">
          {[...pending, ...decided].map((t) => (
            <div key={t.id} className="p-3 bg-gray-50 rounded border border-gray-100 text-sm">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <span className="font-semibold">{t.name}</span>
                  {t.company && <span className="text-gray-500"> · {t.company}</span>}
                  <span className="text-xs text-gray-400 ml-2">{t.email}</span>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    t.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : t.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {t.status}
                </span>
              </div>
              <StarRating value={t.rating} size={14} />
              {t.projectName && <p className="text-xs text-gray-400 mt-1">Re: {t.projectName}</p>}
              <p className="text-gray-700 mt-1">{t.message}</p>
              <div className="flex items-center gap-3 mt-2">
                {t.status !== 'approved' && (
                  <button onClick={() => setStatus(t.id, 'approved')} className="text-green-600 hover:text-green-800 text-xs flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                )}
                {t.status !== 'rejected' && (
                  <button onClick={() => setStatus(t.id, 'rejected')} className="text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1">
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                )}
                <button onClick={() => remove(t.id)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
