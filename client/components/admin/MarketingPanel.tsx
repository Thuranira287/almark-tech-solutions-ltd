import { useEffect, useState } from 'react';
import { Check, X, Sparkles, Power, Image as ImageIcon, CalendarClock, Link2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Tenant { id: string; name: string; role: string }
interface Project { id: string; name: string; website: string; websiteVerified: boolean; autonomyMode: 'AUTONOMOUS' | 'APPROVAL' | 'MANUAL' }
interface ContentRow { id: string; projectId: string; contentType: string; body: string; status: string; createdAt: string }
interface Connection { id: string; platform: string; accountName: string; status: string; lastErrorSafe: string | null }
interface ProviderStatus { socialPublisher: { name: string; configured: boolean }; imageGeneration: { name: string; configured: boolean }; scheduler: { configured: boolean }; ai: { configured: boolean } }

const CONTENT_TYPES = ['educational', 'service_promotion', 'portfolio', 'blog_promotion', 'company_update', 'engagement', 'lead_generation'];
const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'x', 'threads', 'tiktok', 'youtube', 'pinterest', 'bluesky', 'mastodon', 'google_business'];

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`/api/admin${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...options });
  const json = await res.json();
  if (!res.ok || !json.success) {
    const detail = json.validationIssues?.length ? `: ${json.validationIssues.join('; ')}` : '';
    throw new Error((json.message || 'Request failed') + detail);
  }
  return json;
}

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${ok ? 'bg-green-500' : 'bg-gray-300'}`} />;
}

