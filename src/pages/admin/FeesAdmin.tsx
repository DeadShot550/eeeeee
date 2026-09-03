import { useMemo, useState } from 'react';
import { CreditCard, Plus, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import { PageHeader, StatCard } from '../../components/PortalShell';
import { Badge, Button, Confirm, EmptyState, ErrorBox, Field, Input, Modal, Select, Spinner, useToast } from '../../components/ui';
import { api, errMsg } from '../../lib/api';
import type { Fee, SchoolClass, Student } from '../../lib/types';
import { fmtDate, fmtMoney } from '../../lib/utils';
import { FilterPill, IconBtn, SearchBox, Table, td, useResource } from './shared';

type F = { mode: 'student' | 'class'; student_id: string; class_id: string; title: string; amount: string; due_date: string };
const blank: F = { mode: 'student', student_id: '', class_id: '', title: '', amount: '', due_date: '' };

export default function FeesAdmin() {
  const fees = useResource<Fee[]>('/api/admin?resource=fees');
  const students = useResource<Student[]>('/api/admin?resource=students');
  const classes = useResource<SchoolClass[]>('/api/admin?resource=classes');
  const [status, setStatus] = useState<'all' | 'due' | 'paid'>('all');
  const [classId, setClassId] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(blank);
  const [err, setErr] = useState<Partial<F>>({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Fee | null>(null);
  const toast = useToast();

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return (fees.data || []).filter((f) => (status === 'all' || f.status === status) && (classId === 'all' || String(f.class_id) === classId) && (!s || f.student_name?.toLowerCase().includes(s) || f.title.toLowerCase().includes(s) || f.admission_no?.toLowerCase().includes(s)));
  }, [fees.data, status, classId, q]);
  const due = (fees.data || []).filter((f) => f.status === 'due').reduce((a, f) => a + Number(f.amount), 0);
  const paid = (fees.data || []).filter((f) => f.status === 'paid').reduce((a, f) => a + Number(f.amount), 0);

  const issue = async () => {
    const e: Partial<F> = {};
    if (!form.title.trim()) e.title = 'Fee title is required.';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a valid amount.';
    if (form.mode === 'student' && !form.student_id) e.student_id = 'Choose a student.';
    if (form.mode === 'class' && !form.class_id) e.class_id = 'Choose a class.';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const body = form.mode === 'student' ? { student_id: Number(form.student_id), title: form.title.trim(), amount: Number(form.amount), due_date: form.due_date || null, status: 'due' } : { class_id: Number(form.class_id), title: form.title.trim(), amount: Number(form.amount), due_date: form.due_date || null };
      const res = await api<{ count?: number }>('/api/admin?resource=fees', { method: 'POST', body });
      toast.push({ title: form.mode === 'class' ? `Fee issued to ${res.count} students` : 'Fee issued', tone: 'success' });
      setOpen(false);
      setForm(blank);
      await fees.reload();
    } catch (x) {
      toast.push({ title: 'Could not issue fee', desc: errMsg(x), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (f: Fee) => {
    try {
      await api('/api/admin?resource=fees', { method: 'PUT', body: { id: f.id, status: f.status === 'paid' ? 'due' : 'paid', paid_at: f.status === 'paid' ? null : new Date().toISOString() } });
      await fees.reload();
    } catch (x) {
      toast.push({ title: 'Update failed', desc: errMsg(x), tone: 'error' });
    }
  };
  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try {
      await api('/api/admin?resource=fees', { method: 'DELETE', body: { id: del.id } });
      setDel(null);
      await fees.reload();
    } catch (x) {
      toast.push({ title: 'Delete failed', desc: errMsg(x), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Accounts" title="Fees" description="Issue fees to a scholar or an entire class, and reconcile payments." actions={<><SearchBox value={q} onChange={setQ} placeholder="Search student or fee" /><Button variant="navy" onClick={() => setOpen(true)} icon={<Plus className="w-4 h-4" />}>Issue fee</Button></>} />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Outstanding" value={fmtMoney(due)} accent="ruby" icon={<CreditCard />} hint={`${(fees.data || []).filter((f) => f.status === 'due').length} records`} />
        <StatCard label="Collected" value={fmtMoney(paid)} accent="emerald" icon={<CheckCircle2 />} hint={`${(fees.data || []).filter((f) => f.status === 'paid').length} receipts`} />
        <StatCard label="Collection rate" value={`${due + paid ? Math.round((paid / (due + paid)) * 100) : 0}%`} accent="gold" hint="of billed amount" />
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['all', 'due', 'paid'] as const).map((s) => <FilterPill key={s} active={status === s} onClick={() => setStatus(s)}>{s}</FilterPill>)}
        <Select tone="light" value={classId} onChange={(e) => setClassId(e.target.value)} className="w-48 !py-1.5">
          <option value="all">All classes</option>
          {classes.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      {fees.loading ? (
        <Spinner label="Loading fees" tone="light" />
      ) : fees.error ? (
        <ErrorBox message={fees.error} onRetry={fees.reload} />
      ) : list.length === 0 ? (
        <EmptyState icon={<CreditCard className="w-5 h-5" />} title="No fee records" hint="Issue a fee to get started." />
      ) : (
        <Table head={['Student', 'Fee', 'Amount', 'Due', 'Status', '']}>
          {list.map((f) => (
            <tr key={f.id} className="hover:bg-paper/60">
              <td className={td}><p className="font-medium">{f.student_name}</p><p className="text-[11px] text-navy/50">{f.class_name} · {f.admission_no}</p></td>
              <td className={td}>{f.title}</td>
              <td className={`${td} font-display text-lg`}>{fmtMoney(f.amount)}</td>
              <td className={td}>{fmtDate(f.due_date)}</td>
              <td className={td}><Badge tone={f.status === 'paid' ? 'emerald' : 'ruby'}>{f.status}</Badge>{f.paid_at && <p className="text-[10px] text-navy/45 mt-0.5">{fmtDate(f.paid_at)}</p>}</td>
              <td className={`${td} text-right whitespace-nowrap`}>
                <IconBtn onClick={() => toggle(f)} title={f.status === 'paid' ? 'Mark as due' : 'Mark as paid'} tone={f.status === 'paid' ? 'navy' : 'gold'}>{f.status === 'paid' ? <RotateCcw /> : <CheckCircle2 />}</IconBtn>
                <IconBtn onClick={() => setDel(f)} title="Delete" tone="ruby"><Trash2 /></IconBtn>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Issue fee" subtitle="Bill a single scholar or every student in a class." width="max-w-lg">
        <div className="inline-flex p-1 rounded-full border border-navy/15 bg-paper mb-5">
          {(['student', 'class'] as const).map((m) => <button key={m} onClick={() => setForm((f) => ({ ...f, mode: m }))} className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider ${form.mode === m ? 'bg-navy text-gold' : 'text-navy/60'}`}>{m === 'student' ? 'Single student' : 'Entire class'}</button>)}
        </div>
        <div className="grid gap-4">
          {form.mode === 'student' ? (
            <Field label="Student" tone="light" error={err.student_id}><Select tone="light" value={form.student_id} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}><option value="">Choose…</option>{students.data?.map((s) => <option key={s.id} value={s.id}>{s.full_name} · {s.class?.name} · {s.admission_no}</option>)}</Select></Field>
          ) : (
            <Field label="Class" tone="light" error={err.class_id}><Select tone="light" value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}><option value="">Choose…</option>{classes.data?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.student_count} students)</option>)}</Select></Field>
          )}
          <Field label="Fee title" tone="light" error={err.title}><Input tone="light" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Tuition Fee – Term II" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (₹)" tone="light" error={err.amount}><Input tone="light" type="number" min={1} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></Field>
            <Field label="Due date" tone="light"><Input tone="light" type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} /></Field>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="soft" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="navy" onClick={issue} loading={busy}>Issue fee</Button>
        </div>
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} danger title="Delete fee record?" message={`Remove “${del?.title}” for ${del?.student_name}? This cannot be undone.`} confirmLabel="Delete" />
    </div>
  );
}
