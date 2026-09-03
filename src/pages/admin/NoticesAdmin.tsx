import { useState } from 'react';
import { Bell, Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/PortalShell';
import { Badge, Button, Confirm, EmptyState, ErrorBox, Field, Input, Modal, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { api, errMsg } from '../../lib/api';
import type { Notice, SchoolClass } from '../../lib/types';
import { fmtDateTime } from '../../lib/utils';
import { IconBtn, useResource } from './shared';

type F = { title: string; body: string; audience: string; class_id: string; pinned: boolean };
const blank: F = { title: '', body: '', audience: 'all', class_id: '', pinned: false };

export default function NoticesAdmin() {
  const notices = useResource<Notice[]>('/api/admin?resource=notices');
  const classes = useResource<SchoolClass[]>('/api/admin?resource=classes');
  const [editing, setEditing] = useState<Notice | 'new' | null>(null);
  const [form, setForm] = useState<F>(blank);
  const [err, setErr] = useState<Partial<Record<keyof F, string>>>({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Notice | null>(null);
  const toast = useToast();
  const audienceLabel = (n: Notice) => (n.audience === 'all' ? 'Public · whole school' : n.audience === 'students' ? 'All students' : classes.data?.find((c) => c.id === n.class_id)?.name || 'Class');

  const open = (n: Notice | 'new') => {
    setErr({});
    setEditing(n);
    setForm(n === 'new' ? blank : { title: n.title, body: n.body, audience: n.audience === 'class' ? 'class' : n.audience, class_id: n.class_id ? String(n.class_id) : '', pinned: n.pinned });
  };
  const save = async () => {
    const e: Partial<Record<keyof F, string>> = {};
    if (!form.title.trim() || !form.body.trim()) e.title = 'A notice needs both a title and a message.';
    if (form.audience === 'class' && !form.class_id) e.class_id = 'Choose a class.';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const payload = { title: form.title.trim(), body: form.body.trim(), audience: form.audience, class_id: form.audience === 'class' ? Number(form.class_id) : null, pinned: form.pinned };
    try {
      if (editing === 'new') await api('/api/admin?resource=notices', { method: 'POST', body: payload });
      else if (editing) await api('/api/admin?resource=notices', { method: 'PUT', body: { id: editing.id, ...payload } });
      toast.push({ title: `Notice published to ${form.audience === 'all' ? 'the whole school' : form.audience === 'students' ? 'all students' : classes.data?.find((c) => String(c.id) === form.class_id)?.name}`, tone: 'success' });
      setEditing(null);
      await notices.reload();
    } catch (x) {
      toast.push({ title: 'Could not publish', desc: errMsg(x), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try {
      await api('/api/admin?resource=notices', { method: 'DELETE', body: { id: del.id } });
      setDel(null);
      await notices.reload();
    } catch (x) {
      toast.push({ title: 'Delete failed', desc: errMsg(x), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Communications" title="Notices" description="Public notices appear on the website; student and class notices appear in the portals." actions={<Button variant="navy" onClick={() => open('new')} icon={<Plus className="w-4 h-4" />}>New notice</Button>} />
      {notices.loading ? (
        <Spinner label="Loading notices" tone="light" />
      ) : notices.error ? (
        <ErrorBox message={notices.error} onRetry={notices.reload} />
      ) : !notices.data?.length ? (
        <EmptyState icon={<Bell className="w-5 h-5" />} title="No notices yet" action={<Button variant="navy" onClick={() => open('new')}>New notice</Button>} />
      ) : (
        <div className="space-y-3">
          {notices.data.map((n) => (
            <div key={n.id} className={`rounded-2xl bg-white border p-5 ${n.pinned ? 'border-gold/50' : 'border-navy/10'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl text-navy flex items-center gap-2">{n.pinned && <Pin className="w-4 h-4 text-gold-dark" />}{n.title}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5"><Badge tone="navy">{audienceLabel(n)}</Badge><span className="text-[11px] text-navy/45 self-center">{fmtDateTime(n.created_at)}</span></div>
                </div>
                <div className="flex">
                  <IconBtn onClick={() => open(n)} title="Edit"><Pencil /></IconBtn>
                  <IconBtn onClick={() => setDel(n)} title="Delete" tone="ruby"><Trash2 /></IconBtn>
                </div>
              </div>
              <p className="text-sm text-navy/70 mt-3 whitespace-pre-line">{n.body}</p>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New notice' : 'Edit notice'} width="max-w-xl">
        <div className="grid gap-4">
          <Field label="Title" tone="light" error={err.title}><Input tone="light" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Message" tone="light"><Textarea tone="light" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Write the full notice…" className="min-h-[120px]" /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Audience" tone="light"><Select tone="light" value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}><option value="all">Public · website & all portals</option><option value="students">All students (portal only)</option><option value="class">A specific class</option></Select></Field>
            {form.audience === 'class' && (
              <Field label="Class" tone="light" error={err.class_id}><Select tone="light" value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}><option value="">Choose…</option>{classes.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
            )}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-navy"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))} className="accent-[#c9a961] w-4 h-4" /> Pin to top</label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="soft" onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="navy" onClick={save} loading={busy}>Publish</Button>
        </div>
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} danger title="Delete notice?" message={`Remove “${del?.title}” from the website and portals.`} confirmLabel="Delete" />
    </div>
  );
}
