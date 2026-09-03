import { useEffect, useState } from 'react';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/PortalShell';
import { Badge, Button, Confirm, EmptyState, ErrorBox, Field, Input, Modal, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { api, errMsg } from '../../lib/api';
import type { SchoolClass, Syllabus } from '../../lib/types';
import { TERMS } from '../../lib/utils';
import { IconBtn, useResource } from './shared';

type F = { subject: string; term: string; description: string; topics: string };
const blank: F = { subject: '', term: 'Term I', description: '', topics: '' };

export default function SyllabusAdmin() {
  const classes = useResource<SchoolClass[]>('/api/admin?resource=classes');
  const [classId, setClassId] = useState('');
  useEffect(() => {
    if (!classId && classes.data?.length) setClassId(String(classes.data[0].id));
  }, [classes.data, classId]);
  const syllabus = useResource<Syllabus[]>(`/api/admin?resource=syllabus&class_id=${classId}`, !!classId);
  const [editing, setEditing] = useState<Syllabus | 'new' | null>(null);
  const [form, setForm] = useState<F>(blank);
  const [err, setErr] = useState<Partial<F>>({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Syllabus | null>(null);
  const toast = useToast();

  const open = (s: Syllabus | 'new') => {
    setErr({});
    setEditing(s);
    setForm(s === 'new' ? blank : { subject: s.subject, term: s.term, description: s.description, topics: s.topics.join('\n') });
  };
  const save = async () => {
    const e: Partial<F> = {};
    if (!form.subject.trim()) e.subject = 'Subject is required.';
    const topics = form.topics.split('\n').map((t) => t.trim()).filter(Boolean);
    if (!topics.length) e.topics = 'Add at least one topic (one per line).';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const payload = { class_id: Number(classId), subject: form.subject.trim(), term: form.term, description: form.description, topics };
    try {
      if (editing === 'new') await api('/api/admin?resource=syllabus', { method: 'POST', body: payload });
      else if (editing) await api('/api/admin?resource=syllabus', { method: 'PUT', body: { id: editing.id, ...payload } });
      toast.push({ title: 'Syllabus published', tone: 'success' });
      setEditing(null);
      await syllabus.reload();
    } catch (x) {
      toast.push({ title: 'Could not save', desc: errMsg(x), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try {
      await api('/api/admin?resource=syllabus', { method: 'DELETE', body: { id: del.id } });
      setDel(null);
      await syllabus.reload();
    } catch (x) {
      toast.push({ title: 'Delete failed', desc: errMsg(x), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const cls = classes.data?.find((c) => String(c.id) === classId);

  return (
    <div>
      <PageHeader eyebrow="Curriculum" title="Syllabus" description="Publish subject-wise syllabi. Students see these instantly in their portal." actions={<Button variant="navy" onClick={() => open('new')} disabled={!classId} icon={<Plus className="w-4 h-4" />}>Add subject</Button>} />
      <div className="flex flex-wrap gap-2 mb-6">
        {classes.data?.map((c) => (
          <button key={c.id} onClick={() => setClassId(String(c.id))} className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${String(c.id) === classId ? 'bg-navy text-gold border-navy' : 'border-navy/15 text-navy/60 hover:border-navy/40'}`}>
            {c.name}
          </button>
        ))}
      </div>
      {syllabus.loading || classes.loading ? (
        <Spinner label="Loading syllabus" tone="light" />
      ) : syllabus.error ? (
        <ErrorBox message={syllabus.error} onRetry={syllabus.reload} />
      ) : !syllabus.data?.length ? (
        <EmptyState icon={<BookOpen className="w-5 h-5" />} title={`No syllabus for ${cls?.name || 'this class'}`} hint="Add the first subject to publish it to students." action={<Button variant="navy" onClick={() => open('new')}>Add subject</Button>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {syllabus.data.map((s) => (
            <div key={s.id} className="rounded-2xl bg-white border border-navy/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl text-navy">{s.subject}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge tone="gold">{s.term}</Badge>
                    <Badge tone="navy">{s.topics.length} topics</Badge>
                  </div>
                </div>
                <div className="flex">
                  <IconBtn onClick={() => open(s)} title="Edit"><Pencil /></IconBtn>
                  <IconBtn onClick={() => setDel(s)} title="Delete" tone="ruby"><Trash2 /></IconBtn>
                </div>
              </div>
              {s.description && <p className="text-sm text-navy/60 mt-3">{s.description}</p>}
              <ol className="mt-3 space-y-1 text-sm text-navy/80 list-decimal list-inside marker:text-gold-dark">
                {s.topics.slice(0, 6).map((t, i) => <li key={i}>{t}</li>)}
                {s.topics.length > 6 && <li className="list-none text-xs text-navy/45">+{s.topics.length - 6} more</li>}
              </ol>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? `Add subject · ${cls?.name}` : `Edit ${editing ? editing.subject : ''}`} width="max-w-xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Subject" tone="light" error={err.subject}><Input tone="light" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" /></Field>
          <Field label="Term" tone="light"><Select tone="light" value={form.term} onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}>{TERMS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Description" tone="light" className="sm:col-span-2"><Input tone="light" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short overview" /></Field>
          <Field label="Topics (one per line)" tone="light" error={err.topics} className="sm:col-span-2"><Textarea tone="light" value={form.topics} onChange={(e) => setForm((f) => ({ ...f, topics: e.target.value }))} className="min-h-[160px] font-mono text-xs" placeholder={'Fractions and decimals\nGeometry: angles and triangles\nData handling'} /></Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="soft" onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="navy" onClick={save} loading={busy}>Publish</Button>
        </div>
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} danger title={`Remove ${del?.subject}?`} message="Students will no longer see this subject syllabus." confirmLabel="Remove" />
    </div>
  );
}
