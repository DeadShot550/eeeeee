import { useState } from 'react';
import { Pencil, Plus, School, Trash2, Users } from 'lucide-react';
import { PageHeader } from '../../components/PortalShell';
import { Button, Confirm, EmptyState, ErrorBox, Field, Input, Modal, Spinner, Textarea, useToast } from '../../components/ui';
import { api, errMsg } from '../../lib/api';
import type { SchoolClass } from '../../lib/types';
import { fmtMoney, stageOf } from '../../lib/utils';
import { IconBtn, useResource } from './shared';

type F = { name: string; level: string; section: string; teacher: string; room: string; capacity: string; age_range: string; annual_fee: string; description: string };
const blank: F = { name: '', level: '', section: 'A', teacher: '', room: '', capacity: '24', age_range: '', annual_fee: '', description: '' };

export default function ClassesAdmin() {
  const { data, loading, error, reload } = useResource<SchoolClass[]>('/api/admin?resource=classes');
  const [editing, setEditing] = useState<SchoolClass | 'new' | null>(null);
  const [form, setForm] = useState<F>(blank);
  const [err, setErr] = useState<Partial<F>>({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<SchoolClass | null>(null);
  const toast = useToast();

  const open = (c: SchoolClass | 'new') => {
    setErr({});
    setEditing(c);
    setForm(c === 'new' ? { ...blank, level: String((data?.length || 0)) } : { name: c.name, level: String(c.level), section: c.section, teacher: c.teacher, room: c.room, capacity: String(c.capacity), age_range: c.age_range, annual_fee: String(c.annual_fee), description: c.description });
  };
  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErr((x) => ({ ...x, [k]: undefined }));
  };
  const save = async () => {
    const e: Partial<F> = {};
    if (!form.name.trim()) e.name = 'Class name is required.';
    if (form.level === '' || isNaN(Number(form.level))) e.level = 'Level must be a number (0 = Nursery).';
    if (!form.capacity || Number(form.capacity) < 1) e.capacity = 'Capacity must be at least 1.';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const payload = { ...form, level: Number(form.level), capacity: Number(form.capacity), annual_fee: Number(form.annual_fee) || 0 };
    try {
      if (editing === 'new') await api('/api/admin?resource=classes', { method: 'POST', body: payload });
      else if (editing) await api('/api/admin?resource=classes', { method: 'PUT', body: { id: editing.id, ...payload } });
      toast.push({ title: editing === 'new' ? 'Class created' : 'Class updated', tone: 'success' });
      setEditing(null);
      await reload();
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
      await api('/api/admin?resource=classes', { method: 'DELETE', body: { id: del.id } });
      toast.push({ title: `${del.name} removed`, tone: 'info' });
      setDel(null);
      await reload();
    } catch (x) {
      toast.push({ title: 'Cannot delete', desc: errMsg(x), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Academic structure" title="Classes" description="Nursery through Class X. Levels control the order across the website and portals." actions={<Button variant="navy" onClick={() => open('new')} icon={<Plus className="w-4 h-4" />}>Add class</Button>} />
      {loading ? (
        <Spinner label="Loading classes" tone="light" />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState icon={<School className="w-5 h-5" />} title="No classes yet" action={<Button variant="navy" onClick={() => open('new')}>Add class</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((c) => {
            const pct = Math.min(100, Math.round(((c.student_count || 0) / Math.max(1, c.capacity)) * 100));
            return (
              <div key={c.id} className="rounded-2xl bg-white border border-navy/10 p-5 group hover:border-gold/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-gold-dark">{stageOf(c.level)} · Level {c.level}</p>
                    <p className="font-display text-3xl text-navy leading-tight">{c.name} <span className="text-navy/40 text-xl">· {c.section}</span></p>
                  </div>
                  <div className="flex opacity-70 group-hover:opacity-100">
                    <IconBtn onClick={() => open(c)} title="Edit"><Pencil /></IconBtn>
                    <IconBtn onClick={() => setDel(c)} title="Delete" tone="ruby"><Trash2 /></IconBtn>
                  </div>
                </div>
                <p className="text-sm text-navy/60 mt-2 line-clamp-2">{c.description}</p>
                <dl className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div><dt className="text-navy/45">Class teacher</dt><dd className="text-navy">{c.teacher || '—'}</dd></div>
                  <div><dt className="text-navy/45">Room</dt><dd className="text-navy">{c.room || '—'}</dd></div>
                  <div><dt className="text-navy/45">Ages</dt><dd className="text-navy">{c.age_range || '—'}</dd></div>
                  <div><dt className="text-navy/45">Annual fee</dt><dd className="text-navy">{fmtMoney(c.annual_fee)}</dd></div>
                </dl>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-navy/60 mb-1">
                    <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.student_count} / {c.capacity} seats</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-navy/8 overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-ruby' : pct >= 80 ? 'bg-amber' : 'bg-gold'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add class' : `Edit ${editing ? editing.name : ''}`} width="max-w-xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Class name" tone="light" error={err.name}><Input tone="light" value={form.name} onChange={set('name')} placeholder="e.g. Class 4" /></Field>
          <Field label="Level (order)" tone="light" error={err.level} hint="0 = Nursery, 1 = LKG, 2 = Prep, 3 = Class 1 …"><Input tone="light" type="number" value={form.level} onChange={set('level')} /></Field>
          <Field label="Section" tone="light"><Input tone="light" value={form.section} onChange={set('section')} /></Field>
          <Field label="Class teacher" tone="light"><Input tone="light" value={form.teacher} onChange={set('teacher')} /></Field>
          <Field label="Room" tone="light"><Input tone="light" value={form.room} onChange={set('room')} /></Field>
          <Field label="Capacity" tone="light" error={err.capacity}><Input tone="light" type="number" min={1} value={form.capacity} onChange={set('capacity')} /></Field>
          <Field label="Age range" tone="light"><Input tone="light" value={form.age_range} onChange={set('age_range')} placeholder="e.g. 8 – 9 yrs" /></Field>
          <Field label="Annual fee (₹)" tone="light"><Input tone="light" type="number" min={0} value={form.annual_fee} onChange={set('annual_fee')} /></Field>
          <Field label="Description" tone="light" className="sm:col-span-2"><Textarea tone="light" value={form.description} onChange={set('description')} className="min-h-[70px]" /></Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="soft" onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="navy" onClick={save} loading={busy}>{editing === 'new' ? 'Create class' : 'Save changes'}</Button>
        </div>
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} danger title={`Delete ${del?.name}?`} message="Its syllabus and timetable are removed too. Classes with enrolled students cannot be deleted." confirmLabel="Delete class" />
    </div>
  );
}
