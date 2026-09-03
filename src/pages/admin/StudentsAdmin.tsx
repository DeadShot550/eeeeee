import { useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '../../components/PortalShell';
import { Badge, Button, Confirm, EmptyState, ErrorBox, Field, Input, Modal, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { api, errMsg } from '../../lib/api';
import type { SchoolClass, Student } from '../../lib/types';
import { BLOOD_GROUPS, GENDERS } from '../../lib/utils';
import { CredentialsModal, IconBtn, SearchBox, Table, td, useResource, type Credentials } from './shared';

type FormState = {
  full_name: string;
  class_id: string;
  roll_no: string;
  admission_no: string;
  username: string;
  dob: string;
  gender: string;
  blood_group: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  address: string;
  status: string;
};
const blank: FormState = { full_name: '', class_id: '', roll_no: '', admission_no: '', username: '', dob: '', gender: '', blood_group: '', guardian_name: '', guardian_phone: '', guardian_email: '', address: '', status: 'active' };

export default function StudentsAdmin() {
  const students = useResource<Student[]>('/api/admin?resource=students');
  const classes = useResource<SchoolClass[]>('/api/admin?resource=classes');
  const [q, setQ] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [showPw, setShowPw] = useState<Record<number, boolean>>({});
  const [editing, setEditing] = useState<Student | null | 'new'>(null);
  const [form, setForm] = useState<FormState>(blank);
  const [formErr, setFormErr] = useState<Partial<FormState>>({});
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ type: 'delete' | 'reset'; s: Student } | null>(null);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const toast = useToast();

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return (students.data || []).filter((st) => (classFilter === 'all' || String(st.class_id) === classFilter) && (!s || st.full_name.toLowerCase().includes(s) || st.username.toLowerCase().includes(s) || st.admission_no.toLowerCase().includes(s) || st.guardian_name.toLowerCase().includes(s)));
  }, [students.data, q, classFilter]);

  const open = (s: Student | 'new') => {
    setEditing(s);
    setFormErr({});
    setForm(s === 'new' ? { ...blank, class_id: classFilter !== 'all' ? classFilter : '' } : { full_name: s.full_name, class_id: String(s.class_id), roll_no: String(s.roll_no), admission_no: s.admission_no, username: s.username, dob: s.dob || '', gender: s.gender || '', blood_group: s.blood_group || '', guardian_name: s.guardian_name || '', guardian_phone: s.guardian_phone || '', guardian_email: s.guardian_email || '', address: s.address || '', status: s.status });
  };
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setFormErr((er) => ({ ...er, [k]: undefined }));
  };

  const save = async () => {
    const er: Partial<FormState> = {};
    if (form.full_name.trim().length < 2) er.full_name = 'Full name is required.';
    if (!form.class_id) er.class_id = 'Choose a class.';
    if (editing !== 'new' && form.username.trim().length < 3) er.username = 'Username must be at least 3 characters.';
    if (form.guardian_email && !/^\S+@\S+\.\S+$/.test(form.guardian_email)) er.guardian_email = 'Invalid email.';
    setFormErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      if (editing === 'new') {
        const created = await api<Student>('/api/admin?resource=students', { method: 'POST', body: { ...form, class_id: Number(form.class_id), roll_no: form.roll_no ? Number(form.roll_no) : undefined } });
        toast.push({ title: 'Student added and login credentials created.', tone: 'success' });
        setCreds({ username: created.username, password: created.password || '', admission_no: created.admission_no, full_name: created.full_name });
      } else if (editing) {
        await api('/api/admin?resource=students', { method: 'PUT', body: { id: editing.id, ...form, class_id: Number(form.class_id), roll_no: Number(form.roll_no) || editing.roll_no } });
        toast.push({ title: 'Student updated', tone: 'success' });
      }
      setEditing(null);
      await students.reload();
    } catch (e) {
      toast.push({ title: 'Could not save', desc: errMsg(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const doConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.type === 'delete') {
        await api('/api/admin?resource=students', { method: 'DELETE', body: { id: confirm.s.id } });
        toast.push({ title: `${confirm.s.full_name} removed`, tone: 'info' });
      } else {
        const updated = await api<Student>('/api/admin?resource=students&action=reset-password', { method: 'POST', body: { id: confirm.s.id } });
        toast.push({ title: 'New password generated. Share it with the parent.', tone: 'success' });
        setCreds({ username: updated.username, password: updated.password || '', admission_no: updated.admission_no, full_name: updated.full_name });
      }
      setConfirm(null);
      await students.reload();
    } catch (e) {
      toast.push({ title: 'Action failed', desc: errMsg(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Registry"
        title="Students"
        description={`${students.data?.length ?? 0} enrolled · credentials managed here`}
        actions={
          <>
            <SearchBox value={q} onChange={setQ} placeholder="Search name, username or admission no." />
            <Button variant="navy" onClick={() => open('new')} icon={<UserPlus className="w-4 h-4" />}>
              Add student
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Select tone="light" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-56">
          <option value="all">All classes</option>
          {classes.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.student_count})
            </option>
          ))}
        </Select>
        <span className="text-xs text-navy/50">{list.length} shown</span>
      </div>

      {students.loading ? (
        <Spinner label="Loading students" tone="light" />
      ) : students.error ? (
        <ErrorBox message={students.error} onRetry={students.reload} />
      ) : list.length === 0 ? (
        <EmptyState icon={<Users className="w-5 h-5" />} title={students.data?.length ? 'No students match' : 'No students yet'} hint={students.data?.length ? 'Try a different search or class filter.' : 'Add your first student to issue them a unique login.'} action={<Button variant="navy" onClick={() => open('new')}>Add student</Button>} />
      ) : (
        <Table head={['Student', 'Class', 'Login', 'Guardian', 'Status', '']}>
          {list.map((s) => (
            <tr key={s.id} className="hover:bg-paper/60">
              <td className={td}>
                <p className="font-medium">{s.full_name}</p>
                <p className="text-[11px] text-navy/50 font-mono">{s.admission_no}</p>
              </td>
              <td className={td}>
                <p>{s.class?.name || '—'}</p>
                <p className="text-[11px] text-navy/50">Roll {s.roll_no}{s.class?.section ? ` · Sec ${s.class.section}` : ''}</p>
              </td>
              <td className={td}>
                <p className="font-mono text-xs">{s.username}</p>
                <p className="font-mono text-xs text-navy/60 inline-flex items-center gap-1">
                  {showPw[s.id] ? s.password : '••••••••'}
                  <button onClick={() => setShowPw((p) => ({ ...p, [s.id]: !p[s.id] }))} className="text-navy/40 hover:text-navy" aria-label={showPw[s.id] ? 'Hide password' : 'Show password'}>
                    {showPw[s.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </p>
              </td>
              <td className={td}>
                <p>{s.guardian_name || '—'}</p>
                <p className="text-[11px] text-navy/50">{s.guardian_phone}</p>
              </td>
              <td className={td}>
                <Badge tone={s.status === 'active' ? 'emerald' : 'mist'}>{s.status}</Badge>
              </td>
              <td className={`${td} text-right whitespace-nowrap`}>
                <IconBtn onClick={() => open(s)} title="Edit"><Pencil /></IconBtn>
                <IconBtn onClick={() => setConfirm({ type: 'reset', s })} title="Reset password" tone="gold"><KeyRound /></IconBtn>
                <IconBtn onClick={() => setConfirm({ type: 'delete', s })} title="Delete" tone="ruby"><Trash2 /></IconBtn>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add student' : 'Edit student'} subtitle={editing === 'new' ? 'Creates a unique login automatically.' : editing ? `${editing.admission_no} · ${editing.username}` : ''} width="max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" tone="light" error={formErr.full_name} className="sm:col-span-2">
            <Input tone="light" value={form.full_name} onChange={set('full_name')} placeholder="e.g. Ishaan Verma" />
          </Field>
          <Field label="Class" tone="light" error={formErr.class_id}>
            <Select tone="light" value={form.class_id} onChange={set('class_id')}>
              <option value="">Choose…</option>
              {classes.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Roll no." tone="light" hint={editing === 'new' ? 'Leave blank to auto-assign' : undefined}>
            <Input tone="light" type="number" min={1} value={form.roll_no} onChange={set('roll_no')} />
          </Field>
          {editing === 'new' ? (
            <Field label="Admission no. (optional)" tone="light" hint="Auto-generated if left blank">
              <Input tone="light" value={form.admission_no} onChange={set('admission_no')} placeholder="AUR-2026-0001" />
            </Field>
          ) : (
            <>
              <Field label="Username" tone="light" error={formErr.username}>
                <Input tone="light" value={form.username} onChange={set('username')} />
              </Field>
              <Field label="Admission no." tone="light">
                <Input tone="light" value={form.admission_no} onChange={set('admission_no')} />
              </Field>
              <Field label="Status" tone="light">
                <Select tone="light" value={form.status} onChange={set('status')}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive (login disabled)</option>
                </Select>
              </Field>
            </>
          )}
          <Field label="Date of birth" tone="light">
            <Input tone="light" type="date" value={form.dob} onChange={set('dob')} />
          </Field>
          <Field label="Gender" tone="light">
            <Select tone="light" value={form.gender} onChange={set('gender')}>
              <option value="">—</option>
              {GENDERS.map((g) => <option key={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Blood group" tone="light">
            <Select tone="light" value={form.blood_group} onChange={set('blood_group')}>
              <option value="">—</option>
              {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
            </Select>
          </Field>
          <div className="sm:col-span-2 pt-2 text-[10px] uppercase tracking-[0.25em] text-gold-dark border-t border-navy/10">Parent / guardian</div>
          <Field label="Guardian name" tone="light">
            <Input tone="light" value={form.guardian_name} onChange={set('guardian_name')} />
          </Field>
          <Field label="Guardian phone" tone="light">
            <Input tone="light" value={form.guardian_phone} onChange={set('guardian_phone')} />
          </Field>
          <Field label="Guardian email" tone="light" error={formErr.guardian_email}>
            <Input tone="light" type="email" value={form.guardian_email} onChange={set('guardian_email')} />
          </Field>
          <Field label="Address" tone="light" className="sm:col-span-2">
            <Textarea tone="light" value={form.address} onChange={set('address')} className="min-h-[70px]" />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="soft" onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="navy" onClick={save} loading={busy}>
            {editing === 'new' ? 'Create student & login' : 'Save changes'}
          </Button>
        </div>
      </Modal>

      <Confirm open={confirm?.type === 'delete'} onClose={() => setConfirm(null)} onConfirm={doConfirm} loading={busy} danger title={`Delete ${confirm?.s.full_name}?`} message="This deletes the student, their fees and their report cards permanently. Their login stops working." confirmLabel="Delete student" />
      <Confirm open={confirm?.type === 'reset'} onClose={() => setConfirm(null)} onConfirm={doConfirm} loading={busy} title="Reset password" message={`Generate a new password for ${confirm?.s.full_name}? The old password will stop working immediately.`} confirmLabel="Generate new password" />
      <CredentialsModal creds={creds} onClose={() => setCreds(null)} />
    </div>
  );
}
