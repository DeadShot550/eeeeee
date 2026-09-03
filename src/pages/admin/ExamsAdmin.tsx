import { useState } from 'react';
import { CalendarDays, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/PortalShell';
import { Badge, Button, Confirm, EmptyState, ErrorBox, Field, Input, Modal, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { api, errMsg } from '../../lib/api';
import type { Exam, SchoolClass } from '../../lib/types';
import { fmtDate, TERMS, todayISO } from '../../lib/utils';
import { IconBtn, useResource } from './shared';

type F = { title: string; term: string; start_date: string; end_date: string; class_id: string; description: string };
const blank: F = { title: '', term: 'Term I', start_date: '', end_date: '', class_id: '', description: '' };

export default function ExamsAdmin() {
  const exams = useResource<Exam[]>('/api/admin?resource=exams');
  const classes = useResource<SchoolClass[]>('/api/admin?resource=classes');
  const [editing, setEditing] = useState<Exam | 'new' | null>(null);
  const [form, setForm] = useState<F>(blank);
  const [err, setErr] = useState<Partial<F>>({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Exam | null>(null);
  const toast = useToast();
  const cname = (id: number | null) => (id ? classes.data?.find((c) => c.id === id)?.name || '—' : 'All classes');

  const open = (e: Exam | 'new') => {
    setErr({});
    setEditing(e);
    setForm(e === 'new' ? blank : { title: e.title, term: e.term, start_date: e.start_date, end_date: e.end_date, class_id: e.class_id ? String(e.class_id) : '', description: e.description });
  };
  const set = (k: keyof F) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: ev.target.value }));
    setErr((x) => ({ ...x, [k]: undefined }));
  };
  const save = async () => {
    const e: Partial<F> = {};
    if (!form.title.trim()) e.title = 'Enter the examination title.';
    if (!form.start_date) e.start_date = 'Start date required.';
    if (!form.end_date) e.end_date = 'End date required.';
    if (form.start_date && form.end_date && form.end_date < form.start_date) e.end_date = 'End date must be after start.';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const payload = { title: form.title.trim(), term: form.term, start_date: form.start_date, end_date: form.end_date, class_id: form.class_id ? Number(form.class_id) : null, description: form.description };
    try {
      if (editing === 'new') await api('/api/admin?resource=exams', { method: 'POST', body: payload });
      else if (editing) await api('/api/admin?resource=exams', { method: 'PUT', body: { id: editing.id, ...payload } });
      toast.push({ title: editing === 'new' ? 'Examination scheduled' : 'Examination updated', tone: 'success' });
      setEditing(null);
      await exams.reload();
    } catch (x) {
      toast.push({ title: 'Could not schedule the exam.', desc: errMsg(x), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try {
      await api('/api/admin?resource=exams', { method: 'DELETE', body: { id: del.id } });
      setDel(null);
      await exams.reload();
    } catch (x) {
      toast.push({ title: 'Delete failed', desc: errMsg(x), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const status = (e: Exam) => (e.end_date < todayISO() ? { l: 'Completed', t: 'mist' as const } : e.start_date <= todayISO() ? { l: 'Ongoing', t: 'amber' as const } : { l: 'Upcoming', t: 'emerald' as const });

  return (
    <div>
      <PageHeader eyebrow="Examination office" title="Examinations" description="Schedule examinations for the whole school or a specific class, then enter marks under Results." actions={<Button variant="navy" onClick={() => open('new')} icon={<Plus className="w-4 h-4" />}>Schedule exam</Button>} />
      {exams.loading ? (
        <Spinner label="Loading examinations" tone="light" />
      ) : exams.error ? (
        <ErrorBox message={exams.error} onRetry={exams.reload} />
      ) : !exams.data?.length ? (
        <EmptyState icon={<ClipboardList className="w-5 h-5" />} title="No exam scheduled" action={<Button variant="navy" onClick={() => open('new')}>Schedule exam</Button>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {exams.data.map((e) => {
            const st = status(e);
            return (
              <div key={e.id} className="rounded-2xl bg-white border border-navy/10 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-gold-dark">{e.term} · {cname(e.class_id)}</p>
                    <p className="font-display text-2xl text-navy mt-0.5">{e.title}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge tone={st.t}>{st.l}</Badge>
                    <IconBtn onClick={() => open(e)} title="Edit"><Pencil /></IconBtn>
                    <IconBtn onClick={() => setDel(e)} title="Delete" tone="ruby"><Trash2 /></IconBtn>
                  </div>
                </div>
                {e.description && <p className="text-sm text-navy/60 mt-3">{e.description}</p>}
                <p className="mt-3 text-xs text-navy/60 inline-flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {fmtDate(e.start_date)} – {fmtDate(e.end_date)}</p>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Schedule examination' : 'Edit examination'} width="max-w-xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title" tone="light" error={err.title} className="sm:col-span-2"><Input tone="light" value={form.title} onChange={set('title')} placeholder="e.g. Mid-Term Examination" /></Field>
          <Field label="Term" tone="light"><Select tone="light" value={form.term} onChange={set('term')}>{TERMS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Class" tone="light"><Select tone="light" value={form.class_id} onChange={set('class_id')}><option value="">All classes</option>{classes.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Start date" tone="light" error={err.start_date}><Input tone="light" type="date" value={form.start_date} onChange={set('start_date')} /></Field>
          <Field label="End date" tone="light" error={err.end_date}><Input tone="light" type="date" value={form.end_date} onChange={set('end_date')} /></Field>
          <Field label="Description" tone="light" className="sm:col-span-2"><Textarea tone="light" value={form.description} onChange={set('description')} className="min-h-[70px]" /></Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="soft" onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="navy" onClick={save} loading={busy}>{editing === 'new' ? 'Schedule' : 'Save changes'}</Button>
        </div>
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} danger title={`Delete ${del?.title}?`} message="All results entered for this examination will be deleted as well." confirmLabel="Delete exam" />
    </div>
  );
}