export default function MarketingPanel() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [platformOn, setPlatformOn] = useState(false);
  const [tenantOn, setTenantOn] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [content, setContent] = useState<ContentRow[]>([]);
  const [error, setError] = useState('');

  const [projectId, setProjectId] = useState('');
  const [contentType, setContentType] = useState('educational');
  const [brief, setBrief] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draftMessage, setDraftMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [connectStep, setConnectStep] = useState<'idle' | 'checking' | 'picking'>('idle');
  const [bufferKey, setBufferKey] = useState('');
  const [channels, setChannels] = useState<{ id: string; name: string; service: string; organizationId: string }[]>([]);

  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduleConnectionId, setScheduleConnectionId] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [imagePromptFor, setImagePromptFor] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [t, ps] = await Promise.all([api('/tenants'), api('/marketing/provider-status')]);
        setTenants(t.data);
        setProviderStatus(ps.data);
        if (t.data.length > 0) setTenantId(t.data[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
  }, []);

  async function loadTenantData(id: string) {
    if (!id) return;
    setError('');
    try {
      const [platformS, tenantS, p, c, content] = await Promise.all([
        api('/platform-settings'),
        api(`/tenants/${id}/marketing/settings`),
        api(`/tenants/${id}/marketing/projects`),
        api(`/tenants/${id}/marketing/connections`),
        api(`/tenants/${id}/marketing/content`),
      ]);
      setPlatformOn(platformS.data.automationEnabled);
      setTenantOn(tenantS.data.automationEnabled);
      setProjects(p.data);
      setConnections(c.data);
      setContent(content.data);
      if (p.data.length > 0 && !projectId) setProjectId(p.data[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant data');
    }
  }

  useEffect(() => {
    loadTenantData(tenantId);
  }, [tenantId]);

  async function togglePlatform() {
    const next = !platformOn;
    if (next && !confirm('Turn ON platform-wide AI marketing automation?')) return;
    try {
      await api('/platform-settings', { method: 'PATCH', body: JSON.stringify({ automationEnabled: next }) });
      setPlatformOn(next);
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  }

  async function toggleTenant() {
    const next = !tenantOn;
    if (next && !confirm('Turn ON automation for this tenant?')) return;
    try {
      await api(`/tenants/${tenantId}/marketing/settings`, { method: 'PATCH', body: JSON.stringify({ automationEnabled: next }) });
      setTenantOn(next);
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  }

  async function setAutonomy(id: string, autonomyMode: Project['autonomyMode']) {
    try {
      await api(`/tenants/${tenantId}/marketing/projects/${id}`, { method: 'PATCH', body: JSON.stringify({ autonomyMode }) });
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, autonomyMode } : p)));
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  }

  async function checkBuffer() {
    setConnectStep('checking');
    try {
      const res = await api(`/tenants/${tenantId}/marketing/connections/check`, { method: 'POST', body: JSON.stringify({ apiKey: bufferKey }) });
      setChannels(res.data.channels || []);
      setConnectStep('picking');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not verify this Buffer API key');
      setConnectStep('idle');
    }
  }

  async function saveConnection(ch: { id: string; name: string; service: string; organizationId: string }) {
    const platform = PLATFORMS.includes(ch.service) ? ch.service : 'facebook';
    try {
      await api(`/tenants/${tenantId}/marketing/connections`, {
        method: 'POST',
        body: JSON.stringify({ apiKey: bufferKey, platform, externalChannelId: ch.id, externalOrgId: ch.organizationId, accountName: ch.name }),
      });
      setBufferKey('');
      setChannels([]);
      setConnectStep('idle');
      loadTenantData(tenantId);
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to save connection'); }
  }

  async function removeConnection(id: string) {
    if (!confirm('Remove this social connection?')) return;
    try {
      await api(`/tenants/${tenantId}/marketing/connections/${id}`, { method: 'DELETE' });
      loadTenantData(tenantId);
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  }

  async function handleDraft(e: React.FormEvent) {
    e.preventDefault();
    setDrafting(true);
    setDraftMessage(null);
    try {
      await api(`/tenants/${tenantId}/marketing/content/draft`, { method: 'POST', body: JSON.stringify({ projectId, contentType, brief }) });
      setDraftMessage({ ok: true, text: 'Draft created and waiting for review below.' });
      setBrief('');
      loadTenantData(tenantId);
    } catch (err) {
      setDraftMessage({ ok: false, text: err instanceof Error ? err.message : 'Draft failed' });
    } finally { setDrafting(false); }
  }

  async function review(id: string, action: 'approve' | 'reject') {
    let body: string | undefined;
    if (action === 'reject') {
      const reason = prompt('Reason for rejecting this draft?');
      if (!reason) return;
      body = JSON.stringify({ reason });
    }
    try {
      await api(`/tenants/${tenantId}/marketing/content/${id}/${action}`, { method: 'POST', body });
      loadTenantData(tenantId);
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  }

  async function submitImage(contentId: string) {
    try {
      await api(`/tenants/${tenantId}/marketing/content/${contentId}/generate-image`, { method: 'POST', body: JSON.stringify({ prompt: imagePrompt }) });
      setImagePromptFor(null);
      setImagePrompt('');
      alert('Image generated and attached.');
    } catch (err) { alert(err instanceof Error ? err.message : 'Image generation failed'); }
  }

  async function submitSchedule(contentId: string) {
    if (!scheduleConnectionId || !scheduleTime) { alert('Pick a connection and a time'); return; }
    const conn = connections.find((c) => c.id === scheduleConnectionId);
    try {
      await api(`/tenants/${tenantId}/marketing/content/${contentId}/schedule`, {
        method: 'POST',
        body: JSON.stringify({ socialConnectionId: scheduleConnectionId, platform: conn?.platform, scheduledFor: new Date(scheduleTime).toISOString() }),
      });
      setSchedulingId(null);
      loadTenantData(tenantId);
    } catch (err) { alert(err instanceof Error ? err.message : 'Scheduling failed'); }
  }

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name || id;
  const pending = content.filter((c) => c.status === 'pending_approval');
  const approved = content.filter((c) => c.status === 'approved');
  const others = content.filter((c) => !['pending_approval', 'approved'].includes(c.status)).slice(0, 15);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-dark text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-gold" /> AI Marketing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {providerStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 bg-gray-50 rounded border">
            <span><StatusDot ok={providerStatus.ai.configured} />Claude</span>
            <span><StatusDot ok={providerStatus.socialPublisher.configured} />Buffer</span>
            <span><StatusDot ok={providerStatus.imageGeneration.configured} />fal.ai/Cloudinary</span>
            <span><StatusDot ok={providerStatus.scheduler.configured} />Scheduler</span>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
          <div>
            <p className="text-sm font-semibold">Platform automation (all tenants)</p>
            <p className="text-xs text-gray-500">{platformOn ? 'ON' : 'OFF'} — master switch</p>
          </div>
          <Button size="sm" variant={platformOn ? 'destructive' : 'outline'} onClick={togglePlatform}>
            <Power className="h-4 w-4 mr-2" />{platformOn ? 'Turn off' : 'Turn on'}
          </Button>
        </div>

        <div>
          <Label htmlFor="mk-tenant" className="text-xs">Tenant</Label>
          <select id="mk-tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full text-sm border rounded px-2 py-2">
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {tenantId && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
            <div>
              <p className="text-sm font-semibold">This tenant's automation</p>
              <p className="text-xs text-gray-500">{tenantOn ? 'ON' : 'OFF'}. Both switches must be on to publish.</p>
            </div>
            <Button size="sm" variant={tenantOn ? 'destructive' : 'outline'} onClick={toggleTenant}>
              <Power className="h-4 w-4 mr-2" />{tenantOn ? 'Turn off' : 'Turn on'}
            </Button>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold mb-2">Projects</p>
          <div className="space-y-2">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded border">
                <span>
                  <span className="font-medium">{p.name}</span>
                  {!p.websiteVerified && <span className="ml-2 text-xs text-orange-500">unverified URL</span>}
                </span>
                <select value={p.autonomyMode} onChange={(e) => setAutonomy(p.id, e.target.value as Project['autonomyMode'])} className="text-xs border rounded px-2 py-1">
                  <option value="MANUAL">MANUAL</option>
                  <option value="APPROVAL">APPROVAL</option>
                  <option value="AUTONOMOUS">AUTONOMOUS</option>
                </select>
              </div>
            ))}
            {projects.length === 0 && <p className="text-xs text-gray-400">No projects yet.</p>}
          </div>
        </div>

        <div className="pt-3 border-t">
          <p className="text-sm font-semibold mb-2 flex items-center gap-1"><Link2 className="h-4 w-4" /> Social connections (Buffer)</p>
          <div className="space-y-2 mb-2">
            {connections.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded border">
                <span>{c.platform}: {c.accountName} <span className="text-xs text-gray-400">({c.status})</span></span>
                <button onClick={() => removeConnection(c.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {connections.length === 0 && <p className="text-xs text-gray-400">No social connections yet.</p>}
          </div>
          {connectStep === 'idle' && (
            <div className="flex gap-2">
              <Input placeholder="Buffer API key" type="password" value={bufferKey} onChange={(e) => setBufferKey(e.target.value)} className="text-sm" />
              <Button size="sm" onClick={checkBuffer} disabled={bufferKey.length < 10}>Check</Button>
            </div>
          )}
          {connectStep === 'checking' && <p className="text-xs text-gray-400">Checking with Buffer…</p>}
          {connectStep === 'picking' && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Pick a channel to connect:</p>
              {channels.map((ch) => (
                <button key={ch.id} onClick={() => saveConnection(ch)} className="block w-full text-left text-sm p-2 bg-gray-50 hover:bg-gray-100 rounded border">
                  {ch.name} ({ch.service})
                </button>
              ))}
              {channels.length === 0 && <p className="text-xs text-gray-400">No channels found on this Buffer account.</p>}
            </div>
          )}
        </div>

        <form onSubmit={handleDraft} className="space-y-2 pt-3 border-t">
          <p className="text-sm font-semibold">Generate a draft</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full text-sm border rounded px-2 py-2">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full text-sm border rounded px-2 py-2">
              {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Textarea rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Brief, e.g. Announce our new UI/UX design service" required minLength={5} />
          {draftMessage && <p className={`text-xs ${draftMessage.ok ? 'text-green-600' : 'text-red-600'}`}>{draftMessage.text}</p>}
          <Button type="submit" size="sm" disabled={drafting || !projectId}>{drafting ? 'Generating…' : 'Generate draft'}</Button>
        </form>

        <div className="pt-3 border-t">
          <p className="text-sm font-semibold mb-2">Review queue {pending.length > 0 && <span className="text-orange-600 font-normal">({pending.length} pending)</span>}</p>
          <div className="space-y-3">
            {pending.map((c) => (
              <div key={c.id} className="p-3 bg-gray-50 rounded border text-sm">
                <p className="text-xs text-gray-500 mb-1">{projectName(c.projectId)} · {c.contentType}</p>
                <p className="whitespace-pre-wrap text-gray-800">{c.body}</p>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => review(c.id, 'approve')} className="text-green-600 hover:text-green-800 text-xs flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Approve</button>
                  <button onClick={() => review(c.id, 'reject')} className="text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1"><X className="h-3.5 w-3.5" /> Reject</button>
                </div>
              </div>
            ))}
            {pending.length === 0 && <p className="text-xs text-gray-400">Nothing waiting for review.</p>}
          </div>
        </div>

        {approved.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-sm font-semibold mb-2">Approved — add image / schedule</p>
            <div className="space-y-3">
              {approved.map((c) => (
                <div key={c.id} className="p-3 bg-gray-50 rounded border text-sm">
                  <p className="text-xs text-gray-500 mb-1">{projectName(c.projectId)} · {c.contentType}</p>
                  <p className="whitespace-pre-wrap text-gray-800 mb-2">{c.body}</p>
                  <div className="flex gap-3 text-xs">
                    <button onClick={() => setImagePromptFor(imagePromptFor === c.id ? null : c.id)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> Image</button>
                    <button onClick={() => setSchedulingId(schedulingId === c.id ? null : c.id)} className="text-purple-600 hover:text-purple-800 flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Schedule</button>
                  </div>
                  {imagePromptFor === c.id && (
                    <div className="mt-2 flex gap-2">
                      <Input placeholder="Image prompt" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} className="text-sm" />
                      <Button size="sm" onClick={() => submitImage(c.id)}>Generate</Button>
                    </div>
                  )}
                  {schedulingId === c.id && (
                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      <select value={scheduleConnectionId} onChange={(e) => setScheduleConnectionId(e.target.value)} className="text-xs border rounded px-2 py-1">
                        <option value="">Choose connection…</option>
                        {connections.map((conn) => <option key={conn.id} value={conn.id}>{conn.platform}: {conn.accountName}</option>)}
                      </select>
                      <input type="datetime-local" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="text-xs border rounded px-2 py-1" />
                      <Button size="sm" onClick={() => submitSchedule(c.id)}>Schedule</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-sm font-semibold mb-2">Recent</p>
            <div className="space-y-1">
              {others.map((c) => (
                <div key={c.id} className="text-xs text-gray-600 flex justify-between gap-3">
                  <span className="truncate">{projectName(c.projectId)}: {c.body.slice(0, 70)}</span>
                  <span className="font-semibold">{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
