import { useEffect, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminUserRow {
  id: string;
  email: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminUsersPanel({ currentEmail }: { currentEmail: string }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load admins');
      setUsers(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to add admin');
      setNewEmail('');
      setNewPassword('');
      load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Remove admin access for ${email}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to remove admin');
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove admin');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-dark text-lg">Admin Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="space-y-2 mb-4">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded border border-gray-100">
              <div>
                <span className="font-medium">{u.email}</span>
                {u.email === currentEmail && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                <span className="ml-2 text-xs text-gray-400">
                  {u.twoFactorEnabled ? '2FA on' : '2FA off'} · last login:{' '}
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'never'}
                </span>
              </div>
              <button
                onClick={() => handleDelete(u.id, u.email)}
                className="text-red-500 hover:text-red-700"
                title="Remove admin"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {users.length === 0 && !loading && <p className="text-gray-400 text-sm">No admins found.</p>}
        </div>

        <form onSubmit={handleCreate} className="space-y-2 pt-3 border-t">
          <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <UserPlus className="h-3.5 w-3.5" /> Add a new admin
          </p>
          <Input
            type="email"
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Temporary password (min 10 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={10}
            required
          />
          {createError && <p className="text-xs text-red-600">{createError}</p>}
          <Button type="submit" size="sm" disabled={creating}>
            {creating ? 'Adding…' : 'Add admin'}
          </Button>
          <p className="text-xs text-gray-400">
            2FA for a new account is set up via <code>npm run admin:create -- email password --totp</code> — there's
            no in-app way to enroll a 2FA secret yet.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
