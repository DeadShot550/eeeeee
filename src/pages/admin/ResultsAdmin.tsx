import { useEffect, useMemo, useState } from 'react';
import { Award, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/PortalShell';
import { Badge, Button, EmptyState, ErrorBox, Field, Modal, Select, Spinner, useToast } from '../../components/ui';
import { api, errMsg } from '../../lib/api';
import type { Exam, Result, SchoolClass, Student, Syllabus } from '../../lib/types';
import { gradeFor } from '../../lib/utils';
import { Table, td, useResource } from './shared';

interface Row {
  subject: string;
  max_marks: string;
  marks_obtained: string;
  remarks: string;
}

export default function ResultsAdmin() {
  const exams = useResource<Exam[]>('/api/admin?resource=exams');
  const classes = useResource<SchoolClass[]>('/api/admin?resource=classes');
  const students = useResource<Student[]>('/api/admin?resource=students');
  const [examId, setExamId] = useState('');
  const [classId, setClassId] = useState('');
  const results = useResource<Result[]>(`/api/admin?resource=results&exam_id=${examId}`, !!examId);
  const syllabus = useResource<Syllabus[]>(`/api/admin?resource=syllabus&class_id=${classId}`, !!classId);
  const [target, setTarget] = useState<Student | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const exam = exams.data?.find((e) => String(e.id) === examId);
  useEffect(() => {
    if (!examId && exams.data?.length) setExamId(String(exams.data[0].id));
  }, [exams.data, examId]);
  useEffect(() => {
    if (exam?.class_id) setClassId(String(exam.class_id));
    else if (!classId && classes.data?.length) setClassId(String(classes.data[0].id));
  }, [exam, classes.data, classId]);

  const roster = useMemo(() => (students.data || []).filter((s) => String(s.class_id) === classId), [students.data, classId]);
  const byStudent = useMemo(() => {
    const m = new Map<number, Result[]>();
    (results.data || []).forEach((r) => m.set(r.student_id, [...(m.get(r.student_id) || []), r]));
    return m;
  }, [results.data]);

  const openEntry = (s: Student) => {
    const existing = byStudent.get(s.id) || [];
    const subjects = Array.from(new Set((syllabus.data || []).map((x) => x.subject)));
    const base: Row[] = existing.length
      ? existing.map((r) => ({ subject: r.subject, max_marks: String(r.max_marks), marks_obtained: String(r.marks_obtained), remarks: r.remarks }))
      : subjects.map((sub) => ({ subject: sub, max_marks: '100', marks_obtained: '', remarks: '' }));
    setRows(base.length ? base : [{ subject: '', max_marks: '100', marks_obtained: '', remarks: '' }]);
    setTarget(s);
  };

  const save = async () => {
    if (!target) return;
    const invalid = rows.some((r) => r.subject.trim() && (Number(r.marks_obtained) > Number(r.max_marks) || Number(r.marks_obtained) < 0));
    if (invalid) return toast.push({ title: 'Marks cannot exceed the maximum.', tone: 'error' });
    setBusy(true);
    try {
      await api('/api/admin?resource=results', { method: 'POST', body: { exam_id: Number(examId), student_id: target.id, rows } });
      toast.push({ title: `Results saved for ${target.full_name}`, tone: 'success' });
      setTarget(null);
      await results.reload();
    } catch (e) {
      toast.push({ title: 'Save failed', desc: errMsg(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const clear = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await api('/api/admin?resource=results', { method: 'DELETE', body: { exam_id: Number(examId), student_id: target.id } });
      toast.push({ title: 'Results cleared', tone: 'info' });
      setTarget(null);
      await results.reload();
    } catch (e) {
      toast.push({ title: 'Failed', desc: errMsg(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const total = rows.reduce((a, r) => a + (Number(r.marks_obtained) || 0), 0);
  const max = rows.reduce((a, r) => a + (Number(r.max_marks) || 0), 0);
  const pct = max ? Math.round((total / max) * 1000) / 10 : 0;

  return (
    <div>
      <PageHeader eyebrow="Examination office" title="Results & report cards" description="Choose an examination and class, then enter subject-wise marks for each scholar." />
      <div className="grid sm:grid-cols-2 gap-4 mb-6 max-w-2xl">
        <Field label="Examination" tone="light">
          <Select tone="light" value={examId} onChange={(e) => setExamId(e.target.value)}>
            {exams.data?.map((e) => <option key={e.id} value={e.id}>{e.title} · {e.term}</option>)}
          </Select>
        </Field>
        <Field label="Class" tone="light" hint={exam?.class_id ? 'Locked to the exam’s class' : undefined}>
          <Select tone="light" value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!!exam?.class_id}>
            {classes.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
      </div>
      {exams.loading || students.loading || results.loading ? (
        <Spinner label="Loading" tone="light" />
      ) : results.error ? (
        <ErrorBox message={results.error} onRetry={results.reload} />
      ) : !exams.data?.length ? (
        <EmptyState icon={<Award className="w-5 h-5" />} title="Schedule an examination first" hint="Results are entered against a scheduled examination." />
      ) : roster.length === 0 ? (
        <EmptyState icon={<Award className="w-5 h-5" />} title="No students in this class" />
      ) : (
        <Table head={['Roll', 'Student', 'Subjects entered', 'Total', 'Grade', '']}>
          {roster.map((s) => {
            const rs = byStudent.get(s.id) || [];
            const got = rs.reduce((a, r) => a + Number(r.marks_obtained), 0);
            const mx = rs.reduce((a, r) => a + Number(r.max_marks), 0);
            const p = mx ? Math.round((got / mx) * 100) : 0;
            return (
              <tr key={s.id} className="hover:bg-paper/60">
                <td className={td}>{s.roll_no}</td>
                <td className={td}><p className="font-medium">{s.full_name}</p><p className="text-[11px] text-navy/50 font-mono">{s.admission_no}</p></td>
                <td className={td}>{rs.length ? <span>{rs.length} subjects</span> : <span className="text-navy/40">Not entered</span>}</td>
                <td className={td}>{rs.length ? `${got} / ${mx}` : '—'}</td>
                <td className={td}>{rs.length ? <Badge tone={gradeFor(p).tone}>{gradeFor(p).grade} · {p}%</Badge> : '—'}</td>
                <td className={`${td} text-right`}><Button size="sm" variant={rs.length ? 'soft' : 'navy'} onClick={() => openEntry(s)}>{rs.length ? 'Edit marks' : 'Enter marks'}</Button></td>
              </tr>
            );
          })}
        </Table>
      )}

      <Modal open={!!target} onClose={() => setTarget(null)} title={target ? `${target.full_name}` : ''} subtitle={exam ? `${exam.title} · ${classes.data?.find((c) => String(c.id) === classId)?.name}` : ''} width="max-w-2xl">
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] uppercase tracking-[0.2em] text-navy/50 px-1">
            <span className="col-span-4">Subject</span><span className="col-span-2">Max</span><span className="col-span-2">Marks</span><span className="col-span-3">Remarks</span><span />
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input value={r.subject} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, subject: e.target.value } : x)))} placeholder="Subject" className="col-span-12 sm:col-span-4 rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-gold" />
              <input type="number" min={1} value={r.max_marks} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, max_marks: e.target.value } : x)))} placeholder="Max" className="col-span-4 sm:col-span-2 rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-gold" />
              <input type="number" min={0} value={r.marks_obtained} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, marks_obtained: e.target.value } : x)))} placeholder="Marks" className={`col-span-4 sm:col-span-2 rounded-lg border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-gold ${Number(r.marks_obtained) > Number(r.max_marks) ? 'border-ruby' : 'border-navy/15'}`} />
              <input value={r.remarks} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, remarks: e.target.value } : x)))} placeholder="Remarks" className="col-span-3 sm:col-span-3 rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-gold" />
              <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="col-span-1 p-2 text-ruby/70 hover:text-ruby" aria-label="Remove row"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <Button variant="soft" size="sm" onClick={() => setRows((rs) => [...rs, { subject: '', max_marks: '100', marks_obtained: '', remarks: '' }])} icon={<Plus className="w-4 h-4" />}>Add subject</Button>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-paper border border-navy/10 px-4 py-3">
          <p className="text-sm text-navy">Total <span className="font-display text-2xl">{total}</span> <span className="text-navy/50">/ {max}</span></p>
          <Badge tone={gradeFor(pct).tone}>{gradeFor(pct).grade} · {pct}% · {gradeFor(pct).label}</Badge>
        </div>
        <div className="flex flex-wrap justify-between gap-3 mt-6">
          <Button variant="danger" size="sm" onClick={clear} disabled={busy || !(target && byStudent.get(target.id)?.length)}>Clear results</Button>
          <div className="flex gap-2">
            <Button variant="soft" onClick={() => setTarget(null)}>Cancel</Button>
            <Button variant="navy" onClick={save} loading={busy}>Save report card</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
