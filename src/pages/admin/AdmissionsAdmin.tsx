import { useMemo, useState } from 'react';
import { Inbox, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '../../components/PortalShell';
import { Badge, Button, Confirm, EmptyState, ErrorBox, Field, Modal, Spinner, Textarea, useToast } from '../../components/ui';
import { api, errMsg } from '../../lib/api';
import type { Admission } from '../../lib/types';
import { fmtDate, fmtDateTime } from '../../lib/utils';
import { CredentialsModal, FilterPill, SearchBox, useResource, type Credentials } from './shared';

const tone = { pending: 'amber', approved: 'emerald', rejected: 'ruby' } as const;

export default function AdmissionsAdmin() {
  const { data, loading, error, reload } = useResource<Admission[]>('/api/admissions');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Admission | null>(null);
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const toast = useToast();

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return (data || []).filter((a) => (filter === 'all' || a.status === filter) && (!s || a.applicant_name.toLowerCase().includes(s) || a.application_no.toLowerCase().includes(s) || a.guardian_name.toLowerCase().includes(s)));
  }, [data, filter, q]);

  const counts = useMemo(() => ({ all: data?.length || 0, pending: data?.filter((a) => a.status === 'pending').length || 0, approved: data?.filter((a) => a.status === 'approved').length || 0, rejected: data?.filter((a) => a.status === 'rejected').length || 0 }), [data]);

  const review = async (status: 'approved' | 'rejected') => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await api<{ admission: Admission; credentials: Credentials | null }>('/api/admissions', { method: 'PUT', body: { id: selected.id, status, review_note: note } });
      toast.push({ title: status === 'approved' ? `${selected.applicant_name} is enrolled` : 'Application declined', desc: status === 'approved' ? 'A unique login was generated and the admission fee added to their account.' : undefined, tone: status === 'approved' ? 'success' : 'info' });
      setConfirm(null);
      setSelected(null);
      if (res.credentials) setCreds({ ...res.credentials, full_name: selected.applicant_name });
      await reload();
    } catch (e) {
      toast.push({ title: 'Review failed', desc: errMsg(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await api('/api/admissions', { method: 'DELETE', body: { id: selected.id } });
      toast.push({ title: 'Application deleted', tone: 'info' });
      setConfirm(null);
      setSelected(null);
      await reload();
    } catch (e) {
      toast.push({ title: 'Delete failed', desc: errMsg(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Admissions office" title="Admission applications" description="Review applications from the public portal. Approving creates the student and their unique login automatically." actions={<SearchBox value={q} onChange={setQ} placeholder="Search name, reference or guardian" />} />
      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <FilterPill key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f} · {counts[f]}
          </FilterPill>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading applications" tone="light" />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState icon={<Inbox className="w-5 h-5" />} title="No applications here" hint="Try a different filter or search." />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {list.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setSelected(a);
                setNote(a.review_note || '');
              }}
              className="text-left rounded-2xl bg-white border border-navy/10 p-5 hover:border-gold/60 hover:shadow-[0_12px_30px_-20px_rgba(11,18,34,0.4)] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] text-navy/50">{a.application_no}</p>
                  <p className="font-display text-2xl text-navy leading-tight">{a.applicant_name}</p>
                  <p className="text-xs text-navy/60 mt-1">Applying for {a.class_name} · {a.gender} · DOB {fmtDate(a.dob)}</p>
                </div>
                <Badge tone={tone[a.status]}>{a.status}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-navy/55">
                <span>{a.guardian_name} · {a.guardian_phone}</span>
                <span>{fmtDate(a.created_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!selected && !confirm} onClose={() => setSelected(null)} title={selected?.applicant_name || ''} subtitle={selected ? `${selected.application_no} · submitted ${fmtDateTime(selected.created_at)}` : ''} width="max-w-2xl">
        {selected && (
          <div>
            <div className="flex items-center justify-between">
              <Badge tone={tone[selected.status]}>{selected.status}</Badge>
              {selected.reviewed_at && <span className="text-xs text-navy/50">Reviewed {fmtDateTime(selected.reviewed_at)}</span>}
            </div>
            <dl className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                ['Applying for', selected.class_name],
                ['Date of birth', fmtDate(selected.dob)],
                ['Gender', selected.gender],
                ['Previous school', selected.previous_school || '—'],
                ['Guardian', selected.guardian_name],
                ['Phone', selected.guardian_phone],
                ['Email', selected.guardian_email || '—'],
                ['Address', selected.address || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-navy/50">{k}</dt>
                  <dd className="text-navy mt-0.5 break-words">{v}</dd>
                </div>
              ))}
              {selected.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-navy/50">Notes from guardian</dt>
                  <dd className="text-navy mt-0.5 whitespace-pre-line">{selected.notes}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6">
              <Field label="Note to family (shown on the tracker)" tone="light">
                <Textarea tone="light" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional message…" className="min-h-[80px]" disabled={selected.status !== 'pending'} />
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button variant="danger" size="sm" onClick={() => setConfirm('delete')} icon={<Trash2 className="w-4 h-4" />}>
                Delete
              </Button>
              {selected.status === 'pending' ? (
                <div className="flex gap-2">
                  <Button variant="soft" onClick={() => setConfirm('reject')} icon={<XCircle className="w-4 h-4" />}>
                    Reject
                  </Button>
                  <Button variant="navy" onClick={() => setConfirm('approve')} icon={<CheckCircle2 className="w-4 h-4" />}>
                    Confirm admission
                  </Button>
                </div>
              ) : selected.status === 'approved' ? (
                <p className="text-xs text-emerald">Enrolled · student record #{selected.student_id}</p>
              ) : (
                <Button variant="soft" onClick={() => setConfirm('approve')} icon={<CheckCircle2 className="w-4 h-4" />}>
                  Approve after all
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Confirm open={confirm === 'approve'} onClose={() => setConfirm(null)} onConfirm={() => review('approved')} loading={busy} title="Confirm admission" message={`Admit ${selected?.applicant_name} into ${selected?.class_name}? A unique login will be generated and the admission fee will be added to their account.`} confirmLabel="Yes, approve admission" />
      <Confirm open={confirm === 'reject'} onClose={() => setConfirm(null)} onConfirm={() => review('rejected')} loading={busy} title="Decline application" message={`Decline ${selected?.applicant_name}'s application? The family will see this decision on the tracker.`} confirmLabel="Decline" danger />
      <Confirm open={confirm === 'delete'} onClose={() => setConfirm(null)} onConfirm={remove} loading={busy} title="Delete application" message="This permanently removes the application record. Any enrolled student created from it is kept." confirmLabel="Delete" danger />
      <CredentialsModal creds={creds} onClose={() => setCreds(null)} title="Admission approved — login created" />
    </div>
  );
}
