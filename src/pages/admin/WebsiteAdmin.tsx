import { useState } from 'react';
import { Globe, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/PortalShell';
import { Button, Confirm, EmptyState, ErrorBox, Field, Input, Modal, Spinner, Textarea, useToast } from '../../components/ui';
import { api, errMsg } from '../../lib/api';
import type { Faculty, Testimonial } from '../../lib/types';
import { initials } from '../../lib/utils';
import { FilterPill, IconBtn, useResource } from './shared';

type FacForm = { name: string; title: string; department: string; qualifications: string; bio: string };
type TesForm = { name: string; role: string; quote: string };
const blankF: FacForm = { name: '', title: '', department: '', qualifications: '', bio: '' };
const blankT: TesForm = { name: '', role: '', quote: '' };

export default function WebsiteAdmin() {
  const [tab, setTab] = useState<'faculty' | 'testimonials'>('faculty');
  const faculty = useResource<Faculty[]>('/api/admin?resource=faculty');
  const testimonials = useResource<Testimonial[]>('/api/admin?resource=testimonials');
  const [editF, setEditF] = useState<Faculty | 'new' | null>(null);
  const [editT, setEditT] = useState<Testimonial | 'new' | null>(null);
  const [fForm, setFForm] = useState<FacForm>(blankF);
  const [tForm, setTForm] = useState<TesForm>(blankT);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<{ kind: 'faculty' | 'testimonials'; id: number; label: string } | null>(null);
  const toast = useToast();

  const saveF = async () => {
    if (!fForm.name.trim() || !fForm.title.trim()) return setErr('Name and title are required.');
    setBusy(true);
    try {
      if (editF === 'new') await api('/api/admin?resource=faculty', { method: 'POST', body: fForm });
      else if (editF) await api('/api/admin?resource=faculty', { method: 'PUT', body: { id: editF.id, ...fForm } });
      toast.push({ title: 'Faculty profile saved', tone: 'success' });
      setEditF(null);
      await faculty.reload();
    } catch (x) {
      toast.push({ title: 'Save failed', desc: errMsg(x), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const saveT = async () => {
    if (!tForm.name.trim() || !tForm.quote.trim()) return setErr('Name and quote are required.');
    setBusy(true);
    try {
      if (editT === 'new') await api('/api/admin?resource=testimonials', { method: 'POST', body: tForm });
      else if (editT) await api('/api/admin?resource=testimonials', { method: 'PUT', body: { id: editT.id, ...tForm } });
      toast.push({ title: 'Testimonial saved', tone: 'success' });
      setEditT(null);
      await testimonials.reload();
    } catch (x) {
      toast.push({ title: 'Save failed', desc: errMsg(x), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try {
      await api(`/api/admin?resource=${del.kind}`, { method: 'DELETE', body: { id: del.id } });
      setDel(null);
      await (del.kind === 'faculty' ? faculty.reload() : testimonials.reload());
    } catch (x) {
      toast.push({ title: 'Delete failed', desc: errMsg(x), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Public website"
        title="Website content"
        description="Faculty profiles and family testimonials shown on the public site."
        actions={
          tab === 'faculty' ? (
            <Button variant="navy" onClick={() => { setErr(''); setFForm(blankF); setEditF('new'); }} icon={<Plus className="w-4 h-4" />}>Add faculty</Button>
          ) : (
            <Button variant="navy" onClick={() => { setErr(''); setTForm(blankT); setEditT('new'); }} icon={<Plus className="w-4 h-4" />}>Add testimonial</Button>
          )
        }
      />
      <div className="flex gap-2 mb-6">
        <FilterPill active={tab === 'faculty'} onClick={() => setTab('faculty')}>Faculty · {faculty.data?.length ?? 0}</FilterPill>
        <FilterPill active={tab === 'testimonials'} onClick={() => setTab('testimonials')}>Testimonials · {testimonials.data?.length ?? 0}</FilterPill>
      </div>

      {tab === 'faculty' ? (
        faculty.loading ? <Spinner tone="light" /> : faculty.error ? <ErrorBox message={faculty.error} onRetry={faculty.reload} /> : !faculty.data?.length ? <EmptyState icon={<Globe className="w-5 h-5" />} title="No faculty profiles" /> : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {faculty.data.map((f) => (
              <div key={f.id} className="rounded-2xl bg-white border border-navy/10 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-full bg-navy text-gold font-display text-lg flex items-center justify-center">{initials(f.name)}</span>
                    <div><p className="font-display text-xl text-navy leading-tight">{f.name}</p><p className="text-[10px] uppercase tracking-[0.2em] text-gold-dark">{f.title}</p></div>
                  </div>
                  <div className="flex">
                    <IconBtn onClick={() => { setErr(''); setFForm({ name: f.name, title: f.title, department: f.department, qualifications: f.qualifications, bio: f.bio }); setEditF(f); }} title="Edit"><Pencil /></IconBtn>
                    <IconBtn onClick={() => setDel({ kind: 'faculty', id: f.id, label: f.name })} title="Delete" tone="ruby"><Trash2 /></IconBtn>
                  </div>
                </div>
                <p className="text-xs text-navy/50 mt-3 uppercase tracking-wider">{f.department} · {f.qualifications}</p>
                <p className="text-sm text-navy/70 mt-1 line-clamp-3">{f.bio}</p>
              </div>
            ))}
          </div>
        )
      ) : testimonials.loading ? <Spinner tone="light" /> : testimonials.error ? <ErrorBox message={testimonials.error} onRetry={testimonials.reload} /> : !testimonials.data?.length ? <EmptyState icon={<Globe className="w-5 h-5" />} title="No testimonials" /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {testimonials.data.map((t) => (
            <div key={t.id} className="rounded-2xl bg-white border border-navy/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-xl text-navy leading-snug">“{t.quote}”</p>
                <div className="flex shrink-0">
                  <IconBtn onClick={() => { setErr(''); setTForm({ name: t.name, role: t.role, quote: t.quote }); setEditT(t); }} title="Edit"><Pencil /></IconBtn>
                  <IconBtn onClick={() => setDel({ kind: 'testimonials', id: t.id, label: t.name })} title="Delete" tone="ruby"><Trash2 /></IconBtn>
                </div>
              </div>
              <p className="text-xs text-gold-dark uppercase tracking-[0.2em] mt-3">{t.name}</p>
              <p className="text-xs text-navy/50">{t.role}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editF} onClose={() => setEditF(null)} title={editF === 'new' ? 'Add faculty' : 'Edit faculty'} width="max-w-xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" tone="light"><Input tone="light" value={fForm.name} onChange={(e) => setFForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Title" tone="light"><Input tone="light" value={fForm.title} onChange={(e) => setFForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Head of Mathematics" /></Field>
          <Field label="Department" tone="light"><Input tone="light" value={fForm.department} onChange={(e) => setFForm((f) => ({ ...f, department: e.target.value }))} /></Field>
          <Field label="Qualifications" tone="light"><Input tone="light" value={fForm.qualifications} onChange={(e) => setFForm((f) => ({ ...f, qualifications: e.target.value }))} placeholder="e.g. M.Sc., B.Ed." /></Field>
          <Field label="Bio" tone="light" className="sm:col-span-2"><Textarea tone="light" value={fForm.bio} onChange={(e) => setFForm((f) => ({ ...f, bio: e.target.value }))} /></Field>
        </div>
        {err && <p className="text-sm text-ruby mt-3">{err}</p>}
        <div className="flex justify-end gap-3 mt-6"><Button variant="soft" onClick={() => setEditF(null)}>Cancel</Button><Button variant="navy" onClick={saveF} loading={busy}>Save</Button></div>
      </Modal>
      <Modal open={!!editT} onClose={() => setEditT(null)} title={editT === 'new' ? 'Add testimonial' : 'Edit testimonial'} width="max-w-xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" tone="light"><Input tone="light" value={tForm.name} onChange={(e) => setTForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Role" tone="light"><Input tone="light" value={tForm.role} onChange={(e) => setTForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. Parent, Class 4" /></Field>
          <Field label="Quote" tone="light" className="sm:col-span-2"><Textarea tone="light" value={tForm.quote} onChange={(e) => setTForm((f) => ({ ...f, quote: e.target.value }))} /></Field>
        </div>
        {err && <p className="text-sm text-ruby mt-3">{err}</p>}
        <div className="flex justify-end gap-3 mt-6"><Button variant="soft" onClick={() => setEditT(null)}>Cancel</Button><Button variant="navy" onClick={saveT} loading={busy}>Save</Button></div>
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} danger title={`Remove ${del?.label}?`} message="This removes the entry from the public website." confirmLabel="Remove" />
    </div>
  );
}
